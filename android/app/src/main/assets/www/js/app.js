/**
 * Ruijie Voucher App — UI logic (vanilla JS)
 */
'use strict';

/* ── helpers ── */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = ts => {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  return isNaN(d) ? String(ts) : d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fmtPeriod = mins => {
  if (!mins) return '—';
  mins = Number(mins);
  if (mins % 43200 === 0) return (mins / 43200) + ' လ';
  if (mins % 1440 === 0) return (mins / 1440) + ' ရက်';
  if (mins % 60 === 0) return (mins / 60) + ' နာရီ';
  return mins + ' မိနစ်';
};
const fmtQuota = mb => {
  if (!mb && mb !== 0) return '—';
  mb = Number(mb);
  if (mb <= 0) return 'အကန့်အသတ်မရှိ';
  return mb >= 1024 ? (mb / 1024).toFixed(mb % 1024 ? 1 : 0) + ' GB' : mb + ' MB';
};
const STATUS_TXT = { '1': 'မသုံးရသေး', '2': 'သုံးနေဆဲ', '3': 'သက်တမ်းကုန်' };
const vCode = v => v.voucherCode || v.codeNo || '';

function toast(msg, isErr) {
  // minimal toast
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:' +
    (isErr ? '#c62828' : '#1a1a1a') + ';color:#fff;padding:10px 18px;border-radius:10px;z-index:99;font-size:14px;max-width:90vw;text-align:center;';
  t.classList.remove('hidden');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.add('hidden'), 2600);
}

/* ── state ── */
const S = {
  projects: [],       // {id, name}
  projectId: null,
  vouchers: [],
  vFilter: '',
  vStatus: '',
  packages: [],       // user groups
  queue: [],          // print queue: {code, pkg, period, quota}
  account: null,
};

/* ═══════════ CONNECT ═══════════ */
async function doConnect() {
  const cfg = {
    cloud: $('cfg-cloud').value.trim().replace(/\/+$/, '') || 'https://cloud-as.ruijienetworks.com',
    appid: $('cfg-appid').value.trim(),
    secret: $('cfg-secret').value.trim(),
    proxy: $('cfg-proxy').value.trim().replace(/\/+$/, ''),
  };
  $('connect-err').classList.add('hidden');
  if (!cfg.appid || !cfg.secret) return showErr('connect-err', 'App ID နဲ့ App Secret ထည့်ပါ');
  if (!hasBridge() && !cfg.proxy) return showErr('connect-err', 'Proxy URL ထည့်ပါ');
  const btn = $('btn-connect');
  btn.disabled = true; btn.textContent = 'ချိတ်ဆက်နေသည်…';
  Api.saveCfg(cfg);
  try {
    const info = await Api.testConnection();
    S.account = info;
    enterApp();
    toast('ချိတ်ဆက်မှုအောင်မြင်ပါသည် ✅');
  } catch (e) {
    showErr('connect-err', 'ချိတ်ဆက်မရပါ: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'ချိတ်ဆက်မယ်';
  }
}
function showErr(id, msg) {
  const e = $(id);
  e.textContent = msg;
  e.classList.remove('hidden');
}

/* ═══════════ APP SHELL ═══════════ */
function enterApp() {
  $('view-connect').classList.add('hidden');
  $('app').classList.remove('hidden');
  const st = Store.load();
  if (st.printHeader) $('print-header').value = st.printHeader;
  if (st.printFooter) $('print-footer').value = st.printFooter;
  if (st.printPaper) $('print-paper').value = st.printPaper;
  if (st.printCopies) $('print-copies').value = st.printCopies;
  loadProjects().then(() => { switchView('view-vouchers'); });
  loadAccountInfo();
}

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === id));
  if (id === 'view-vouchers' && S.vouchers.length === 0) loadVouchers();
  if (id === 'view-generate') ensurePackages();
  if (id === 'view-printer') renderQueue();
  if (id === 'view-settings') fillSettings();
}

/* ═══════════ PROJECTS ═══════════ */
function flattenProjects(nodes, out = []) {
  for (const n of nodes || []) {
    const id = n.groupId || n.id;
    const name = n.groupName || n.name;
    const type = (n.groupType || n.type || '').toUpperCase();
    if (type === 'BUILDING' && id) out.push({ id: String(id), name: name || String(id) });
    const kids = n.children || n.subGroups || n.childGroups || [];
    if (kids.length) flattenProjects(kids, out);
  }
  return out;
}

