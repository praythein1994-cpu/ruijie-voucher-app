/**
 * Ruijie Cloud API client — talks to Ruijie THROUGH the CORS proxy.
 * All cloud data comes from Ruijie Cloud; nothing is fabricated.
 * API contracts follow the Ruijie Cloud API Reference Manual V2.0.3.
 */
'use strict';

const CFG_KEY = 'rv_cfg_v1';
const STATE_KEY = 'rv_state_v1';

/* ── Native bridge (Android WebView) ─────────────────────────────
 * When the app runs inside the APK, window.RuijieBridge is injected by
 * native code. Native layer does HTTPS directly (no CORS there), so no
 * proxy server is needed. Responses come back base64-encoded via
 * window._bridgeResolve(id, b64).
 */
let _bridgeSeq = 0;
const _bridgePending = {};
window._bridgeResolve = (id, b64) => {
  const p = _bridgePending[id];
  delete _bridgePending[id];
  if (!p) return;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    p.resolve(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) { p.reject(e); }
};
const hasBridge = () => !!(window.RuijieBridge && window.RuijieBridge.apiCall);
function bridgeCall(payload) {
  return new Promise((resolve, reject) => {
    const id = 'b' + (++_bridgeSeq) + '_' + Date.now();
    _bridgePending[id] = { resolve, reject };
    try { window.RuijieBridge.apiCall(id, JSON.stringify(payload)); }
    catch (e) { delete _bridgePending[id]; reject(e); }
    setTimeout(() => { if (_bridgePending[id]) { delete _bridgePending[id]; reject(new Error('Native bridge timeout')); } }, 45000);
  });
}
const b64encodeUnicode = s => btoa(unescape(encodeURIComponent(s)));

/* ── SSO session (Android APK only) ─────────────────────────────
 * Ruijie account login through the native SSO dialog. Session requests go
 * through the portal's internal webproxy API using SSO cookies — this is
 * the only path that supports voucher delete (the public Open API has no
 * delete endpoint). Responses come back base64-encoded via
 * window._ssoResolve(id, b64); login/logout events via window._ssoEvent.
 */
let _ssoSeq = 0;
const _ssoPending = {};
window._ssoResolve = (id, b64) => {
  const p = _ssoPending[id];
  delete _ssoPending[id];
  if (!p) return;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    p.resolve(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) { p.reject(e); }
};
window._ssoEvent = (name) => {
  document.dispatchEvent(new CustomEvent('ruijie-sso', { detail: name }));
};
const hasSso = () => !!(window.RuijieBridge && window.RuijieBridge.ssoRequest);
function ssoCall(apiPath, envelope) {
  return new Promise((resolve, reject) => {
    if (!hasSso()) return reject(new Error('SSO login ကို Android app မှာပဲ သုံးလို့ရပါတယ်'));
    const id = 's' + (++_ssoSeq) + '_' + Date.now();
    _ssoPending[id] = { resolve, reject };
    try { window.RuijieBridge.ssoRequest(id, apiPath, JSON.stringify(envelope)); }
    catch (e) { delete _ssoPending[id]; reject(e); }
    setTimeout(() => { if (_ssoPending[id]) { delete _ssoPending[id]; reject(new Error('SSO request timeout')); } }, 45000);
  });
}

/* ── Gateway-local session (Android APK only) ───────────────────
 * Direct LAN connection to the user's own gateway eWeb
 * (https://<ip>/cgi-bin/luci/api/...). The https web app cannot reach a
 * LAN IP, so this is APK-only like the SSO bridge. Used for devices
 * Ruijie Cloud never sees (China-version APs) — the 9-device view.
 * Responses come back base64-encoded via window._gwResolve(id, b64).
 */
