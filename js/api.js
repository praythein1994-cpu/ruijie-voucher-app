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
const GW_AUTH_RE = /GW_NOT_LOGGED_IN|auth|login|session|sid|token|expire|invalid|unauthori|forbidden|\b40[13]\b/i;
/** Is this error text (or throwaway message) an auth/session failure? */
function gwAuthLike(m) { return GW_AUTH_RE.test(String((m && m.message) || m || '')); }
/**
 * Does a resolved gateway response look like an auth/session failure?
 * (401/403, or an auth-ish message with a non-zero code.) A code-0 response
 * is never flagged, even if its message mentions auth words.
 */
function gwAuthFailed(j) {
  if (!j || typeof j !== 'object') return false;
  const code = Number(j.code);
  if (code === 401 || code === 403) return true;
  if (code === 0 || !j.code) return false;
  const m = String(j.msg || j.message || j.error || '');
  return /auth|login|session|sid|token|expire|invalid|unauthori|forbidden/i.test(m);
}
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
  /** Session: {ip, sid, sn, token}. The session itself lives in memory only.
   * The gateway PASSWORD is remembered in localStorage (gwPass) once the user
   * logs in successfully — the user explicitly asked that the app keep using
   * it (auto re-connect) until they change it or disconnect. The password is
   * never logged and never sent anywhere except the gateway itself. */
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

  /**
   * Auto-login with the remembered gateway credentials (user-requested).
   * Once the user has logged in once, the app must stay connected: after an
   * app restart — or when a session expires mid-use — the app re-connects by
   * itself with the remembered password, until the user explicitly
   * disconnects (gwAuto=false) or no password is remembered.
   * Returns true when a session is (now) available. Never throws.
   */
  async ensureLogin() {
    if (this.loggedIn()) return true;
    if (!hasGw()) return false;
    let s = null;
    try { s = Store.load(); } catch (_) { s = null; }
    if (!s || s.gwAuto === false) return false; // user explicitly disconnected
    const ip = String(s.gwIp || '100.88.200.103').trim() || '100.88.200.103';
    const pass = s.gwPass || '';
    if (!pass) return false;
    try { await this.login(ip, 'admin', pass); return true; }
    catch (_) { return false; }
  },

  /** Drop the current session and try a fresh login with remembered creds. */
  async relogin() {
    this.session = null;
    return this.ensureLogin();
  },

  /**
   * Run fn(); on auth-like failures (no session, expired/invalid sid),
   * drop the session, re-login with the remembered password and retry.
   * At most two attempts total; a second auth-like failure (or a failed
   * re-login) rethrows. Any non-auth error is rethrown untouched.
   */
  async _withAutoRelogin(fn) {
    let lastErr = null;
    for (let i = 0; i < 2; i++) {
      try {
        if (!this.loggedIn() && !(await this.ensureLogin()))
          throw new Error('Gateway re-login failed (check saved IP/password)');
        return await fn();
      } catch (e) {
        lastErr = e;
        if (!gwAuthLike(e)) throw e;
        this.session = null; // next iteration re-logs in
      }
    }
    throw lastErr;
  },

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
    return this._withAutoRelogin(async () => {
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(this.deviceListBody()));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return this.parseDevices(j);
    });
  },

  /**
   * v1.5.78: gateway-local device reboot. Wire format VERIFIED from a real
   * eWeb Reboot click (2026-09-30, RAP6202-G): a DIRECT devSta.set
   * (NOT cmdArr-wrapped), module "devReboot", data {sn:[...], reboot:"true"}.
   * Success = outer code 0 AND inner data.code 0.
   */
  deviceRebootBody(sn) {
    return {
      method: 'devSta.set',
      params: {
        module: 'devReboot',
        noParse: false,
        async: null,
        remoteIp: false,
        device: 'pc',
        data: { sn: [String(sn)], reboot: 'true' },
      },
    };
  },

  /** Reboot one gateway-local device by serial number. Throws on failure. */
  async deviceReboot(sn) {
    return this._withAutoRelogin(async () => {
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(this.deviceRebootBody(sn)));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const outer = j && typeof j.code !== 'undefined' ? Number(j.code) : -1;
      const inner = j && j.data && typeof j.data.code !== 'undefined' ? Number(j.data.code) : -1;
      if (outer !== 0 || inner !== 0) {
        throw new Error('ပြန်ဖွင့်မရပါ (code ' + outer + '/' + inner + ')');
      }
      return j;
    });
  },

  /**
   * v1.5.78: Flow Table / conntrack read (Diagnostics → Flow Statistics).
   * Wire format VERIFIED 2026-09-30: a DIRECT devSta.get (NOT cmdArr-wrapped),
   * module "content_audit", data {func:"ca_get_nf_conntrace"}.
   * Response ~166 kB — call on manual refresh only, never fast polling.
   */
  flowTableBody() {
    return {
      method: 'devSta.get',
      params: {
        module: 'content_audit',
        noParse: false,
        async: null,
        remoteIp: false,
        device: 'pc',
        data: { func: 'ca_get_nf_conntrace' },
      },
    };
  },

  /** Fetch the raw flow table. Returns {count, flows}. */
  async flowTable() {
    return this._withAutoRelogin(async () => {
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(this.flowTableBody()));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return this.parseFlowTable(j);
    });
  },

  /**
   * Pull the flow array out of a ca_get_nf_conntrace response.
   * Verified shape: {code:0, data:{count:"499", array:[...]}}.
   * Per-flow verified field names: protocol, src, dst, sport, dport,
   * src_down, dst_down, sport_down, dport_down, bytes, bytes_down,
   * packets, packets_down, state1, state2, aging_time, mark, use.
   * bytes = src→dst direction, bytes_down = return direction.
   */
  parseFlowTable(j) {
    const d = (j && j.data) || {};
    const arr = Array.isArray(d.array) ? d.array : [];
    const count = d.count != null ? Number(d.count) : arr.length;
    return { count: Number.isFinite(count) ? count : arr.length, flows: arr };
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
    return this._withAutoRelogin(async () => {
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
    catch (e) {
      /* Network blips return [] as before — but an auth-like rejection must
       * reach _withAutoRelogin so the session is refreshed and retried. */
      if (gwAuthLike(e)) throw e;
      return [];
    }
    if (gwAuthFailed(j)) throw new Error('Gateway session expired');
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
    });
  },

  /* ── AdBlock DNS toggle (v1.5.77) ─────────────────────────────
   * Gateway eWeb DHCP Option write path, captured from REAL saves
   * (user DevTools, 2026-09-30 — set 8.8.8.8, then cleared back).
   * READ: cmdArr batch {devConfig.get module dhcp_option} +
   *   {devConfig.get module network}, POST /cgi-bin/luci/api/cmd?auth=<sid>.
   * WRITE: a DIRECT devConfig.update (NOT wrapped in cmdArr) with
   *   data.single=[{vlan:"lan_<id>", custom_option:[],
   *   option:[{id:"6",value:"<dns>"},{id:"43",...},{id:"138",...},
   *   {id:"150",...},{id:"3",...}], vlan:"lan_<id>", device:"pc",
   *   module:"dhcp_option", noParse:false, remoteIp:false}].
   * Option id "6" = DNS servers (space-separated, up to 5 IPv4).
   * Scope: VLAN 20 (vlan tag "lan_20") — the voucher VLAN (user-confirmed).
   * Clearing option 6 to "" reverts the VLAN to inherited DNS. */
  AD_DNS: '94.140.14.14', // AdGuard DNS — user-specified; no invented secondary
  AD_VLAN: 'lan_20', // voucher VLAN 20

  /** Exact read envelope (verified from the wire). Pure. */
  dhcpOptionReadBody() {
    const sub = (method, params) => ({ method, params });
    const base = { noParse: false, async: null, remoteIp: false };
    return {
      method: 'cmdArr',
      params: {
        device: 'pc',
        params: [
          sub('devConfig.get', Object.assign({ module: 'dhcp_option' }, base)),
          sub('devConfig.get', Object.assign({ module: 'network' }, base)),
        ],
      },
    };
  },

  /**
   * Recursively find the dhcp_option entry for a vlan tag like "lan_20"
   * (an object carrying vlan/vlanid + an option[] array). Returns the
   * entry object or null. Pure — unit-tested.
   */
  findDhcpVlanEntry(node, vlanTag) {
    let found = null;
    const want = String(vlanTag).toLowerCase();
    const walk = (o) => {
      if (found || !o || typeof o !== 'object') return;
      if (Array.isArray(o)) { for (const x of o) walk(x); return; }
      const v = o.vlan != null ? o.vlan : (o.vlanid != null ? o.vlanid : o.vlanId);
      if (typeof v !== 'undefined' && String(v).toLowerCase() === want && Array.isArray(o.option)) {
        found = o; return;
      }
      const keys = Object.keys(o);
      for (const k of keys) { if (k !== 'parent') walk(o[k]); }
    };
    walk(node);
    return found;
  },

  /** option id "6" (DNS) value of a dhcp_option entry; "" when absent. Pure. */
  dhcpOption6Of(entry) {
    if (!entry || !Array.isArray(entry.option)) return '';
    const o = entry.option.find(x => x && String(x.id) === '6');
    return (o && o.value != null) ? String(o.value) : '';
  },

  /**
   * Exact write envelope (verified from a real eWeb save). `entry` is the
   * existing vlan entry from findDhcpVlanEntry (may be null); its other
   * options (43/138/150/3) and custom_option are preserved — only id "6"
   * is replaced. Pure — unit-tested against the captured payload.
   */
  dhcpOptionWriteBody(vlanTag, dnsValue, entry) {
    const base = { noParse: false, async: null, remoteIp: false };
    const dns = String(dnsValue);
    let opts;
    if (entry && Array.isArray(entry.option) && entry.option.length) {
      opts = entry.option.map(o => ({
        id: String(o.id),
        value: String(o.id) === '6' ? dns : String(o.value != null ? o.value : ''),
      }));
      if (!opts.some(o => o.id === '6')) opts.unshift({ id: '6', value: dns });
    } else {
      opts = ['6', '43', '138', '150', '3'].map(id => ({ id, value: id === '6' ? dns : '' }));
    }
    const singleEntry = Object.assign(
      { vlan: vlanTag },
      { custom_option: (entry && Array.isArray(entry.custom_option)) ? entry.custom_option : [] },
      { option: opts },
      // NOTE: the verified capture's single entry carries noParse/remoteIp
      // but NO async key (params does have async:null).
      { vlan: vlanTag, device: 'pc', module: 'dhcp_option', noParse: false, remoteIp: false }
    );
    return {
      method: 'devConfig.update',
      params: Object.assign({ module: 'dhcp_option', data: { single: [singleEntry] } }, base),
    };
  },

  /** Read the raw dhcp_option config (response data array). */
  async dhcpOptionRead() {
    return this._withAutoRelogin(async () => {
      const j = await gwCall('cmd', this.session.ip, this.session.sid,
        JSON.stringify(this.dhcpOptionReadBody()));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      if (!j || Number(j.code) !== 0) throw new Error((j && (j.msg || j.error)) || 'DHCP option ဖတ်မရပါ');
      return j.data;
    });
  },

  /**
   * Set option-6 DNS for one vlan tag. The gateway's own reply (code 0)
   * is the acceptance signal — same as the eWeb UI. Returns
   * {ok, before, readback}: `before` is the previous option-6 value,
   * `readback` is a best-effort re-read afterwards (the gateway does not
   * always echo per-VLAN entries, so a missing readback is reported, not
   * treated as failure). Throws with a Burmese message when the write
   * itself is rejected.
   */
  async dhcpOptionSetDns(vlanTag, dnsValue) {
    const data = await this.dhcpOptionRead();
    const entry = this.findDhcpVlanEntry(data, vlanTag);
    const before = this.dhcpOption6Of(entry);
    const body = this.dhcpOptionWriteBody(vlanTag, dnsValue, entry);
    await this._withAutoRelogin(async () => {
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      if (!j || Number(j.code) !== 0) throw new Error((j && (j.msg || j.error)) || 'DNS ပြောင်းမရပါ');
    });
    let readback = '';
    try {
      const data2 = await this.dhcpOptionRead();
      readback = this.dhcpOption6Of(this.findDhcpVlanEntry(data2, vlanTag));
    } catch (_) { /* best-effort only */ }
    return { ok: true, before, readback };
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
          mac: o.mac || o.devMac || '', // v1.5.78: switch rows key it as devMac (verified)
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

/* ═══════════ Flow Table aggregation (v1.5.78) — pure + unit-testable ═══
   Verified semantics (2026-09-30): bytes counts the src→dst direction
   (client upload side), bytes_down the return direction (download side).
   Only internet-bound client flows are aggregated: gateway-originated,
   LAN-local (dst private), multicast, loopback and malformed rows are
   filtered out. Cumulative counters of currently-tracked flows — NOT
   billing totals; flows expire, so one snapshot is not history. */
const _fNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const _fStr = v => String(v == null ? '' : v).trim();
const _isPrivateIp = ip => {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(_fStr(ip));
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
};
const _isSpecialIp = ip => {
  const s = _fStr(ip);
  if (!s || s === '0.0.0.0') return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(s);
  if (!m) return true;
  const a = +m[1];
  return a === 127 || a >= 224; // loopback + multicast/reserved
};

/**
 * Aggregate flows per client (src IP).
 * Returns [{ip, upBytes, downBytes, upPkts, downPkts, flows, dns:[]}],
 * sorted by total bytes desc. dns[] = distinct DNS-server IPs this client
 * contacted (UDP/TCP dport 53, TCP 853 DoT) — for the AdBlock DNS check.
 */
function aggFlowsByClient(flows) {
  const map = new Map();
  (Array.isArray(flows) ? flows : []).forEach(f => {
    if (!f || typeof f !== 'object') return;
    const src = _fStr(f.src), dst = _fStr(f.dst);
    if (!_isPrivateIp(src) || _isSpecialIp(src) || _isSpecialIp(dst)) return;
    if (src === dst) return;
    const lanLocal = _isPrivateIp(dst); // client→AP, mDNS, inter-VLAN…
    const dport = _fStr(f.dport);
    const isDns = dport === '53' || dport === '853';
    let e = map.get(src);
    if (!e) { e = { ip: src, upBytes: 0, downBytes: 0, upPkts: 0, downPkts: 0, flows: 0, dns: [] }; map.set(src, e); }
    if (isDns) {
      if (dst && e.dns.indexOf(dst) < 0) e.dns.push(dst);
    }
    if (lanLocal) return; // DNS noted above; LAN-local bytes don't count as internet use
    e.upBytes += _fNum(f.bytes);
    e.downBytes += _fNum(f.bytes_down);
    e.upPkts += _fNum(f.packets);
    e.downPkts += _fNum(f.packets_down);
    e.flows += 1;
  });
  return Array.from(map.values()).sort((a, b) => (b.upBytes + b.downBytes) - (a.upBytes + a.downBytes));
}

/** Identity of one conntrack flow for two-snapshot matching. */
function flowKey(f) {
  return [_fStr(f.protocol), _fStr(f.src), _fStr(f.dst), _fStr(f.sport), _fStr(f.dport)].join('|');
}

/**
 * Per-client up/down rates (bytes/sec) between two snapshots.
 * Only flows present in BOTH snapshots contribute (tuple-matched deltas);
 * new or vanished flows are ignored, so this is an ESTIMATE — the UI must
 * label it as such. Returns a Map ip → {upRate, downRate}.
 */
function flowRates(prevFlows, curFlows, dtMs) {
  const out = new Map();
  const dt = _fNum(dtMs) / 1000;
  if (!(dt > 0)) return out;
  const prev = new Map();
  (Array.isArray(prevFlows) ? prevFlows : []).forEach(f => {
    if (f && typeof f === 'object') prev.set(flowKey(f), f);
  });
  (Array.isArray(curFlows) ? curFlows : []).forEach(f => {
    if (!f || typeof f !== 'object') return;
    const p = prev.get(flowKey(f));
    if (!p) return;
    const du = _fNum(f.bytes) - _fNum(p.bytes);
    const dd = _fNum(f.bytes_down) - _fNum(p.bytes_down);
    if (du < 0 || dd < 0) return; // counter reset / replaced flow
    if (du === 0 && dd === 0) return;
    const src = _fStr(f.src);
    if (!_isPrivateIp(src) || _isSpecialIp(src)) return;
    let e = out.get(src);
    if (!e) { e = { upRate: 0, downRate: 0 }; out.set(src, e); }
    e.upRate += du / dt;
    e.downRate += dd / dt;
  });
  return out;
}

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

  /**
   * Portal webproxy envelope for voucher MAC unbind (internal API, undocumented).
   * EXACT shape from the live Ruijie portal JS (2026-09-30, user-authorized):
   * vue2Compat bundle: USER_MANAGE_VOUCHER_UNBIND_MAC = "/intlSamVoucher/unbindMac/{uuid}"
   * voucher modal unbindMac(): POST {api, method:"POST", replaces:{uuid},
   *   params:{recordList:[recordUuid], tenantId, macList:[mac], name:voucherCode},
   *   querys:{group_id}}
   * webproxy: POST https://cloud-as.ruijienetworks.com/webproxy/common/api?/intlSamVoucher/unbindMac/{uuid}?group_id=...
   */
  ssoUnbindMacEnvelope(uuid, groupId, recordList, macList, voucherCode, tenantId) {
    const api = '/intlSamVoucher/unbindMac/' + uuid;
    const gid = Number(groupId);
    const params = {
      recordList: recordList || [],
      macList: macList || [],
      name: voucherCode || '',
    };
    if (tenantId) params.tenantId = tenantId;
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params,
      querys: { group_id: Number.isFinite(gid) ? gid : groupId, lang: 'en' },
    };
  },

  /**
   * Portal webproxy envelope for listing bound MACs (internal API, undocumented).
   * vue2Compat bundle: USER_MANAGE_VOUCHER_GET_BIND_MAC_LIST = "/intlSamVoucher/getBindedMac/{tenantName}/{groupId}/{uuid}"
   * queryData(): GET {api, method:"GET", querys:{tenantId, ishttps:false}, replaces:{uuid, groupId, tenantName}}
   * Response list at voucherData.list, items {mac, bindTime, recordUuid}.
   */
  ssoGetBindMacListEnvelope(tenantName, groupId, uuid, tenantId) {
    const api = '/intlSamVoucher/getBindedMac/' + encodeURIComponent(tenantName || '') + '/' + groupId + '/' + uuid;
    const querys = { ishttps: false, lang: 'en' };
    if (tenantId) querys.tenantId = tenantId;
    return {
      api,
      authParams: { api, method: 'GET' },
      method: 'GET',
      module: 'default',
      params: {},
      querys,
    };
  },

  /** List MACs bound to a voucher through the SSO session. Returns array of {mac, bindTime, recordUuid}. */
  async voucherBindMacListSso(groupId, voucher, tenantName, tenantId) {
    const uuid = voucher.uuid || voucher.id || '';
    if (!uuid) throw new Error('Voucher UUID မရှိပါ (keys: ' + Object.keys(voucher || {}).slice(0, 8).join(',') + ')');
    if (!groupId) throw new Error('Project ID မရှိပါ');
    const env = this.ssoGetBindMacListEnvelope(tenantName, groupId, uuid, tenantId);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('MAC စာရင်း ရမရပါ (code ' + c + ')'));
    }
    const vd = (j && j.voucherData) || {};
    return vd.list || [];
  },

  /** Unbind MAC(s) from a voucher through the SSO session. Throws on portal error. */
  async voucherUnbindMacSso(groupId, voucher, recordList, macList, tenantId) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const code = voucher.voucherCode || voucher.codeNo || voucher.code || '';
    const uuid = voucher.uuid || voucher.id || '';
    if (!uuid) throw new Error('Voucher UUID မရှိပါ');
    const env = this.ssoUnbindMacEnvelope(uuid, groupId, recordList, macList, code, tenantId);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('Unbind မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── SSID management (Cloud webproxy, SSO session) ──
   * Source: portal's own JS (SeniorIndex-D70dfrR8.js, presetConf-CFOiaIt9.js),
   * read-only inspection 2026-09-30. Nothing was created/modified in the portal.
   * - GET /conf/group/{group_id}/templates → tempList[0].id = template id
   * - GET /conf/wifi_grp/wifi?group_id=X&conf_template_id=Y → data.ssidList[]
   * - POST /conf/template/{id}/ssid, params {wirelessConfEntity: {...}}
   *   (classic modal; WiFi7 drawer wraps differently but same object shape)
   * - PUT /conf/template/{id}/ssid/{ssid_id}, params {wirelessConfEntity: {...FULL object}}
   * Default new-SSID object (literal from SeniorIndex-D70dfrR8.js):
   * {ishidden:false, ssidEncode:"utf-8", fowardType:"bridge", vlanType:"1", vlanId:"1",
   *  encryptionMode:"wpa_wpa2-psk", wirelessMode:"compatibilityMode", relatedRadio:"1,2",
   *  bandSelectEnable:false, authEnable:false, authEntity:{}, enable:"true", ...}
   * Required: ssidName (unique), password (wpa types, charset
   * /^[a-zA-Z0-9@<=>\[\]!#$*().]+$/), encryptionMode, relatedRadio non-empty.
   * Encryption values: "open", "wpa-psk", "wpa_wpa2-psk" (default), "wpa2-psk". */

  /** Default object for a new SSID (portal's mtfDefaultForm + General preset). */
  ssoNewSsidDefaults() {
    return {
      wlanId: undefined,
      ishidden: false,
      ssidEncode: 'utf-8',
      fowardType: 'bridge',
      vlanType: '1',
      vlanId: '1',
      encryptionMode: 'wpa_wpa2-psk',
      wirelessMode: 'compatibilityMode',
      relatedRadio: '1,2',
      isApartment: false,
      bandSelectEnable: false,
      beMode: false,
      axMode: false,
      qosEnable: false,
      wlanQosEnable: false,
      authEnable: false,
      ppskEnable: false,
      ftEnable: 0,
      preset: '0',
      mlo: 0,
      l2iso: false,
      enable: 'true',
      authEntity: {},
    };
  },

  ssoSsidCreateEnvelope(tempId, ssidObj) {
    const api = '/conf/template/' + tempId + '/ssid';
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: { wirelessConfEntity: ssidObj },
      querys: { lang: 'en' },
    };
  },

  ssoSsidUpdateEnvelope(tempId, ssidId, ssidObj) {
    const api = '/conf/template/' + tempId + '/ssid/' + ssidId;
    return {
      api,
      authParams: { api, method: 'PUT' },
      method: 'PUT',
      module: 'default',
      params: { wirelessConfEntity: ssidObj },
      querys: { lang: 'en' },
    };
  },

  ssoSsidDeleteEnvelope(tempId, ssidId) {
    const api = '/conf/template/' + tempId + '/ssid/' + ssidId;
    return {
      api,
      authParams: { api, method: 'DELETE' },
      method: 'DELETE',
      module: 'default',
      params: {},
      querys: { lang: 'en' },
    };
  },

  /** Load template id, then the SSID list. Returns {tempId, list}. */
  async ssidListSso(groupId) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const tApi = '/conf/group/' + groupId + '/templates';
    const tj = await ssoCall(tApi, {
      api: tApi, authParams: { api: tApi, method: 'GET' },
      method: 'GET', module: 'default', params: {}, querys: { lang: 'en' },
    });
    const tempList = tj.tempList || tj.data || [];
    const tempId = tempList.length ? (tempList[0].id || tempList[0].templateId) : null;
    if (!tempId) throw new Error('Template မရှိပါ');
    const wApi = '/conf/wifi_grp/wifi';
    const wj = await ssoCall(wApi, {
      api: wApi, authParams: { api: wApi, method: 'GET' },
      method: 'GET', module: 'default', params: {},
      querys: { group_id: groupId, conf_template_id: tempId, lang: 'en' },
    });
    const list = (wj.data && wj.data.ssidList) || wj.ssidList || [];
    return { tempId, list };
  },

  /** Create a new SSID. opts: {ssidName, password, encryptionMode}. */
  async ssidCreateSso(groupId, opts) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const name = String(opts.ssidName || '').trim();
    const pwd = String(opts.password || '');
    if (!name) throw new Error('SSID နာမည် ထည့်ပါ');
    if (!/^[a-zA-Z0-9@<=>\[\]!#$*().]+$/.test(pwd) || pwd.length < 8) {
      throw new Error('Password 8 လုံးအထက်၊ ခွင့်ပြုတဲ့ စာလုံးတွေပဲ သုံးပါ');
    }
    const { tempId, list } = await this.ssidListSso(groupId);
    if (list.some(s => String(s.ssidName || '').toLowerCase() === name.toLowerCase())) {
      throw new Error('ဒီ SSID နာမည် ရှိနေပြီးသား');
    }
    const obj = Object.assign(this.ssoNewSsidDefaults(), {
      ssidName: name,
      password: pwd,
      encryptionMode: opts.encryptionMode || 'wpa_wpa2-psk',
    });
    const env = this.ssoSsidCreateEnvelope(tempId, obj);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('SSID ဆောက်မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /** Delete an SSID by name. Double-confirm in UI before calling. */
  async ssidDeleteSso(groupId, ssidName) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const { tempId, list } = await this.ssidListSso(groupId);
    const ssid = list.find(s => String(s.ssidName || '').toLowerCase() === String(ssidName).toLowerCase());
    if (!ssid) throw new Error('SSID မတွေ့ပါ: ' + ssidName);
    const ssidId = ssid.id || ssid.ssidId;
    if (!ssidId) throw new Error('SSID ID မရှိပါ');
    const env = this.ssoSsidDeleteEnvelope(tempId, ssidId);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('SSID ဖျက်မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /** Change an SSID's password: GET full object, set new password, PUT full object back. */
  async ssidSetPasswordSso(groupId, ssidName, newPassword) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const pwd = String(newPassword || '');
    if (!/^[a-zA-Z0-9@<=>\[\]!#$*().]+$/.test(pwd) || pwd.length < 8) {
      throw new Error('Password 8 လုံးအထက်၊ ခွင့်ပြုတဲ့ စာလုံးတွေပဲ သုံးပါ');
    }
    const { tempId, list } = await this.ssidListSso(groupId);
    const ssid = list.find(s => String(s.ssidName || '').toLowerCase() === String(ssidName).toLowerCase());
    if (!ssid) throw new Error('SSID မတွေ့ပါ: ' + ssidName);
    const ssidId = ssid.id || ssid.ssidId;
    if (!ssidId) throw new Error('SSID ID မရှိပါ');
    // PUT the FULL object back, only the password changed (portal sends full config).
    const obj = Object.assign({}, ssid);
    obj.password = pwd;
    if (Array.isArray(obj.relatedRadio)) obj.relatedRadio = obj.relatedRadio.join(',');
    if (!obj.authEntity) obj.authEntity = {};
    const env = this.ssoSsidUpdateEnvelope(tempId, ssidId, obj);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('Password ချိန်းမရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── Client kick / disconnect (Cloud webproxy, SSO session) ──
   * EXACT shape captured from the live Ruijie portal (Chrome DevTools,
   * 2026-09-29, user's authorized test client): the portal's own Disconnect
   * button on the Clients page sends
   * outer POST https://cloud-as.ruijienetworks.com/webproxy/common/api?/samTransfer/kick/user/offline
   * inner {"api":"/samTransfer/kick/user/offline",
   *         "authParams":{"api":"/samTransfer/kick/user/offline","method":"POST"},
   *         "method":"POST","module":"default",
   *         "params":{"group_id":<project id>,"account":"<voucher code>",
   *                   "auth_type":"15","mac":"<dotted-lowercase mac>","id":<auth record id>},
   *         "querys":{"lang":"en","cloudType":"smb"}}
   * Notes: params is an OBJECT here (unlike voucher delete's array); mac is
   * the dotted-lowercase form the portal reports (e.g. 461a.f562.bb5b);
   * auth_type "15" = Voucher (portal's own authType map). Disconnect only —
   * the voucher is never deleted. Android-APK-only (needs SSO session).
   * Throws on portal error; returns the raw response on success. */
  ssoKickEnvelope(groupId, rec) {
    const api = '/samTransfer/kick/user/offline';
    const mac = String(rec.userMac || rec.mac || '').toLowerCase();
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: {
        group_id: Number(groupId),
        account: String(rec.account || ''),
        auth_type: String(rec.authType || rec.auth_type || ''),
        mac,
        id: Number(rec.id),
      },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  /** Disconnect one client through the SSO session. Throws on portal error. */
  async clientKickSso(groupId, rec) {
    const env = this.ssoKickEnvelope(groupId, rec);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('ဖြုတ်မရပါ (code ' + c + ')'));
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
  async portalClients(groupId, { pageIndex = 1, pageSize = 500, linkedDevice = '', authCount = false, connectType = 'wireless' } = {}) {
    const querys = { group_id: Number(groupId), page_index: pageIndex, page_size: pageSize, lang: 'en' };
    // The portal's own client list sends connect_type "" for the "All" tab,
    // "wireless"/"wire" for the filtered tabs. Default 'wireless' preserves
    // the existing per-AP callers; pass '' for the unfiltered global list.
    if (connectType) querys.connect_type = connectType;
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

  /* ── Voucher Authenticate records (auth-server data) · v1.5.39 ──
     The portal's own "Auth Clients" page (verified 2026-09-28 against the
     portal's public JS chunk macc5/assets/index-C9-BzMTB.js + the live page):
       outer POST .../webproxy/common/api?/samTransfer/authuserinfos/bypage?cloudType=smb
       body {"api":"/samTransfer/authuserinfos/bypage?cloudType=smb",
             "method":"POST","module":"default",
             "params":{"group_id":N,"tenant_name":"...","page":1,"size":N},
             "querys":{"lang":"en"}}
       -> {code, data:{result:{list:[...], total}}, msg}
     Each record carries account (= the voucher code for voucher auths),
     userIp, userMac, authType ("15" = Voucher, per the portal's own
     authType map), loginTimes, onlineStatus, deviceSn. This table is
     AP-independent (keyed by group, not by AP) — it covers clients sitting
     on China/local APs that the portal's current-client snapshot never
     lists. NOTE: tenant_name is deliberately omitted — the app has no
     verified source for it, and the sibling /samTransfer/kick/user/offline
     endpoint works with group_id alone. If the backend ever requires it,
     the call fails here and callers fall back silently (never fabricated).
     Android-APK-only (needs SSO session). */
  async portalAuthUsers(groupId, { pageSize = 1000, maxPages = 5 } = {}) {
    const p = '/samTransfer/authuserinfos/bypage?cloudType=smb';
    const out = [];
    let total = Infinity, page = 1;
    while (out.length < total && page <= maxPages) {
      const env = {
        api: p, method: 'POST', module: 'default',
        params: { group_id: Number(groupId), page, size: pageSize },
        querys: { lang: 'en' },
      };
      const j = await ssoCall('/samTransfer/authuserinfos/bypage?cloudType=smb', env);
      if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
      if (Number(j.code) !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + j.code)));
      const res = (j.data && j.data.result) || {};
      const list = Array.isArray(res.list) ? res.list : [];
      out.push(...list);
      total = Number(res.total) || out.length;
      if (!list.length) break;
      page++;
    }
    return out;
  },

  /* v1.5.54: client auth history (verified 2026-09-28 — portal's own "Portal Auth
     Clients" page, read-only). Same envelope as portalAuthUsers but hits
     /samTransfer/userauthlogs/bypage. Record fields (camelCase): account,
     userIp, userMac, authType ("15" = Voucher), logoutReason, loginTimes,
     logoutTimes. 4,880 records seen live. Android-APK-only (needs SSO). */
  async portalAuthLogs(groupId, { pageSize = 500, maxPages = 3 } = {}) {
    const p = '/samTransfer/userauthlogs/bypage?cloudType=smb';
    const out = [];
    let total = Infinity, page = 1;
    while (out.length < total && page <= maxPages) {
      const env = {
        api: p, method: 'POST', module: 'default',
        params: { group_id: Number(groupId), page, size: pageSize },
        querys: { lang: 'en' },
      };
      const j = await ssoCall('/samTransfer/userauthlogs/bypage?cloudType=smb', env);
      if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
      if (Number(j.code) !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + j.code)));
      const res = (j.data && j.data.result) || {};
      const list = Array.isArray(res.list) ? res.list : [];
      out.push(...list);
      total = Number(res.total) || out.length;
      if (!list.length) break;
      page++;
    }
    return out;
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

/* ═══════════ NAMED LOGIN PROFILES (v1.5.79) ═══════════
 * Tier 1 (phone) of the 3-tier lookup: phone → render → github.
 * Tiers 2/3 live on the proxy (/api/profiles/:name); this object only
 * handles the on-device store. Name matching is case- AND space-insensitive:
 * "PrayThein", "praythein", "Pray Thein" and "pray Thein" all resolve to the
 * same profile. */
const PROFILES_KEY = 'rv_profiles_v1';
/**
 * Profile sync key for proxy writes. The APK build (android/build-apk.sh)
 * rewrites this line in the COPIED assets from .secrets/profiles_key, so the
 * real key never lands in the public repo / GitHub Pages. Web builds keep ''.
 */
const BUILTIN_SYNC_KEY = '';
const Profiles = {
  /** Normalize a typed name to its lookup key; '' when invalid. */
  normName(raw) {
    if (raw === null || raw === undefined) return '';
    const s = String(raw).trim().toLowerCase().replace(/\s+/g, '');
    if (s.length < 2 || s.length > 32) return '';
    if (!/^[a-z0-9._-]+$/.test(s)) return '';
    if (/^[.\-]|[.\-]$/.test(s)) return '';
    return s;
  },
  _all() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}'); }
    catch (e) { return {}; }
  },
  _write(all) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(all)); } catch (e) {}
  },
  /** Get a profile by typed name (case-insensitive). Returns null when absent. */
  get(rawName) {
    const name = this.normName(rawName);
    if (!name) return null;
    const p = this._all()[name];
    return p && typeof p === 'object' ? p : null;
  },
  /** Save/overwrite a profile. Returns the normalized key. */
  put(profile) {
    const all = this._all();
    const key = this.normName(profile.name);
    all[key] = { ...profile, name: key, updatedAt: Date.now() };
    this._write(all);
    return key;
  },
  /** Forget one profile by typed name. */
  forget(rawName) {
    const name = this.normName(rawName);
    if (!name) return;
    const all = this._all();
    delete all[name];
    this._write(all);
  },
  /** Validate profile fields. Returns null when OK, else the bad field name. */
  validate(p) {
    if (!p || typeof p !== 'object') return 'profile';
    if (!this.normName(p.name)) return 'name';
    if (!p.appid || String(p.appid).trim().length < 2) return 'appid';
    if (!p.secret || String(p.secret).trim().length < 2) return 'secret';
    if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email).trim())) return 'email';
    if (!p.password || String(p.password).length < 1) return 'password';
    return null;
  },
};