async function loadProjects() {
  try {
    const tree = await Api.getGroupTree('BUILDING');
    const nodes = Array.isArray(tree) ? tree : [tree];
    S.projects = flattenProjects(nodes);
  } catch (e) {
    toast('Project list ရမလာ: ' + e.message, true);
    S.projects = [];
  }
  const sel = $('project-select');
  sel.innerHTML = S.projects.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('') || '<option value="">—</option>';
  const st = Store.load();
  S.projectId = st.projectId && S.projects.some(p => p.id === st.projectId) ? st.projectId : (S.projects[0] && S.projects[0].id);
  if (S.projectId) sel.value = S.projectId;
  Store.save({ projectId: S.projectId });
}

function onProjectChange() {
  S.projectId = $('project-select').value;
  Store.save({ projectId: S.projectId });
  S.vouchers = [];
  S.packages = [];
  loadVouchers();
}

/* ═══════════ VOUCHERS ═══════════ */
async function loadVouchers() {
  if (!S.projectId) return;
  const listEl = $('voucher-list');
  listEl.innerHTML = '';
  $('voucher-loading').classList.remove('hidden');
  $('voucher-count').textContent = '';
  try {
    S.vouchers = await Api.voucherListAll(S.projectId, (done, total) => {
      $('voucher-count').textContent = `ဆွဲနေသည်… ${done}/${total}`;
    });
    // newest first
    S.vouchers.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    renderVouchers();
  } catch (e) {
    listEl.innerHTML = `<p class="err">ဒေတာရမလာ: ${esc(e.message)}</p>`;
  } finally {
    $('voucher-loading').classList.add('hidden');
  }
}

