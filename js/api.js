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
/* fix1: iOS-style loading overlay — shown during silent SSO login at app
 * entry while the native dialog stays hidden. Hidden again when the SSO
 * result arrives (success or cancel), and by applyTheme-timeout safety.
 * Defensive: never throws (node test harness has no document). */
function showIosLoading() {
  try {
    const el = document.getElementById('ios-loading');
    if (el) { el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
  } catch (e) {}
}
function hideIosLoading() {
  try {
    const el = document.getElementById('ios-loading');
    if (el) { el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
  } catch (e) {}
}
window._ssoEvent = (name) => {
  hideIosLoading(); // fix1: SSO settled (login or cancel) — drop the loading overlay
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
/* v1.5.115: pull MAC-like strings out of a blocklist reply of unknown
 * shape. v1.5.117: recurse through EVERY key (the real response nests the
 * list under keys we cannot predict — the old fixed key list silently
 * returned []), unwrap stringified JSON, dedupe, and never match a MAC
 * pattern buried inside a longer hex token. Returns [] when nothing
 * recognizable is found. */
function extractMacList(j) {
  const out = [];
  const seen = new Set();
  const MAC_RE = /(?:^|[^0-9a-fA-F])([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}|[0-9a-fA-F]{4}(?:\.[0-9a-fA-F]{4}){2}|[0-9a-fA-F]{12})(?:[^0-9a-fA-F]|$)/;
  function emit(s) {
    const m = String(s).match(MAC_RE);
    if (m) {
      const key = m[1].toUpperCase();
      if (!seen.has(key)) { seen.add(key); out.push(m[1]); }
    }
  }
  function grab(v, depth) {
    if (v == null || depth > 8) return;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.length > 1 && (t[0] === '{' || t[0] === '[')) {
        try { grab(JSON.parse(t), depth + 1); return; } catch (e) { /* not JSON */ }
      }
      emit(v);
      return;
    }
    if (Array.isArray(v)) { for (const x of v) grab(x, depth + 1); return; }
    if (typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (/^(code|msg|message|error|success)$/i.test(k)) continue;
        grab(v[k], depth + 1);
      }
    }
  }
  grab(j, 0);
  return out;
}
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

/* ── Gateway STA record normalizer · v1.5.96 ──
 * Pure, self-contained (safe to eval in tests). Normalizes ONE raw object
 * from any gateway client module into {mac, ip, apSn, apMac, apName, ssid,
 * rssi, host}. Returns null when the object is not a STA record.
 * Verified 2026-10-01 from the user's DevTools capture of the gateway's
 * own Online Clients page (/admin/home_online):
 *   devSta.get {module:"user_list", data:{devType:"all", dataType:"timely"}}
 * whose records carry: mac, userIp, ssid, deviceAliasName (AP name),
 * hostName, rssi, sn (AP serial). Older firmware guesses (sta_list etc.)
 * are kept as fallbacks. */
const normGwStaRecord = o => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const cleanNull = s => { s = String(s == null ? '' : s).trim(); return (/^null$/i.test(s) ? '' : s); };
  const mac = o.mac || o.staMac || o.clientMac || o.stamac || '';
  if (!mac || !/^[0-9a-fA-F:]{11,}/.test(String(mac))) return null;
  return {
    mac: String(mac).toUpperCase(),
    // v1.5.96: userIp is the verified field (user_list); the rest are
    // older firmware guesses kept as fallbacks.
    ip: cleanNull(o.userIp || o.ip || o.staIp || o.clientIp || o.staip || ''),
    apSn: o.sn || o.devSN || o.apSn || o.apsn || o.linkedSn || o.ap_sn || '',
    apMac: o.apMac || o.apmac || o.bssid || '',
    apName: cleanNull(o.deviceAliasName || o.deviceAlias || o.apName || ''),
    ssid: o.ssid || '',
    rssi: (o.rssi != null ? o.rssi : (o.signal != null ? o.signal : '')),
    host: cleanNull(o.hostName || o.hostname || o.deviceName || o.staName || ''),
  };
};

/* ── Fix12b: gateway Authentication -> Online Clients (app_auth) ──
 * Pure normalizer for the records returned by
 *   devSta.get {module:"app_auth", data:{func:"app_auth_get_user_online"}}
 * Verified 2026-10-01 from the user's DevTools capture of
 * /admin/alone/authentication/web_online (Response saved as 2-5.txt):
 *   {code:0, data:{user:[{mac:"fa17.5101.04e3", ip:"192.168.20.141",
 *    userName:"33637503", auth_type:"wifidog", time:"2026-10-1 6:49:46",
 *    timeUsed:"10930", timeLimit:"0", status:"On"}, ...]}}
 * userName IS the voucher code the client authenticated with. MAC arrives
 * in dotted form ("fa17.5101.04e3") — normMac strips the separators.
 * Returns {mac, ip, voucher, authType, loginTime, timeUsedSec, status},
 * or null when the record carries no usable MAC or no userName. */
