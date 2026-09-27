/**
 * Ruijie Voucher App — UI logic (vanilla JS) · v1.2.0
 * iOS design · SVG icon system · EN/MY i18n · tablet layouts
 */
'use strict';

const APP_VERSION = '1.2.0';

/* ═══════════ I18N (မြန်မာ / English) ═══════════ */
const I18N = {
  appTitle: { my: 'Ruijie Voucher App', en: 'Ruijie Voucher App' },
  'connect.sub': { my: 'Ruijie Cloud Open Platform နဲ့ ချိတ်ဆက်ပါ', en: 'Connect with Ruijie Cloud Open Platform' },
  'connect.cloud': { my: 'Cloud URL', en: 'Cloud URL' },
  'connect.appid': { my: 'App ID', en: 'App ID' },
  'connect.appidPh': { my: 'Ruijie Cloud Open Platform မှ App ID', en: 'App ID from Ruijie Cloud Open Platform' },
  'connect.secret': { my: 'App Secret', en: 'App Secret' },
  'connect.proxy': { my: 'Proxy URL', en: 'Proxy URL' },
  'connect.proxyHelp': { my: 'CORS proxy server လိပ်စာ (ဥပမာ Render/Railway မှာ deploy ထားတာ)', en: 'CORS proxy server address (e.g. deployed on Render/Railway)' },
  'connect.btn': { my: 'ချိတ်ဆက်မယ်', en: 'Connect' },
  'connect.secure': { my: 'အချက်အလက်များသည် သင့်စက်ပေါ်မှာသာ သိမ်းထားပါသည်', en: 'Your credentials stay only on this device' },
  'btn.connecting': { my: 'ချိတ်ဆက်နေသည်…', en: 'Connecting…' },
  'err.needCreds': { my: 'App ID နဲ့ App Secret ထည့်ပါ', en: 'Enter your App ID and App Secret' },
  'err.needProxy': { my: 'Proxy URL ထည့်ပါ', en: 'Enter the Proxy URL' },
  'toast.connected': { my: 'ချိတ်ဆက်မှုအောင်မြင်ပါသည်', en: 'Connected successfully' },
  'err.connectFail': { my: 'ချိတ်ဆက်မရပါ: ', en: 'Connection failed: ' },
  'err.projectList': { my: 'Project list ရမလာ: ', en: "Couldn't load projects: " },
  'tab.vouchers': { my: 'ဗောက်ချာ', en: 'Vouchers' },
  'tab.generate': { my: 'ထုတ်မယ်', en: 'Generate' },
  'tab.printer': { my: 'ပရင်တာ', en: 'Printer' },
  'tab.more': { my: 'More', en: 'More' },
  'tab.settings': { my: 'ဆက်တင်', en: 'Settings' },
  'v.title': { my: 'ဗောက်ချာများ', en: 'Vouchers' },
  'stat.active': { my: 'မသုံးရသေး', en: 'Active' },
  'stat.used': { my: 'သုံးနေဆဲ', en: 'In use' },
  'stat.expired': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'stat.total': { my: 'စုစုပေါင်း', en: 'Total' },
  'search.label': { my: 'ရှာဖွေမယ်', en: 'Search' },
  'search.ph': { my: 'ကုဒ်နံပါတ်ရှာမယ်…', en: 'Search codes…' },
  'search.clear': { my: 'ရှင်းမယ်', en: 'Clear' },
  'search.refresh': { my: 'ပြန်ဆွဲမယ်', en: 'Refresh' },
  'chip.all': { my: 'အားလုံး', en: 'All' },
  'chip.s1': { my: 'မသုံးရသေး', en: 'Active' },
  'chip.s2': { my: 'သုံးနေဆဲ', en: 'In use' },
  'chip.s3': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'v.loading': { my: 'ဆွဲနေသည်…', en: 'Loading…' },
  'v.loadFail': { my: 'ဒေတာရမလာ', en: "Couldn't load data" },
  'v.found': { my: 'တွေ့ရှိချက် {n} / စုစုပေါင်း {total}', en: '{n} found / {total} total' },
  'v.total': { my: 'စုစုပေါင်း {n}', en: '{n} total' },
  'v.noResult': { my: 'ရှာမတွေ့ပါ', en: 'No results' },
  'v.noResultSub': { my: 'ရှာဖွေမှုစာသား (သို့) စစ်ထုတ်မှုပြောင်းကြည့်ပါ', en: 'Try a different search or filter' },
  'v.empty': { my: 'ဗောက်ချာမရှိပါ', en: 'No vouchers' },
  'v.emptySub': { my: '「ထုတ်မယ်」 tab မှ အသစ်ထုတ်နိုင်ပါတယ်', en: 'Generate new ones from the Generate tab' },
  'v.first300': { my: 'အစဆုံး ၃၀၀ သာပြထားသည် — ရှာဖွေမှုနဲ့ စစ်ထုတ်ပါ', en: 'Showing first 300 — use search or filters' },
  'status.1': { my: 'မသုံးရသေး', en: 'Active' },
  'status.2': { my: 'သုံးနေဆဲ', en: 'In use' },
  'status.3': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'd.code': { my: 'ကုဒ်နံပါတ်', en: 'Code' },
  'd.status': { my: 'အခြေအနေ', en: 'Status' },
  'd.pkg': { my: 'Package', en: 'Package' },
  'd.validity': { my: 'သက်တမ်း', en: 'Validity' },
  'd.usedTime': { my: 'သုံးပြီးချိန်', en: 'Used time' },
  'd.created': { my: 'ထုတ်လုပ်ချိန်', en: 'Created' },
  'd.expiry': { my: 'သက်တမ်းကုန်ချိန်', en: 'Expires' },
  'd.quota': { my: 'ဒေတာပမာဏ', en: 'Data quota' },
  'd.usedQuota': { my: 'သုံးပြီးဒေတာ', en: 'Data used' },
  'd.maxClients': { my: 'တစ်ပြိုင်သုံးနိုင်သူ', en: 'Max clients' },
  'd.curClients': { my: 'လက်ရှိသုံးနေသူ', en: 'Current clients' },
  'd.price': { my: 'ဈေးနှုန်း', en: 'Price' },
  'd.note': { my: 'မှတ်ချက်', en: 'Note' },
  'd.macbind': { my: 'MAC bind', en: 'MAC bind' },
  'a.copy': { my: 'ကူးမယ်', en: 'Copy' },
  'a.queue': { my: 'Queue ထဲထည့်မယ်', en: 'Add to queue' },
  'a.close': { my: 'ပိတ်မယ်', en: 'Close' },
  'del.confirm': { my: '"{code}" ကို ဖျက်မှာသေချာပါသလား?', en: 'Delete "{code}"?' },
  'del.done': { my: 'ဖျက်ပြီးပါပြီ', en: 'Deleted' },
  'del.unsupported': { my: 'ဖျက်မရပါ — Ruijie Open API မှာ voucher ဖျက်တဲ့လုပ်ဆောင်ချက်မပါဝင်ပါ', en: 'Cannot delete — the Ruijie Open API has no voucher-delete operation' },
  'err.pkgList': { my: 'Package list ရမလာ: ', en: "Couldn't load packages: " },
  'err.pickPkg': { my: 'Package ရွေးပါ', en: 'Choose a package' },
  'btn.generating': { my: 'ထုတ်နေသည်…', en: 'Generating…' },
  'toast.generated': { my: '{n} ခု ထုတ်ပြီးပါပြီ', en: '{n} vouchers generated' },
  'err.codeFmt': { my: 'ပုံစံမှားနေသည်: xxxx-xxxx (သို့) xxxx-xxxx-xxxx', en: 'Invalid format: xxxx-xxxx or xxxx-xxxx-xxxx' },
  'toast.genDone': { my: 'ထုတ်ပြီးပါပြီ', en: 'Generated' },
  'toast.copied': { my: 'ကူးပြီးပါပြီ', en: 'Copied' },
  'toast.copyFail': { my: 'ကူးမရပါ', en: 'Copy failed' },
  'toast.queueDup': { my: 'Queue ထဲမှာရှိနေပြီးသား', en: 'Already in queue' },
  'toast.queueAdded': { my: 'Queue ထဲထည့်ပြီးပါပြီ', en: 'Added to queue' },
  'q.empty': { my: 'Queue လွတ်နေသည်', en: 'Queue is empty' },
  'err.noPrint': { my: 'ပရင့်ထုတ်စရာ မရှိပါ', en: 'Nothing to print' },
  'err.print': { my: 'Print error: ', en: 'Print error: ' },
  'tkt.validity': { my: 'သက်တမ်း: ', en: 'Validity: ' },
  'tkt.quota': { my: 'ဒေတာ: ', en: 'Data: ' },
  'tkt.test': { my: 'စမ်းသပ်စာရွက်', en: 'Test ticket' },
  'pv.sample': { my: 'နမူနာစာရွက်', en: 'Sample ticket' },
  'pv.meta': { my: 'စာရွက် {paper}mm · မိတ္တူ {copies} စောင်', en: '{paper}mm paper · {copies} copies' },
  'g.title': { my: 'ဗောက်ချာထုတ်မယ်', en: 'Generate Vouchers' },
  'g.new': { my: 'ဗောက်ချာအသစ်ထုတ်မယ်', en: 'Generate new vouchers' },
  'g.package': { my: 'Package ရွေးပါ', en: 'Choose a package' },
  'g.package2': { my: 'Package ရွေးပါ', en: 'Choose a package' },
  'g.qty': { my: 'အရေအတွက် (၁–၅၀၀)', en: 'Quantity (1–500)' },
  'g.comment': { my: 'မှတ်ချက် (optional)', en: 'Note (optional)' },
  'g.commentPh': { my: 'ဥပမာ ဆိုင်အမည် / ဧည့်သည်အမည်', en: 'e.g. shop name / guest name' },
  'g.advanced': { my: 'အပိုအချက်အလက် (optional)', en: 'Extra info (optional)' },
  'g.btn': { my: 'ထုတ်မယ်', en: 'Generate' },
  'g.custom': { my: 'စိတ်ကြိုက်ကုဒ်နံပါတ်ထုတ်မယ်', en: 'Generate a custom code' },
  'g.customHelp': { my: 'ပုံစံ: xxxx-xxxx (သို့) xxxx-xxxx-xxxx', en: 'Format: xxxx-xxxx or xxxx-xxxx-xxxx' },
  'g.customCode': { my: 'ကုဒ်နံပါတ်', en: 'Code' },
  'g.customCodePh': { my: 'ဥပမာ ab12-cd34', en: 'e.g. ab12-cd34' },
  'g.customBtn': { my: 'စိတ်ကြိုက်ကုဒ်ထုတ်မယ်', en: 'Generate custom code' },
  'g.result': { my: 'ထုတ်ပြီးသား ဗောက်ချာများ', en: 'Generated vouchers' },
  'g.printAll': { my: 'အားလုံးပရင့်ထုတ်မယ်', en: 'Print all' },
  'g.queueAll': { my: 'Print queue ထဲထည့်မယ်', en: 'Add to print queue' },
  'p.title': { my: 'ပရင်တာ', en: 'Printer' },
  'p.settings': { my: 'ပရင့်ဆက်တင်', en: 'Print settings' },
  'p.paper': { my: 'စာရွက်အကျယ်', en: 'Paper width' },
  'p.header': { my: 'ခေါင်းစဉ်စာသား', en: 'Header text' },
  'p.headerPh': { my: 'ဥပမာ My Shop WiFi', en: 'e.g. My Shop WiFi' },
  'p.footer': { my: 'အောက်ခြေစာသား', en: 'Footer text' },
  'p.footerPh': { my: 'ဥပမာ ကျေးဇူးတင်ပါသည်', en: 'e.g. Thank you' },
  'p.copies': { my: 'မိတ္တူ အရေအတွက်', en: 'Copies' },
  'p.test': { my: 'စမ်းသပ်ထုတ်မယ်', en: 'Print test page' },
  'p.preview': { my: 'အစမ်းကြည့်မယ်', en: 'Preview' },
  'p.queue': { my: 'Print Queue', en: 'Print Queue' },
  'p.queuePrint': { my: 'ပရင့်ထုတ်မယ်', en: 'Print' },
  'p.queueClear': { my: 'ရှင်းမယ်', en: 'Clear' },
  'm.title': { my: 'နောက်ထပ်', en: 'More' },
  'm.accounts': { my: 'Auth Accounts', en: 'Auth Accounts' },
  'm.accountsSub': { my: 'အသုံးပြုသူများ', en: 'Users' },
  'm.usergroups': { my: 'User Groups', en: 'User Groups' },
  'm.usergroupsSub': { my: 'အုပ်စုများ', en: 'Groups' },
  'm.devices': { my: 'Devices', en: 'Devices' },
  'm.devicesSub': { my: 'စက်များ', en: 'Devices' },
  'm.clients': { my: 'Online Clients', en: 'Online Clients' },
  'm.clientsSub': { my: 'ချိတ်ထားသူများ', en: 'Connected' },
  'm.networks': { my: 'Networks', en: 'Networks' },
  'm.networksSub': { my: 'ကွန်ရက်များ', en: 'Networks' },
  'more.back': { my: 'ပြန်သွားမယ်', en: 'Back' },
  'more.loading': { my: 'ဆွဲနေသည်…', en: 'Loading…' },
  'ma.title': { my: 'Auth Accounts', en: 'Auth Accounts' },
  'ma.add': { my: 'အကောင့်အသစ်ထည့်မယ်', en: 'Add account' },
  'ma.added': { my: 'ထည့်ပြီးပါပြီ', en: 'Added' },
  'ma.none': { my: 'အကောင့်မရှိပါ', en: 'No accounts' },
  'ma.del': { my: 'ဖျက်မယ်', en: 'Delete' },
  'ma.note': { my: 'မှတ်ချက်', en: 'Note' },
  'ma.user': { my: 'Username', en: 'Username' },
  'ma.pass': { my: 'Password', en: 'Password' },
  'ma.pkg': { my: 'Package', en: 'Package' },
  'mg.title': { my: 'User Groups (Packages)', en: 'User Groups (Packages)' },
  'mg.name': { my: 'အမည်', en: 'Name' },
  'mg.validity': { my: 'သက်တမ်း', en: 'Validity' },
  'mg.data': { my: 'ဒေတာ', en: 'Data' },
  'mg.price': { my: 'ဈေး', en: 'Price' },
  'mg.none': { my: 'မရှိပါ', en: 'None' },
  'md.title': { my: 'Devices', en: 'Devices' },
  'md.all': { my: 'အားလုံး', en: 'All' },
  'md.none': { my: 'စက်မရှိပါ', en: 'No devices' },
  'md.sn': { my: 'SN / အမည်', en: 'SN / Name' },
  'md.model': { my: 'Model', en: 'Model' },
  'md.status': { my: 'Status', en: 'Status' },
  'mc.title': { my: 'Online Clients', en: 'Online Clients' },
  'mc.detail': { my: 'အသေးစိတ်', en: 'Details' },
  'mc.none': { my: 'Online client မရှိပါ', en: 'No online clients' },
  'mc.total': { my: 'စုစုပေါင်း {n}', en: '{n} total' },
  'mc.mac': { my: 'MAC / IP', en: 'MAC / IP' },
  'mc.ssid': { my: 'SSID', en: 'SSID' },
  'mn.title': { my: 'Networks', en: 'Networks' },
  'mn.add': { my: 'Network အသစ်ထည့်မယ်', en: 'Add network' },
  'mn.name': { my: 'အမည်', en: 'Name' },
  'mn.desc': { my: 'ဖော်ပြချက်', en: 'Description' },
  'mn.added': { my: 'ထည့်ပြီးပါပြီ', en: 'Added' },
  'mn.none': { my: 'မရှိပါ', en: 'None' },
  's.title': { my: 'ဆက်တင်များ', en: 'Settings' },
  's.account': { my: 'အကောင့်အချက်အလက်', en: 'Account info' },
  's.appearance': { my: 'အသွင်အပြင်', en: 'Appearance' },
  's.darkmode': { my: 'Dark Mode', en: 'Dark Mode' },
  's.darkmodeSub': { my: 'ညအချိန်အတွက် အနက်ရောင်အပြင်', en: 'Dark theme for night use' },
  's.language': { my: 'ဘာသာစကား', en: 'Language' },
  's.conn': { my: 'ချိတ်ဆက်မှုပြင်ဆင်မယ်', en: 'Edit connection' },
  's.cloud': { my: 'Cloud URL', en: 'Cloud URL' },
  's.appid': { my: 'App ID', en: 'App ID' },
  's.secret': { my: 'App Secret', en: 'App Secret' },
  's.secretPh': { my: '(မပြောင်းလျှင် ချန်ထားပါ)', en: '(leave blank to keep)' },
  's.proxy': { my: 'Proxy URL', en: 'Proxy URL' },
  's.save': { my: 'သိမ်းမယ်', en: 'Save' },
  's.other': { my: 'အခြား', en: 'Other' },
  's.disconnect': { my: 'အကောင့်ထွက်မယ် (ဒေတာရှင်းမယ်)', en: 'Sign out (clear data)' },
  's.version': { my: 'Version {v} · Ruijie Cloud Open API', en: 'Version {v} · Ruijie Cloud Open API' },
  'modal.print': { my: 'ပရင့်ထုတ်မယ်', en: 'Print' },
  'modal.del': { my: 'ဖျက်မယ်', en: 'Delete' },
  'preview.title': { my: 'ပရင့်အစမ်းကြည့်ခြင်း', en: 'Print preview' },
  'preview.print': { my: 'ပရင့်ထုတ်မယ်', en: 'Print' },
  'ai.name': { my: 'အမည်', en: 'Name' },
  'ai.tenant': { my: 'Tenant', en: 'Tenant' },
  'toast.saved': { my: 'သိမ်းပြီး ချိတ်ဆက်မှုအောင်မြင်ပါသည်', en: 'Saved and connected' },
  'confirm.signout': { my: 'အကောင့်ထွက်ပြီး သိမ်းထားတဲ့ဒေတာအကုန်ရှင်းမှာလား?', en: 'Sign out and clear all saved data?' },
  'fmt.month': { my: ' လ', en: ' mo' },
  'fmt.day': { my: ' ရက်', en: 'd' },
  'fmt.hour': { my: ' နာရီ', en: 'h' },
  'fmt.min': { my: ' မိနစ်', en: 'm' },
  'fmt.unlimited': { my: 'အကန့်အသတ်မရှိ', en: 'Unlimited' },
  'peek': { my: 'ပြမယ်/ဖုံးမယ်', en: 'Show/hide' },
};