function filteredVouchers() {
  const q = S.vFilter.trim().toLowerCase();
  return S.vouchers.filter(v => {
    if (S.vStatus && String(v.status) !== S.vStatus) return false;
    if (q && !vCode(v).toLowerCase().includes(q) && !(v.comment || '').toLowerCase().includes(q) && !(v.nameRef || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderVouchers() {
  const list = filteredVouchers();
  $('voucher-count').textContent = `စုစုပေါင်း ${S.vouchers.length} · ပြသနေသည် ${list.length}`;
  $('voucher-list').innerHTML = list.slice(0, 300).map(v => `
    <div class="voucher-row" data-uuid="${esc(v.uuid)}">
      <div class="voucher-meta">
        <div class="voucher-code">${esc(vCode(v))}</div>
        <div class="pkg">${esc(v.packageName || v.userGroupName || '')} · ${esc(fmtPeriod(v.timePeriod))}</div>
      </div>
      <span class="badge s${esc(v.status)}">${esc(STATUS_TXT[v.status] || v.status)}</span>
    </div>`).join('') || '<p class="muted">ဗောက်ချာမရှိပါ</p>';
  if (list.length > 300) $('voucher-list').innerHTML += `<p class="muted small">အစဆုံး ၃၀၀ သာပြထားသည် — ရှာဖွေမှုနဲ့ စစ်ထုတ်ပါ</p>`;
  document.querySelectorAll('.voucher-row').forEach(r => r.addEventListener('click', () => openVoucherDetail(r.dataset.uuid)));
}

let modalVoucher = null;
function openVoucherDetail(uuid) {
  const v = S.vouchers.find(x => x.uuid === uuid);
  if (!v) return;
  modalVoucher = v;
  $('modal-title').textContent = '🎟️ ' + vCode(v);
  const rows = [
    ['ကုဒ်နံပါတ်', `<b class="voucher-code">${esc(vCode(v))}</b>`],
    ['အခြေအနေ', `<span class="badge s${esc(v.status)}">${esc(STATUS_TXT[v.status] || v.status)}</span>`],
    ['Package', esc(v.packageName || v.userGroupName || '—')],
    ['သက်တမ်း', esc(fmtPeriod(v.timePeriod))],
    ['သုံးပြီးချိန်', v.usedTime ? fmtPeriod(v.usedTime) : '—'],
    ['ထုတ်လုပ်ချိန်', esc(fmtDate(v.createTime))],
    ['သက်တမ်းကုန်ချိန်', esc(v.expiryTime || '—')],
    ['ဒေတာပမာဏ', esc(fmtQuota(v.quota))],
    ['သုံးပြီးဒေတာ', esc(fmtQuota(v.usedQuota))],
    ['တစ်ပြိုင်သုံးနိုင်သူ', esc(v.maxClients || '—')],
    ['လက်ရှိသုံးနေသူ', esc(v.currentClients || 0)],
    ['Download limit', v.downloadRateLimit ? v.downloadRateLimit + ' KB/s' : '—'],
    ['Upload limit', v.uploadRateLimit ? v.uploadRateLimit + ' KB/s' : '—'],
    ['ဈေးနှုန်း', v.packagePrice ? esc(v.packagePrice) : '—'],
    ['မှတ်ချက်', esc(v.comment || v.nameRef || '—')],
    ['MAC bind', v.bindMac ? 'Yes' : 'No'],
  ];
  $('modal-body').innerHTML = `<dl class="kv">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
  $('modal').classList.remove('hidden');
}

async function deleteVoucher() {
  const v = modalVoucher;
  if (!v) return;
  if (!confirm(`"${vCode(v)}" ကို ဖျက်မှာသေချာပါသလား?`)) return;
  try {
    await Api.voucherDelete(S.projectId, v);
    toast('ဖျက်ပြီးပါပြီ');
  } catch (e) {
    alert(e.message);
  }
}

/* ═══════════ PACKAGES (user groups) ═══════════ */
async function ensurePackages() {
  if (!S.projectId) return;
  if (S.packages.length) { fillPackageSelects(); return; }
  try {
    S.packages = await Api.userGroupList(S.projectId);
    fillPackageSelects();
  } catch (e) {
    toast('Package list ရမလာ: ' + e.message, true);
  }
}
function fillPackageSelects() {
  const opts = S.packages.map(p => {
    const pid = p.authprofileid || p.profileId || '';
    const label = `${p.name || p.groupName || 'Package'} — ${fmtPeriod(p.timePeriod)} · ${fmtQuota(p.quota)}`;
    return `<option value="${esc(p.id)}|${esc(pid)}" data-pid="${esc(pid)}">${esc(label)}</option>`;
  }).join('');
  $('gen-package').innerHTML = opts || '<option value="">—</option>';
  $('gen-custom-package').innerHTML = opts || '<option value="">—</option>';
}
function selectedPackage(selId) {
  const sel = $(selId);
  const [id, pid] = (sel.value || '').split('|');
  const pkg = S.packages.find(p => String(p.id) === id);
  return { id: id ? Number(id) : null, profile: pid || null, pkg };
}

/* ═══════════ GENERATE ═══════════ */
async function doGenerate() {
  const { id, profile, pkg } = selectedPackage('gen-package');
  const qty = Math.min(500, Math.max(1, Number($('gen-qty').value) || 1));
  $('gen-err').classList.add('hidden');
  if (!id || !profile) return showErr('gen-err', 'Package ရွေးပါ');
  const btn = $('btn-generate');
  btn.disabled = true; btn.textContent = 'ထုတ်နေသည်…';
  try {
    const list = await Api.voucherCreate(S.projectId, {
      quantity: qty, profile, userGroupId: id,
      firstName: $('gen-first').value.trim() || undefined,
      lastName: $('gen-last').value.trim() || undefined,
      email: $('gen-email').value.trim() || undefined,
      phone: $('gen-phone').value.trim() || undefined,
      comment: $('gen-comment').value.trim() || undefined,
    });
    showGenResult(list.map(v => ({ code: vCode(v), pkg: pkg && (pkg.name || pkg.groupName), period: v.timePeriod, quota: v.quota })));
    S.vouchers = []; // refresh list next time
    toast(`${list.length} ခု ထုတ်ပြီးပါပြီ ✅`);
  } catch (e) {
    showErr('gen-err', e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'ထုတ်မယ်';
  }
}

async function doGenerateCustom() {
  const code = $('gen-custom-code').value.trim();
  const { id, profile, pkg } = selectedPackage('gen-custom-package');
  $('gen-custom-err').classList.add('hidden');
  if (!/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}(-[A-Za-z0-9]{4})?$/.test(code))
    return showErr('gen-custom-err', 'ပုံစံမှားနေသည်: xxxx-xxxx (သို့) xxxx-xxxx-xxxx');
  const btn = $('btn-generate-custom');
  btn.disabled = true; btn.textContent = 'ထုတ်နေသည်…';
  try {
    await Api.voucherCustomCreate(S.projectId, code, { profile, userGroupId: id });
    showGenResult([{ code, pkg: pkg && (pkg.name || pkg.groupName), period: pkg && pkg.timePeriod, quota: pkg && pkg.quota }]);
    S.vouchers = [];
    toast('ထုတ်ပြီးပါပြီ ✅');
  } catch (e) {
    showErr('gen-custom-err', e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'စိတ်ကြိုက်ကုဒ်ထုတ်မယ်';
  }
}

let genResultItems = [];
function showGenResult(items) {
  genResultItems = items;
  $('gen-result-count').textContent = items.length;
  $('gen-result-list').innerHTML = items.map((it, i) =>
    `<span class="code-pill">${esc(it.code)}<button data-i="${i}" title="queue">➕</button></span>`).join('');
  document.querySelectorAll('#gen-result-list button').forEach(b =>
    b.addEventListener('click', () => { addToQueue(genResultItems[Number(b.dataset.i)]); }));
  $('gen-result').classList.remove('hidden');
  $('gen-result').scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════ PRINTER ═══════════ */
function addToQueue(item) {
  if (!item || !item.code) return;
  if (S.queue.some(q => q.code === item.code)) return toast('Queue ထဲမှာရှိနေပြီးသား');
  S.queue.push({ code: item.code, pkg: item.pkg || '', period: item.period, quota: item.quota });
  renderQueue();
  toast('Queue ထဲထည့်ပြီးပါပြီ');
}
function renderQueue() {
  $('queue-count').textContent = S.queue.length;
  $('print-queue').innerHTML = S.queue.map((q, i) =>
    `<span class="code-pill">${esc(q.code)}<button data-i="${i}">✕</button></span>`).join('') || '<p class="muted">Queue လွတ်နေသည်</p>';
  document.querySelectorAll('#print-queue button').forEach(b =>
    b.addEventListener('click', () => { S.queue.splice(Number(b.dataset.i), 1); renderQueue(); }));
}

function printSettings() {
  const st = {
    header: $('print-header').value.trim(),
    footer: $('print-footer').value.trim(),
    paper: $('print-paper').value,
    copies: Math.min(10, Math.max(1, Number($('print-copies').value) || 1)),
  };
  Store.save({ printHeader: st.header, printFooter: st.footer, printPaper: st.paper, printCopies: st.copies });
  return st;
}

function ticketHtml(item, st) {
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  let html = '';
  for (let c = 0; c < st.copies; c++) {
    html += `<div class="ticket${st.paper === '58' ? ' narrow' : ''}">
      ${st.header ? `<h3>${esc(st.header)}</h3><hr>` : ''}
      <div class="info">${esc(item.pkg || '')}</div>
      <div class="vcode">${esc(item.code)}</div>
      <div class="info">${item.period ? 'သက်တမ်း: ' + esc(fmtPeriod(item.period)) : ''}</div>
      <div class="info">${item.quota != null ? 'ဒေတာ: ' + esc(fmtQuota(item.quota)) : ''}</div>
      <div class="info">${esc(now)}</div>
      ${st.footer ? `<hr><div class="foot">${esc(st.footer)}</div>` : ''}
    </div>`;
  }
  return html;
}

function doPrint(items) {
  if (!items.length) return toast('ပရင့်ထုတ်စရာ မရှိပါ', true);
  const st = printSettings();
  const html = items.map(it => ticketHtml(it, st)).join('');
  // APK: native Android print via PrintManager (window.print() does nothing in WebView)
  if (window.RuijieBridge && window.RuijieBridge.printHtml) {
    try {
      window.RuijieBridge.printHtml(b64encodeUnicode(printDocHtml(html, st)), st.paper);
      return;
    } catch (e) { toast('Print error: ' + e.message, true); return; }
  }
  $('print-area').innerHTML = html;
  setTimeout(() => window.print(), 60);
}

/** Standalone HTML document wrapper for the native print WebView. */
function printDocHtml(ticketsHtml, st) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { margin: 0; }
    body { margin: 0; }
    .ticket { width: ${st.paper === '58' ? '58mm' : '80mm'}; margin: 0 auto; padding: 4mm 3mm; text-align: center;
      font-family: monospace; page-break-after: always; color: #000; }
    .ticket h3 { margin: 2mm 0; font-size: 14pt; font-family: sans-serif; }
    .ticket .vcode { font-size: 22pt; font-weight: 700; letter-spacing: 2px; margin: 3mm 0; border: 2px dashed #000; padding: 2mm; }
    .ticket .info { font-size: 10pt; margin: 1mm 0; }
    .ticket .foot { font-size: 9pt; margin-top: 3mm; font-family: sans-serif; }
    .ticket hr { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
  </style></head><body>${ticketsHtml}</body></html>`;
}

/* ═══════════ MORE ═══════════ */
function moreHome() {
  $('more-menu').classList.remove('hidden');
  $('more-content').innerHTML = '';
}
function moreShell(title, inner) {
  $('more-menu').classList.add('hidden');
  $('more-content').innerHTML = `<button class="btn back-btn" id="more-back">← ပြန်သွားမယ်</button><div class="card"><h2>${esc(title)}</h2>${inner}</div>`;
  $('more-back').addEventListener('click', moreHome);
}

async function moreAccounts() {
  moreShell('👥 Auth Accounts', `<div id="ma-list"><p class="muted">ဆွဲနေသည်…</p></div>
    <div class="row"><button class="btn" id="ma-add">➕ အကောင့်အသစ်ထည့်မယ်</button></div><div id="ma-form"></div>`);
  $('ma-add').addEventListener('click', () => {
    const pkgOpts = S.packages.map(p => `<option value="${p.id}|${esc(p.authprofileid || p.profileId || '')}">${esc(p.name || p.groupName)}</option>`).join('');
    $('ma-form').innerHTML = `<label>Username <input id="ma-u"></label><label>Password <input id="ma-p"></label>
      <label>Package <select id="ma-pkg">${pkgOpts}</select></label>
      <label>မှတ်ချက် <input id="ma-c"></label>
      <button class="btn primary" id="ma-do">ထည့်မယ်</button>`;
    $('ma-do').addEventListener('click', async () => {
      const [gid, pid] = $('ma-pkg').value.split('|');
      try {
        await Api.accountCreate(S.projectId, { username: $('ma-u').value.trim(), password: $('ma-p').value, profileId: pid, userGroupId: Number(gid), comment: $('ma-c').value.trim() });
        toast('ထည့်ပြီးပါပြီ ✅'); moreAccounts();
      } catch (e) { toast(e.message, true); }
    });
  });
  try {
    const j = await Api.accountList(S.projectId, { pageSize: 100 });
    const list = j.list || j.data || j.accounts || [];
    $('ma-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>Username</th><th>Status</th><th></th></tr>
      ${list.map(a => `<tr><td>${esc(a.username || a.name || '')}</td><td>${esc(a.status || '')}</td>
        <td><button class="btn danger-ghost" data-del="${esc(a.username || a.name || '')}" data-uuid="${esc(a.uuid || '')}">ဖျက်</button></td></tr>`).join('')}
      </table></div>` : '<p class="muted">အကောင့်မရှိပါ</p>';
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`"${b.dataset.del}" ကို ဖျက်မှာသေချာပါသလား?`)) return;
      try { await Api.accountDelete(S.projectId, b.dataset.del); toast('ဖျက်ပြီးပါပြီ'); moreAccounts(); }
      catch (e) { toast(e.message, true); }
    }));
  } catch (e) { $('ma-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreUserGroups() {
  moreShell('📦 User Groups (Packages)', '<div id="mg-list"><p class="muted">ဆွဲနေသည်…</p></div>');
  try {
    await ensurePackages();
    $('mg-list').innerHTML = S.packages.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>အမည်</th><th>သက်တမ်း</th><th>ဒေတာ</th><th>ဈေး</th></tr>
      ${S.packages.map(p => `<tr><td>${esc(p.name || p.groupName || '')}</td><td>${esc(fmtPeriod(p.timePeriod))}</td>
        <td>${esc(fmtQuota(p.quota || p.flowQuota))}</td><td>${esc(p.price || p.packagePrice || '—')}</td></tr>`).join('')}
      </table></div>` : '<p class="muted">မရှိပါ</p>';
  } catch (e) { $('mg-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreDevices() {
  moreShell('📡 Devices', `
    <div class="chips" id="md-chips">
      <button class="chip active" data-t="">အားလုံး</button>
      <button class="chip" data-t="AP">AP</button>
      <button class="chip" data-t="Switch">Switch</button>
      <button class="chip" data-t="Gateway">Gateway</button>
    </div><div id="md-list" style="margin-top:10px"><p class="muted">ဆွဲနေသည်…</p></div>`);
  const load = async (type) => {
    $('md-list').innerHTML = '<p class="muted">ဆွဲနေသည်…</p>';
    try {
      const list = await Api.deviceList(S.projectId, type, 0, 100);
      $('md-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
        <tr><th>SN / အမည်</th><th>Model</th><th>Status</th></tr>
        ${list.map(d => `<tr><td>${esc(d.alias || d.name || d.sn || '')}<br><small class="muted">${esc(d.sn || d.mac || '')}</small></td>
          <td>${esc(d.model || d.productModel || '')}</td>
          <td>${esc(d.onlineStatus || d.status || (d.online ? 'online' : ''))}</td></tr>`).join('')}
        </table></div>` : '<p class="muted">စက်မရှိပါ</p>';
    } catch (e) { $('md-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  };
  document.querySelectorAll('#md-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#md-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); load(c.dataset.t);
  }));
  load('');
}

async function moreClients() {
  moreShell('💻 Online Clients', '<div id="mc-list"><p class="muted">ဆွဲနေသည်…</p></div>');
  try {
    const list = await Api.onlineClients(Number(S.projectId), 0, 100);
    $('mc-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>MAC / IP</th><th>SSID</th><th>အသေးစိတ်</th></tr>
      ${list.map(c => `<tr><td>${esc(c.mac || '')}<br><small class="muted">${esc(c.ip || '')}</small></td>
        <td>${esc(c.ssid || '')}</td><td><small>${esc(c.username || c.hostname || '')}</small></td></tr>`).join('')}
      </table></div><p class="muted small">စုစုပေါင်း ${list.length}</p>` : '<p class="muted">Online client မရှိပါ</p>';
  } catch (e) { $('mc-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreNetworks() {
  moreShell('🌐 Networks', `<div id="mn-tree"><p class="muted">ဆွဲနေသည်…</p></div>
    <div class="row"><button class="btn" id="mn-add">➕ Network အသစ်ထည့်မယ်</button></div><div id="mn-form"></div>`);
  const renderTree = (nodes, depth = 0) => (nodes || []).map(n => {
    const kids = n.children || n.subGroups || n.childGroups || [];
    return `<div style="margin-left:${depth * 16}px;padding:4px 0">📁 ${esc(n.groupName || n.name)} <small class="muted">(${(n.groupType || n.type || '').toUpperCase()})</small></div>` +
      (kids.length ? renderTree(kids, depth + 1) : '');
  }).join('');
  try {
    const tree = await Api.getGroupTree('BUILDING');
    $('mn-tree').innerHTML = renderTree(Array.isArray(tree) ? tree : [tree]) || '<p class="muted">မရှိပါ</p>';
  } catch (e) { $('mn-tree').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  $('mn-add').addEventListener('click', () => {
    $('mn-form').innerHTML = `<label>အမည် <input id="mn-name"></label><label>ဖော်ပြချက် <input id="mn-desc"></label>
      <button class="btn primary" id="mn-do">ထည့်မယ်</button>`;
    $('mn-do').addEventListener('click', async () => {
      try {
        await Api.addNetwork({ name: $('mn-name').value.trim(), parentId: S.projects[0] ? S.projects[0].id : undefined });
        toast('ထည့်ပြီးပါပြီ ✅'); moreNetworks(); loadProjects();
      } catch (e) { toast(e.message, true); }
    });
  });
}

/* ═══════════ SETTINGS ═══════════ */
function fillSettings() {
  const c = Api.cfg || {};
  $('set-cloud').value = c.cloud || '';
  $('set-appid').value = c.appid || '';
  $('set-proxy').value = c.proxy || '';
  $('set-secret').value = '';
}
async function loadAccountInfo() {
  try {
    const info = S.account || await Api.getAccountInfo();
    S.account = info;
    const email = info.account || info.email || '';
    const name = info.userName || info.username || '';
    $('topbar-account').textContent = name || email || 'Ruijie';
    $('account-info').innerHTML = `<dl class="kv">
      <dt>အမည်</dt><dd>${esc(name || '—')}</dd>
      <dt>Email</dt><dd>${esc(email || '—')}</dd>
      <dt>Tenant</dt><dd>${esc(info.tenantId || info.defaultTenantId || '—')}</dd>
    </dl>`;
  } catch (e) { /* silent */ }
}
async function saveSettings() {
  const c = Api.cfg || {};
  const nc = {
    cloud: $('set-cloud').value.trim().replace(/\/+$/, '') || c.cloud,
    appid: $('set-appid').value.trim() || c.appid,
    secret: $('set-secret').value.trim() || c.secret,
    proxy: $('set-proxy').value.trim().replace(/\/+$/, '') || c.proxy,
  };
  $('set-err').classList.add('hidden');
  Api.saveCfg(nc);
  try {
    await Api.testConnection();
    toast('သိမ်းပြီး ချိတ်ဆက်မှုအောင်မြင်ပါသည် ✅');
    S.vouchers = []; S.packages = [];
    loadProjects().then(loadVouchers);
    loadAccountInfo();
  } catch (e) { showErr('set-err', 'ချိတ်ဆက်မရပါ: ' + e.message); }
}

/* ═══════════ INIT ═══════════ */
function init() {
  // toast container style
  const st = document.createElement('style');
  st.textContent = '.toast.hidden{display:none}';
  document.head.appendChild(st);

  $('btn-connect').addEventListener('click', doConnect);
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
  $('project-select').addEventListener('change', onProjectChange);
  $('voucher-search').addEventListener('input', e => { S.vFilter = e.target.value; renderVouchers(); });
  document.querySelectorAll('#voucher-status-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#voucher-status-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); S.vStatus = c.dataset.s; renderVouchers();
  }));
  $('modal-close').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.add('hidden'); });
  $('modal-print').addEventListener('click', () => { if (modalVoucher) doPrint([{ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }]); });
  $('modal-queue').addEventListener('click', () => { if (modalVoucher) addToQueue({ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }); });
  $('modal-delete').addEventListener('click', deleteVoucher);

  $('btn-generate').addEventListener('click', doGenerate);
  $('btn-generate-custom').addEventListener('click', doGenerateCustom);
  $('btn-gen-print-all').addEventListener('click', () => doPrint(genResultItems));
  $('btn-gen-queue-all').addEventListener('click', () => { genResultItems.forEach(addToQueue); });

  $('btn-print-test').addEventListener('click', () => doPrint([{ code: 'TEST-1234', pkg: 'စမ်းသပ်စာရွက်', period: 60, quota: 1024 }]));
  $('btn-queue-print').addEventListener('click', () => doPrint(S.queue));
  $('btn-queue-clear').addEventListener('click', () => { S.queue = []; renderQueue(); });

  document.querySelectorAll('#more-menu .menu-item').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.more;
    if (k === 'accounts') moreAccounts();
    else if (k === 'usergroups') moreUserGroups();
    else if (k === 'devices') moreDevices();
    else if (k === 'clients') moreClients();
    else if (k === 'networks') moreNetworks();
  }));

  $('btn-save-settings').addEventListener('click', saveSettings);
  $('btn-disconnect').addEventListener('click', () => {
    if (!confirm('အကောင့်ထွက်ပြီး သိမ်းထားတဲ့ဒေတာအကုန်ရှင်းမှာလား?')) return;
    Api.clearCfg();
    location.reload();
  });

  Api.loadCfg();
  if (window.RuijieBridge) {
    // APK mode: no proxy needed (native HTTPS has no CORS) — hide proxy field
    const pf = $('cfg-proxy');
    if (pf && pf.closest('label')) pf.closest('label').style.display = 'none';
  }
  if (Api.cfg && Api.cfg.appid) enterApp();
  else $('view-connect').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