let _gwSeq = 0;
const _gwPending = {};
window._gwResolve = (id, b64) => {
  const p = _gwPending[id];
  delete _gwPending[id];
  if (!p) return;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    p.resolve(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) { p.reject(e); }
};
const hasGw = () => !!(window.RuijieBridge && window.RuijieBridge.gatewayLogin);
function gwCall(kind, ...args) {
  return new Promise((resolve, reject) => {
    if (!hasGw()) return reject(new Error('Gateway ကို Android app မှာပဲ ချိတ်လို့ရပါတယ်'));
    const id = 'g' + (++_gwSeq) + '_' + Date.now();
    _gwPending[id] = { resolve, reject };
    try {
      if (kind === 'login') window.RuijieBridge.gatewayLogin(id, args[0], args[1], args[2]);
      else window.RuijieBridge.gatewayCmd(id, args[0], args[1], args[2]);
    } catch (e) { delete _gwPending[id]; reject(e); }
    setTimeout(() => { if (_gwPending[id]) { delete _gwPending[id]; reject(new Error('Gateway timeout')); } }, 45000);
  });
}

/**
 * Gateway-local API (captured read-only from the gateway eWeb, 2026-09-28).
 * Login: POST /cgi-bin/luci/api/auth
 *   {method:"login",params:{username,time,isCheckReadAgreement:"true",encry:true,pwd}}
 *   -> {code:0,data:{token,sn,sid}}
 * Device list: POST /cgi-bin/luci/api/cmd?auth=<sid>
 *   {method:"cmdArr",params:{device:"pc",params:[ ... ]}}
 */