let LANG = 'my';
const t = k => { const e = I18N[k]; return (e && (e[LANG] || e.my)) || k; };
const tx = (k, vars) => {
  let s = t(k);
  if (vars) for (const key of Object.keys(vars)) s = s.replace('{' + key + '}', String(vars[key]));
  return s;
};
/** Inline SVG icon referencing the sprite in index.html */
const ic = (name, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function initLang() {
  try {
    const l = localStorage.getItem('rv-lang');
    if (l === 'en' || l === 'my') LANG = l;
  } catch (e) {}
}
function setLang(l) {
  LANG = (l === 'en') ? 'en' : 'my';
  try { localStorage.setItem('rv-lang', LANG); } catch (e) {}
  applyLang();
}
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('#lang-seg button').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
  const vv = $('app-version');
  if (vv) vv.textContent = tx('s.version', { v: APP_VERSION });
  renderVouchers();
  renderQueue();
  if (modalVoucher && !$('modal').classList.contains('hidden')) openVoucherDetail(modalVoucher.uuid);
  if (!$('preview-modal').classList.contains('hidden')) openPrintPreview();
  if (S.account) loadAccountInfo();
  if (S.moreFn) S.moreFn();
}

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
  if (mins % 43200 === 0) return (mins / 43200) + t('fmt.month');
  if (mins % 1440 === 0) return (mins / 1440) + t('fmt.day');
  if (mins % 60 === 0) return (mins / 60) + t('fmt.hour');
  return mins + t('fmt.min');
};
const fmtQuota = mb => {
  if (!mb && mb !== 0) return '—';
  mb = Number(mb);
  if (mb <= 0) return t('fmt.unlimited');
  return mb >= 1024 ? (mb / 1024).toFixed(mb % 1024 ? 1 : 0) + ' GB' : mb + ' MB';
};
const statusTxt = s => t('status.' + s) || String(s);
const vCode = v => v.voucherCode || v.codeNo || '';