const normGwAuthUser = o => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const mac = normMac(o.mac || '');
  if (!mac) return null;
  const userName = String(o.userName || o.username || o.account || '').trim();
  if (!userName) return null;
  return {
    mac,
    ip: String(o.ip || o.userIp || '').trim(),
    voucher: userName,
    authType: String(o.auth_type || o.authType || '').trim(),
    loginTime: String(o.time || o.loginTime || '').trim(),
    timeUsedSec: parseInt(o.timeUsed, 10) || 0,
    status: String(o.status || '').trim(),
  };
};

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

  /* ── QoS management (v1.5.150) — VERIFIED from user's Gateway Capture
   * 2026-10-03 (gateway-capture-20261003-175108.txt, -175334.txt).
   * Smart QoS: devConfig.set module "flowctrl".
   * Key Group (App Priority): devConfig.update module "flowctrl_app".
   * App features: devConfig.update module "funcmgr" cmd "ctlSta". */

  /** Read Smart QoS config. Returns {tcSwitch, uploadBand, downloadBand} or null. */
  async qosGet() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devConfig.get',
        params: { module: 'flowctrl', noParse: false, async: null, remoteIp: false, device: 'pc' },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const d = (j && j.data) || {};
      const list = Array.isArray(d.list) ? d.list : [];
      const wan = list[0] || {};
      return {
        tcSwitch: d.tcSwitch || 'off',
        uploadBand: wan.uploadBand || '',
        downloadBand: wan.downloadBand || '',
        raw: d,
      };
    });
  },

  /** Write Smart QoS config. tcSwitch: "on"|"off". Returns true on success.
   * v1.5.171: accepts the last-read gateway state (raw) and merges — fields
   * the UI doesn't edit (p2p switch, wan count, extra WAN entries) are
   * preserved so a concurrent change from the other phone isn't clobbered.
   * The gateway is the source of truth; callers should pass fresh raw. */
  async qosSet(tcSwitch, uploadBand, downloadBand, raw) {
    return this._withAutoRelogin(async () => {
      const r = (raw && typeof raw === 'object') ? raw : {};
      const upB = String(uploadBand);
      const dnB = String(downloadBand);
      // Preserve every WAN entry the gateway reported, applying the new
      // bands to each (UI exposes a single up/down pair).
      const rawList = Array.isArray(r.list) ? r.list : [];
      const list = rawList.length
        ? rawList.map(w => ({ ...w, uploadBand: upB, downloadBand: dnB }))
        : [{
            downloadBand: dnB,
            enable: 'on',
            ifname: 'br-wan',
            uploadBand: upB,
          }];
      const body = {
        method: 'devConfig.set',
        params: {
          module: 'flowctrl', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: {
            tcSwitch: tcSwitch ? 'on' : 'off',
            p2pSwtich: r.p2pSwtich || 'off',
            wanNum: r.wanNum || '1',
            list,
            version: r.version || '1.0.0',
          },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return j && j.code === 0;
    });
  },

  /** Read Application Priority Key Group. Returns {appList:[...]} or null. */
  async qosAppGet() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: { module: 'flowctrl_app', noParse: false, async: null, remoteIp: false, device: 'pc' },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const d = (j && j.data) || {};
      const list = Array.isArray(d.list) ? d.list : [];
      const key = list.find(x => x.appGrp === 'key') || list[0] || {};
      return { appList: Array.isArray(key.appList) ? key.appList : [], raw: d };
    });
  },

  /** Write Application Priority Key Group app list. Returns true on success. */
  async qosAppSet(appList) {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devConfig.update',
        params: {
          module: 'flowctrl_app', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: { list: [{ appGrp: 'key', name: '关键通道', appList: appList }] },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return j && j.code === 0;
    });
  },

  /** Write full Application Group List (key/suppression/normal). groups: [{appGrp, name, appList}]. */
  async qosAppSetAll(groups) {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devConfig.update',
        params: {
          module: 'flowctrl_app', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: { list: groups },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return j && j.code === 0;
    });
  },

  /** Fetch the app signature tree for selection. Returns array of {name, apps:[...]} or null. */
  async qosAppTree() {
    return this._withAutoRelogin(async () => {
      // v1.5.163: match gateway UI — cmdArr batch with appIcon (from capture 20261003-193202 [35])
      const body = {
        method: 'cmdArr',
        params: {
          device: 'pc',
          params: [
            { method: 'devSta.get', params: { module: 'content_audit', noParse: false, async: null, remoteIp: false, data: { func: 'app_idy_get_app_tree' } } },
            { method: 'devConfig.get', params: { module: 'appIcon', noParse: false, async: null, remoteIp: false } },
          ],
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      // cmdArr response: {code:0, data:[treeResult, iconResult]}
      const arr = (j && j.data) || [];
      const treeRes = Array.isArray(arr) ? arr[0] : {};
      const d = (treeRes && treeRes.data) || treeRes || {};
      // v1.5.165: debug — store raw response info for diagnostics
      try {
        const grpSample = d && Array.isArray(d.grp_list) && d.grp_list.length > 0
          ? JSON.stringify(d.grp_list[0]).slice(0, 200)
          : null;
        window._qosTreeDebug = {
          hasData: !!j.data,
          arrLen: Array.isArray(arr) ? arr.length : -1,
          treeKeys: d && typeof d === 'object' ? Object.keys(d).slice(0, 10) : [],
          treeCode: treeRes && treeRes.code,
          grpLen: d && Array.isArray(d.grp_list) ? d.grp_list.length : -1,
          grpSample: grpSample,
        };
      } catch (_) {}
      const out = [];
      const seen = new Set();
      const addName = (n) => {
        if (typeof n !== 'string') return;
        const s = n.trim();
        if (s.length < 2 || s.length > 64) return;
        if (seen.has(s)) return;
        seen.add(s);
        out.push({ name: s, leaf: true, id: s });
      };
      const walk = (node, depth) => {
        if (!node || depth > 10) return; // v1.5.177: PUBG at depth 8 was cut off
        if (typeof node === 'string') { addName(node); return; }
        if (Array.isArray(node)) { node.forEach(n => walk(n, depth + 1)); return; }
        if (typeof node === 'object') {
          const nm = node.name || node.appName || node.label || node.app_name || node.title;
          // v1.5.171: include ALL named nodes (parents like PUBG too) — match Gateway search behavior
          if (nm && typeof nm === 'string') addName(nm);
          for (const k of ['children', 'sub', 'apps', 'list', 'items', 'data', 'tree', 'grp_list', 'group_list', 'app_list']) {
            if (node[k]) walk(node[k], depth + 1);
          }
          if (Array.isArray(node.appList)) node.appList.forEach(addName);
        }
      };
      try { walk(d, 0); } catch (_) {}
      // v1.5.171: sort A-Z (case-insensitive) so the app list is alphabetical
      out.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      if (out.length >= 3) return out;
      throw new Error('parsed ' + out.length + ' apps');
    });
  },

  /** Read Custom QoS policies (flowctrl_udp). Returns {list:[...]} or null.
   * v1.5.163: use devSta.get (from capture 20261003-193202 [37]), not devConfig.get */
  async qosPolicyGet() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: { module: 'flowctrl_udp', noParse: false, async: null, remoteIp: false, device: 'pc' },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const d = (j && j.data) || {};
      return { list: Array.isArray(d.list) ? d.list : [], raw: d };
    });
  },

  /** Get gateway user groups for QoS policy. Returns array of {name, path}. */
  async qosUserGroupList() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: { module: 'user_group', data: { type: 'all' }, device: 'pc' },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const d = (j && j.data) || {};
      const list = Array.isArray(d.list) ? d.list : (Array.isArray(d.groups) ? d.groups : []);
      return list.map(g => ({
        name: g.name || g.groupName || g.path || '',
        path: g.path || g.name || '',
        raw: g,
      })).filter(g => g.name);
    });
  },

  /** Write full Custom QoS policy list. Returns true on success. */
  async qosPolicySet(list) {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devConfig.update',
        params: {
          module: 'flowctrl_udp', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: { list: list },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return j && j.code === 0;
    });
  },

  /** Toggle a funcmgr feature (e.g. "app_identify"). on: boolean. Returns true on success. */
  async funcToggle(funcName, on) {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devConfig.update',
        params: {
          module: 'funcmgr', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: {
            cmd: 'ctlSta',
            data: { funcName: [funcName], switch: on ? '1' : '0' },
            callSource: 'front',
          },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return j && j.code === 0;
    });
  },

  /** Read funcmgr status for all functions. Returns {funcName: "1"|"0"} map or null. */
  async funcStatus() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: {
          module: 'funcmgr', noParse: false, async: null, remoteIp: false, device: 'pc',
          data: { cmd: 'getSta', data: { funcName: ['all'] } },
        },
      };
      const j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body));
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      return (j && j.data) || null;
    });
  },

  /**
   * Gateway-local wireless client (STA) list, v1.5.29.
   * v1.5.96: the gateway's OWN Online Clients page (/admin/home_online)
   * uses devSta.get {module:"user_list", data:{devType:"all",
   * dataType:"timely"}} — verified 2026-10-01 from the user's DevTools
   * capture. devType "all" = every user on every AP (wired + wireless,
   * Cloud + China APs), each record carrying userIp, ssid and
   * deviceAliasName (AP name). It is probed FIRST; the older guesses
   * (sta_list, sta_info, client_list, wireless_sta) stay as fallbacks.
   * Records are normalized with normGwStaRecord and deduped by MAC.
   * Returns [{mac, ip, apSn, apMac, apName, ssid, rssi, host}];
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
          sub('devSta.get', Object.assign({ module: 'user_list', data: { devType: 'all', dataType: 'timely' } }, base)),
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
      // v1.5.96: normalization lives in normGwStaRecord (top-level, pure,
      // unit-tested) — verified against the user_list capture.
      const rec = normGwStaRecord(o);
      if (rec) { out.push(rec); return; }
      Object.keys(o).forEach(k => { if (k !== 'parent') grab(o[k]); });
    };
    grab(j && j.data ? j.data : j);
    // Dedupe by MAC (multiple modules may return the same STAs).
    const seen = new Set();
    return out.filter(r => (seen.has(r.mac) ? false : (seen.add(r.mac), true)));
    });
  },

  /**
   * Gateway Authentication -> Online Clients (v1.5.96, Fix12b).
   * The gateway's OWN authenticated-user list, verified 2026-10-01 from the
   * user's DevTools capture of /admin/alone/authentication/web_online:
   *   POST /cgi-bin/luci/api/cmd?auth=<sid>
   *   {method:"devSta.get", params:{module:"app_auth", noParse:false,
   *    async:null, remoteIp:false, data:{func:"app_auth_get_user_online"},
   *    device:"pc"}}
   * -> {code:0, data:{user:[{mac, ip, userName, auth_type, time,
   *      timeUsed, timeLimit, status}]}} — userName IS the voucher code.
   * NOTE: this list holds only the authenticated (voucher) users — it is a
   * voucher-attribution source, NOT the full client enumeration (that stays
   * staList()/user_list). Callers join by MAC: app_auth wins for the
   * Voucher column, everything else keeps working as before.
   * Returns {list:[{mac, ip, voucher, ...}], byMac:Map}; empty = unavailable.
   */
  async authOnlineUsers() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: {
          module: 'app_auth', noParse: false, async: null, remoteIp: false,
          data: { func: 'app_auth_get_user_online' }, device: 'pc',
        },
      };
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        return { list: [], byMac: new Map() };
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const users = j && j.data && Array.isArray(j.data.user) ? j.data.user : [];
      const list = [];
      const byMac = new Map();
      for (const r of users) {
        const u = normGwAuthUser(r);
        if (!u || byMac.has(u.mac)) continue;
        byMac.set(u.mac, u);
        list.push(u);
      }
      return { list, byMac };
    });
  },

  /**
   * Gateway Web Authentication config — READ (v1.5.96, Fix13).
   * Verified 2026-10-01 from the user's DevTools capture of
   * /admin/alone/authentication/web_authentication (response 2-6.txt):
   *   POST /cgi-bin/luci/api/cmd?auth=<sid>
   *   {method:"cmdArr", params:{device:"pc", params:[
   *     {method:"devSta.get", params:{module:"app_auth", noParse:false,
   *       async:null, remoteIp:false, data:{func:"app_auth_get_macc"},
   *       device:"pc"}},
   *     {method:"acConfig.get", params:{module:"apPortalMacc",
   *       noParse:false, async:null, remoteIp:false}},
   *     {method:"devConfig.get", params:{module:"appAuthParamFmt",
   *       noParse:false, async:null, remoteIp:false}}]}}
   * Returns the element-[0] config object (the editable web-auth config):
   *   {enable, ad_url, authType, proxy_https, flowDetectEn, flowDetectTime,
   *    setSsidIpList:[{ssidName, ip:[ranges]}], authIpList, macByPass,
   *    cfgIdOpt, authenMlist, acctMlist, authorMlist, paramFmt, ...}
   * or null when the gateway does not answer.
   */
  async webAuthGet() {
    return this._withAutoRelogin(async () => {
      const sub = (method, params) => ({ method, params });
      const base = { noParse: false, async: null, remoteIp: false };
      const body = {
        method: 'cmdArr',
        params: {
          device: 'pc',
          params: [
            sub('devSta.get', Object.assign({ module: 'app_auth', data: { func: 'app_auth_get_macc' }, device: 'pc' }, base)),
            sub('acConfig.get', Object.assign({ module: 'apPortalMacc' }, base)),
            sub('devConfig.get', Object.assign({ module: 'appAuthParamFmt' }, base)),
          ],
        },
      };
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        return null;
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      if (!j || Number(j.code) !== 0) return null;
      const el = j.data && Array.isArray(j.data) ? j.data[0] : null;
      return (el && typeof el === 'object' && !Array.isArray(el)) ? el : null;
    });
  },

  /**
   * Pure builder for the web-auth WRITE body (v1.5.96, Fix13).
   * Verified 2026-10-01 from the user's DevTools Save capture
   * (request 2-7.txt, response "success_set"):
   *   POST /cgi-bin/luci/api/cmd?auth=<sid>
   *   {method:"devConfig.set", params:{module:"app_auth_macc",
   *    noParse:false, async:true, remoteIp:false, device:"pc",
   *    data:{<FULL config object as read>}}}
   * NOTE: the write module is "app_auth_macc" (read func is
   * app_auth_get_macc under module "app_auth"). The FULL object read by
   * webAuthGet must be sent back — pass the object the app read, mutated
   * in place; never construct it from scratch (fields like paramFmt and
   * wxRedirect would be lost).
   */
  webAuthWriteBody(cfg) {
    return {
      method: 'devConfig.set',
      params: {
        module: 'app_auth_macc', noParse: false, async: true,
        remoteIp: false, device: 'pc', data: cfg,
      },
    };
  },

  /**
   * Gateway Web Authentication config — WRITE (v1.5.96, Fix13).
   * Success reply: {code:0, data:{rcode:"00000000", message:"success_set"}}
   */
  async webAuthSet(cfg) {
    return this._withAutoRelogin(async () => {
      const body = this.webAuthWriteBody(cfg);
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        throw new Error('Gateway သို့ ချိတ်ဆက်၍မရပါ');
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const ok = j && Number(j.code) === 0 && j.data &&
        (String(j.data.rcode) === '00000000' || /success/i.test(String(j.data.message || '')));
      if (!ok) throw new Error((j && j.data && j.data.message) || 'Gateway က save လက်မခံပါ');
      return true;
    });
  },

  /**
   * Gateway Web Authentication — Allowlist READ (v1.5.96, Fix15).
   * Verified 2026-10-01 from the user's DevTools capture of
   * /admin/alone/authentication/web_authentication?tab=4 (page load):
   *   {method:"devSta.get", params:{module:"app_auth", noParse:false,
   *    async:null, remoteIp:false, device:"pc",
   *    data:{func:"app_auth_get_whitelist"}}}
   *   -> {code:0, data:{deny_mac:[], mac:["C4:B2:5B:26:45:26", …11],
   *        srcip:[], url:["portal-as.ruijienetwork.com",
   *        "ruijiecloud.com", "ruijienetwork.com"], dstip:[]}}
   * Direct devSta.get (NOT cmdArr-wrapped). Returns the data object or null.
   */
  async allowlistGet() {
    return this._withAutoRelogin(async () => {
      const body = {
        method: 'devSta.get',
        params: {
          module: 'app_auth', noParse: false, async: null,
          remoteIp: false, device: 'pc',
          data: { func: 'app_auth_get_whitelist' },
        },
      };
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        return null;
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      if (!j || Number(j.code) !== 0) return null;
      const d = j.data;
      return (d && typeof d === 'object' && !Array.isArray(d)) ? d : null;
    });
  },

  /**
   * Pure builder for the MAC Allowlist WRITE body (v1.5.96, Fix15).
   * Verified 2026-10-01 from the user's DevTools Save capture on ?tab=4
   * (after adding a MAC ending 45:2B and pressing OK):
   *   {method:"devConfig.set", params:{module:"app_auth_direct_mac",
   *    noParse:false, async:null, remoteIp:false, device:"pc",
   *    data:{type:"mac", data:["C4:B2:5B:26:45:26", …11]}}}
   *   -> {code:0, data:{code:0, id:null, data:"", error:null}}
   * MACs are colon-UPPERCASE. The write sends the FULL list — callers
   * must read first and mutate the read list, never send a partial one.
   */
  allowlistMacWriteBody(macs) {
    const norm = macs.map(m => String(m).trim().toUpperCase());
    return {
      method: 'devConfig.set',
      params: {
        module: 'app_auth_direct_mac', noParse: false, async: null,
        remoteIp: false, device: 'pc',
        data: { type: 'mac', data: norm },
      },
    };
  },

  /**
   * Gateway Web Authentication — MAC Allowlist WRITE (v1.5.96, Fix15).
   * Success reply: {code:0, data:{code:0, …}} (outer AND inner code 0).
   */
  async allowlistMacSet(macs) {
    return this._withAutoRelogin(async () => {
      const body = this.allowlistMacWriteBody(macs);
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        throw new Error('Gateway သို့ ချိတ်ဆက်၍မရပါ');
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const ok = j && Number(j.code) === 0 && j.data && Number(j.data.code) === 0;
      if (!ok) throw new Error((j && j.data && (j.data.msg || j.data.message)) || 'Gateway က save လက်မခံပါ');
      return true;
    });
  },
  /**
   * Gateway Web Authentication — Global Config READ (v1.5.96, Fix14).
   * Verified 2026-10-01 from the user's DevTools capture of
   * /admin/alone/authentication/web_authentication?tab=7:
   *   {method:"cmdArr", params:{device:"pc", params:[
   *     {method:"devConfig.get", params:{module:"globalAuthConf",
   *       noParse:false, async:null, remoteIp:false}},
   *     {method:"devConfig.get", params:{module:"authCertUpload",
   *       noParse:false, async:null, remoteIp:false}}]}}
   * -> {code:0, data:[ {proto:"http", remind_days:"1",
   *      remind_interval:"1", remind_content:"", user_state_url:
   *      "lan.auth.reyee.com", charge_url:"", remind_url:"",
   *      flow_detect_time:"15", http_host_check:"1", version:"1.0.0",
   *      configTime, currentTime, configId}, {cert list} ]}
   * Returns element [0] (the editable global config) or null.
   */
  async globalAuthGet() {
    return this._withAutoRelogin(async () => {
      const sub = (method, params) => ({ method, params });
      const base = { noParse: false, async: null, remoteIp: false };
      const body = {
        method: 'cmdArr',
        params: {
          device: 'pc',
          params: [
            sub('devConfig.get', Object.assign({ module: 'globalAuthConf' }, base)),
            sub('devConfig.get', Object.assign({ module: 'authCertUpload' }, base)),
          ],
        },
      };
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        return null;
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      if (!j || Number(j.code) !== 0) return null;
      const el = j.data && Array.isArray(j.data) ? j.data[0] : null;
      return (el && typeof el === 'object' && !Array.isArray(el)) ? el : null;
    });
  },

  /**
   * Pure builder for the Global Config WRITE body (v1.5.96, Fix14).
   * Verified 2026-10-01 from the user's DevTools Save capture on ?tab=7:
   *   {method:"devConfig.set", params:{module:"globalAuthConf",
   *    noParse:false, async:null, remoteIp:false, device:"pc",
   *    data:{proto:"http", remind_days:"1", remind_interval:"1",
   *      remind_content:"", charge_url:"", flow_detect_time:"15",
   *      http_host_check:"1", remind_url:"",
   *      user_state_url:"lan.auth.reyee.com", version:"1.0.0"}}}
   * -> {code:0, data:{rcode:"00000000", msg:"success"}}
   * NOTE: the write carries exactly these 10 verified keys — the read's
   * metadata keys (configTime/currentTime/configId) are NOT sent.
   */
  globalAuthWriteBody(cfg) {
    const pick = (o, ks) => { const d = {}; for (const k of ks) d[k] = o[k]; return d; };
    return {
      method: 'devConfig.set',
      params: {
        module: 'globalAuthConf', noParse: false, async: null,
        remoteIp: false, device: 'pc',
        data: pick(cfg, ['proto', 'remind_days', 'remind_interval',
          'remind_content', 'charge_url', 'flow_detect_time',
          'http_host_check', 'remind_url', 'user_state_url', 'version']),
      },
    };
  },

  /**
   * Gateway Web Authentication — Global Config WRITE (v1.5.96, Fix14).
   * Success reply: {code:0, data:{rcode:"00000000", msg:"success"}}
   */
  async globalAuthSet(cfg) {
    return this._withAutoRelogin(async () => {
      const body = this.globalAuthWriteBody(cfg);
      let j = null;
      try { j = await gwCall('cmd', this.session.ip, this.session.sid, JSON.stringify(body)); }
      catch (e) {
        if (gwAuthLike(e)) throw e;
        throw new Error('Gateway သို့ ချိတ်ဆက်၍မရပါ');
      }
      if (gwAuthFailed(j)) throw new Error('Gateway session expired');
      const ok = j && Number(j.code) === 0 && j.data &&
        (String(j.data.rcode) === '00000000' || /success/i.test(String(j.data.msg || j.data.message || '')));
      if (!ok) throw new Error((j && j.data && (j.data.msg || j.data.message)) || 'Gateway က save လက်မခံပါ');
      return true;
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
   * v1.5.101: Voucher reset (Ruijie Cloud "Reset" in the voucher More menu).
   * Reset clears a voucher's usage (used time / used quota) back to fresh.
   * VERIFIED 2026-10-01 from the live Ruijie portal JS (user-authorized):
   * vue2Compat bundle: USER_MANAGE_VOUCHER_RESET = "/intlSamVoucher/voucher/reset"
   * UserManagement page reset(e): POST {api, method:"POST",
   *   params:{recordList:[uuid,...], voucherCode:"code1,code2"},
   *   querys:{group_id}}
   * Response: s.code truthy -> error s.msg; s.voucherData.code truthy ->
   * warn s.voucherData.msg; else success. Throws SSO_REQUIRED without
   * an SSO session, like delete.
   */
  async voucherReset(groupId, voucher) {
    if (this.ssoLoggedIn()) return this.voucherResetSso(groupId, voucher);
    throw new Error('SSO_REQUIRED');
  },
  /** Batch reset through the SSO session (portal sends one call for all selected). */
  async voucherResetMany(groupId, vouchers) {
    if (this.ssoLoggedIn()) return this.voucherResetManySso(groupId, vouchers);
    throw new Error('SSO_REQUIRED');
  },
  ssoResetEnvelope(codes, uuids, groupId) {
    const api = '/intlSamVoucher/voucher/reset';
    const gid = Number(groupId);
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: { recordList: uuids, voucherCode: codes.join(',') },
      querys: { group_id: Number.isFinite(gid) ? gid : groupId },
    };
  },
  /** Reset vouchers through the SSO session. Throws on portal error. */
  async voucherResetSso(groupId, voucher) {
    return this.voucherResetManySso(groupId, [voucher]);
  },
  async voucherResetManySso(groupId, vouchers) {
    const vs = (vouchers || []).filter(Boolean);
    const codes = vs.map(v => v.voucherCode || v.codeNo || v.code || '').filter(Boolean);
    const uuids = vs.map(v => v.uuid || v.id || '').filter(Boolean);
    const env = this.ssoResetEnvelope(codes, uuids, groupId);
    const j = await ssoCall(env.api, env);
    if (j && j.code) {
      throw new Error(j.msg || j.message || ('Reset မရပါ (code ' + j.code + ')'));
    }
    const vd = j && j.voucherData;
    if (vd && vd.code) {
      throw new Error(vd.msg || vd.message || ('Reset မရပါ (code ' + vd.code + ')'));
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

  /** Rename an SSID (WiFi name): GET full object, set new ssidName,
   * PUT full object back. Portal route: PUT /conf/template/{id}/ssid/{ssid_id}
   * with the FULL wirelessConfEntity — same pattern as password change
   * (verified 2026-10-01 from the portal's own write flow). */
  async ssidRenameSso(groupId, oldName, newName) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const name = String(newName || '').trim();
    if (!name || name.length > 32) throw new Error('SSID_BADNAME');
    const { tempId, list } = await this.ssidListSso(groupId);
    const ssid = list.find(s => String(s.ssidName || '').toLowerCase() === String(oldName).toLowerCase());
    if (!ssid) throw new Error('SSID မတွေ့ပါ: ' + oldName);
    if (list.some(s => s !== ssid && String(s.ssidName || '').toLowerCase() === name.toLowerCase())) {
      throw new Error('SSID_NAMEEXISTS');
    }
    const ssidId = ssid.id || ssid.ssidId;
    if (!ssidId) throw new Error('SSID ID မရှိပါ');
    // PUT the FULL object back, only the name changed (portal sends full config).
    const obj = Object.assign({}, ssid);
    obj.ssidName = name;
    if (Array.isArray(obj.relatedRadio)) obj.relatedRadio = obj.relatedRadio.join(',');
    if (!obj.authEntity) obj.authEntity = {};
    const env = this.ssoSsidUpdateEnvelope(tempId, ssidId, obj);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('နာမည်ပြောင်းမရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── Per-client speed limit on an SSID (Cloud webproxy, SSO session) ──
   * Wire format VERIFIED from the portal's own JS (docs/wifi-ratelimit-spec.md,
   * 2026-09-30): PUT /conf/template/{id}/ssid/{ssid_id} with the FULL
   * wirelessConfEntity — only upRate/downRate changed.
   * upRate/downRate = per-client caps on that SSID (NOT the whole-SSID totals
   * wlanUpRate/wlanDownRate).
   * UNIT: Kbps per Ruijie cloud convention — VERIFYING via live portal UI
   * (browser task 2026-10-01); the UI converts Mbps <-> Kbps at the edges so
   * only this constant changes if the portal shows a different unit.
   * User-approved 2026-10-01 ("speed limit ထည့်"). */
  ssidRateUnit() { return 'Kbps'; },
  ssidMbpsToUnit(mbps) { return Math.round(Number(mbps) * 1000); },
  ssidUnitToMbps(unit) { return Number(unit) / 1000; },

  /** Set per-client up/down rate caps on an SSID. Rates in Mbps (UI unit). */
  async ssidSetRatesSso(groupId, ssidName, upMbps, downMbps) {
    if (!this.ssoLoggedIn()) throw new Error('SSO_REQUIRED');
    const up = Number(upMbps), down = Number(downMbps);
    if (!(up >= 0 && down >= 0) || !isFinite(up) || !isFinite(down)) {
      throw new Error('Speed 0 သို့မဟုတ် အပေါင်းကိန်း ထည့်ပါ');
    }
    const { tempId, list } = await this.ssidListSso(groupId);
    const ssid = list.find(s => String(s.ssidName || '').toLowerCase() === String(ssidName).toLowerCase());
    if (!ssid) throw new Error('SSID မတွေ့ပါ: ' + ssidName);
    const ssidId = ssid.id || ssid.ssidId;
    if (!ssidId) throw new Error('SSID ID မရှိပါ');
    // PUT the FULL object back, only the rate fields changed (portal sends full config).
    const obj = Object.assign({}, ssid);
    obj.upRate = this.ssidMbpsToUnit(up);
    obj.downRate = this.ssidMbpsToUnit(down);
    if (Array.isArray(obj.relatedRadio)) obj.relatedRadio = obj.relatedRadio.join(',');
    if (!obj.authEntity) obj.authEntity = {};
    const env = this.ssoSsidUpdateEnvelope(tempId, ssidId, obj);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? j.code : 0;
    if (c !== 0 && c !== 200) {
      throw new Error(j.msg || j.message || ('Speed limit ချိန်မရပါ (code ' + c + ')'));
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

  /* ── Portal MAC block / unblock (Cloud webproxy, SSO session) · v1.5.95 ──
   * Verified 2026-10-01 from the user's DevTools captures on the portal's
   * own client list (block + unblock clicks, both HTTP 200):
   * Block:   outer POST .../webproxy/common/api?/enet/conf/group/{gid}/mac_filter
   *          inner {"api":"/enet/conf/group/{gid}/mac_filter","method":"POST",
   *                 "authParams":{"api":...,"method":"POST"},
   *                 "params":{"type":"deny","macList":[{"mac":"62:22:3f:a9:9f:14"}]},
   *                 "module":"default","querys":{"lang":"en","cloudType":"smb"}}
   *          MAC is colon-separated lowercase.
   * Unblock: outer POST .../webproxy/common/api?/enet/conf/group/{gid}/mac_filter
   *          inner {"api":"/enet/conf/group/{gid}/mac_filter","method":"DELETE",
   *                 "authParams":{"api":...,"method":"DELETE"},
   *                 "module":"default",
   *                 "querys":{"group_id":6752877,"mac":"6222.3fa9.9f14",
   *                          "type":"global","lang":"en","cloudType":"smb"}}
   *          MAC is dotted-lowercase.
   * Android-APK-only (needs the SSO portal session, like kick). Throws on
   * portal error; returns the raw response on success. */
  ssoBlockEnvelope(groupId, macColon) {
    const api = '/enet/conf/group/' + Number(groupId) + '/mac_filter';
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: {
        type: 'deny',
        macList: [{ mac: String(macColon || '').toLowerCase() }],
      },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  /** Block one client MAC through the SSO session. Throws on portal error. */
  async clientBlockSso(groupId, macColon) {
    const env = this.ssoBlockEnvelope(groupId, macColon);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('Block မရပါ (code ' + c + ')'));
    }
    return j;
  },

  ssoUnblockEnvelope(groupId, macDotted) {
    const api = '/enet/conf/group/' + Number(groupId) + '/mac_filter';
    return {
      api,
      authParams: { api, method: 'DELETE' },
      method: 'DELETE',
      module: 'default',
      querys: {
        group_id: Number(groupId),
        mac: String(macDotted || '').toLowerCase(),
        type: 'global',
        lang: 'en',
        cloudType: 'smb',
      },
    };
  },

  /** Unblock one client MAC through the SSO session. Throws on portal error. */
  async clientUnblockSso(groupId, macDotted) {
    const env = this.ssoUnblockEnvelope(groupId, macDotted);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('Unblock မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── Portal MAC deny-list READ (v1.5.116) ──
   * VERIFIED from the user's Recorder capture 2026-10-01 23:41 +0630
   * (portal-capture-20261001-234138.txt, entry [100]): visiting the
   * portal's block page fires
   *   outer POST .../webproxy/common/api?/homescene/mac_filter/{gid}
   *   inner {"api":"/homescene/mac_filter/{gid}","method":"GET",
   *          "module":"default","querys":{"lang":"en","cloudType":"smb"},
   *          "authParams":{"api":"/homescene/mac_filter/{gid}",
   *                        "method":"GET"}}
   * The response shape was NOT captured, so extractMacList() parses
   * flexibly and clientBlocklistSso() still never throws (null on any
   * failure → caller keeps the local list). */
  ssoBlocklistEnvelope(groupId) {
    const api = '/homescene/mac_filter/' + Number(groupId);
    return {
      api,
      authParams: { api, method: 'GET' },
      method: 'GET',
      module: 'default',
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  async clientBlocklistSso(groupId) {
    try {
      const env = this.ssoBlocklistEnvelope(groupId);
      const j = await ssoCall(env.api, env);
      const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
      if (c !== 0) return null;
      return extractMacList(j);
    } catch (e) {
      return null;
    }
  },

  /* ── Delete Expired Vouchers (bulk, portal-verified) · v1.5.113 ──
   * VERIFIED 2026-10-01 from the user's Recorder capture of the live
   * Cloud portal voucher page (240 requests). The portal does NOT loop
   * per-voucher deletes — it calls the macc3 agent through webproxy:
   * count:  POST /webproxy/common/api?/authconfig/group/{gid}/api/agent/read
   *          inner {api, method:'POST', authParams, module:'default',
   *                 params:{urlSuffix:'/macc3/getExpireVoucherCount/{gid}',
   *                        httpMethod:'POST', bodyParam:{expireTime:<ms>}},
   *                 querys:{lang:'en',cloudType:'smb'}}
   * delete: POST /webproxy/common/api?/authconfig/group/{gid}/api/agent/write
   *          inner params:{urlSuffix:'/macc3/batchDelete/voucher/{gid}',
   *                       httpMethod:'DELETE', bodyParam:{expireTime:<ms>}}
   * expireTime is an epoch-ms cutoff; we use Date.now(). */
  ssoExpireCountEnvelope(groupId, expireTimeMs) {
    const gid = Number(groupId);
    const api = '/authconfig/group/' + gid + '/api/agent/read';
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: {
        urlSuffix: '/macc3/getExpireVoucherCount/' + gid,
        httpMethod: 'POST',
        bodyParam: { expireTime: expireTimeMs },
      },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  /** Returns the portal's expired-voucher count (raw JSON). Throws on portal error. */
  async voucherExpireCountSso(groupId, expireTimeMs) {
    const env = this.ssoExpireCountEnvelope(groupId, expireTimeMs);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('Count မရပါ (code ' + c + ')'));
    }
    return j;
  },

  ssoDeleteExpiredEnvelope(groupId, expireTimeMs) {
    const gid = Number(groupId);
    const api = '/authconfig/group/' + gid + '/api/agent/write';
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: {
        urlSuffix: '/macc3/batchDelete/voucher/' + gid,
        httpMethod: 'DELETE',
        bodyParam: { expireTime: expireTimeMs },
      },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  /** Bulk-delete expired vouchers through the SSO session. Throws on portal error. */
  async voucherDeleteExpiredSso(groupId, expireTimeMs) {
    const env = this.ssoDeleteExpiredEnvelope(groupId, expireTimeMs);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('Delete မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── User group add (portal, SSO) · v1.5.95 ──
   * Verified 2026-10-01 from the user's DevTools capture on
   * #/config_group_userManagement_menu — 2-step flow:
   * 1. POST /intlSamProfile/create/{email}/{email}/{groupId}
   *    inner {"api":"/intlSamProfile/create/{email}/{email}/{groupId}","method":"POST",
   *           "authParams":{"api":...,"method":"POST"},"module":"default",
   *           "params":{...profile fields...},
   *           "querys":{"tenantId":341634,"lang":"en","cloudType":"smb"}}
   *    → response carries the new authProfileId
   * 2. POST /intl/usergroup/group/{groupId}
   *    inner {"api":"/intl/usergroup/group/{groupId}","method":"POST",
   *           "authParams":{"api":...,"method":"POST"},"module":"default",
   *           "params":{"list":[{...same fields..., "authProfileId":"<from step 1>"}]},
   *           "querys":{"lang":"en","cloudType":"smb"}}
   */
  ssoUserGroupProfileEnvelope(email, groupId, p, tenantId) {
    const e = encodeURIComponent(email || '');
    const api = '/intlSamProfile/create/' + e + '/' + e + '/' + Number(groupId);
    const querys = { lang: 'en', cloudType: 'smb' };
    if (tenantId) querys.tenantId = tenantId;
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: p,
      querys,
    };
  },

  ssoUserGroupEnvelope(groupId, g) {
    const api = '/intl/usergroup/group/' + Number(groupId);
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params: { list: [g] },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },

  /** Build the shared profile/group params object from form fields. */
  buildUserGroupParams(f, groupId) {
    const ipRange = String(f.ip || '').trim();
    return {
      name: String(f.name || '').trim(),
      userGroupName: String(f.name || '').trim(),
      price: String(f.price == null ? '' : f.price),
      quota: Number(f.quota) || 0,
      timePeriod: Number(f.timePeriod) || 0,
      timePeriodDaily: Number(f.timePeriodDaily) || 0,
      timePeriodDailyCustom: Number(f.timePeriodDailyCustom) || 0,
      timePeriodTotal: Number(f.timePeriodTotal) || 0,
      uploadRateLimit: Number(f.uploadRateLimit) || 0,
      downloadRateLimit: Number(f.downloadRateLimit) || 0,
      noOfDevice: String(f.noOfDevice == null ? '' : f.noOfDevice),
      packageType: String(f.packageType || 'COMMON'),
      bindSsid: String(f.bindSsid || ''),
      isBindSsid: f.isBindSsid ? 1 : 0,
      bindMac: f.bindMac ? 1 : 0,
      ip: ipRange,
      bindIpList: ipRange ? [ipRange] : [],
      kickOffType: Number(f.kickOffType) || 0,
      durationCtrlType: Number(f.durationCtrlType) || 0,
      limitedTimes: Number(f.limitedTimes) || 0,
      lowQuota: Number(f.lowQuota) || 0,
      lowUploadRateLimit: Number(f.lowUploadRateLimit) || 0,
      lowDownloadRateLimit: Number(f.lowDownloadRateLimit) || 0,
      lowProfileStatus: Number(f.lowProfileStatus) || 0,
      groupId: Number(groupId),
    };
  },

  /** Pull the new authProfileId out of the step-1 response (tries common spots). */
  extractAuthProfileId(j) {
    if (!j || typeof j !== 'object') return '';
    const d = j.data && typeof j.data === 'object' ? j.data : null;
    const r = j.result && typeof j.result === 'object' ? j.result : null;
    const cand = [
      j.authProfileId, j.profileId, j.id,
      d && (d.authProfileId || d.profileId || d.id),
      r && (r.authProfileId || r.profileId || r.id),
    ];
    for (const c of cand) {
      if (c !== undefined && c !== null && String(c)) return String(c);
    }
    return '';
  },

  /** Create a user group through the SSO session (2-step). Throws on portal error. */
  async userGroupAddSso(groupId, email, tenantId, fields) {
    const profile = this.buildUserGroupParams(fields, groupId);
    const env1 = this.ssoUserGroupProfileEnvelope(email, groupId, profile, tenantId);
    const j1 = await ssoCall(env1.api, env1);
    const c1 = j1 && typeof j1.code !== 'undefined' ? Number(j1.code) : 0;
    if (c1 !== 0) {
      throw new Error((j1 && (j1.msg || j1.message)) || ('Profile create မရပါ (code ' + c1 + ')'));
    }
    const authProfileId = this.extractAuthProfileId(j1);
    if (!authProfileId) throw new Error('authProfileId မရပါ');
    const group = Object.assign({}, profile, { authProfileId });
    const env2 = this.ssoUserGroupEnvelope(groupId, group);
    const j2 = await ssoCall(env2.api, env2);
    const c2 = j2 && typeof j2.code !== 'undefined' ? Number(j2.code) : 0;
    if (c2 !== 0) {
      throw new Error((j2 && (j2.msg || j2.message)) || ('Group create မရပါ (code ' + c2 + ')'));
    }
    return j2;
  },

  /* ── User group EDIT (portal, SSO) · v1.5.146 ──
   * Verified 2026-10-03 from the user's DevTools capture of a real portal
   * group edit (Edit -> Save on "Unlimited"), file
   * workspace/user/files/portal-capture-20261003-081723.txt entry [99].
   * Single step (unlike add/delete which are 2-step):
   *   outer  POST .../webproxy/common/api?/intlSamProfile/update/{email}/{email}/{groupId}
   *   inner  {"api":"/intlSamProfile/update/{email}/{email}/{groupId}","method":"POST",
   *           "authParams":{"api":...,"method":"POST"},"module":"default",
   *           "params":{...full profile object with edits...},
   *           "querys":{"tenantId":341634,"group_id":6752877,"lang":"en","cloudType":"smb"}}
   * The portal sends the FULL profile object (id, authProfileId, uuid,
   * createTime, updateTime, originGroupName, ...) with edited fields
   * overridden — no second usergroup/group call. We replicate that by
   * spreading the original list record, then applying the form values. */
  ssoUserGroupProfileUpdateEnvelope(email, groupId, params, tenantId) {
    const e = encodeURIComponent(email || '');
    const api = '/intlSamProfile/update/' + e + '/' + e + '/' + Number(groupId);
    return {
      api,
      authParams: { api, method: 'POST' },
      method: 'POST',
      module: 'default',
      params,
      querys: { tenantId, group_id: Number(groupId), lang: 'en', cloudType: 'smb' },
    };
  },

  /** Update a user group through the SSO session (single profile-update step).
   * origRecord: the list item from userGroupList (preserves id/authProfileId/
   * uuid/createTime/...). fields: edited form values (buildUserGroupParams shape). */
  async userGroupEditSso(groupId, email, tenantId, origRecord, fields) {
    if (!origRecord || typeof origRecord !== 'object') throw new Error('Group data မရပါ');
    const params = Object.assign({}, origRecord, this.buildUserGroupParams(fields, groupId));
    // The portal's edit params carry no UI-only keys; drop ours.
    delete params.loading;
    const env = this.ssoUserGroupProfileUpdateEnvelope(email, groupId, params, tenantId);
    const j = await ssoCall(env.api, env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : 0;
    if (c !== 0) {
      throw new Error((j && (j.msg || j.message)) || ('Group ပြင်၍မရပါ (code ' + c + ')'));
    }
    return j;
  },

  /* ── Portal user group DELETE (Cloud webproxy, SSO session) · v1.5.96 ──
   * Verified 2026-10-01 from the user's DevTools capture of a real portal
   * group delete (Delete button -> portal confirm OK):
   * Step 1 — delete the group record:
   *   outer  POST .../webproxy/common/api?/intl/usergroup/group/6752877
   *   inner  {"api":"/intl/usergroup/group/6752877","method":"DELETE",
   *           "authParams":{"api":"/intl/usergroup/group/6752877","method":"DELETE"},
   *           "params":{"list":[699225]},"module":"default",
   *           "querys":{"lang":"en","cloudType":"smb"}}
   * Step 2 — delete the auth profile:
   *   outer  POST .../webproxy/common/api?/intlSamProfile/delete/16384157693025024909983414791988
   *   inner  {"api":"/intlSamProfile/delete/16384157693025024909983414791988","method":"DELETE",
   *           "authParams":{"api":"/intlSamProfile/delete/16384157693025024909983414791988","method":"DELETE"},
   *           "module":"default",
   *           "querys":{"tenantId":341634,"group_id":6752877,"lang":"en","cloudType":"smb"}}
   * (step 2 carries NO params field). Android-APK-only (needs SSO session).
   */
  ssoUserGroupDeleteStep1Envelope(groupId, userGroupId) {
    const api = '/intl/usergroup/group/' + Number(groupId);
    return {
      api,
      authParams: { api, method: 'DELETE' },
      method: 'DELETE',
      module: 'default',
      params: { list: [Number(userGroupId)] },
      querys: { lang: 'en', cloudType: 'smb' },
    };
  },
  ssoUserGroupDeleteStep2Envelope(groupId, tenantId, authProfileId) {
    const api = '/intlSamProfile/delete/' + String(authProfileId);
    const querys = { group_id: Number(groupId), lang: 'en', cloudType: 'smb' };
    if (tenantId) querys.tenantId = Number(tenantId);
    return {
      api,
      authParams: { api, method: 'DELETE' },
      method: 'DELETE',
      module: 'default',
      querys,
    };
  },
  /** Delete a user group through the SSO session (2-step: group record, then auth profile). Throws on portal error. */
  async userGroupDeleteSso(groupId, tenantId, userGroupId, authProfileId) {
    const env1 = this.ssoUserGroupDeleteStep1Envelope(groupId, userGroupId);
    const j1 = await ssoCall(env1.api, env1);
    const c1 = j1 && typeof j1.code !== 'undefined' ? Number(j1.code) : -1;
    if (c1 !== 0) {
      throw new Error((j1 && (j1.msg || j1.message)) || ('Group ဖျက်မရပါ (code ' + c1 + ')'));
    }
    const env2 = this.ssoUserGroupDeleteStep2Envelope(groupId, tenantId, authProfileId);
    const j2 = await ssoCall(env2.api, env2);
    const c2 = j2 && typeof j2.code !== 'undefined' ? Number(j2.code) : -1;
    if (c2 !== 0) {
      throw new Error((j2 && (j2.msg || j2.message)) || ('Profile ဖျက်မရပါ (code ' + c2 + ')'));
    }
    return j2;
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

  // ── 2.4a Device firmware upgrade (SSO portal) ─────────────────
  /* Verified from the portal's own upgradeDeviceModal bundle (2026-10-02):
   * trigger: POST /upgrade/device with params {snList:[...],
   * jobUniqueId: epoch-ms, targetVersion, schedule:{startInterval,
   * endInterval, beginDate}, retryTimes (1-10), firmwareId, groupId}.
   * check: POST /upgrade/condition/check with {groupId[, serialNumbers]}
   * returns {checkInofs:[{recommendSoftware, real_recommendSoftware,
   * newestSoftwareVersion, real_newestSoftwareVersion, firmwareId,
   * newestFirmwareId, deviceSns (comma-joined), deviceNum, deviceType,
   * deviceSoftware, deviceHardware, releaseNotes, ...}]}.
   * firmwares: GET /firmwares/cloud?page={p}&per_page={n}[&software..]. */
  upgradeCheckEnvelope(groupId) {
    return {
      api: '/upgrade/condition/check?cloudType=smb',
      method: 'POST',
      params: { groupId },
      module: 'default',
      querys: { lang: 'en' },
    };
  },

  /** Check which firmware upgrades are available (SSO). Returns the
   *  portal's checkInofs array (per-model upgrade info). */
  async upgradeConditionCheckSso(groupId) {
    const env = this.upgradeCheckEnvelope(groupId);
    const j = await ssoCall('/upgrade/condition/check', env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : -1;
    if (c !== 0) throw new Error(j.msg || j.message || ('အပ်ဒိတ်စစ်မရပါ (code ' + c + ')'));
    const d = j.data || j;
    return d.checkInofs || d.checkInfo || d.list || [];
  },

  upgradeDeviceEnvelope({ snList, targetVersion, firmwareId, groupId, retryTimes = 3 }) {
    const now = Date.now();
    return {
      api: '/upgrade/device?cloudType=smb',
      method: 'POST',
      params: {
        snList,
        jobUniqueId: now,
        targetVersion: targetVersion || '',
        schedule: { startInterval: '00:00', endInterval: '23:50', beginDate: now },
        retryTimes,
        firmwareId: firmwareId || null,
        groupId,
      },
      module: 'default',
      querys: { lang: 'en' },
    };
  },

  /** Trigger a firmware upgrade job (SSO). Throws on portal error. */
  async upgradeDeviceSso(opts) {
    const env = this.upgradeDeviceEnvelope(opts);
    const j = await ssoCall('/upgrade/device', env);
    const c = j && typeof j.code !== 'undefined' ? Number(j.code) : -1;
    if (c !== 0) throw new Error(j.msg || j.message || ('အပ်ဒိတ်တင်မရပါ (code ' + c + ')'));
    return j;
  },

  /** Upgrade entry points: SSO session required (Ruijie account login). */
  async upgradeConditionCheck(groupId) {
    if (this.ssoLoggedIn()) return this.upgradeConditionCheckSso(groupId);
    throw new Error('SSO_REQUIRED');
  },
  async upgradeDevice(opts) {
    if (this.ssoLoggedIn()) return this.upgradeDeviceSso(opts);
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
  /* v1.5.132: cache the auth-config flag per project (5-min TTL) — it
   * changes only when portal auth is (de)configured, and callers await it
   * before every client-list fetch. Saves one SSO round-trip per load. */
  _authStatusCache: {},
  async portalAuthStatus(groupId) {
    const gid = Number(groupId);
    const hit = this._authStatusCache[gid];
    if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.val;
    const p = '/intl/auth/v2/status/' + gid;
    const j = await ssoCall(p, { api: p, method: 'GET', module: 'default', params: {}, querys: { lang: 'en' } });
    if (!j || typeof j !== 'object') throw new Error('Invalid response from cloud');
    if (Number(j.code) !== 0) throw new Error('Ruijie: ' + (j.msg || j.message || ('code ' + j.code)));
    const val = !!j.hasConfigAuth;
    this._authStatusCache[gid] = { val, at: Date.now() };
    return val;
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
    try { if (typeof SettingsSync !== 'undefined') SettingsSync.onLocalChange(patch); } catch (e) {}
    return s;
  },
};

/* ═══════════ APP SETTINGS SYNC (v1.5.120) ═══════════
 * Syncs app settings across the user's phones via the proxy:
 *   PUT /api/settings/:name { settings, updatedAt, key }
 *   GET /api/settings/:name -> { settings, updatedAt }
 * NEVER syncs: gwPass, gwIp, gwAuto (gateway credentials stay on-device).
 * Conflict: last-write-wins by updatedAt. Push is debounced 3s. */
const SETTINGS_NEVER_SYNC = ['gwPass', 'gwIp', 'gwAuto', 'lastGen', 'kicked', 'kickedVouchers', 'vcache', '_settingsUpdatedAt'];
const SettingsSync = {
  _timer: null,
  _proxyBase() {
    try {
      const p = (typeof Profiles !== 'undefined' && Profiles.getProxyBase) ? Profiles.getProxyBase() : '';
      if (p) return String(p).replace(/\/+$/, '');
    } catch (e) {}
    return 'https://ruijie-voucher-proxy.onrender.com';
  },
  _userName() {
    try { return localStorage.getItem('rv_profile_name') || ''; } catch (e) { return ''; }
  },
  _syncKey() {
    try { return (typeof BUILTIN_SYNC_KEY !== 'undefined' && BUILTIN_SYNC_KEY) || ''; } catch (e) { return ''; }
  },
  getSyncable() {
    const s = Store.load(), out = {};
    for (const k of Object.keys(s)) {
      if (SETTINGS_NEVER_SYNC.includes(k)) continue;
      out[k] = s[k];
    }
    // v1.5.125: include native device-offline-monitor setting
    try {
      if (window.RuijieBridge && window.RuijieBridge.monitorInfo) {
        const info = JSON.parse(window.RuijieBridge.monitorInfo());
        out._monEnabled = !!info.enabled;
      }
    } catch (e) {}
    return out;
  },
  onLocalChange(patch) {
    if (!patch || typeof patch !== 'object') return;
    const keys = Object.keys(patch);
    if (!keys.some(k => !SETTINGS_NEVER_SYNC.includes(k))) return;
    if (!this._userName()) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 3000);
  },
  async push() {
    const name = this._userName();
    if (!name) return { ok: false, reason: 'no-user' };
    const norm = (typeof Profiles !== 'undefined' && Profiles.normName) ? Profiles.normName(name) : String(name).toLowerCase().replace(/\s+/g, '');
    if (!norm) return { ok: false, reason: 'bad-name' };
    const body = { settings: this.getSyncable(), updatedAt: Date.now(), key: this._syncKey() };
    try {
      const r = await fetch(this._proxyBase() + '/api/settings/' + encodeURIComponent(norm), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await r.json();
    } catch (e) { return { ok: false, reason: 'network' }; }
  },
  async pull() {
    const name = this._userName();
    if (!name) return { ok: false, reason: 'no-user' };
    const norm = (typeof Profiles !== 'undefined' && Profiles.normName) ? Profiles.normName(name) : String(name).toLowerCase().replace(/\s+/g, '');
    if (!norm) return { ok: false, reason: 'bad-name' };
    try {
      const r = await fetch(this._proxyBase() + '/api/settings/' + encodeURIComponent(norm), { method: 'GET' });
      if (r.status === 404) return { ok: false, reason: 'not-found' };
      const j = await r.json();
      if (!j.ok || !j.settings) return { ok: false, reason: 'bad-response' };
      const localUpdatedAt = Number(Store.load()._settingsUpdatedAt) || 0;
      if ((Number(j.updatedAt) || 0) > localUpdatedAt) {
        const clean = {};
        for (const k of Object.keys(j.settings)) {
          if (SETTINGS_NEVER_SYNC.includes(k)) continue;
          clean[k] = j.settings[k];
        }
        clean._settingsUpdatedAt = Number(j.updatedAt) || Date.now();
        const s = Object.assign(Store.load(), clean);
        localStorage.setItem(STATE_KEY, JSON.stringify(s));
        // v1.5.125: apply native monitor setting
        try {
          if (clean._monEnabled !== undefined && window.RuijieBridge && window.RuijieBridge.monitorSetEnabled) {
            const info = JSON.parse(window.RuijieBridge.monitorInfo());
            if (!!info.enabled !== !!clean._monEnabled) {
              window.RuijieBridge.monitorSetEnabled(!!clean._monEnabled);
            }
          }
        } catch (e) {}
        return { ok: true, applied: true, updatedAt: clean._settingsUpdatedAt };
      }
      return { ok: true, applied: false };
    } catch (e) { return { ok: false, reason: 'network' }; }
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
    // v1.5.144: the owner's profile must carry a SHA-256 PIN hash; other
    // profiles never need one, but a present hash must be well-formed.
    const h = String(p.pinHash || '');
    if (this.normName(p.name) === 'praythein') {
      if (!/^[0-9a-f]{64}$/.test(h)) return 'pinHash';
    } else if (h && !/^[0-9a-f]{64}$/.test(h)) return 'pinHash';
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
  const out = { proxy: 'error', github: 'skipped', pinHash: '' };
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
      // v1.5.144: echo of the stored profile — lets the caller verify the
      // server really kept the PIN hash (an old proxy drops unknown fields).
      if (j.profile && typeof j.profile.pinHash === 'string') out.pinHash = j.profile.pinHash;
    }
  } catch (e) { /* out.proxy stays 'error' */ }
  finally { clearTimeout(timer); }
  return out;
};