const GwApi = {
  /** Session: {ip, sid, sn, token}. Kept in memory only (never persisted). */
  session: null,

  /**
   * Gateway login. The plaintext password is passed to the native bridge,
   * which AES-encrypts it (Gibberish-AES compatible) before sending —
   * it never crosses the JS bridge in plaintext-readable form beyond
   * this call, and is never logged.
   */
  async login(ip, username, pwdPlain) {
    const j = await gwCall('login', ip, username, pwdPlain);
    if (!j || Number(j.code) !== 0) throw new Error((j && (j.msg || j.error)) || 'Gateway login မအောင်မြင်ပါ');
    let d = j.data || {};
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { d = {}; } }
    // sid fallbacks: some firmware uses `stok`, or returns sid only as the
    // <sn>=<sid> session cookie (captured by native code into _cookies).
    let sid = d.sid || d.stok || j.sid || j.stok || '';
    if (!sid && Array.isArray(j._cookies)) {
      for (const ck of j._cookies) {
        const m = String(ck).split(';')[0].match(/^[^=]+=(.+)$/);
        if (m && m[1] && !/^(deleted|expired)$/i.test(m[1].trim())) { sid = m[1].trim(); break; }
      }
    }
    if (!sid) {
      const gwMsg = d.msg ? String(d.msg).slice(0, 160) : '';
      const km = j._keyMode ? ' [key:' + j._keyMode + ']' : '';
      const tr = j._tried ? ' [tried:' + j._tried + ']' : '';
      throw new Error('Gateway login: ' + (gwMsg || 'sid မပါလာပါ') + ' (keys: ' + Object.keys(d).join(',') + ')' + km + tr);
    }
    this.session = { ip, sid, sn: d.sn || '', token: d.token || '' };
    return this.session;
  },
  logout() { this.session = null; },
  loggedIn() { return !!(this.session && this.session.sid); },

  /** Exact cmdArr batch captured from the /admin/device page. */
  deviceListBody() {
    const sub = (method, params) => ({ method, params });
    const base = { noParse: true, async: null, remoteIp: false };
    return {
      method: 'cmdArr',
      params: {
        device: 'pc',
        params: [
          sub('acConfig.get', Object.assign({ module: 'network_group' }, base)),
          sub('devSta.get', Object.assign({ module: 'ap_list' }, base)),
          sub('devSta.get', Object.assign({ module: 'esw_neighbor' }, base)),
          sub('devSta.get', Object.assign({ module: 'neighbor', data: { product: 'GW_RGOS|FW_NTOS|NBR_NTOS' } }, base)),
          sub('devSta.get', Object.assign({ module: 'all_ap_list' }, base)),
        ],
      },
    };
  },

  /** Fetch + merge local devices, deduped by serialNumber. Each gets local:true. */
  async deviceList() {
    if (!this.loggedIn()) throw new Error('GW_NOT_LOGGED_IN');
    const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(this.deviceListBody()));
    return this.parseDevices(j);
  },

  /**
   * Gateway-local wireless client (STA) list, v1.5.29.
   * The eWeb shows per-AP connected devices (IP/MAC), so the data exists —
   * but the exact module name isn't captured. We probe several likely
   * modules in ONE cmdArr batch and keep whichever blocks contain
   * MAC-bearing records. Returns [{mac, ip, apSn, apMac, ssid, rssi, host}];
   * empty array = not available (caller falls through honestly).
   */
  async staList() {
    if (!this.loggedIn()) throw new Error('GW_NOT_LOGGED_IN');
    const sub = (method, params) => ({ method, params });
    const base = { noParse: true, async: null, remoteIp: false };
    const body = {
      method: 'cmdArr',
      params: {
        device: 'pc',
        params: [
          sub('devSta.get', Object.assign({ module: 'sta_list' }, base)),
          sub('devSta.get', Object.assign({ module: 'sta_info' }, base)),
          sub('devSta.get', Object.assign({ module: 'client_list' }, base)),
          sub('devSta.get', Object.assign({ module: 'wireless_sta' }, base)),
        ],
      },
    };
    let j = null;
    try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
    catch (_) { return []; }
    const out = [];
    const grab = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(grab); return; }
      // A STA record has a MAC and usually an AP serial/MAC + ssid.
      const mac = o.mac || o.staMac || o.clientMac || o.stamac || '';
      if (mac && /^[0-9a-fA-F:]{11,}/.test(String(mac))) {
        // v1.5.34: the gateway's IP field name varies by firmware — probe
        // every plausible key. Also scrub literal "NULL" strings the
        // gateway uses for unknown hostnames.
        const cleanNull = s => { s = String(s == null ? '' : s).trim(); return (/^null$/i.test(s) ? '' : s); };
        const ip = cleanNull(o.ip || o.staIp || o.clientIp || o.staip || '');
        out.push({
          mac: String(mac).toUpperCase(),
          ip,
          apSn: o.sn || o.devSN || o.apSn || o.apsn || o.linkedSn || o.ap_sn || '',
          apMac: o.apMac || o.apmac || o.bssid || '',
          ssid: o.ssid || '',
          rssi: (o.rssi != null ? o.rssi : (o.signal != null ? o.signal : '')),
          host: cleanNull(o.hostName || o.hostname || o.deviceName || o.staName || ''),
        });
        return;
      }
      Object.keys(o).forEach(k => { if (k !== 'parent') grab(o[k]); });
    };
    grab(j && j.data ? j.data : j);
    // Dedupe by MAC (multiple modules may return the same STAs).
    const seen = new Set();
    return out.filter(r => (seen.has(r.mac) ? false : (seen.add(r.mac), true)));
  },

  /** Pull every {serialNumber,...} object out of a cmdArr response. */
  parseDevices(j) {
    const blocks = [];
    const collect = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(collect); return; }
      blocks.push(o);
      Object.keys(o).forEach(k => { if (k !== 'parent') collect(o[k]); });
    };
    collect(j && j.data ? j.data : j);
    const seen = new Set(), out = [];
    const grab = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(grab); return; }
      const sn = o.serialNumber || o.devSN || o.sn;
      if (sn && (o.hostName || o.deviceType || o.devModel) && !seen.has(sn)) {
        seen.add(sn);
        out.push({
          serialNumber: sn,
          name: o.hostName || o.deviceType || sn,
          model: o.devModel || o.deviceType || '',
          deviceType: o.deviceType || '',
          product: o.product || '',
          ip: o.ip || o.localIp || '',
          mac: o.mac || '',
          // v1.5.22: neighbor[] entries carry no status field — a missing
          // status means UNKNOWN (''), never fabricated OFF.
          onlineStatus: (o.status == null || o.status === '') ? '' : (String(o.status).toUpperCase() === 'ON' ? 'ON' : 'OFF'),
          staNums: o.staNum != null ? Number(o.staNum) : null,
          software: o.software || '',
          local: true, // gateway-local device (may be invisible to Ruijie Cloud)
        });
        return;
      }
      Object.keys(o).forEach(k => grab(o[k]));
    };
    blocks.forEach(grab);
    return out;
  },
};