/* ═══════════ DIRECT GITHUB FALLBACK (v1.5.79) ═══════════
 * Tier 2 of the 3-tier lookup: phone -> github -> render.
 * Read-only token embedded by the owner (fine-grained PAT, contents:read
 * on the profiles repo only). The file holds {profiles: {name: profile}}.
 * Writes always go through the proxy — this token cannot write. */
const GITHUB_PROFILES = {
  repo: 'praythein1994-cpu/ruijie-profiles',
  branch: 'main',
  path: 'profiles.json',
  token: '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',
};

/**
 * Direct GitHub read (tier 2). No proxy involved.
 * Returns {status:'found'|'notfound'|'error', profile?}.
 */
Profiles.fetchGithub = async function (rawName) {
  const name = this.normName(rawName);
  if (!name) return { status: 'notfound' };
  if (!GITHUB_PROFILES.token || !GITHUB_PROFILES.repo) return { status: 'error' };
  const url = 'https://api.github.com/repos/' + GITHUB_PROFILES.repo +
    '/contents/' + GITHUB_PROFILES.path + '?ref=' + encodeURIComponent(GITHUB_PROFILES.branch);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + GITHUB_PROFILES.token,
        'Accept': 'application/vnd.github+json',
      },
      signal: ctrl.signal,
    });
    if (r.status === 404) return { status: 'notfound' };
    if (!r.ok) return { status: 'error' };
    const j = await r.json();
    const b64 = String(j.content || '').replace(/\s+/g, '');
    if (!b64) return { status: 'error' };
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const store = JSON.parse(new TextDecoder().decode(bytes));
    const p = store && store.profiles && store.profiles[name];
    if (p && typeof p === 'object') return { status: 'found', profile: p };
    return { status: 'notfound' };
  } catch (e) {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Proxy read (tier 3: render disk, then the proxy's own github read-through).
 * Returns {status:'found'|'notfound'|'error', profile?}.
 */
Profiles.fetchProxy = async function (rawName, proxyUrl) {
  const name = this.normName(rawName);
  if (!name) return { status: 'notfound' };
  const base = String(proxyUrl || '').replace(/\/+$/, '');
  if (!base) return { status: 'error' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(base + '/api/profiles/' + encodeURIComponent(name), { signal: ctrl.signal });
    if (r.status === 404) return { status: 'notfound' };
    if (!r.ok) return { status: 'error' };
    const j = await r.json();
    if (j && j.ok && j.profile) return { status: 'found', profile: j.profile };
    return { status: 'notfound' };
  } catch (e) {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Full 3-tier lookup: phone (instant) -> github direct (15s) -> proxy (15s).
 * A remote hit is cached to the phone so the next login is instant.
 * Returns {status:'found'|'notfound'|'error'|'badname', source?, profile?}.
 * 'error' means at least one remote tier failed (slow/offline) — the caller
 * should show "try again", not "not found".
 */
Profiles.lookup = async function (rawName, proxyUrl) {
  const name = this.normName(rawName);
  if (!name) return { status: 'badname' };
  const local = this.get(name);
  if (local) return { status: 'found', source: 'phone', profile: local };
  const gh = await this.fetchGithub(name);
  if (gh.status === 'found') {
    try { this.put(gh.profile); } catch (e) {}
    return { status: 'found', source: 'github', profile: gh.profile };
  }
  const px = await this.fetchProxy(name, proxyUrl);
  if (px.status === 'found') {
    try { this.put(px.profile); } catch (e) {}
    return { status: 'found', source: 'render', profile: px.profile };
  }
  if (gh.status === 'error' || px.status === 'error') return { status: 'error' };
  return { status: 'notfound' };
};

/**
 * Push a profile to the proxy (tiers 2+3: render disk + github write-through).
 * Returns {proxy:'ok'|'error'|'key', github:'ok'|'error'|'skipped'}.
 * 'key' means the proxy demands a sync key (HTTP 403, code -6).
 */
Profiles.pushRemote = async function (name, profile, key, proxyUrl) {
  const out = { proxy: 'error', github: 'skipped' };
  const base = String(proxyUrl || '').replace(/\/+$/, '');
  if (!base) return out;
  // Built-in APK key first, then typed/remembered key override.
  const sendKey = key || BUILTIN_SYNC_KEY || '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(base + '/api/profiles/' + encodeURIComponent(name), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, key: sendKey }),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => null);
    if (r.status === 403 && j && j.code === -6) { out.proxy = 'key'; return out; }
    if (r.ok && j && j.ok) {
      out.proxy = 'ok';
      out.github = (j.github === 'ok') ? 'ok' : (j.github === 'error' ? 'error' : 'skipped');
    }
  } catch (e) { /* out.proxy stays 'error' */ }
  finally { clearTimeout(timer); }
  return out;
};