function toast(msg, isErr) {
  // iOS-style banner pill (styled in CSS)
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.toggle('err', !!isErr);
  // restart animation
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(el._h);
  el._h = setTimeout(() => el.classList.remove('show'), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('toast.copied'));
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(t('toast.copied')); }
    catch (e2) { toast(t('toast.copyFail'), true); }
    ta.remove();
  }
}

/* ── theme (iOS light/dark) ── */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('rv-theme', theme); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#000000' : '#F2F2F7';
  const cb = $('set-darkmode');
  if (cb) cb.checked = theme === 'dark';
}
function initTheme() {
  let theme = null;
  try { theme = localStorage.getItem('rv-theme'); } catch (e) {}
  if (theme !== 'dark' && theme !== 'light') {
    theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  applyTheme(theme);
}

/* ── iOS sheet close with animation ── */
function closeModal(id) {
  const m = $(id);
  if (!m || m.classList.contains('hidden')) return;
  m.classList.add('closing');
  setTimeout(() => { m.classList.add('hidden'); m.classList.remove('closing'); }, 200);
}

/* ── stepper wiring ── */
function wireStepper(minusId, plusId, inputId, min, max) {
  const inp = $(inputId);
  const clamp = () => {
    let v = Math.round(Number(inp.value) || min);
    v = Math.min(max, Math.max(min, v));
    inp.value = v;
  };
  $(minusId).addEventListener('click', () => { inp.value = (Number(inp.value) || min) - 1; clamp(); });
  $(plusId).addEventListener('click', () => { inp.value = (Number(inp.value) || min) + 1; clamp(); });
  inp.addEventListener('change', clamp);
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
  moreFn: null,       // active "more" screen renderer (for language re-render)
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
  if (!cfg.appid || !cfg.secret) return showErr('connect-err', t('err.needCreds'));
  if (!hasBridge() && !cfg.proxy) return showErr('connect-err', t('err.needProxy'));
  const btn = $('btn-connect');
  const lbl = $('btn-connect-label');
  btn.disabled = true; lbl.textContent = t('btn.connecting');
  Api.saveCfg(cfg);
  try {
    const info = await Api.testConnection();
    S.account = info;
    enterApp();
    toast(t('toast.connected'));
  } catch (e) {
    showErr('connect-err', t('err.connectFail') + e.message);
  } finally {
    btn.disabled = false; lbl.textContent = t('connect.btn');
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
  // sync iOS segmented paper control with stored value
  const pp = $('print-paper').value || '80';
  document.querySelectorAll('#paper-seg button').forEach(b =>
    b.classList.toggle('active', b.dataset.paper === pp));
  loadProjects().then(() => { switchView('view-vouchers'); });
  loadAccountInfo();
}

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(tb => tb.classList.toggle('active', tb.dataset.view === id));
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
    toast(t('err.projectList') + e.message, true);
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
  $('voucher-count').textContent = '';
  // iOS-style skeleton shimmer
  listEl.innerHTML = Array.from({ length: 6 }, () =>
    '<div class="skel"><div class="bar" style="width:52%"></div><div class="bar" style="width:34%"></div></div>').join('');
  try {
    S.vouchers = await Api.voucherListAll(S.projectId, (done, total) => {
      $('voucher-count').textContent = `${t('v.loading')} ${done}/${total}`;
    });
    // newest first
    S.vouchers.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    renderVouchers();
  } catch (e) {
    listEl.innerHTML = `<div class="empty"><div class="big">${ic('alert', 'xl')}</div><p><b>${t('v.loadFail')}</b></p><p class="small">${esc(e.message)}</p></div>`;
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
  // dashboard stats (all vouchers, not just filtered)
  const n1 = S.vouchers.filter(v => String(v.status) === '1').length;
  const n2 = S.vouchers.filter(v => String(v.status) === '2').length;
  const n3 = S.vouchers.filter(v => String(v.status) === '3').length;
  $('stat-active').textContent = n1.toLocaleString();
  $('stat-used').textContent = n2.toLocaleString();
  $('stat-expired').textContent = n3.toLocaleString();
  $('stat-total').textContent = S.vouchers.length.toLocaleString();

  const list = filteredVouchers();
  $('voucher-count').textContent = S.vFilter || S.vStatus
    ? tx('v.found', { n: list.length, total: S.vouchers.length })
    : tx('v.total', { n: S.vouchers.length });
  const el = $('voucher-list');
  if (!list.length) {
    el.innerHTML = (S.vFilter || S.vStatus)
      ? `<div class="empty"><div class="big">${ic('search', 'xl')}</div><p><b>${t('v.noResult')}</b></p><p class="small">${t('v.noResultSub')}</p></div>`
      : `<div class="empty"><div class="big">${ic('ticket', 'xl')}</div><p><b>${t('v.empty')}</b></p><p class="small">${t('v.emptySub')}</p></div>`;
    return;
  }
  el.innerHTML = list.slice(0, 300).map(v => `
    <div class="voucher-row" data-uuid="${esc(v.uuid)}">
      <span class="status-dot s${esc(v.status)}"></span>
      <div class="voucher-meta">
        <div class="voucher-code">${esc(vCode(v))}</div>
        <div class="pkg">${esc(v.packageName || v.userGroupName || '')} · ${esc(fmtPeriod(v.timePeriod))}</div>
      </div>
      <span class="badge s${esc(v.status)}">${esc(statusTxt(v.status))}</span>
      <span class="chev">${ic('chev')}</span>
    </div>`).join('');
  if (list.length > 300) el.innerHTML += `<div class="empty" style="padding:20px"><p class="small">${t('v.first300')}</p></div>`;
  el.querySelectorAll('.voucher-row').forEach(r => r.addEventListener('click', () => openVoucherDetail(r.dataset.uuid)));
}

let modalVoucher = null;
function openVoucherDetail(uuid) {
  const v = S.vouchers.find(x => x.uuid === uuid);
  if (!v) return;
  modalVoucher = v;
  $('modal-title').innerHTML = ic('ticket', 'sm') + ' ' + esc(vCode(v));
  const rows = [
    [t('d.code'), `<b class="voucher-code">${esc(vCode(v))}</b> <button class="icon-btn" id="modal-copy" title="${t('a.copy')}" style="width:30px;height:30px">${ic('copy', 'sm')}</button>`],
    [t('d.status'), `<span class="badge s${esc(v.status)}">${esc(statusTxt(v.status))}</span>`],
    [t('d.pkg'), esc(v.packageName || v.userGroupName || '—')],
    [t('d.validity'), esc(fmtPeriod(v.timePeriod))],
    [t('d.usedTime'), v.usedTime ? fmtPeriod(v.usedTime) : '—'],
    [t('d.created'), esc(fmtDate(v.createTime))],
    [t('d.expiry'), esc(v.expiryTime || '—')],
    [t('d.quota'), esc(fmtQuota(v.quota))],
    [t('d.usedQuota'), esc(fmtQuota(v.usedQuota))],
    [t('d.maxClients'), esc(v.maxClients || '—')],
    [t('d.curClients'), esc(v.currentClients || 0)],
    ['Download limit', v.downloadRateLimit ? v.downloadRateLimit + ' KB/s' : '—'],
    ['Upload limit', v.uploadRateLimit ? v.uploadRateLimit + ' KB/s' : '—'],
    [t('d.price'), v.packagePrice ? esc(v.packagePrice) : '—'],
    [t('d.note'), esc(v.comment || v.nameRef || '—')],
    [t('d.macbind'), v.bindMac ? 'Yes' : 'No'],
  ];
  $('modal-body').innerHTML = `<dl class="kv">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
  $('modal-copy').addEventListener('click', ev => { ev.stopPropagation(); copyText(vCode(v)); });
  $('modal').classList.remove('hidden');
}

async function deleteVoucher() {
  const v = modalVoucher;
  if (!v) return;
  if (!confirm(tx('del.confirm', { code: vCode(v) }))) return;
  try {
    await Api.voucherDelete(S.projectId, v);
    toast(t('del.done'));
  } catch (e) {
    // Honest: Ruijie Open Platform has no voucher-delete endpoint (portal uses internal SSO API)
    toast(e.message || t('del.unsupported'), true);
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
    toast(t('err.pkgList') + e.message, true);
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
  if (!id || !profile) return showErr('gen-err', t('err.pickPkg'));
  const btn = $('btn-generate');
  const lbl = $('btn-generate-label');
  btn.disabled = true; lbl.textContent = t('btn.generating');
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
    toast(tx('toast.generated', { n: list.length }));
  } catch (e) {
    showErr('gen-err', e.message);
  } finally {
    btn.disabled = false; lbl.textContent = t('g.btn');
  }
}

async function doGenerateCustom() {
  const code = $('gen-custom-code').value.trim();
  const { id, profile, pkg } = selectedPackage('gen-custom-package');
  $('gen-custom-err').classList.add('hidden');
  if (!/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}(-[A-Za-z0-9]{4})?$/.test(code))
    return showErr('gen-custom-err', t('err.codeFmt'));
  const btn = $('btn-generate-custom');
  const lbl = $('btn-generate-custom-label');
  btn.disabled = true; lbl.textContent = t('btn.generating');
  try {
    await Api.voucherCustomCreate(S.projectId, code, { profile, userGroupId: id });
    showGenResult([{ code, pkg: pkg && (pkg.name || pkg.groupName), period: pkg && pkg.timePeriod, quota: pkg && pkg.quota }]);
    S.vouchers = [];
    toast(t('toast.genDone'));
  } catch (e) {
    showErr('gen-custom-err', e.message);
  } finally {
    btn.disabled = false; lbl.textContent = t('g.customBtn');
  }
}

let genResultItems = [];
function showGenResult(items) {
  genResultItems = items;
  $('gen-result-count').textContent = items.length;
  $('gen-result-list').innerHTML = items.map((it, i) =>
    `<span class="code-pill">${esc(it.code)}<button data-copy="${i}" title="${t('a.copy')}">${ic('copy', 'sm')}</button><button data-i="${i}" title="${t('a.queue')}">${ic('plus', 'sm')}</button></span>`).join('');
  document.querySelectorAll('#gen-result-list [data-copy]').forEach(b =>
    b.addEventListener('click', () => copyText(genResultItems[Number(b.dataset.copy)].code)));
  document.querySelectorAll('#gen-result-list [data-i]').forEach(b =>
    b.addEventListener('click', () => { addToQueue(genResultItems[Number(b.dataset.i)]); }));
  $('gen-result').classList.remove('hidden');
  $('gen-result').scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════ PRINTER ═══════════ */
function addToQueue(item) {
  if (!item || !item.code) return;
  if (S.queue.some(q => q.code === item.code)) return toast(t('toast.queueDup'));
  S.queue.push({ code: item.code, pkg: item.pkg || '', period: item.period, quota: item.quota });
  renderQueue();
  toast(t('toast.queueAdded'));
}
function renderQueue() {
  $('queue-count').textContent = S.queue.length;
  $('print-queue').innerHTML = S.queue.map((q, i) =>
    `<span class="code-pill">${esc(q.code)}<button data-i="${i}" title="${t('search.clear')}">${ic('x', 'sm')}</button></span>`).join('') || `<p class="muted">${t('q.empty')}</p>`;
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
      <div class="info">${item.period ? t('tkt.validity') + esc(fmtPeriod(item.period)) : ''}</div>
      <div class="info">${item.quota != null ? t('tkt.quota') + esc(fmtQuota(item.quota)) : ''}</div>
      <div class="info">${esc(now)}</div>
      ${st.footer ? `<hr><div class="foot">${esc(st.footer)}</div>` : ''}
    </div>`;
  }
  return html;
}

function doPrint(items) {
  if (!items.length) return toast(t('err.noPrint'), true);
  const st = printSettings();
  const html = items.map(it => ticketHtml(it, st)).join('');
  // APK: native Android print via PrintManager (window.print() does nothing in WebView)
  if (window.RuijieBridge && window.RuijieBridge.printHtml) {
    try {
      window.RuijieBridge.printHtml(b64encodeUnicode(printDocHtml(html, st)), st.paper);
      return;
    } catch (e) { toast(t('err.print') + e.message, true); return; }
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

/* ── print preview (sample ticket with current settings) ── */
function ticketPreviewHtml(item, st) {
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<div class="ticket-preview">
    ${st.header ? `<h4>${esc(st.header)}</h4><hr>` : ''}
    <div class="pv-info">${esc(item.pkg || '')}</div>
    <div class="pv-code">${esc(item.code)}</div>
    <div class="pv-info">${item.period ? t('tkt.validity') + esc(fmtPeriod(item.period)) : ''}</div>
    <div class="pv-info">${item.quota != null ? t('tkt.quota') + esc(fmtQuota(item.quota)) : ''}</div>
    <div class="pv-info">${esc(now)}</div>
    ${st.footer ? `<hr><div class="pv-info">${esc(st.footer)}</div>` : ''}
  </div>
  <p class="muted small" style="text-align:center">${tx('pv.meta', { paper: esc(st.paper), copies: esc(String(st.copies)) })}</p>`;
}
function openPrintPreview() {
  const st = printSettings();
  $('preview-body').innerHTML = ticketPreviewHtml(
    { code: 'XXXX-XXXX', pkg: t('pv.sample'), period: 60, quota: 1024 }, st);
  $('preview-modal').classList.remove('hidden');
}

/* ═══════════ MORE ═══════════ */
function moreHome() {
  S.moreFn = null;
  $('more-menu').classList.remove('hidden');
  $('more-content').innerHTML = '';
}
function moreShell(title, inner) {
  $('more-menu').classList.add('hidden');
  $('more-content').innerHTML = `<button class="btn back-btn" id="more-back">${ic('back', 'sm')}<span>${t('more.back')}</span></button><div class="card"><h2>${title}</h2>${inner}</div>`;
  $('more-back').addEventListener('click', moreHome);
}

async function moreAccounts() {
  moreShell(`${ic('user', 'sm')} ${esc(t('ma.title'))}`, `<div id="ma-list"><p class="muted">${t('more.loading')}</p></div>
    <div class="row"><button class="btn" id="ma-add">${ic('plus', 'sm')}<span>${t('ma.add')}</span></button></div><div id="ma-form"></div>`);
  S.moreFn = moreAccounts;
  $('ma-add').addEventListener('click', () => {
    const pkgOpts = S.packages.map(p => `<option value="${p.id}|${esc(p.authprofileid || p.profileId || '')}">${esc(p.name || p.groupName)}</option>`).join('');
    $('ma-form').innerHTML = `<label>${t('ma.user')} <input id="ma-u"></label><label>${t('ma.pass')} <input id="ma-p"></label>
      <label>${t('ma.pkg')} <select id="ma-pkg">${pkgOpts}</select></label>
      <label>${t('ma.note')} <input id="ma-c"></label>
      <button class="btn primary" id="ma-do">${t('ma.add')}</button>`;
    $('ma-do').addEventListener('click', async () => {
      const [gid, pid] = $('ma-pkg').value.split('|');
      try {
        await Api.accountCreate(S.projectId, { username: $('ma-u').value.trim(), password: $('ma-p').value, profileId: pid, userGroupId: Number(gid), comment: $('ma-c').value.trim() });
        toast(t('ma.added')); moreAccounts();
      } catch (e) { toast(e.message, true); }
    });
  });
  try {
    const j = await Api.accountList(S.projectId, { pageSize: 100 });
    const list = j.list || j.data || j.accounts || [];
    $('ma-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>Username</th><th>Status</th><th></th></tr>
      ${list.map(a => `<tr><td>${esc(a.username || a.name || '')}</td><td>${esc(a.status || '')}</td>
        <td><button class="btn danger-ghost" data-del="${esc(a.username || a.name || '')}" data-uuid="${esc(a.uuid || '')}">${t('ma.del')}</button></td></tr>`).join('')}
      </table></div>` : `<p class="muted">${t('ma.none')}</p>`;
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(tx('del.confirm', { code: b.dataset.del }))) return;
      try { await Api.accountDelete(S.projectId, b.dataset.del); toast(t('del.done')); moreAccounts(); }
      catch (e) { toast(e.message, true); }
    }));
  } catch (e) { $('ma-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreUserGroups() {
  moreShell(`${ic('box', 'sm')} ${esc(t('mg.title'))}`, `<div id="mg-list"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = moreUserGroups;
  try {
    await ensurePackages();
    $('mg-list').innerHTML = S.packages.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>${t('mg.name')}</th><th>${t('mg.validity')}</th><th>${t('mg.data')}</th><th>${t('mg.price')}</th></tr>
      ${S.packages.map(p => `<tr><td>${esc(p.name || p.groupName || '')}</td><td>${esc(fmtPeriod(p.timePeriod))}</td>
        <td>${esc(fmtQuota(p.quota || p.flowQuota))}</td><td>${esc(p.price || p.packagePrice || '—')}</td></tr>`).join('')}
      </table></div>` : `<p class="muted">${t('mg.none')}</p>`;
  } catch (e) { $('mg-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreDevices() {
  moreShell(`${ic('signal', 'sm')} ${esc(t('md.title'))}`, `
    <div class="chips" id="md-chips">
      <button class="chip active" data-t="">${t('md.all')}</button>
      <button class="chip" data-t="AP">AP</button>
      <button class="chip" data-t="Switch">Switch</button>
      <button class="chip" data-t="Gateway">Gateway</button>
    </div><div id="md-list" style="margin-top:10px"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = moreDevices;
  const load = async (type) => {
    $('md-list').innerHTML = `<p class="muted">${t('more.loading')}</p>`;
    try {
      const list = await Api.deviceList(S.projectId, type, 0, 100);
      $('md-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
        <tr><th>${t('md.sn')}</th><th>${t('md.model')}</th><th>${t('md.status')}</th></tr>
        ${list.map(d => `<tr><td>${esc(d.alias || d.name || d.sn || '')}<br><small class="muted">${esc(d.sn || d.mac || '')}</small></td>
          <td>${esc(d.model || d.productModel || '')}</td>
          <td>${esc(d.onlineStatus || d.status || (d.online ? 'online' : ''))}</td></tr>`).join('')}
        </table></div>` : `<p class="muted">${t('md.none')}</p>`;
    } catch (e) { $('md-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  };
  document.querySelectorAll('#md-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#md-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); load(c.dataset.t);
  }));
  load('');
}

async function moreClients() {
  moreShell(`${ic('monitor', 'sm')} ${esc(t('mc.title'))}`, `<div id="mc-list"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = moreClients;
  try {
    const list = await Api.onlineClients(Number(S.projectId), 0, 100);
    $('mc-list').innerHTML = list.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>${t('mc.mac')}</th><th>${t('mc.ssid')}</th><th>${t('mc.detail')}</th></tr>
      ${list.map(c => `<tr><td>${esc(c.mac || '')}<br><small class="muted">${esc(c.ip || '')}</small></td>
        <td>${esc(c.ssid || '')}</td><td><small>${esc(c.username || c.hostname || '')}</small></td></tr>`).join('')}
      </table></div><p class="muted small">${tx('mc.total', { n: list.length })}</p>` : `<p class="muted">${t('mc.none')}</p>`;
  } catch (e) { $('mc-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreNetworks() {
  moreShell(`${ic('globe', 'sm')} ${esc(t('mn.title'))}`, `<div id="mn-tree"><p class="muted">${t('more.loading')}</p></div>
    <div class="row"><button class="btn" id="mn-add">${ic('plus', 'sm')}<span>${t('mn.add')}</span></button></div><div id="mn-form"></div>`);
  S.moreFn = moreNetworks;
  const renderTree = (nodes, depth = 0) => (nodes || []).map(n => {
    const kids = n.children || n.subGroups || n.childGroups || [];
    return `<div style="margin-left:${depth * 16}px;padding:4px 0">${ic('folder', 'sm')} ${esc(n.groupName || n.name)} <small class="muted">(${(n.groupType || n.type || '').toUpperCase()})</small></div>` +
      (kids.length ? renderTree(kids, depth + 1) : '');
  }).join('');
  try {
    const tree = await Api.getGroupTree('BUILDING');
    $('mn-tree').innerHTML = renderTree(Array.isArray(tree) ? tree : [tree]) || `<p class="muted">${t('mn.none')}</p>`;
  } catch (e) { $('mn-tree').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  $('mn-add').addEventListener('click', () => {
    $('mn-form').innerHTML = `<label>${t('mn.name')} <input id="mn-name"></label><label>${t('mn.desc')} <input id="mn-desc"></label>
      <button class="btn primary" id="mn-do">${t('mn.add')}</button>`;
    $('mn-do').addEventListener('click', async () => {
      try {
        await Api.addNetwork({ name: $('mn-name').value.trim(), parentId: S.projects[0] ? S.projects[0].id : undefined });
        toast(t('mn.added')); moreNetworks(); loadProjects();
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
    const av = $('topbar-avatar');
    if (av) av.textContent = (name || email || 'R').trim().charAt(0).toUpperCase();
    $('account-info').innerHTML = `<dl class="kv">
      <dt>${t('ai.name')}</dt><dd>${esc(name || '—')}</dd>
      <dt>Email</dt><dd>${esc(email || '—')}</dd>
      <dt>${t('ai.tenant')}</dt><dd>${esc(info.tenantId || info.defaultTenantId || '—')}</dd>
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
    toast(t('toast.saved'));
    S.vouchers = []; S.packages = [];
    loadProjects().then(loadVouchers);
    loadAccountInfo();
  } catch (e) { showErr('set-err', t('err.connectFail') + e.message); }
}

/* ═══════════ INIT ═══════════ */
function init() {
  if (init._done) return; // guard against double script evaluation
  init._done = true;
  initTheme();
  initLang();

  // password peek toggles
  document.querySelectorAll('[data-peek]').forEach(b => b.addEventListener('click', () => {
    const i = $(b.dataset.peek);
    if (i) i.type = i.type === 'password' ? 'text' : 'password';
  }));

  $('btn-connect').addEventListener('click', doConnect);
  document.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', () => switchView(tb.dataset.view)));
  $('project-select').addEventListener('change', onProjectChange);

  // icon-only search: expand on tap, collapse via ✕ when empty (or Esc)
  const searchInput = $('voucher-search'), searchWrap = $('search-wrap'), searchBtn = $('btn-search');
  const collapseSearch = () => {
    searchWrap.classList.remove('open');
    searchBtn.classList.remove('hidden');
    searchInput.value = ''; S.vFilter = '';
    searchWrap.classList.remove('has-text');
    renderVouchers();
  };
  searchInput.addEventListener('input', e => {
    S.vFilter = e.target.value;
    searchWrap.classList.toggle('has-text', !!e.target.value);
    renderVouchers();
  });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') collapseSearch(); });
  searchBtn.addEventListener('click', () => {
    searchWrap.classList.add('open');
    searchBtn.classList.add('hidden');
    searchInput.focus();
  });
  $('search-clear').addEventListener('click', () => {
    if (searchInput.value) {
      searchInput.value = ''; S.vFilter = '';
      searchWrap.classList.remove('has-text');
      renderVouchers();
      searchInput.focus();
    } else {
      collapseSearch();
    }
  });
  $('btn-refresh-vouchers').addEventListener('click', function () {
    this.classList.add('spinning');
    loadVouchers().finally(() => this.classList.remove('spinning'));
  });

  document.querySelectorAll('#voucher-status-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#voucher-status-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); S.vStatus = c.dataset.s; renderVouchers();
  }));
  $('modal-close').addEventListener('click', () => closeModal('modal'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal('modal'); });
  $('modal-print').addEventListener('click', () => { if (modalVoucher) doPrint([{ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }]); });
  $('modal-queue').addEventListener('click', () => { if (modalVoucher) addToQueue({ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }); });
  $('modal-delete').addEventListener('click', deleteVoucher);

  // print preview sheet
  $('preview-close').addEventListener('click', () => closeModal('preview-modal'));
  $('preview-modal').addEventListener('click', e => { if (e.target === $('preview-modal')) closeModal('preview-modal'); });
  $('btn-print-preview').addEventListener('click', openPrintPreview);
  $('btn-preview-print').addEventListener('click', () => {
    closeModal('preview-modal');
    doPrint([{ code: 'TEST-1234', pkg: t('tkt.test'), period: 60, quota: 1024 }]);
  });

  // steppers
  wireStepper('qty-minus', 'qty-plus', 'gen-qty', 1, 500);
  wireStepper('copies-minus', 'copies-plus', 'print-copies', 1, 10);

  // iOS segmented paper size (syncs hidden select used by printSettings)
  document.querySelectorAll('#paper-seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#paper-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('print-paper').value = b.dataset.paper;
    Store.save({ printPaper: b.dataset.paper });
  }));

  // dark mode
  $('set-darkmode').addEventListener('change', e => applyTheme(e.target.checked ? 'dark' : 'light'));

  // language (မြန်မာ / English)
  document.querySelectorAll('#lang-seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  $('btn-generate').addEventListener('click', doGenerate);
  $('btn-generate-custom').addEventListener('click', doGenerateCustom);
  $('btn-gen-print-all').addEventListener('click', () => doPrint(genResultItems));
  $('btn-gen-queue-all').addEventListener('click', () => { genResultItems.forEach(addToQueue); });

  $('btn-print-test').addEventListener('click', () => doPrint([{ code: 'TEST-1234', pkg: t('tkt.test'), period: 60, quota: 1024 }]));
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
    if (!confirm(t('confirm.signout'))) return;
    Api.clearCfg();
    location.reload();
  });

  applyLang();

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