const Api = {
  cfg: null,

  loadCfg() {
    try { this.cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); }
    catch (e) { this.cfg = null; }
    return this.cfg;
  },
  saveCfg(cfg) {
    this.cfg = cfg;
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  },
  clearCfg() {
    this.cfg = null;
    localStorage.removeItem(CFG_KEY);
    localStorage.removeItem(STATE_KEY);
  },

  /** Low-level call: native bridge inside the APK, otherwise via the CORS proxy. Returns Ruijie's JSON verbatim. */
  async call(method, path, query = {}, body = null) {
    if (!this.cfg) throw new Error('Not connected');
    const payload = {
      cloud: this.cfg.cloud, appid: this.cfg.appid, secret: this.cfg.secret,
      method, path, query, body,
    };
    if (hasBridge()) return bridgeCall(payload);   // APK: native HTTPS, no CORS, no proxy
    const proxy = (this.cfg.proxy || '').replace(/\/+$/, '');
    if (!proxy) throw new Error('Proxy URL မထည့်ထားပါ (ဆက်တင်မှာ ထည့်ပါ)');
    const res = await fetch(proxy + '/api/ruijie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error('Proxy error ' + res.status + (t ? ': ' + t.slice(0, 200) : ''));
    }
    return res.json();
  },

  /** Throw if Ruijie reports failure; return the inner data payload. */
  unwrap(json, innerKey) {
    if (!json || typeof json !== 'object') throw new Error('Invalid response from cloud');
    if (json.code !== 0) throw new Error('Ruijie: ' + (json.msg || ('code ' + json.code)));
    if (innerKey) {
      const inner = json[innerKey];
      if (inner && typeof inner === 'object' && inner.code !== undefined && inner.code !== 0)
        throw new Error('Ruijie: ' + (inner.msg || ('code ' + inner.code)));
      return inner;
    }
    return json;
  },

  // ── 2.1 Authorization ──
  async testConnection() {
    // account info is the lightest authenticated call
    const j = await this.call('GET', 'org/account/info');
    return this.unwrap(j);
  },
  async getAccountInfo() {
    const j = await this.call('GET', 'org/account/info');
    return this.unwrap(j);
  },

  // ── 2.2 Network groups ──
  async getGroupTree(depth = 'BUILDING') {
    const j = await this.call('GET', 'group/single/tree', { depth });
    const d = this.unwrap(j);
    return d.group || d.groups || d;
  },
  async addNetwork({ name, parentId, timezone }) {
    const j = await this.call('POST', 'open/v1/group', {}, { name, parentId, timezone, type: 'BUILDING' });
    return this.unwrap(j);
  },

  // ── 2.3 Vouchers ──
  async voucherListPage(groupId, start, pageSize) {
    const j = await this.call('GET', `open/auth/voucher/getList/${groupId}`, { start, pageSize });
    const inner = this.unwrap(j, 'voucherData');
    return { count: inner.count || 0, list: inner.list || [] };
  },
  /** Fetch ALL vouchers (pageSize max 200), with progress callback.
   * Pages after the first are fetched in parallel — ~5s startup → ~1.5s. */
  async voucherListAll(groupId, onProgress) {
    const pageSize = 200;
    const first = await this.voucherListPage(groupId, 0, pageSize);
    const total = first.count || 0;
    let done = (first.list || []).length;
    if (onProgress) onProgress(done, total);
    const jobs = [];
    for (let start = (first.list || []).length; start < total; start += pageSize) {
      jobs.push(this.voucherListPage(groupId, start, pageSize).then(({ list }) => {
        done += (list || []).length;
        if (onProgress) onProgress(done, total);
        return list || [];
      }));
    }
    const rest = await Promise.all(jobs);
    return (first.list || []).concat(...rest);
  },
  async voucherCreate(groupId, { quantity, profile, userGroupId, firstName, lastName, email, phone, comment, createCodeType, codeSize, packageName }) {
    const body = { quantity, profile, userGroupId };
    if (firstName) body.firstName = firstName;
    if (lastName) body.lastName = lastName;
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (comment) body.comment = comment;
    // Confirmed working mapping (verified against a production-tested implementation):
    // createCodeType "1" = alphanumeric, "2" = alphabetic, "3" = numeric; codeSize = 6-9.
    if (createCodeType) body.createCodeType = createCodeType;
    if (codeSize) body.codeSize = codeSize;
    if (packageName) { body.packageName = packageName; body.profileName = packageName; body.userGroupName = packageName; }
    const j = await this.call('POST', `open/auth/voucher/create/${groupId}`, {}, body);
    const inner = this.unwrap(j, 'voucherData');
    return inner.list || [];
  },
  async voucherCustomCreate(groupId, code, { profile, userGroupId }) {
    const body = {};
    if (profile) body.profile = profile;
    if (userGroupId) body.userGroupId = userGroupId;
    const j = await this.call('POST', `open/auth/voucher/customerCreate/${groupId}/${encodeURIComponent(code)}`, {}, body);
    return this.unwrap(j, 'voucherData');
  },
  /**
   * Voucher delete.
   *
   * The public Ruijie Cloud API manual (V2.0.3) documents NO voucher delete
   * endpoint, so the Open API path stays disabled. Delete works only through
   * an SSO session (Ruijie account login in the Android app), which uses the
   * portal's internal webproxy API.
   */
  async voucherDelete(groupId, voucher) {
    if (this.ssoLoggedIn()) return this.voucherDeleteSso(groupId, voucher);
    throw new Error('SSO_REQUIRED');
  },

  /** True when the Android APK holds a Ruijie SSO session. */
  ssoLoggedIn() {
    if (!hasSso()) return false;
    try { return !!JSON.parse(window.RuijieBridge.ssoStatus()).loggedIn; }
    catch (e) { return false; }
  },

  /**
   * Portal webproxy envelope for voucher delete (internal API, undocumented).
   * EXACT shape captured from the live Ruijie portal (Chrome DevTools, 2026-09-27):
   * POST https://cloud-as.ruijienetworks.com/webproxy/common/api?/intlSamVoucher/v2/delete
   *   {"api":"/intlSamVoucher/v2/delete",
   *    "authParams":{"api":"/intlSamVoucher/v2/delete","method":"DELETE"},
   *    "method":"DELETE","module":"default",
   *    "params":[{"voucherCode":"<code>"}],
   *    "querys":{"ids":"<voucher uuid>","group_id":<project group id>,"lang":"en"}}
   * Success response: {"code":0,"msg":"Success.","voucherData":{"code":0,"msg":"OK."}}
   * Notes: module is "default" (not "common"); params carries ONLY voucherCode
   * (no codeNo); querys.ids is the voucher uuid; group_id is numeric.
   */
  ssoDeleteEnvelope(code, uuid, groupId) {
    const api = '/intlSamVoucher/v2/delete';
    const gid = Number(groupId);
    return {
      api,
      authParams: { api, method: 'DELETE' },
      method: 'DELETE',
      module: 'default',
      params: [{ voucherCode: code }],
      querys: { ids: uuid, group_id: Number.isFinite(gid) ? gid : groupId, lang: 'en' },
    };
  },

  /** Delete one voucher through the SSO session. Throws on portal error. */
  async voucherDeleteSso(groupId, voucher) {
    const code = voucher.voucherCode || voucher.codeNo || voucher.code || '';
    const uuid = voucher.uuid || voucher.id || '';
    const env = this.ssoDeleteEnvelope(code, uuid, groupId);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('ဖျက်မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── Portal device reboot (Cloud webproxy, SSO session) · v1.5.13 ──
   * Verified 2026-09-28 from the portal's own frontend JS (read-only):
   * outer  POST https://cloud-as.ruijienetworks.com/webproxy/common/api?/maint/device/reboot
   * inner  {"api":"/maint/device/reboot?cloudType=smb","method":"POST",
   *         "params":{"snList":["<serial>"]},"module":"default","querys":{"lang":"en"}}
   * Response {code,msg}; code 0 = success. No device was rebooted to verify.
   * Android-APK-only (needs the SSO portal session, like voucher delete).
   */
  ssoRebootEnvelope(sn) {
    return {
      api: '/maint/device/reboot?cloudType=smb',
      method: 'POST',
      params: { snList: [sn] },
      module: 'default',
      querys: { lang: 'en' },
    };
  },

  /** Reboot one device through the SSO session. Throws on portal error. */
  async deviceRebootSso(sn) {
    const env = this.ssoRebootEnvelope(sn);
    const j = await ssoCall('/maint/device/reboot', env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : -1;
    if (c !== 0) {
      throw new Error(j.msg || j.message || ('ပြန်ဖွင့်မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /** Reboot entry point: SSO session required (Ruijie account login). */
  async deviceReboot(sn) {
    if (this.ssoLoggedIn()) return this.deviceRebootSso(sn);
    throw new Error('SSO_REQUIRED');
  },

  // ── 2.4 Auth accounts ──
  async accountList(groupId, { start = 0, pageSize = 50, name = '', status = '' } = {}) {
    const q = { start, pageSize };
    if (name) q.name = name;
    if (status) q.status = status;
    const j = await this.call('GET', `open/auth/account/getList/${groupId}`, q);
    const d = this.unwrap(j);
    const inner = d.data || d;
    return Array.isArray(inner) ? inner : (inner.list || inner.accounts || []);
  },
  async accountCreate(groupId, { username, password, profileId, userGroupId, vpnEnable = false, comment = '' }) {
    const j = await this.call('POST', `open/auth/account/create/${groupId}`, {},
      { username, password, profileId, userGroupId, vpnEnable, comment });
    return this.unwrap(j);
  },
  async accountDelete(groupId, names) {
    const j = await this.call('POST', `samTransfer/account/delete/${groupId}`, {}, { names });
    return this.unwrap(j);
  },
  async accountUpdate(groupId, { uuid, password, userGroupId }) {
    const j = await this.call('POST', `open/auth/account/update/${groupId}`, {}, { uuid, password, userGroupId });
    return this.unwrap(j);
  },
  async accountReset(groupId, names) {
    const j = await this.call('POST', `open/auth/account/reset/${groupId}`, {}, { names });
    return this.unwrap(j);
  },

  // ── 2.7 User groups (packages) ──
  async userGroupList(groupId, pageIndex = 0, pageSize = 100) {
    const j = await this.call('GET', `intl/usergroup/list/${groupId}`, { pageIndex, pageSize });
    const d = this.unwrap(j);
    return d.list || d.userGroups || d.data || [];
  },

  // ── Devices ──
  // Manual §2.x: common_type is MANDATORY (AP / Switch / Gateway).
  // Response carries the array under "deviceList".
  async deviceList(groupId, commonType = '', page = 0, perPage = 50, key = '') {
    const q = { group_id: groupId, page, per_page: perPage };
    if (commonType) q.common_type = commonType;
    if (key) q.key = key;
    const j = await this.call('GET', 'maint/devices', q);
    const d = this.unwrap(j);
    const inner = d.data || d;
    return Array.isArray(inner) ? inner : (inner.list || inner.devices || inner.deviceList || []);
  },

  /* ── Device list via Cloud portal webproxy (SSO) · v1.5.15 ──
     Portal capture (read-only): POST .../webproxy/common/api?/maint/devices/list
     body {"api":"/maint/devices/list?page={p}&per_page={pp}&cloudType=smb",
           "method":"POST","params":{"groupId":<numeric>,"commonType":"<TAB>"},
           "querys":{"lang":"en"},"module":"default"}
     commonType: "" = All, "AP", "SWITCH", "GATEWAY", "WR" (Home Router)…
     Response {code,msg,deviceList[],totalCount}; device.onlineStatus is
     "ON" / "OFF" / "NEVER_ONLINE". Works for every type (the Open API
     404s on Switch/Gateway). Android-APK-only (needs SSO session). */
  async deviceListSso(groupId, commonType = '', page = 1, perPage = 100) {
    const env = {
      api: `/maint/devices/list?page=${page}&per_page=${perPage}&cloudType=smb`,
      method: 'POST',
      params: { groupId: Number(groupId), commonType },
      module: 'default',
      querys: { lang: 'en' },
    };
    const j = await ssoCall('/maint/devices/list', env);
    if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
    const code = Number(j.code);
    if (code !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + code)));
    return Array.isArray(j.deviceList) ? j.deviceList : [];
  },

  /* ── Clients via Cloud portal webproxy (SSO) · v1.5.25 ──
     The portal's own client list (extracted from the portal's public JS):
     outer POST .../webproxy/common/api?/network/current/user/global/page
     body {"api":"/network/current/user/global/page","method":"GET",
           "module":"logbiz",
           "querys":{"group_id":N,"page_index":1,"page_size":N,
                     "connect_type":"wireless","lang":"en"}}
     Unlike the open-API sta_users, portal records carry `account` (the auth
     account — the voucher code for voucher-auth clients), `userName`,
     `authType`, `linkedDevice` (the AP serial), `deviceName`, `activeSec`
     (seconds). page_index is 1-based. Response {code,list[],currentCount}.
     Android-APK-only (needs SSO session). */
  async portalClients(groupId, { pageIndex = 1, pageSize = 500, linkedDevice = '', authCount = false } = {}) {
    const querys = { group_id: Number(groupId), page_index: pageIndex, page_size: pageSize, connect_type: 'wireless', lang: 'en' };
    if (linkedDevice) querys.linked_device = linkedDevice;
    // Portal parity (from the portal's own client-list code): when the project
    // has auth configured it sends authCount=true, which is what makes the
    // backend join auth-account data into the client records.
    if (authCount) querys.authCount = true;
    const env = { api: '/network/current/user/global/page', method: 'GET', module: 'logbiz', params: {}, querys };
    const j = await ssoCall('/network/current/user/global/page', env);
    if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
    const code = Number(j.code);
    if (code !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + code)));
    return Array.isArray(j.list) ? j.list : [];
  },

  /** Whether the portal project has auth (voucher/portal) configured.
   * Portal: GET /intl/auth/v2/status/{groupId} -> {code, hasConfigAuth}.
   * The portal only shows/requests the account column when this is true. */
  async portalAuthStatus(groupId) {
    const p = '/intl/auth/v2/status/' + Number(groupId);
    const j = await ssoCall(p, { api: p, method: 'GET', module: 'default', params: {}, querys: { lang: 'en' } });
    if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
    if (Number(j.code) !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + j.code)));
    return !!j.hasConfigAuth;
  },

  // ── Clients (online) ──
  // Manual: staType is MANDATORY — "currentUser" = current online data.
  // NOTE: logbiz APIs live at /logbizagent/... directly (NO /service/api/ prefix).
  // A leading "/" in the path means "absolute on the cloud host" (see native
  // RuijieBridge.doApiCall + proxy/server.js).
  async onlineClients(groupId, pageIndex = 0, pageSize = 50) {
    const j = await this.call('POST', '/logbizagent/logbiz/api/sta/sta_users', {}, { groupId, pageIndex, pageSize, staType: 'currentUser' });
    const d = this.unwrap(j);
    return d.list || d.data || [];
  },
  /**
   * All currently-online clients in the group (one large page) — grouped
   * per-AP client-side by each client's `sn` (the AP serial).
   * v1.5.22: powers the per-AP client view (counts, voucher use, roam).
   */
  async allOnlineClients(groupId) {
    const j = await this.call('POST', '/logbizagent/logbiz/api/sta/sta_users', {}, { groupId, pageIndex: 0, pageSize: 200, staType: 'currentUser' });
    const d = this.unwrap(j);
    return d.list || d.data || [];
  },
  /**
   * Online/offline history for one client MAC — consecutive records on
   * different AP serials mean the client roamed between APs.
   * v1.5.22.
   */
  async clientHistory(groupId, mac) {
    const j = await this.call('POST', '/logbizagent/logbiz/api/sta/sta_users', {}, { groupId, pageIndex: 0, pageSize: 100, staType: 'onofflineUserHistory', mac });
    const d = this.unwrap(j);
    return d.list || d.data || [];
  },
};

// persistent UI state (selected project, printer prefs)
const Store = {
  load() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch (e) { return {}; }
  },
  save(patch) {
    const s = Object.assign(this.load(), patch);
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    return s;
  },
};
