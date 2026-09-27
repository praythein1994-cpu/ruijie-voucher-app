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
  /** Fetch ALL vouchers (pageSize max 200), with progress callback. */
  async voucherListAll(groupId, onProgress) {
    const pageSize = 200;
    let start = 0, all = [], total = Infinity;
    while (start < total) {
      const { count, list } = await this.voucherListPage(groupId, start, pageSize);
      total = count;
      all = all.concat(list);
      start += list.length;
      if (onProgress) onProgress(all.length, total);
      if (list.length === 0) break;
    }
    return all;
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
   * NOTE: The public Ruijie Cloud API manual (V2.0.3) documents NO voucher
   * delete endpoint. This stays disabled until Ruijie publishes one.
   */
  async voucherDelete(/* groupId, voucher */) {
    throw new Error('Ruijie public API မှာ voucher ဖျက်တဲ့ endpoint မပါဝင်သေးပါ။');
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
  async deviceList(groupId, commonType = '', page = 0, perPage = 50, key = '') {
    const q = { group_id: groupId, page, per_page: perPage };
    if (commonType) q.common_type = commonType;
    if (key) q.key = key;
    const j = await this.call('GET', 'maint/devices', q);
    const d = this.unwrap(j);
    const inner = d.data || d;
    return Array.isArray(inner) ? inner : (inner.list || inner.devices || []);
  },

  // ── Clients (online) ──
  async onlineClients(groupId, pageIndex = 0, pageSize = 50) {
    const j = await this.call('POST', 'logbizagent/logbiz/api/sta/sta_users', {}, { groupId, pageIndex, pageSize });
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
