/**
 * Ruijie Voucher App — UI logic (vanilla JS) · v1.2.0
 * iOS design · SVG icon system · EN/MY i18n · tablet layouts
 */
'use strict';

const APP_VERSION = '1.5.57';

/* ═══════════ I18N (မြန်မာ / English) ═══════════ */
const I18N = {
  appTitle: { my: 'Pray Manager', en: 'Pray Manager' },
  'connect.sub': { my: 'Voucher စီမံခန့်ခွဲမှုစနစ်', en: 'Voucher management system' },
  'connect.cloud': { my: 'Cloud URL', en: 'Cloud URL' },
  'connect.appid': { my: 'App ID', en: 'App ID' },
  'connect.appidPh': { my: 'App ID', en: 'App ID' },
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
  'stat.active': { my: 'မသုံးရသေး', en: 'Unused' },
  'stat.used': { my: 'သုံးနေဆဲ', en: 'In use' },
  'stat.expired': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'stat.total': { my: 'စုစုပေါင်း', en: 'Total' },
  'search.label': { my: 'ရှာဖွေမယ်', en: 'Search' },
  'search.ph': { my: 'ကုဒ်နံပါတ်ရှာမယ်…', en: 'Search codes…' },
  'search.clear': { my: 'ရှင်းမယ်', en: 'Clear' },
  'search.refresh': { my: 'ပြန်ဆွဲမယ်', en: 'Refresh' },
  'chip.all': { my: 'အားလုံး', en: 'All' },
  'chip.s1': { my: 'မသုံးရသေး', en: 'Unused' },
  'chip.s2': { my: 'သုံးနေဆဲ', en: 'In use' },
  'chip.s3': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'v.loading': { my: 'ဆွဲနေသည်…', en: 'Loading…' },
  'v.loadFail': { my: 'ဒေတာရမလာ', en: "Couldn't load data" },
  'v.found': { my: 'တွေ့ရှိချက် {n} / စုစုပေါင်း {total}', en: '{n} found / {total} total' },
  'v.total': { my: 'စုစုပေါင်း {n}', en: '{n} total' },
  'v.updated': { my: 'နောက်ဆုံးရယူချိန်', en: 'Updated' },
  'v.expiring': { my: 'မကြာမီသက်တမ်းကုန်မည့်ဗောက်ချာ', en: 'Expiring soon' },
  'v.select': { my: 'ရွေးမယ်', en: 'Select' },
  'v.bulkPrint': { my: 'ပရင့်ထုတ်မယ်', en: 'Print' },
  'v.bulkDelete': { my: 'ဖျက်မယ်', en: 'Delete' },
  'v.selected': { my: '{n} ခုရွေးထားသည်', en: '{n} selected' },
  'v.noResult': { my: 'ရှာမတွေ့ပါ', en: 'No results' },
  'v.noResultSub': { my: 'ရှာဖွေမှုစာသား (သို့) စစ်ထုတ်မှုပြောင်းကြည့်ပါ', en: 'Try a different search or filter' },
  'v.empty': { my: 'ဗောက်ချာမရှိပါ', en: 'No vouchers' },
  'v.emptySub': { my: '「ထုတ်မယ်」 tab မှ အသစ်ထုတ်နိုင်ပါတယ်', en: 'Generate new ones from the Generate tab' },
  'v.first300': { my: 'အစဆုံး ၃၀၀ သာပြထားသည် — ရှာဖွေမှုနဲ့ စစ်ထုတ်ပါ', en: 'Showing first 300 — use search or filters' },
  'status.1': { my: 'မသုံးရသေး', en: 'Unused' },
  'status.2': { my: 'သုံးနေဆဲ', en: 'In use' },
  'status.3': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'd.code': { my: 'ကုဒ်နံပါတ်', en: 'Code' },
  'd.status': { my: 'အခြေအနေ', en: 'Status' },
  'd.pkg': { my: 'Package', en: 'Package' },
  'd.validity': { my: 'သက်တမ်း', en: 'Validity' },
  'd.usedTime': { my: 'သုံးပြီးချိန်', en: 'Used time' },
  'd.created': { my: 'ထုတ်လုပ်ချိန်', en: 'Created' },
  'd.expiry': { my: 'သက်တမ်းကုန်ချိန်', en: 'Expires' },
  'd.activated': { my: 'စတင်သုံးချိန်', en: 'First used' },
  'd.quota': { my: 'ဒေတာပမာဏ', en: 'Data quota' },
  'd.usedQuota': { my: 'သုံးပြီးဒေတာ', en: 'Data used' },
  'd.remQuota': { my: 'ကျန်ဒေတာ', en: 'Remaining data' },
  'd.remTime': { my: 'ကျန်အချိန်', en: 'Remaining time' },
  'd.maxClients': { my: 'တစ်ပြိုင်သုံးနိုင်သူ', en: 'Max clients' },
  'd.curClients': { my: 'လက်ရှိသုံးနေသူ', en: 'Current clients' },
  'd.price': { my: 'ဈေးနှုန်း', en: 'Price' },
  'd.note': { my: 'မှတ်ချက်', en: 'Note' },
  'd.macbind': { my: 'MAC bind', en: 'MAC bind' },
  'a.copy': { my: 'ကူးမယ်', en: 'Copy' },
  'a.queue': { my: 'Queue ထဲထည့်မယ်', en: 'Add to queue' },
  'a.close': { my: 'ပိတ်မယ်', en: 'Close' },
  'del.confirm': { my: '"{code}" ကို ဖျက်မှာသေချာပါသလား?', en: 'Delete "{code}"?' },
  'del.confirmBulk': { my: 'ဗောက်ချာ {n} ခုကို ဖျက်မှာသေချာပါသလား?', en: 'Delete {n} vouchers?' },
  // v1.5.54: bulk delete is restricted to vouchers generated in the current session
  'del.confirmBulkNew': { my: 'ယခု session မှာထုတ်ထားသော ဗောက်ချာ {n} ခုကို ဖျက်မှာသေချာပါသလား?{skip}', en: 'Delete {n} newly-generated vouchers?{skip}' },
  'del.skipOld': { my: '\n({n} ခုမှာ session အတွင်းထုတ်ထားတာမဟုတ်လို့ ကျော်ပါမယ်)', en: '\n({n} skipped — not generated in this session)' },
  'del.noNew': { my: 'ရွေးထားတဲ့ဗောက်ချာတွေမှာ ယခု session အတွင်းထုတ်ထားတာမရှိပါ — ဖျက်လို့မရပါ', en: 'None of the selected vouchers were generated in this session — nothing to delete' },
  'del.done': { my: 'ဖျက်ပြီးပါပြီ', en: 'Deleted' },
  'del.unsupported': { my: 'ဖျက်မရပါ — Ruijie Open API မှာ voucher ဖျက်တဲ့လုပ်ဆောင်ချက်မပါဝင်ပါ', en: 'Cannot delete — the Ruijie Open API has no voucher-delete operation' },
  'del.needSso': { my: 'ဖျက်ဖို့အတွက် Ruijie အကောင့်နဲ့ ဝင်ထားဖို့လိုပါတယ် (ဆက်တင် → Ruijie အကောင့်)', en: 'Deleting needs Ruijie account login (Settings → Ruijie account)' },
  'del.rejected': { my: 'Ruijie က ဖျက်ခြင်းကို ငြင်းဆိုလိုက်ပါတယ် (403) — အကောင့်တော့ ဝင်ထားဆဲပါ', en: 'Ruijie rejected the delete (403) — you are still logged in' },
  'sso.title': { my: 'Ruijie အကောင့်', en: 'Ruijie account' },
  'sso.sub': { my: 'ဝင်ထားမှ voucher ဖျက်လို့ရမယ်', en: 'Log in to enable voucher delete' },
  'sso.login': { my: 'အကောင့်ဝင်မယ်', en: 'Log in' },
  'sso.logout': { my: 'ထွက်မယ်', en: 'Log out' },
  'sso.connected': { my: '✓ ချိတ်ဆက်ထားပြီး — voucher ဖျက်လို့ရပြီ', en: '✓ Connected — voucher delete is available' },
  'sso.notConnected': { my: 'မဝင်ရသေးပါ', en: 'Not logged in' },
  'sso.onlyAndroid': { my: 'Ruijie အကောင့်ဝင်တာကို Android app မှာပဲ သုံးလို့ရပါတယ်', en: 'Ruijie account login is only available in the Android app' },
  'sso.welcome': { my: 'Ruijie အကောင့် ဝင်ပြီးပါပြီ', en: 'Logged in to Ruijie account' },
  'sso.bye': { my: 'အကောင့်ထွက်ပြီးပါပြီ', en: 'Logged out' },
  'sso.savedAs': { my: 'သိမ်းထားတဲ့ အကောင့်', en: 'Saved account' },
  'sso.remember': { my: 'အကောင့်မှတ်ထားမယ်', en: 'Remember account' },
  'sso.rememberSub': { my: 'စက်မှာ encrypted သိမ်းမယ်', en: 'Stored encrypted on this device' },
  'sso.autologin': { my: 'အလိုအလျောက် ဝင်မယ်', en: 'Auto-login' },
  'sso.autologinSub': { my: 'နောက်တစ်ခါ နှိပ်စရာမလို', en: 'Sign in without tapping anything' },
  'sso.switch': { my: 'အကောင့်ပြောင်းမယ်', en: 'Switch account' },
  'sso.forgotten': { my: 'သိမ်းထားတဲ့ အကောင့်ဖျက်ပြီးပါပြီ', en: 'Saved account forgotten' },
  // v1.5.57: live voucher stats (auto-refresh of the 4 stat cards)
  'live.title': { my: 'ဗောက်ချာ တိုက်ရိုက်စာရင်း', en: 'Live voucher stats' },
  'live.enable': { my: 'စာရင်း အလိုအလျောက် ပြန်ဆွဲမယ်', en: 'Auto-refresh stats' },
  'live.enableSub': { my: 'တစ်ယောက်ယောက် voucher စသုံးလိုက်ရင် အရေအတွက် ချက်ချင်းပြောင်းမယ်', en: 'Counts update live when someone redeems a voucher' },
  'live.interval': { my: 'ပြန်ဆွဲမယ့် ကြားချိန်', en: 'Refresh interval' },
  'mon.title': { my: 'စက်ပစ္စည်း သတိပေးချက်', en: 'Device offline alerts' },
  'mon.sub': { my: 'AP / Gateway offline ဖြစ်ရင် အဝိုင်းပေါ့ပ်အပ် + အသံနဲ့ သတိပေးမယ်', en: 'Circle popup + sound when an AP or Gateway goes offline' },
  'mon.enable': { my: 'နောက်ခံ စောင့်ကြည့်မယ်', en: 'Monitor in background' },
  'mon.enableSub': { my: 'App ပိတ်ထားရင်တောင် ၁၅ မိနစ်တစ်ခါ စစ်မယ်', en: 'Checks every 15 min even with the app closed' },
  'mon.checkNow': { my: 'အခုပဲ စစ်မယ်', en: 'Check now' },
  'mon.on': { my: 'ဖွင့်ထားတယ်', en: 'On' },
  'mon.off': { my: 'ပိတ်ထားတယ်', en: 'Off' },
  'mon.noConfig': { my: 'အရင် Cloud ချိတ်ဆက်ပါ', en: 'Connect to Cloud first' },
  'mon.onlyAndroid': { my: 'ဒါကို Android app မှာပဲ သုံးလို့ရပါတယ်', en: 'Only available in the Android app' },
  'mon.checking': { my: 'စစ်နေတယ်…', en: 'Checking…' },
  'gw.title': { my: 'Gateway (ဒေသတွင်း)', en: 'Gateway (local)' },
  'gw.sub': { my: 'LAN ထဲက gateway ကို တိုက်ရိုက်ချိတ်မယ် — Cloud မှာမရှိတဲ့ China AP တွေပါမြင်ရမယ်', en: 'Connect directly to the gateway over LAN — shows China APs invisible to Cloud' },
  'gw.ip': { my: 'Gateway IP', en: 'Gateway IP' },
  'gw.user': { my: 'အသုံးပြုသူအမည်', en: 'Username' },
  'gw.pass': { my: 'စကားဝှက်', en: 'Password' },
  'gw.connect': { my: 'ချိတ်မယ်', en: 'Connect' },
  'gw.disconnect': { my: 'ဖြုတ်မယ်', en: 'Disconnect' },
  'gw.connected': { my: '✓ ချိတ်ထားပြီး — local device တွေမြင်ရမယ်', en: '✓ Connected — local devices are visible' },
  'gw.notConnected': { my: 'မချိတ်ရသေးပါ', en: 'Not connected' },
  'gw.onlyAndroid': { my: 'Gateway ချိတ်တာကို Android app မှာပဲ သုံးလို့ရပါတယ်', en: 'Gateway connection is only available in the Android app' },
  'gw.needInfo': { my: 'IP၊ အသုံးပြုသူအမည်နဲ့ စကားဝှက် ဖြည့်ပါ', en: 'Enter IP, username and password' },
  'gw.ok': { my: 'Gateway ချိတ်ပြီးပါပြီ', en: 'Gateway connected' },
  'gw.bye': { my: 'Gateway ဖြုတ်ပြီးပါပြီ', en: 'Gateway disconnected' },
  'gw.encPending': { my: 'စကားဝှက် encrypt နည်းလမ်း မရသေးပါ — gateway login JS လိုနေပါတယ်', en: 'Password encryption method not captured yet — need the gateway login JS' },
  'md.local': { my: '🏠 Local', en: '🏠 Local' },
  'md.localTag': { my: 'local', en: 'local' },
  'md.needGw': { my: 'Local device တွေမြင်ရရန် Settings → Gateway (ဒေသတွင်း) မှာ ချိတ်ပါ', en: 'Connect in Settings → Gateway (local) to see local devices' },
  'diag.title': { my: 'စစ်ဆေးမှုများ', en: 'Diagnostics' },
  'diag.sub': { my: 'ပြဿနာရှိတဲ့အပိုင်းကို ရွေးပြီးစစ်လို့ရပါတယ်', en: 'Select which part to test' },
  'diag.login': { my: 'Login စစ်မယ်', en: 'Test login' },
  'diag.loginSub': { my: 'App ID/Secret နဲ့ Ruijie အကောင့်', en: 'App ID/Secret and Ruijie account' },
  'diag.voucher': { my: 'Voucher စစ်မယ်', en: 'Test vouchers' },
  'diag.voucherSub': { my: 'စာရင်းဆွဲခြင်းနဲ့ ဖျက်ဖို့အဆင်သင့်ဖြစ်မှု (တကယ်မဖျက်ပါ)', en: 'Listing and delete readiness (nothing is deleted)' },
  'diag.run': { my: 'စစ်မယ်', en: 'Run tests' },
  'diag.save': { my: 'Report သိမ်းမယ်', en: 'Save report' },
  'diag.running': { my: 'စစ်နေသည်…', en: 'Testing…' },
  'diag.pickOne': { my: 'အနည်းဆုံး တစ်ခုရွေးပါ', en: 'Select at least one' },
  'diag.pass': { my: 'အောင်မြင်သည်', en: 'PASS' },
  'diag.fail': { my: 'မအောင်မြင်ပါ', en: 'FAIL' },
  'diag.skip': { my: 'ကျော်သွားသည်', en: 'SKIP' },
  'diag.saved': { my: 'Report သိမ်းပြီးပါပြီ', en: 'Report saved' },
  'diag.saveCancel': { my: 'မသိမ်းပါ', en: 'Save cancelled' },
  'diag.saveFail': { my: 'သိမ်းမရပါ: ', en: 'Save failed: ' },
  'diag.portalProbe': { my: 'Portal session စစ်မယ်', en: 'Portal session probe' },
  'diag.loginTrace': { my: 'Login လမ်းကြောင်း', en: 'Login trace' },
  'err.pkgList': { my: 'Package list ရမလာ: ', en: "Couldn't load packages: " },
  'err.pickPkg': { my: 'Package ရွေးပါ', en: 'Choose a package' },
  'btn.generating': { my: 'ထုတ်နေသည်…', en: 'Generating…' },
  'toast.generated': { my: '{n} ခု ထုတ်ပြီးပါပြီ', en: '{n} vouchers generated' },
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
  'tkt.code': { my: 'ဗောက်ချာကုဒ်', en: 'Voucher Code' },
  'tkt.datetime': { my: 'ပရင့်ထုတ်ချိန်', en: 'Print Date/Time' },
  'tkt.test': { my: 'စမ်းသပ်စာရွက်', en: 'Test ticket' },
  'pv.sample': { my: 'နမူနာစာရွက်', en: 'Sample ticket' },
  'pv.meta': { my: 'စာရွက် {paper}mm · မိတ္တူ {copies} စောင်', en: '{paper}mm paper · {copies} copies' },
  'g.title': { my: 'ဗောက်ချာထုတ်မယ်', en: 'Generate Vouchers' },
  'g.new': { my: 'ဗောက်ချာအသစ်ထုတ်မယ်', en: 'Generate new vouchers' },
  'g.package': { my: 'Package ရွေးပါ', en: 'Choose a package' },
  'g.qty': { my: 'အရေအတွက် (၁–၅၀၀)', en: 'Quantity (1–500)' },
  'g.comment': { my: 'မှတ်ချက် (optional)', en: 'Note (optional)' },
  'g.commentPh': { my: 'ဥပမာ ဆိုင်အမည် / ဧည့်သည်အမည်', en: 'e.g. shop name / guest name' },
  'g.advanced': { my: 'အပိုအချက်အလက် (optional)', en: 'Extra info (optional)' },
  'g.btn': { my: 'ထုတ်မယ်', en: 'Generate' },
  'g.result': { my: 'ထုတ်ပြီးသား ဗောက်ချာများ', en: 'Generated vouchers' },
  'g.recent': { my: 'နောက်ဆုံးထုတ်ထားသောများ', en: 'Recently generated' },
  'g.recentEmpty': { my: 'ဒီစက်မှာ မှတ်ထားတဲ့ နောက်ဆုံးအသုတ်မရှိသေးပါ', en: 'No recent batch saved on this device yet' },
  'g.printAll': { my: 'အားလုံးပရင့်ထုတ်မယ်', en: 'Print all' },
  'g.queueAll': { my: 'Print queue ထဲထည့်မယ်', en: 'Add to print queue' },
  'g.usergroup': { my: 'User Group', en: 'User Group' },
  'g.profile': { my: 'Profile (Package)', en: 'Profile (Package)' },
  'g.length': { my: 'Voucher Length', en: 'Voucher Length' },
  'g.codetype': { my: 'Voucher Code Type', en: 'Voucher Code Type' },
  'g.ctAlnum': { my: 'Alphanumeric', en: 'Alphanumeric' },
  'g.ctAlpha': { my: 'Alphabetic', en: 'Alphabetic' },
  'g.ctNum': { my: 'Numeric', en: 'Numeric' },
  'g.apiNote': { my: 'အရှည်နှင့် စာလုံးအမျိုးအစား ရွေးချယ်မှုများကို Cloud သို့ တိုက်ရိုက်ပို့ပေးသည် (6–9 လုံး / Alphanumeric·Alphabetic·Numeric)။', en: 'Length and code-type choices are sent to Cloud (6–9 chars / Alphanumeric·Alphabetic·Numeric).' },
  'g.qty2': { my: 'ဗောက်ချာ အရေအတွက်', en: 'Number of Vouchers' },
  'g.customQty': { my: 'စိတ်ကြိုက် အရေအတွက်', en: 'Custom Quantity' },
  'g.btnPrint': { my: 'ထုတ်ပြီး ပရင့်မယ်', en: 'Generate & Print' },
  'a.cancel': { my: 'မလုပ်တော့ပါ', en: 'Cancel' },
  'v.unknown': { my: 'အဟောင်း/မသိ', en: 'old/unknown' },
  'kick.title': { my: 'Client ဖြုတ်ချခြင်း', en: 'Client Disconnect' },
  'kick.auto': { my: 'Quota ပြည့်ရင် အလိုအလျောက် ဖြုတ်မယ်', en: 'Auto-disconnect when quota is spent' },
  'kick.autoSub': { my: 'Voucher limit ပြည့်ပြီး ဆက်ချိတ်နေတဲ့ client ကို ဖြုတ်ခိုင်းမယ်', en: 'Disconnect clients still online after their voucher quota is spent' },
  'kick.status': { my: 'အခြေအနေ', en: 'Status' },
  'kick.soon': { my: 'Cloud verify ပြီးမှ အလုပ်လုပ်မယ်', en: 'Activates after cloud verification' },
  'kick.btn': { my: 'ဖြုတ်မယ်', en: 'Disconnect' },
  'kick.confirm': { my: 'ဒီ client ကို ဖြုတ်မလား?', en: 'Disconnect this client?' },
  'kick.pending': { my: 'Kick မရသေးဘူး — cloud ကောင်းမှ verify လုပ်မယ်', en: 'Kick not available yet — will verify when the cloud is healthy' },
  'kick.standby': { my: 'စောင့်နေတယ်', en: 'Standby' },
  'tkt.profileName': { my: 'Profile အမည်: ', en: 'Profile Name: ' },
  'pl.openLayout': { my: 'Print Layout & Spacing', en: 'Print Layout & Spacing' },
  'pl.title': { my: 'Print Layout & Spacing', en: 'Print Layout & Spacing' },
  'pl.reset': { my: 'မူလအတိုင်း ပြန်ထားမယ်', en: 'Reset Defaults' },
  'pl.live': { my: 'တိုက်ရိုက်အစမ်းကြည့်ခြင်း (58mm / 384 dots):', en: 'LIVE OUTPUT PREVIEW (58mm / 384 dots):' },
  'pl.liveFmt': { my: 'တိုက်ရိုက်အစမ်းကြည့်ခြင်း ({paper}mm / {dots} dots):', en: 'LIVE OUTPUT PREVIEW ({paper}mm / {dots} dots):' },
  'pl.advTypo': { my: 'အဆင့်မြင့် Typography & Fonts', en: 'Advanced Typography & Fonts' },
  'pl.spacing': { my: 'အကွာအဝေး ပြင်ဆင်ခြင်း', en: 'Spacing Configuration' },
  'pl.between': { my: 'ဗောက်ချာများကြား စာကြောင်းအလွတ်', en: 'Between Voucher Blank Lines' },
  'pl.betweenSub': { my: 'ပရင့်ထုတ်ထားသော ဗောက်ချာများကြား စာကြောင်းအလွတ်များ ထည့်သွင်းခြင်း', en: 'Feed blank lines between printed vouchers' },
  'pl.inside': { my: 'ဗောက်ချာအတွင်း အကွာအဝေး', en: 'Inside Voucher Spacing' },
  'pl.insideSub': { my: 'ဗောက်ချာတစ်ခုအတွင်းရှိ အချက်အလက်များကြား ဒေါင်လိုက်အကွာအဝေး', en: 'Vertical spacing between fields inside each voucher' },
  'pl.save': { my: 'Layout သိမ်းမယ်', en: 'Save Layout' },
  'pl.field': { my: 'အကွက်', en: 'Field' },
  'pl.show': { my: 'ပြမယ်', en: 'Show' },
  'pl.fontSize': { my: 'စာလုံးအရွယ်', en: 'Font Size' },
  'pl.bold': { my: 'စာလုံးထူ (Bold)', en: 'Bold' },
  'pl.spaced': { my: 'အကွာအဝေးပါ စာလုံး (Spaced)', en: 'Spaced' },
  'pl.label': { my: 'အညွှန်းပါမယ် (Label)', en: 'Label' },
  'pl.labelText': { my: 'အညွှန်းစာသား', en: 'Label text' },
  'pl.headerText': { my: 'ခေါင်းစဉ်စာသား', en: 'Header text' },
  'pl.customLines': { my: 'ကိုယ်ပိုင်စာကြောင်းများ', en: 'Custom Lines' },
  'pl.addLine': { my: 'စာကြောင်းအသစ်ထည့်မယ်', en: 'Add Custom Line' },
  'pl.lineLabel': { my: 'အညွှန်း', en: 'Label' },
  'pl.lineValue': { my: 'တန်ဖိုး', en: 'Value' },
  'pl.removeLine': { my: 'ဖြုတ်မယ်', en: 'Remove' },
  'pl.align': { my: 'တန်းညှိခြင်း', en: 'Alignment' },
  'pl.fHeader': { my: 'ခေါင်းစဉ် / Brand', en: 'Header / Brand' },
  'pl.fCode': { my: 'ဗောက်ချာကုဒ်', en: 'Voucher Code' },
  'pl.fProfile': { my: 'Profile အမည်', en: 'Profile Name' },
  'pl.fPeriod': { my: 'သက်တမ်း', en: 'Valid Period' },
  'pl.fQuota': { my: 'ဒေတာကန့်သတ်ချက်', en: 'Quota Limit' },
  'pl.fDatetime': { my: 'ပရင့်ထုတ်သည့် ရက်စွဲ / အချိန်', en: 'Print Date / Time' },
  'pl.lines': { my: 'လိုင်း', en: 'lines' },
  'pl.compact': { my: 'ကျဉ်းကျဉ်း', en: 'Compact' },
  'ty.openTypo': { my: 'Typography / Font Settings', en: 'Typography / Font Settings' },
  'ty.title': { my: 'Typography / Font Settings', en: 'Typography / Font Settings' },
  'ty.sub': { my: 'ဖောင့်၊ အရွယ်အစားနှင့် အပြင်အဆင်စတိုင်များ ပြင်ဆင်ပါ', en: 'Configure fonts, sizes, and layout styles' },
  'ty.resetColors': { my: 'အရောင်များ ပြန်ထားမယ်', en: 'Reset Colors' },
  'ty.live': { my: 'တိုက်ရိုက်ဗောက်ချာအစမ်းကြည့်ခြင်း (58mm)', en: 'LIVE VOUCHER PREVIEW (58mm)' },
  'ty.liveFmt': { my: 'တိုက်ရိုက်ဗောက်ချာအစမ်းကြည့်ခြင်း ({paper}mm)', en: 'LIVE VOUCHER PREVIEW ({paper}mm)' },
  'ty.realBadge': { my: 'REAL CLOUD VOUCHER', en: 'REAL CLOUD VOUCHER' },
  'ty.presets': { my: 'Typography Presets', en: 'Typography Presets' },
  'ty.pDefault': { my: 'မူလ', en: 'Default' },
  'ty.pCompact': { my: 'ကျဉ်းကျဉ်း', en: 'Compact' },
  'ty.pBold': { my: 'စာလုံးထူ ဗောက်ချာ', en: 'Bold Voucher' },
  'ty.pLarge': { my: 'အကြီး ဗောက်ချာ', en: 'Large Voucher' },
  'ty.pCustom': { my: 'စိတ်ကြိုက်', en: 'Custom' },
  'ty.fontFamily': { my: 'အဓိက ဖောင့်အမျိုးအစား', en: 'Global Font Family' },
  'ty.ffDefault': { my: 'မူလ', en: 'Default' },
  'ty.align': { my: 'တန်းညှိခြင်း', en: 'Alignment' },
  'ty.left': { my: 'ဘယ်', en: 'Left' },
  'ty.center': { my: 'အလယ်', en: 'Center' },
  'ty.right': { my: 'ညာ', en: 'Right' },
  'ty.color': { my: 'စာသားအရောင်', en: 'Text Color' },
  'ty.letterSpacing': { my: 'စာလုံးအကွာအဝေး (ဗောက်ချာကုဒ်နှင့် အကွက်များ)', en: 'Letter Spacing (Voucher Code & Fields)' },
  'ty.lsCompact': { my: 'ကျဉ်းကျဉ်း', en: 'Compact' },
  'ty.lsNormal': { my: 'ပုံမှန်', en: 'Normal' },
  'ty.lsWide': { my: 'ကျယ်ကျယ်', en: 'Wide' },
  'ty.lsCustom': { my: 'စိတ်ကြိုက်', en: 'Custom' },
  'ty.lineSpacing': { my: 'ထပ်တိုးလိုင်းအကွာအဝေး', en: 'Extra Line Spacing' },
  'ty.shadow': { my: 'စာသားအရိပ်', en: 'Text Shadow' },
  'ty.shadowSub': { my: 'အစမ်းကြည့်ခြင်းတွင်သာ ပြမည်။ Thermal ပရင့်အထွက်တွင် ကြည်လင်စွာရှိနေမည်။', en: 'Rendered in preview; thermal print output remains crisp and safe.' },
  'ty.outline': { my: 'စာသားအနားသတ် / Stroke', en: 'Text Outline / Stroke' },
  'ty.outlineSub': { my: 'စာသားအနားများကို သန့်ရှင်းစွာ ထင်ရှားစေသည်။', en: 'Accents text edges cleanly.' },
  'ty.fieldTitle': { my: 'အကွက်အလိုက် Typography & Styling', en: 'Field Typography & Styling' },
  'ty.fontSize': { my: 'စာလုံးအရွယ်', en: 'Font Size' },
  'ty.szSmall': { my: 'သေး', en: 'Small' },
  'ty.szMedium': { my: 'အလယ်', en: 'Medium' },
  'ty.szLarge': { my: 'အကြီး', en: 'Large' },
  'ty.szCustom': { my: 'စိတ်ကြိုက်', en: 'Custom' },
  'ty.fontWeight': { my: 'စာလုံးအထူ', en: 'Font Weight' },
  'ty.wRegular': { my: 'ပုံမှန်', en: 'Regular' },
  'ty.wMedium': { my: 'အလယ်', en: 'Medium' },
  'ty.wSemibold': { my: 'တစ်ဝက်ထူ', en: 'Semi Bold' },
  'ty.wBold': { my: 'ထူ', en: 'Bold' },
  'ty.fontStyle': { my: 'စာလုံးပုံစံ', en: 'Font Style' },
  'ty.stNormal': { my: 'ပုံမှန်', en: 'Normal' },
  'ty.stItalic': { my: 'စောင်း', en: 'Italic' },
  'ty.save': { my: 'Typography သိမ်းမယ်', en: 'Save Typography' },
  'ty.tabCode': { my: 'ဗောက်ချာကုဒ်', en: 'Voucher Code' },
  'ty.tabProfile': { my: 'Profile အမည်', en: 'Profile Name' },
  'ty.tabPeriod': { my: 'သက်တမ်း', en: 'Period' },
  'ty.tabQuota': { my: 'ဒေတာ', en: 'Quota' },
  'ty.tabDatetime': { my: 'ရက်စွဲ/အချိန်', en: 'Date/Time' },
  'ty.tabHeader': { my: 'ခေါင်းစဉ်', en: 'Header' },
  'ty.auto': { my: 'Auto', en: 'Auto' },
  'toast.styleSaved': { my: 'ပရင့်စတိုင် သိမ်းပြီးပါပြီ', en: 'Print style saved' },
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
  'p.bt': { my: 'ဘလူးတုသ် ပရင်တာ', en: 'Bluetooth Printer' },
  'p.btIdle': { my: 'ပရင်တာမချိတ်ရသေးပါ', en: 'No printer connected' },
  'p.btScan': { my: 'စက်ရှာမယ်', en: 'Scan' },
  'p.btScanning': { my: 'ရှာနေတယ်…', en: 'Scanning…' },
  'p.btDisconnect': { my: 'ဖြုတ်မယ်', en: 'Disconnect' },
  'p.btPrint': { my: 'ဘလူးတုသ်နဲ့ထုတ်မယ်', en: 'Print via Bluetooth' },
  'p.layoutBtn': { my: 'Print Layout', en: 'Print Layout' },
  'p.typoBtn': { my: 'Typography', en: 'Typography' },
  'pp.title': { my: 'ပရင့်ထုတ်နေသည်', en: 'Printing' },
  'pp.close': { my: 'ပိတ်မယ်', en: 'Close' },
  'pp.printing': { my: 'ထုတ်နေသည် {c} / {t}', en: 'Printing {c} / {t}' },
  'pp.done': { my: '✓ {n} ခု ထုတ်ပြီးပြီ', en: '✓ Printed {n}' },
  'pp.stopped': { my: '⚠ ပရင့်တာ ရပ်သွားသည် — ထုတ်ပြီးသား {c} / {t}', en: '⚠ Print stopped — printed {c} / {t}' },
  'pp.stoppedAt': { my: 'ရပ်သွားတဲ့ voucher: {code}', en: 'Stopped at voucher: {code}' },
  'pp.sPrinted': { my: 'ထုတ်ပြီးပြီ', en: 'Printed' },
  'pp.sPrinting': { my: 'ထုတ်နေသည်…', en: 'Printing…' },
  'pp.sQueued': { my: 'စောင့်နေသည်', en: 'Queued' },
  'pp.sStopped': { my: 'ဒီမှာ ရပ်သွားသည်', en: 'Stopped here' },
  'p.btTest': { my: 'စမ်းထုတ်မယ်', en: 'Test print' },
  'p.btNoDevices': { my: 'စက်မတွေ့သေးပါ — Scan နှိပ်ပါ', en: 'No devices yet — tap Scan' },
  'p.btNeedApk': { my: 'ဘလူးတုသ်ပရင့်က Android app သီးသန့်ပါ', en: 'Bluetooth printing is Android-app only' },
  'p.btNoQueue': { my: 'Print Queue ထဲမှာ voucher မရှိသေးပါ', en: 'Print Queue is empty' },
  'p.btAuto': { my: 'နောက်ဆုံးသုံးခဲ့တဲ့ပရင်တာကို အော်တိုချိတ်မယ်', en: 'Auto-connect last printer' },
  'p.btAutoTrying': { my: 'အော်တိုချိတ်နေတယ်…', en: 'Auto-connecting…' },
  'm.title': { my: 'နောက်ထပ်', en: 'More' },
  'm.accounts': { my: 'Auth Accounts', en: 'Auth Accounts' },
  'm.accountsSub': { my: 'အသုံးပြုသူများ', en: 'Users' },
  'm.usergroups': { my: 'User Groups', en: 'User Groups' },
  'm.usergroupsSub': { my: 'အုပ်စုများ', en: 'Groups' },
  'm.devices': { my: 'Devices', en: 'Devices' },
  'm.devicesSub': { my: 'စက်များ', en: 'Devices' },
  'm.clients': { my: 'Online Clients', en: 'Online Clients' },
  'm.history': { my: 'History', en: 'History' },
  'm.historySub': { my: 'ဝင်ထွက်မှတ်တမ်း', en: 'Auth history' },
  'mh.title': { my: 'ဝင်ထွက်မှတ်တမ်း', en: 'Client History' },
  'mh.empty': { my: 'မှတ်တမ်းမရှိပါ', en: 'No history' },
  'mh.needSso': { my: 'SSO login လိုအပ်သည်', en: 'SSO login required' },
  'm.clientsSub': { my: 'ချိတ်ထားသူများ', en: 'Connected' },
  'm.networks': { my: 'Networks', en: 'Networks' },
  'm.networksSub': { my: 'ကွန်ရက်များ', en: 'Networks' },
  'm.sales': { my: 'ရောင်းရငွေ', en: 'Sales' },
  'm.salesSub': { my: 'ရောင်းရငွေစာရင်း', en: 'Sales ledger' },
  'sl.title': { my: 'ရောင်းရငွေစာရင်း', en: 'Sales ledger' },
  'sl.revenue': { my: 'ဝင်ငွေ (ကျပ်)', en: 'Revenue (Ks)' },
  'sl.pkg': { my: 'ပက်ကေ့ခ်ျ', en: 'Package' },
  'sl.qty': { my: 'အရေအတွက်', en: 'Qty' },
  'sl.price': { my: 'တစ်စောင်ဈေး (ကျပ်)', en: 'Price each (Ks)' },
  'sl.all': { my: 'အားလုံး', en: 'All' },
  'sl.today': { my: 'ဒီနေ့', en: 'Today' },
  'sl.week': { my: '၇ ရက်', en: '7 days' },
  'sl.custom': { my: 'စိတ်ကြိုက်ရက်', en: 'Custom' },
  'sl.from': { my: 'မှ', en: 'From' },
  'sl.to': { my: 'ထိ', en: 'To' },
  'sl.autoTitle': { my: 'ဗောက်ချာအခြေအနေ · အလိုအလျောက်တွက်ချက်မှု', en: 'Auto · from voucher status' },
  'sl.used': { my: 'သုံးပြီး', en: 'Used' },
  'sl.expired': { my: 'သက်တမ်းကုန်', en: 'Expired' },
  'sl.soldAuto': { my: 'ရောင်းပြီး (စောင်)', en: 'Sold (vouchers)' },
  'sl.refreshV': { my: 'ဗောက်ချာစာရင်း refresh', en: 'Refresh vouchers' },
  'sl.autoNote': { my: 'used နဲ့ သက်တမ်းကုန် ဗောက်ချာတွေကို ရောင်းပြီးအဖြစ် တွက်ပါတယ်။ ဈေးနှုန်းကို ပက်ကေ့ခ်ျစာရင်းက ယူပါတယ်။', en: 'Used + expired vouchers count as sold; prices come from the package list.' },
  'sl.noneAuto': { my: 'ဒီကာလမှာ ရောင်းပြီးဗောက်ချာ မရှိပါ။', en: 'No sold vouchers in this period.' },
  'sl.unknownPkg': { my: 'အမည်မသိ', en: 'Unknown' },
  'sl.dateNote': { my: 'ရက်စွဲအခြေခံ: ဗောက်ချာထုတ်လုပ်ချိန် (createTime) — သုံးပြီးချိန်က မိနစ်အရေအတွက်ဖြစ်လို့ ရက်စွဲအဖြစ် သုံးမရပါ။', en: 'Date basis: voucher creation time (usedTime is a duration in minutes, not a date).' },
  'sl.day1': { my: 'နောက်ဆုံး ၁ ရက်', en: 'Last 1 Day' },
  'sl.today': { my: 'ဒီနေ့', en: 'Today' },
  'sl.yday': { my: 'မနေ့က', en: 'Yesterday' },
  'sl.day7': { my: 'နောက်ဆုံး ၇ ရက်', en: 'Last 7 Days' },
  'sl.day30': { my: 'နောက်ဆုံး ၃၀ ရက်', en: 'Last 30 Days' },
  'sl.no': { my: 'စဉ်', en: 'No.' },
  'sl.profile': { my: 'Profile အမည်', en: 'Profile Name' },
  'sl.made': { my: 'ထုတ်လုပ်ပြီး', en: 'Quantity' },
  'sl.activated': { my: 'စတင်သုံးစွဲသူ', en: 'Activated Accounts' },
  'sl.totalPrice': { my: 'စုစုပေါင်းတန်ဖိုး', en: 'Total Price' },
  'sl.total': { my: 'စုစုပေါင်း', en: 'Total' },
  'sl.dateNote2': { my: 'ရက်စွဲအခြေခံ: ကတ်စတင်သုံးစွဲသည့်ရက် (သက်တမ်းကုန်ချိန် − သက်တမ်းကာလ) — ထုတ်လုပ်သည့်ရက်မဟုတ်ပါ။ တွက်ချက်၍မရသောကတ်များကိုသာ ထုတ်လုပ်သည့်ရက်ဖြင့် ထည့်သွင်းထားပါတယ်။', en: 'Date basis: the day each voucher was first used (expiry time − validity period), not the creation day. Vouchers where this cannot be derived fall back to creation time.' },
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
  'md.action': { my: 'လုပ်ဆောင်ချက်', en: 'Action' },
  'md.reboot': { my: 'ပြန်ဖွင့်', en: 'Reboot' },
  'md.rebootConfirm': { my: '{name} ကို ပြန်လည်စတင်မှာလား? စက်ခနရပ်မည်။', en: 'Reboot {name}? The device will briefly go offline.' },
  'md.rebooting': { my: 'ပြန်လည်စတင်ခိုင်းနေပါသည်…', en: 'Sending reboot…' },
  'md.rebootOk': { my: 'ပြန်လည်စတင်ခိုင်းပြီးပါပြီ', en: 'Reboot command sent' },
  'md.rebootFail': { my: 'ပြန်ဖွင့်မရပါ', en: 'Reboot failed' },
  'md.total': { my: 'စုစုပေါင်း {n} လုံး', en: 'Total {n} devices' },
  'md.partial': { my: 'အချို့စက်များ မရသေးပါ', en: 'Some device types failed to load' },
  'md.needSsoHint': { my: 'Switch/Gateway အပြည့်အစုံမြင်ရရန် Settings မှာ Ruijie အကောင့်ဝင်ပါ', en: 'Log in to your Ruijie account in Settings to see Switch/Gateway' },
  'md.needSso': { my: 'ပြန်ဖွင့်ဖို့အတွက် Ruijie အကောင့်နဲ့ ဝင်ထားဖို့လိုပါတယ် (ဆက်တင် → Ruijie အကောင့်)', en: 'Reboot needs Ruijie account login (Settings → Ruijie account)' },
  'mc.title': { my: 'Online Clients', en: 'Online Clients' },
  'mc.detail': { my: 'အသေးစိတ်', en: 'Details' },
  'mc.none': { my: 'Online client မရှိပါ', en: 'No online clients' },
  'mc.total': { my: 'စုစုပေါင်း {n}', en: '{n} total' },
  'mc.gwMerged': { my: 'gateway မှ {n} ခု ထပ်ဖြည့်', en: '{n} merged from gateway' },
  'mc.mac': { my: 'MAC / IP', en: 'MAC / IP' },
  'mc.ssid': { my: 'SSID', en: 'SSID' },
  'mc.ap': { my: 'AP', en: 'AP' },
  'mc.traffic': { my: 'ဒေတာ', en: 'Traffic' },
  'mc.device': { my: 'စက်', en: 'Device' },
  'mc.fAll': { my: 'အားလုံး', en: 'All' },
  'mc.fActive': { my: 'သုံးနေဆဲ', en: 'Active' },
  'mc.fTimeUp': { my: 'အချိန်ကုန်', en: 'Time up' },
  'mc.fDataUp': { my: 'ဒေတာပြည့်', en: 'Data up' },
  'mc.fNoAuth': { my: 'Portal မဝင်', en: 'No portal' },
  'mc.fUnknown': { my: 'အခြား', en: 'Other' },
  'mc.flag.suspicious': { my: 'သံသယရှိ — စစ်ဆေးရန်', en: 'Unattributed, active — review' },
  'mc.flag.sticky': { my: 'ကုန်ပြီးသားဆက်ချိတ်နေ', en: 'Quota spent, still online' },
  'ac.title': { my: 'AP ချိတ်ဆက်သူများ', en: 'AP clients' },
  'ac.none': { my: 'ချိတ်ဆက်ထားသူမရှိပါ', en: 'No connected clients' },
  'ac.total': { my: 'စုစုပေါင်း {n} ယောက်', en: '{n} clients' },
  'ac.voucherN': { my: 'voucher နဲ့ {n} ယောက်', en: '{n} on vouchers' },
  'ac.voucher': { my: 'Voucher', en: 'Voucher' },
  'ac.since': { my: 'စချိတ်ချိန်', en: 'Connected at' },
  'ac.duration': { my: 'ကြာချိန်', en: 'Duration' },
  'ac.signal': { my: 'ဆစ်ဂနယ်', en: 'Signal' },
  'ac.ssid': { my: 'SSID', en: 'SSID' },
  'ac.names': { my: 'အမည်', en: 'Names' },
  'ac.srcPortal': { my: 'Portal', en: 'Portal' },
  'ac.srcApi': { my: 'Cloud API', en: 'Cloud API' },
  'ac.srcGateway': { my: 'Gateway', en: 'Gateway' },
  'ac.needSso': { my: 'Voucher မြင်ရဖို့ Settings → Ruijie အကောင့်မှာ login ဝင်ပါ', en: 'Log in via Settings → Ruijie account to see voucher info' },
  'ac.portalErr': { my: 'Portal ခေါ်မရပါ', en: 'Portal request failed' },
  'ac.portalNoMatch': { my: 'ဒီ AP အတွက် portal မှာ client မတွေ့ပါ', en: 'Portal returned no clients for this AP' },
  'ac.portalNoAcct': { my: 'Portal client တွေမှာ auth account မပါပါ — voucher သုံးတဲ့ SSID မဟုတ်နိုင်ပါ', en: 'Portal clients carry no auth account — SSID may not use voucher auth' },
  'ac.noAuthCfg': { my: 'ဒီ project မှာ auth (voucher/portal) မသတ်မှတ်ထားပါ', en: 'No auth (voucher/portal) configured on this project' },
  'ac.roamTitle': { my: 'AP ပြောင်းသွားမှု', en: 'Roaming' },
  'ac.roamFrom': { my: 'ပြောင်းလာတဲ့ AP', en: 'Roamed from' },
  'ac.roamNone': { my: 'roam မှတ်တမ်းမရှိပါ', en: 'No roam history' },
  'ac.tapRoam': { my: 'roam မှတ်တမ်းကြည့်ရန် client ကို နှိပ်ပါ', en: 'Tap a client to see roam history' },
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
  's.themeLight': { my: 'Premium', en: 'Premium' },
  's.themeDark': { my: 'Dark', en: 'Dark' },
  's.themeGlass': { my: 'Liquid Glass', en: 'Liquid Glass' },
  's.themeNeo': { my: 'Neumorphism', en: 'Neumorphism' },
  's.themeClay': { my: 'Claymorphism', en: 'Claymorphism' },
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
  'fmt.sec': { my: ' စက္ကန့်', en: 's' },
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
  /* User decision (2026-09-28): the app ALWAYS starts in English —
   * including the pre-login connect screen. A manual language switch
   * still works for the session; the next startup is English again. */
  LANG = 'en';
  try { localStorage.setItem('rv-lang', 'en'); } catch (e) {}
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
  if (!$('layout-modal').classList.contains('hidden')) renderLayoutModal();
  if (!$('typo-modal').classList.contains('hidden')) renderTypoModal();
  if (S.account) loadAccountInfo();
  if (S.moreFn) S.moreFn();
}

/* ── helpers ── */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* v1.5.54: HH:MM for last-fetched timestamps */
const fmtTime = ts => {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  return isNaN(d) ? String(ts) : d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDate = ts => {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  // v1.5.14: 12-hour clock (02:45 PM) per user request
  return isNaN(d) ? String(ts) : d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
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
/* Smart duration for remaining time: "18h 13m", "2d 3h" — built from cloud minutes. */
const fmtRemain = mins => {
  if (mins === null || mins === undefined || mins === '') return '—';
  mins = Math.round(Number(mins));
  if (!isFinite(mins)) return '—';
  mins = Math.max(0, mins);
  if (mins === 0) return '0' + t('fmt.min');
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const p = [];
  if (d) p.push(d + t('fmt.day'));
  if (h) p.push(h + t('fmt.hour'));
  if (m || !p.length) p.push(m + t('fmt.min'));
  return p.join(' ');
};
/* Live ticking variant with seconds: "18h 12m 45s". Driven by the local clock
   from the cloud snapshot — time always passes at 1s/s, so this is exact. */
const fmtRemainSecs = secs => {
  secs = Math.max(0, Math.round(Number(secs)));
  if (!isFinite(secs)) return '—';
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600),
        m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const p = [];
  if (d) p.push(d + t('fmt.day'));
  if (h || d) p.push(h + t('fmt.hour'));
  p.push(m + t('fmt.min'));
  p.push(s + t('fmt.sec'));
  return p.join(' ');
};
const remQuotaTxt = v => {
  if (v.quota === null || v.quota === undefined || v.quota === '') return '—';
  const q = Number(v.quota);
  if (q <= 0) return t('fmt.unlimited');
  if (v.usedQuota === null || v.usedQuota === undefined || v.usedQuota === '') return '—';
  const rem = q - Number(v.usedQuota);
  // v1.5.14: fully used quota shows "0 GB", never "unlimited"
  if (rem <= 0) return q >= 1024 ? '0 GB' : '0 MB';
  return fmtQuota(rem);
};
/* Used quota: 0 means nothing used yet → "0 MB", not "unlimited" (v1.5.14). */
const fmtUsedQuota = mb => {
  if (mb === null || mb === undefined || mb === '') return '—';
  mb = Number(mb);
  if (!isFinite(mb) || mb < 0) return '—';
  return mb === 0 ? '0 MB' : fmtQuota(mb);
};
const remTimeTxt = v => {
  if (v.usedTime === null || v.usedTime === undefined || v.usedTime === '') return '—';
  const tp = Number(v.timePeriod);
  if (!tp) return '—';
  return fmtRemain(tp - Number(v.usedTime));
};
const statusTxt = s => t('status.' + s) || String(s);
/* v1.5.53: remaining-resource info for voucher rows.
   Data vouchers: remaining = quota - usedQuota (MB).
   Time vouchers: remaining = timePeriod - usedTime (minutes).
   Returns {pct, txt} or null → null means "original row" (no fill):
   unused, fully consumed, or usage data missing (never guessed). */
function remainInfo(v) {
  const q = Number(v && v.quota) || 0;
  if (q > 0) {
    if (v.usedQuota === null || v.usedQuota === undefined || v.usedQuota === '') return null;
    const used = Number(v.usedQuota);
    if (!isFinite(used) || used <= 0) return null;
    const rem = q - used;
    if (rem <= 0) return null;
    return { pct: Math.max(0, Math.min(100, (rem / q) * 100)), txt: fmtQuota(rem) };
  }
  const p = Number(v && v.timePeriod) || 0;
  if (p > 0) {
    if (v.usedTime === null || v.usedTime === undefined || v.usedTime === '') return null;
    const used = Number(v.usedTime);
    if (!isFinite(used) || used <= 0) return null;
    const rem = p - used;
    if (rem <= 0) return null;
    return { pct: Math.max(0, Math.min(100, (rem / p) * 100)), txt: fmtRemain(rem) };
  }
  return null;
}
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

/* ── theme (light/dark/glass/neo/clay) ── */
const THEMES = ['light', 'dark', 'glass', 'neo', 'clay'];
const THEME_META = { light: '#EDF1F8', dark: '#000000', glass: '#141A3D', neo: '#E0E5EC', clay: '#E9EDF5' };
function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('rv-theme', theme); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[theme] || '#EDF1F8';
  document.querySelectorAll('#theme-grid .theme-opt').forEach(b =>
    b.classList.toggle('active', b.dataset.themeOpt === theme));
}
function initTheme() {
  let theme = null;
  try { theme = localStorage.getItem('rv-theme'); } catch (e) {}
  if (!THEMES.includes(theme)) {
    theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  applyTheme(theme);
}

/* ── iOS sheet close with animation ── */
function closeModal(id) {
  const m = $(id);
  if (!m || m.classList.contains('hidden')) return;
  if (id === 'modal') stopVoucherLive();
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
  moreStack: [],      // v1.5.34: more sub-page renderers for system-back walking
  _moreRestoring: false,
  sessionGenCodes: new Set(), // v1.5.54: codes generated in THIS session only (memory-only).
                              // Bulk delete may only touch these — never existing/old vouchers.
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
  syncMonitorConfig(); // v1.5.52: push cloud creds to the bg offline monitor
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
  const pad = $(id + '-pad');
  if (pad) pad.classList.remove('hidden');
}

/* v1.5.40: startup sync — refresh the voucher map from Cloud (fresh
 * voucher statuses instead of session-stale) and warm the portal-client
 * voucher cache, so the China-AP client views show vouchers immediately
 * without opening Online Clients first. Fire-and-forget: silent,
 * best-effort, never blocks or breaks startup. */
async function startupSync() {
  try {
    /* Gateway auto-connect (user-requested): once logged in, the app stays
     * connected — re-connect silently in the background on every startup
     * with the remembered password, unless explicitly disconnected. */
    if (typeof GwApi !== 'undefined' && typeof hasGw === 'function' && hasGw()) {
      GwApi.ensureLogin().then(ok => { if (ok) { try { refreshGwCard(); } catch (e) {} } }).catch(() => {});
    }
    const pid = Number(S.projectId);
    if (!pid) return;
    try { await apClientVoucherMap(pid, true); } catch (e) { /* offline: keep last-known map */ }
    if (typeof Api !== 'undefined' && Api.ssoLoggedIn && Api.ssoLoggedIn()) {
      try {
        let hasAuth = null;
        try { hasAuth = await Api.portalAuthStatus(pid); } catch (e) { hasAuth = null; }
        const list = await Api.portalClients(pid, { pageSize: 1000, authCount: hasAuth !== false, connectType: '' });
        try { cachePortalVouchers(list || []); } catch (e) { /* cache is best-effort */ }
      } catch (e) { /* portal sync optional */ }
    }
  } catch (e) { /* never break startup */ }
}

/* ═══════════ APP SHELL ═══════════ */
function enterApp() {
  /* User-requested: the app always starts in English. A manual language
   * switch still works for the session; the next startup is English again. */
  try { setLang('en'); } catch (e) {}
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
  loadProjects().then(() => { switchView('view-vouchers', false); try { history.replaceState({ view: 'view-vouchers' }, ''); } catch (e) {} S.currentView = 'view-vouchers'; startupSync(); });
  // Vouchers start immediately with the stored project (in parallel with
  // the project list) instead of waiting for it — the list reconciles after.
  if (S.projectId) loadVouchers();
  loadAccountInfo();
  // v1.5.52: one-shot startup SSO auto-login (saved creds + auto-login on,
  // no portal session -> open the login dialog once; it auto-submits).
  setTimeout(maybeSsoAutoLogin, 1200);
}

function switchView(id, push) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(tb => tb.classList.toggle('active', tb.dataset.view === id));
  if (id === 'view-vouchers' && !S._vouchersLoading) {
    const stale = !S.vouchersFetchedAt || Date.now() - S.vouchersFetchedAt > 30000;
    if (S.vouchers.length === 0) loadVouchers();
    // v1.5.57: coming back with live stats on and data older than 30s → silent refresh
    else if (stale && getLiveStats().enabled) loadVouchers({ silent: true });
  }
  if (id === 'view-generate') { ensurePackages(); renderRecentGen(); btCacheState(); renderPrinterDots(); }
  if (id === 'view-printer') { renderQueue(); btCacheState(); renderPrinterDots(); }
  if (id === 'view-settings') fillSettings();
  // SPA back-button support: one back press walks views instead of killing the app.
  if (push !== false) {
    // v1.5.48: re-entering the More tab while a sub-page is open seeds the
    // More-menu level first and tags the entry with the real sub-page depth —
    // so system back walks sub-page → More menu → previous tab instead of
    // jumping to whatever tab was open before.
    if (id === 'view-more' && S.moreStack.length) {
      try { history.pushState({ view: 'view-more', moreDepth: 0 }, ''); } catch (e) {}
    }
    const st = { view: id };
    if (id === 'view-more') st.moreDepth = S.moreStack.length;
    try { history.pushState(st, ''); } catch (e) {}
  }
  S.currentView = id;
  try { moveLiqBlob(); } catch (e) {}
}

/* ── Liquid navbar: slide the glowing blob behind the active tab's icon ── */
function moveLiqBlob() {
  const bar = $('tabbar'), blob = $('liq-blob');
  if (!bar || !blob) return;
  const active = bar.querySelector('.tab.active') || bar.querySelector('.tab');
  if (!active) return;
  const icon = active.querySelector('.ic') || active;
  const br = bar.getBoundingClientRect(), ir = icon.getBoundingClientRect();
  if (!br.width || !ir.width) return;
  const bw = blob.offsetWidth || 56, bh = blob.offsetHeight || 56;
  const x = ir.left - br.left + ir.width / 2 - bw / 2;
  const y = ir.top - br.top + ir.height / 2 - bh / 2;
  blob.style.setProperty('--liq', active.dataset.liq || '#3b82f6');
  window.__liqColor = active.dataset.liq || '#3b82f6';
  blob.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  blob.style.opacity = '1';
}
window.addEventListener('resize', () => { try { moveLiqBlob(); } catch (e) {} });

// System back button: close an open modal first, else let popstate walk the view stack.
/* v1.5.48 — whole-element liquid wobble: the touched button/card/voucher
   row itself squishes and wobbles like jelly, pivoting at the tap point. */
function initLiquidWobble() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  /* v1.5.49: .card is NOT a wobble target — tapping table rows / empty areas
   * inside a page card used to fall through closest() to the whole card and
   * shake the entire page. Only the actually-touched icon/function element
   * (button, tab, voucher-row, chip, menu-item, link) wobbles now. */
  const SEL = 'button,.tab,.voucher-row,.menu-item,.chip,a,[data-wobble]';
  document.addEventListener('pointerdown', e => {
    if (e.clientX == null || e.clientY == null || !e.target || !e.target.closest) return;
    const el = e.target.closest(SEL);
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.transformOrigin = Math.round(e.clientX - r.left) + 'px ' + Math.round(e.clientY - r.top) + 'px';
    el.classList.remove('liq-wobble');
    void el.offsetWidth; /* restart the wobble when tapped again mid-animation */
    el.classList.add('liq-wobble');
  }, { passive: true });
  document.addEventListener('animationend', e => {
    if (e.animationName === 'liqWobble' && e.target && e.target.classList) {
      e.target.classList.remove('liq-wobble');
    }
  });
}
/* v1.5.55 — tabbar press-drag: press and slide along the bottom bar and the
   tab under the finger wobbles like liquid, the glow blob follows, and a
   small preview of that page floats above the bar. Release to enter the
   page; a plain tap keeps the normal click behavior (no double switch). */
function initTabbarDrag() {
  const bar = $('tabbar');
  if (!bar || bar._dragInit) return;
  bar._dragInit = true;
  let downTab = null, downX = 0, downY = 0, curTab = null, dragging = false, previewEl = null, tabCache = null;
  const tabs = () => Array.from(bar.querySelectorAll('.tab'));
  // Cache blob targets once per press: no getBoundingClientRect() on every
  // pointermove (layout thrash), so the blob can track the finger 1:1.
  const cacheTabs = () => {
    const blob = $('liq-blob');
    const br = bar.getBoundingClientRect();
    const bw = (blob && blob.offsetWidth) || 56, bh = (blob && blob.offsetHeight) || 56;
    tabCache = tabs().map(tb => {
      const r = tb.getBoundingClientRect();
      const ir = (tb.querySelector('.ic') || tb).getBoundingClientRect();
      return {
        tab: tb, left: r.left, right: r.right,
        bx: ir.left - br.left + ir.width / 2 - bw / 2,
        by: ir.top - br.top + ir.height / 2 - bh / 2,
      };
    });
  };
  const tabFromX = x => {
    const c = (tabCache || []).find(c => x >= c.left && x <= c.right);
    return c ? c.tab : null;
  };
  const wobbleTab = el => {
    if (!el || !el.classList) return;
    el.classList.remove('liq-wobble');
    void el.offsetWidth;
    el.classList.add('liq-wobble');
  };
  const blobTo = tab => {
    const blob = $('liq-blob');
    if (!blob || !tab) return;
    const c = (tabCache || []).find(c => c.tab === tab);
    if (!c) return;
    // Kill the .5s spring while dragging: the blob must sit exactly under
    // the finger, not chase half a second behind it.
    blob.classList.add('dragging');
    blob.style.setProperty('--liq', tab.dataset.liq || '#3b82f6');
    blob.style.transform = 'translate(' + c.bx + 'px,' + c.by + 'px)';
    blob.style.opacity = '1';
  };
  const hidePreview = () => { if (previewEl) { previewEl.remove(); previewEl = null; } };
  const showPreview = tab => {
    // Reuse one element across tab changes: no repeated pop animation, so
    // the preview follows the finger instead of restarting every time.
    if (!previewEl) {
      previewEl = document.createElement('div');
      previewEl.className = 'tab-preview';
      document.body.appendChild(previewEl);
    } else {
      previewEl.innerHTML = '';
    }
    const svg = tab.querySelector('svg');
    if (svg) previewEl.appendChild(svg.cloneNode(true));
    const spans = tab.querySelectorAll('span');
    const lbl = document.createElement('span');
    lbl.textContent = spans.length ? spans[spans.length - 1].textContent.trim() : '';
    previewEl.appendChild(lbl);
  };
  const movePreview = x => {
    if (!previewEl) return;
    const br = bar.getBoundingClientRect();
    previewEl.style.left = x + 'px';
    previewEl.style.bottom = ((window.innerHeight || 800) - br.top + 10) + 'px';
  };
  const setCur = (tab, x) => {
    if (tab === curTab) { if (x != null) movePreview(x); return; }
    curTab = tab;
    if (tab) { wobbleTab(tab); blobTo(tab); showPreview(tab); if (x != null) movePreview(x); }
    else hidePreview();
  };
  bar.addEventListener('pointerdown', e => {
    const tab = e.target && e.target.closest ? e.target.closest('.tab') : null;
    if (!tab) return;
    downTab = tab; downX = e.clientX || 0; downY = e.clientY || 0;
    curTab = tab; dragging = false;
    cacheTabs();
  });
  window.addEventListener('pointermove', e => {
    if (!downTab || e.clientX == null) return;
    if (!dragging && Math.hypot(e.clientX - downX, e.clientY - downY) > 12) dragging = true;
    if (!dragging) return;
    setCur(tabFromX(e.clientX), e.clientX);
  }, { passive: true });
  const end = () => {
    if (!downTab) return;
    const wasDrag = dragging, target = curTab, start = downTab;
    dragging = false; downTab = null; curTab = null; tabCache = null;
    hidePreview();
    const blob = $('liq-blob');
    if (blob) blob.classList.remove('dragging'); // restore the spring for the snap-back
    try { moveLiqBlob(); } catch (err) {}
    // Dragged to a different tab: switch now. The browser dispatches the
    // click to the common ancestor (nav), not to a tab button, so the
    // normal tap handler can't double-fire. Plain tap: do nothing here.
    if (wasDrag && target && target !== start && target.dataset.view) {
      switchView(target.dataset.view);
    }
  };
  window.addEventListener('pointerup', end, { passive: true });
  window.addEventListener('pointercancel', () => {
    dragging = false; downTab = null; curTab = null; tabCache = null;
    hidePreview();
    const blob = $('liq-blob');
    if (blob) blob.classList.remove('dragging');
    try { moveLiqBlob(); } catch (err) {}
  }, { passive: true });
}
function anyModalOpen() {
  return !!document.querySelector('.modal:not(.hidden)');
}
function closeAnyModal() {
  document.querySelectorAll('.modal:not(.hidden)').forEach(m => closeModal(m.id));
}
window.addEventListener('popstate', (e) => {
  if (anyModalOpen()) {
    closeAnyModal();
    // restore the current entry so the next back press keeps working
    // (preserve More depth so back keeps walking the sub-page stack)
    try { history.pushState({ view: S.currentView || 'view-vouchers', moreDepth: S.moreStack.length || undefined }, ''); } catch (err) {}
    return;
  }
  const st = e.state || {};
  const v = st.view;
  // v1.5.34: system back inside More walks the sub-page stack instead of
  // jumping to the previously-open tab.
  if (v === 'view-more') {
    const md = Number(st.moreDepth || 0);
    S._moreRestoring = true;
    try {
      S.moreStack.length = Math.min(md, S.moreStack.length);
      if (md > 0 && S.moreStack[md - 1]) S.moreStack[md - 1]();
      else { S.moreStack = []; moreHome(); }
    } finally { S._moreRestoring = false; }
    /* show the More view itself (popstate may arrive while another tab is
     * visible, e.g. back from Vouchers into a More sub-page) */
    switchView('view-more', false);
    return;
  }
  if (v && $(v)) switchView(v, false);
});

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
  const st0 = Store.load();
  // Optimistic: use the stored project immediately so vouchers can start
  // loading in parallel with the group-tree request (startup ~5s → ~1.5s).
  if (st0.projectId && !S.projectId) S.projectId = st0.projectId;
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
  syncIosPickerBtn(sel);
  const st = Store.load();
  const validId = st.projectId && S.projects.some(p => p.id === st.projectId) ? st.projectId : (S.projects[0] && S.projects[0].id);
  if (validId !== S.projectId) {
    // Stored project is gone — switch and reload vouchers for the right one.
    S.projectId = validId;
    S.vouchers = []; S.packages = [];
    if (S.projectId) { sel.value = S.projectId; loadVouchers(); }
  } else if (S.projectId) {
    sel.value = S.projectId;
  }
  syncIosPickerBtn(sel); // v1.5.55: programmatic .value= fires no change event — sync the sheet label
  Store.save({ projectId: S.projectId });
  syncGenUserGroup();
  syncMonitorConfig();
}

function onProjectChange() {
  S.projectId = $('project-select').value;
  Store.save({ projectId: S.projectId });
  syncGenUserGroup();
  syncMonitorConfig();
  S.vouchers = [];
  S.packages = [];
  loadVouchers();
}

/* ═══════════ VOUCHERS ═══════════ */
async function loadVouchers(opts) {
  opts = opts || {};
  if (!S.projectId) return;
  // Generation guard: a newer load (e.g. project switch mid-flight)
  // supersedes this one — stale results are discarded, never rendered.
  const gen = (S._voucherGen = (S._voucherGen || 0) + 1);
  S._vouchersLoading = true;
  const listEl = $('voucher-list');
  if (!opts.silent) {
    $('voucher-count').textContent = '';
    // iOS-style skeleton shimmer
    listEl.innerHTML = Array.from({ length: 6 }, () =>
      '<div class="skel"><div class="bar" style="width:52%"></div><div class="bar" style="width:34%"></div></div>').join('');
  }
  try {
    const all = await Api.voucherListAll(S.projectId, (done, total) => {
      if (!opts.silent && gen === S._voucherGen) $('voucher-count').textContent = `${t('v.loading')} ${done}/${total}`;
    });
    if (gen !== S._voucherGen) return; // superseded — discard
    S.vouchers = all;
    S.vouchersFetchedAt = Date.now(); // v1.5.54: last-fetched timestamp
    // newest first
    S.vouchers.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    renderVouchers();
  } catch (e) {
    if (gen !== S._voucherGen) return; // superseded — discard
    // v1.5.57: silent (live-stats) failures keep the old list — never wipe it
    if (!opts.silent) listEl.innerHTML = `<div class="empty"><div class="big">${ic('alert', 'xl')}</div><p><b>${t('v.loadFail')}</b></p><p class="small">${esc(e.message)}</p></div>`;
  } finally {
    if (gen === S._voucherGen) S._vouchersLoading = false;
  }
}

/* ═══════════ v1.5.57: live voucher stats ═══════════
   The four stat cards (Unused / In use / Expired / Total) stay fresh without
   a manual pull: while the Vouchers page is open, the voucher list is
   re-fetched on a timer (default 60s) in silent mode — no skeleton flash,
   the old list is never wiped on failure — and the animated numbers tween
   to the new values. Pauses when the tab/app is hidden; never overlaps an
   in-flight load. */
const LIVE_SECS_OPTIONS = [30, 60, 120, 300];
function getLiveStats() {
  let cfg = {};
  try { cfg = Store.load().liveStats || {}; } catch (e) {}
  const secs = LIVE_SECS_OPTIONS.includes(+cfg.secs) ? +cfg.secs : 60;
  return { enabled: cfg.enabled !== false, secs };
}
function setLiveStats(patch) {
  const cur = getLiveStats();
  const next = {
    enabled: patch.enabled !== undefined ? !!patch.enabled : cur.enabled,
    secs: LIVE_SECS_OPTIONS.includes(+patch.secs) ? +patch.secs : cur.secs,
  };
  try { Store.save({ liveStats: next }); } catch (e) {}
  return next;
}
let _liveTimer = null;
function stopLiveStats() { if (_liveTimer) { clearInterval(_liveTimer); _liveTimer = null; } }
function restartLiveStats(force) {
  stopLiveStats();
  const cfg = getLiveStats();
  if (!cfg.enabled) return;
  _liveTimer = setInterval(() => liveStatsTick(false), cfg.secs * 1000);
  if (force) liveStatsTick(true);
}
async function liveStatsTick(force) {
  try {
    if (!force && document.hidden) return;                 // app in background — pause
    if (S._vouchersLoading) return;                        // never overlap a load
    if (!S.projectId) return;
    if (S.currentView && S.currentView !== 'view-vouchers') return; // stats page only
    if (!force && S.vouchersFetchedAt && Date.now() - S.vouchersFetchedAt < 15000) return; // recently fetched
    await loadVouchers({ silent: true });
  } catch (e) { /* a silent tick never breaks the UI */ }
}

function filteredVouchers() {
  const q = S.vFilter.trim().toLowerCase();
  return S.vouchers.filter(v => {
    if (S.vStatus && String(v.status) !== S.vStatus) return false;
    if (q && !vCode(v).toLowerCase().includes(q) && !(v.comment || '').toLowerCase().includes(q) && !(v.nameRef || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

/* ═══════════ v1.5.56: iOS-style animated numbers ═══════════
   Tweens a stat number from its currently displayed value to the new one
   (ease-out, ~650ms) with a spring scale pop. First set is instant (no
   previous value). Reduced-motion: sets instantly, no pop. */
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
function animNum(el, to, fmt, fromOverride) {
  if (!el) return;
  fmt = fmt || (n => Math.round(n).toLocaleString());
  to = Number(to) || 0;
  const from = (typeof fromOverride === 'number') ? fromOverride
    : (typeof el._animVal === 'number' ? el._animVal : to);
  try { if (el._animRaf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(el._animRaf); } catch (e) {}
  el._animRaf = null;
  el._animVal = to;
  if (from === to || reducedMotion()) { el.textContent = fmt(to); return; }
  const t0 = nowMs(), DUR = 650;
  el.classList.remove('num-pop'); void el.offsetWidth; el.classList.add('num-pop');
  const raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : (f => setTimeout(f, 16));
  const step = () => {
    const p = Math.min(1, (nowMs() - t0) / DUR);
    const e = 1 - Math.pow(1 - p, 3); /* easeOutCubic — iOS-like */
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) el._animRaf = raf(step);
    else { el.textContent = fmt(to); el._animRaf = null; }
  };
  el._animRaf = raf(step);
}

function renderVouchers() {
  // dashboard stats (all vouchers, not just filtered) — animated on change
  const n1 = S.vouchers.filter(v => String(v.status) === '1').length;
  const n2 = S.vouchers.filter(v => String(v.status) === '2').length;
  const n3 = S.vouchers.filter(v => String(v.status) === '3').length;
  animNum($('stat-active'), n1);
  animNum($('stat-used'), n2);
  animNum($('stat-expired'), n3);
  animNum($('stat-total'), S.vouchers.length);
  // v1.5.54: last-fetched timestamp
  const fe = $('voucher-fetched');
  if (fe) fe.textContent = S.vouchersFetchedAt ? t('v.updated') + ' ' + fmtTime(S.vouchersFetchedAt) : '';

  const list = filteredVouchers();
  $('voucher-count').textContent = S.vFilter || S.vStatus
    ? tx('v.found', { n: list.length, total: S.vouchers.length })
    : tx('v.total', { n: S.vouchers.length });
  const el = $('voucher-list');
  // v1.5.54: expiry alerts — vouchers expiring within 24h (in-use or unused)
  const now = Date.now(), DAY = 86400000;
  const expiring = S.vouchers.filter(v => {
    const st = String(v.status);
    if (st !== '1' && st !== '2') return false;
    const exp = Number(v.expiryTime);
    return exp > now && exp <= now + DAY;
  });
  const expBanner = expiring.length
    ? `<div class="warn-banner" data-expiring><svg class="ic sm"><use href="#i-alert"/></svg><span>${esc(t('v.expiring'))}: <b>${expiring.length}</b></span></div>`
    : '';
  if (!list.length) {
    el.innerHTML = (S.vFilter || S.vStatus)
      ? `<div class="empty"><div class="big">${ic('search', 'xl')}</div><p><b>${t('v.noResult')}</b></p><p class="small">${t('v.noResultSub')}</p></div>`
      : `<div class="empty"><div class="big">${ic('ticket', 'xl')}</div><p><b>${t('v.empty')}</b></p><p class="small">${t('v.emptySub')}</p></div>`;
    return;
  }
  el.innerHTML = expBanner + list.slice(0, 300).map(v => {
    const ri = remainInfo(v); // v1.5.53: decreasing remaining-resource fill
    return `
    <div class="voucher-row" data-uuid="${esc(v.uuid)}">
      <input type="checkbox" class="bulk-check" data-bulk="${esc(v.uuid)}" aria-label="select">
      ${ri ? `<div class="remain-fill" style="width:${ri.pct.toFixed(1)}%"></div>` : ''}
      <span class="status-dot s${esc(v.status)}"></span>
      <div class="voucher-meta">
        <div class="voucher-code">${esc(vCode(v))}</div>
        <div class="pkg">${esc(v.packageName || v.userGroupName || '')} · ${esc(fmtPeriod(v.timePeriod))}</div>
      </div>
      ${ri ? `<span class="remain-txt">${esc(ri.txt)}</span>` : ''}
      <span class="badge s${esc(v.status)}">${esc(statusTxt(v.status))}</span>
      <span class="chev">${ic('chev')}</span>
    </div>`;
  }).join('');
  if (list.length > 300) el.innerHTML += `<div class="empty" style="padding:20px"><p class="small">${t('v.first300')}</p></div>`;
  el.querySelectorAll('.voucher-row').forEach(r => r.addEventListener('click', e => {
    if (S.bulkMode) {
      // v1.5.54: in bulk mode, row tap toggles the checkbox
      if (e.target.classList.contains('bulk-check')) return; // let checkbox handle itself
      const cb = r.querySelector('.bulk-check');
      if (cb) { cb.checked = !cb.checked; updateBulkCount(); }
      return;
    }
    openVoucherDetail(r.dataset.uuid);
  }));
  el.querySelectorAll('.bulk-check').forEach(cb => cb.addEventListener('click', e => {
    e.stopPropagation(); updateBulkCount();
  }));
}

/* ═══════════ v1.5.54: bulk select ═══════════ */
function toggleBulkMode() {
  S.bulkMode = !S.bulkMode;
  $('voucher-list').classList.toggle('bulk-mode', S.bulkMode);
  $('bulk-bar').classList.toggle('hidden', !S.bulkMode);
  $('btn-bulk-select').querySelector('span').textContent = S.bulkMode ? t('a.cancel') : t('v.select');
  if (!S.bulkMode) {
    document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = false);
  }
  updateBulkCount();
}
function bulkSelectedUuids() {
  return Array.from(document.querySelectorAll('.bulk-check:checked')).map(cb => cb.dataset.bulk);
}
function updateBulkCount() {
  const n = bulkSelectedUuids().length;
  $('bulk-count').textContent = tx('v.selected', { n });
  $('btn-bulk-print').disabled = !n;
  $('btn-bulk-delete').disabled = !n;
}
async function bulkPrint() {
  const uuids = bulkSelectedUuids();
  if (!uuids.length) return;
  const vs = uuids.map(u => S.vouchers.find(v => v.uuid === u)).filter(Boolean);
  // Add to print queue (existing path)
  for (const v of vs) {
    try { addToQueue(v); } catch (e) {}
  }
  toast(tx('v.selected', { n: vs.length }));
}
async function bulkDelete() {
  const uuids = bulkSelectedUuids();
  if (!uuids.length) return;
  // v1.5.54 safety: bulk delete may ONLY touch vouchers generated in this session.
  // Provenance = code present in S.sessionGenCodes (memory-only; empty after restart = nothing deletable).
  const vs = uuids.map(u => S.vouchers.find(x => x.uuid === u)).filter(Boolean);
  const fresh = vs.filter(v => S.sessionGenCodes.has(vCode(v)));
  const stale = vs.length - fresh.length;
  if (!fresh.length) { toast(t('del.noNew')); return; }
  const skipTxt = stale ? tx('del.skipOld', { n: stale }) : '';
  if (!confirm(tx('del.confirmBulkNew', { n: fresh.length, skip: skipTxt }))) return;
  let ok = 0, fail = 0;
  for (const v of fresh) {
    try { await Api.voucherDelete(S.projectId, v); ok++; }
    catch (e) { fail++; }
  }
  // Remove successfully deleted codes from the session set
  try { fresh.forEach(v => S.sessionGenCodes.delete(vCode(v))); } catch (e) {}
  toast(`${ok} ✓${fail ? ` · ${fail} ✗` : ''}${stale ? ` · ${stale} ⏭` : ''}`);
  toggleBulkMode();
  loadVouchers();
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
    [t('d.usedTime'), `<span id="live-usedtime">${v.usedTime ? esc(fmtRemain(v.usedTime)) : '—'}</span>`],
    [t('d.remTime'), `<span id="live-remtime">${esc(remTimeTxt(v))}</span><span class="live-dot" title="live"></span>`],
    [t('d.created'), esc(fmtDate(v.createTime))],
    [t('d.activated'), (() => { const at = voucherActivatedTime(v); return at ? esc(fmtDate(at)) : '—'; })()],
    [t('d.expiry'), esc(fmtDate(v.expiryTime))],
    [t('d.quota'), esc(fmtQuota(v.quota))],
    [t('d.usedQuota'), `<span id="live-usedquota">${esc(fmtUsedQuota(v.usedQuota))}</span>`],
    [t('d.remQuota'), `<span id="live-remquota">${esc(remQuotaTxt(v))}</span><span id="live-age" class="muted small"></span>`],
    [t('d.maxClients'), esc(v.maxClients || '—')],
    [t('d.curClients'), esc(v.currentClients || 0)],
    ['Download limit', v.downloadRateLimit ? v.downloadRateLimit + ' KB/s' : '—'],
    ['Upload limit', v.uploadRateLimit ? v.uploadRateLimit + ' KB/s' : '—'],
    [t('d.price'), v.packagePrice ? esc(v.packagePrice) : '—'],
    [t('d.note'), esc(v.comment || v.nameRef || '—')],
    [t('d.macbind'), v.bindMac ? 'Yes' : 'No'],
  ];
  const vst = String(v.status);
  $('modal-body').innerHTML = `
  <div class="detail-head">
    <span class="badge s${vst}">${esc(statusTxt(v.status))}</span>
    <div class="detail-sub">${esc(v.packageName || v.userGroupName || '')} · ${esc(fmtPeriod(v.timePeriod))}</div>
  </div>
  <dl class="kv">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
  $('modal-copy').addEventListener('click', ev => { ev.stopPropagation(); copyText(vCode(v)); });
  $('modal').classList.remove('hidden');
  startVoucherLive(v);
}

/* Live voucher detail: remaining time ticks every second from the local clock
   (exact — time passes at 1s/s from the cloud snapshot). Data usage can only
   change in the cloud, so it is re-fetched from the cloud every 45s while the
   detail is open; nothing is ever interpolated or invented. */
let liveTimer = null, livePoller = null, liveBase = null;
function startVoucherLive(v) {
  stopVoucherLive();
  liveBase = { uuid: v.uuid, at: Date.now(), usedTimeMin: Number(v.usedTime) || 0, timePeriodMin: Number(v.timePeriod) || 0, dataAt: 0 };
  const tick = () => {
    if (!modalVoucher || !liveBase || modalVoucher.uuid !== liveBase.uuid) return stopVoucherLive();
    const elapsedMin = (Date.now() - liveBase.at) / 60000;
    const el = $('live-remtime');
    if (el) el.textContent = fmtRemainSecs(Math.max(0, (liveBase.timePeriodMin - liveBase.usedTimeMin - elapsedMin) * 60));
    const age = $('live-age');
    if (age) age.textContent = liveBase.dataAt ? ' · ' + Math.max(0, Math.round((Date.now() - liveBase.dataAt) / 1000)) + t('fmt.sec') + ' ago' : '';
  };
  const poll = async () => {
    if (!liveBase) return;
    try {
      const fresh = await Api.voucherListAll(S.projectId);
      if (!liveBase || !fresh) return;
      S.vouchers = fresh;
      const fv = fresh.find(x => x.uuid === liveBase.uuid);
      if (fv && modalVoucher && modalVoucher.uuid === liveBase.uuid) {
        Object.assign(modalVoucher, { usedTime: fv.usedTime, usedQuota: fv.usedQuota, status: fv.status, expiryTime: fv.expiryTime });
        liveBase.usedTimeMin = Number(fv.usedTime) || 0;
        liveBase.timePeriodMin = Number(modalVoucher.timePeriod) || 0;
        liveBase.at = Date.now();
        liveBase.dataAt = Date.now();
        const uq = $('live-usedquota'), rq = $('live-remquota'), ut = $('live-usedtime');
        if (uq) uq.textContent = fmtUsedQuota(fv.usedQuota);
        if (rq) rq.textContent = remQuotaTxt(modalVoucher);
        if (ut) ut.textContent = fv.usedTime ? fmtRemain(fv.usedTime) : '—';
        tick();
      }
    } catch (e) { /* keep the last good snapshot on poll failure */ }
  };
  liveTimer = setInterval(tick, 1000);
  tick();
  livePoller = setInterval(poll, 45000);
  setTimeout(poll, 15000);
}
function stopVoucherLive() {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  if (livePoller) { clearInterval(livePoller); livePoller = null; }
  liveBase = null;
}

async function deleteVoucher() {
  const v = modalVoucher;
  if (!v) return;
  if (!confirm(tx('del.confirm', { code: vCode(v) }))) return;
  try {
    await Api.voucherDelete(S.projectId, v);
    closeModal('modal');
    modalVoucher = null;
    toast(t('del.done'));
    loadVouchers();
  } catch (e) {
    // Ruijie Open API has no delete endpoint; delete needs an SSO session
    // (Ruijie account login in the Android app).
    const m = e.message || '';
    if (m === 'SSO_REQUIRED') toast(t('del.needSso'), true);
    else if (/HTTP 403/.test(m)) toast(t('del.rejected') + ' — ' + m.replace(/^SSO request failed:\s*/, ''), true);
    else toast(m || t('del.unsupported'), true);
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
/* Package field mapping — verified against a production-tested implementation.
   Ruijie user-group/package items vary in shape; resolve with fallbacks:
   profile: authprofileid -> authProfileId -> uuid -> profileId -> packageId -> id
   userGroupId: userGroupId -> id
   name: packageName -> profileName -> userGroupName -> name -> groupName */
function pkgProfileId(p) {
  const v = p.authprofileid || p.authProfileId || p.uuid || p.profileId || p.packageId || p.id;
  return v === undefined || v === null || v === '' ? '' : String(v);
}
function pkgGroupId(p) {
  const v = (p.userGroupId !== undefined && p.userGroupId !== null && p.userGroupId !== '') ? p.userGroupId : p.id;
  return v === undefined || v === null || v === '' ? '' : String(v);
}
function pkgName(p) {
  return p.packageName || p.profileName || p.userGroupName || p.name || p.groupName || 'Package';
}
function fillPackageSelects() {
  const opts = S.packages.map(p => {
    const uid = pkgGroupId(p), pid = pkgProfileId(p);
    const label = `${pkgName(p)} — ${fmtPeriod(p.timePeriod)} · ${fmtQuota(p.quota)}`;
    return `<option value="${esc(uid)}|${esc(pid)}">${esc(label)}</option>`;
  }).join('');
  $('gen-package').innerHTML = opts || '<option value="">—</option>';
  syncIosPickerBtn($('gen-package'));
}
function selectedPackage(selId) {
  const sel = $(selId);
  const [uid, pid] = (sel.value || '').split('|');
  const pkg = S.packages.find(p => pkgGroupId(p) === uid);
  const idNum = uid ? Number(uid) : NaN;
  return { id: Number.isFinite(idNum) ? idNum : null, profile: pid || null, pkg };
}

/* ═══════════ PRINT STYLE (Layout + Typography) · v1.3.0 ═══════════ */
const LS_PX = { compact: 0, normal: 1, wide: 3 };
const WEIGHT_NUM = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const FF_STACK = {
  default: `-apple-system, 'Segoe UI', Roboto, sans-serif`,
  sans: `Arial, Helvetica, sans-serif`,
  serif: `Georgia, 'Times New Roman', serif`,
  mono: `'Courier New', Courier, monospace`,
};
const TYPO_COLORS = ['#111111', '#333333', '#1a3a5c', '#0a58ca', '#6c757d', '#c0392b', '#1e7e34', '#6f42c1'];
const TYPO_FIELD_DEFS = [
  { id: 'header',   labelKey: 'pl.fHeader' },
  { id: 'code',     labelKey: 'pl.fCode' },
  { id: 'profile',  labelKey: 'pl.fProfile' },
  { id: 'period',   labelKey: 'pl.fPeriod' },
  { id: 'quota',    labelKey: 'pl.fQuota' },
  { id: 'datetime', labelKey: 'pl.fDatetime' },
];
/** Strip a trailing colon so custom label texts stay clean ("Profile Name:" -> "Profile Name"). */
function stripColon(s) { return String(s == null ? '' : s).trim().replace(/:\s*$/, ''); }
/** Render "Label: value" prefix from a field's custom label text (falls back to the given default). */
function labelPrefix(f, fallbackKey) {
  let s = stripColon(f.labelText) || stripColon(t(fallbackKey));
  if (s && !s.endsWith(':')) s += ':';
  return s ? s + ' ' : '';
}
function defaultField(id) {
  const base = { show: true, size: 20, align: 'left', color: null, weight: 'regular', style: 'normal', ls: 'normal', lsCustom: 2, label: false, labelText: '', spaced: false };
  switch (id) {
    case 'header':   return Object.assign(base, { size: 14, align: 'center', weight: 'bold' });
    case 'code':     return Object.assign(base, { size: 30, align: 'center', weight: 'bold', spaced: true, ls: 'wide', lsCustom: 3, labelText: stripColon(t('tkt.code')) });
    case 'profile':  return Object.assign(base, { size: 22, label: true, labelText: stripColon(t('tkt.profileName')) });
    case 'period':   return Object.assign(base, { size: 22, label: true, labelText: stripColon(t('tkt.validity')) });
    case 'quota':    return Object.assign(base, { show: false, size: 22, label: true, labelText: stripColon(t('tkt.quota')) });
    case 'datetime': return Object.assign(base, { show: false, size: 18, align: 'center', labelText: stripColon(t('tkt.datetime')) });
  }
  return base;
}
function defaultCustomLine() {
  return {
    id: 'cl' + Math.random().toString(36).slice(2, 10),
    show: true,
    label: '',
    value: '',
    size: 20,
    align: 'left',
    bold: false,
  };
}

function defaultPrintStyle() {
  const fields = {};
  TYPO_FIELD_DEFS.forEach(f => { fields[f.id] = defaultField(f.id); });
  return {
    preset: 'default', fontFamily: 'default',
    align: 'center', color: '#111111',
    ls: 'normal', lsCustom: 2,
    lineSpacing: 0, shadow: false, outline: false,
    betweenBlanks: 1, insideSpacing: 0,
    fields,
    customLines: [],
  };
}
function cloneStyle(s) { return JSON.parse(JSON.stringify(s)); }
function mergePrintStyle(saved) {
  const d = defaultPrintStyle();
  if (!saved || typeof saved !== 'object') return d;
  const out = Object.assign(d, saved);
  out.fields = {};
  TYPO_FIELD_DEFS.forEach(f => {
    out.fields[f.id] = Object.assign(defaultField(f.id), (saved.fields && saved.fields[f.id]) || {});
  });
  /* custom free-text lines: sanitize, cap at 5 */
  out.customLines = Array.isArray(saved.customLines)
    ? saved.customLines.filter(x => x && typeof x === 'object').slice(0, 5)
        .map(x => Object.assign(defaultCustomLine(), x))
    : [];
  return out;
}
let PS = null; // active saved print style
function loadPrintStyle() { PS = mergePrintStyle(Store.load().printStyle); }
function savePrintStyle() { Store.save({ printStyle: PS }); }

/** Apply a typography preset onto a style object (mutates). */
function applyPreset(st, name) {
  st.preset = name;
  const F = st.fields;
  const setAll = (fn) => TYPO_FIELD_DEFS.forEach(d => fn(F[d.id]));
  if (name === 'default') {
    const d = defaultPrintStyle();
    Object.assign(st, { fontFamily: d.fontFamily, align: d.align, color: d.color, ls: d.ls, lsCustom: d.lsCustom, lineSpacing: 0, shadow: false, outline: false, betweenBlanks: 1, insideSpacing: 0 });
    TYPO_FIELD_DEFS.forEach(fd => { F[fd.id] = defaultField(fd.id); });
  } else if (name === 'compact') {
    setAll(f => { f.size = Math.max(12, f.size - 6); f.ls = 'compact'; });
    st.insideSpacing = 0; st.lineSpacing = 0; st.ls = 'compact';
  } else if (name === 'bold') {
    F.code.size = 32; F.code.weight = 'bold';
    setAll(f => { if (f.id !== 'code') f.weight = 'semibold'; });
  } else if (name === 'large') {
    F.code.size = 38; F.profile.size = 28; F.period.size = 28; F.quota.size = 28; F.header.size = 18;
  }
}

/* ── shared ticket HTML builder (layout + typography aware) ── */
/* WYSIWYG preview scale — the native thermal renderer draws on a paper-dots-wide
   bitmap (384 dots = 58mm, 576 = 80mm) using each font size directly as dot-pixels.
   The on-screen preview maps dots -> CSS px at a fixed ratio so on-screen sizes keep
   the exact proportions of the real printout (V1 preview behavior). */
const PAPER_DOTS = { '58': 384, '80': 576 };
const PV_PX_PER_DOT = 0.6875; /* 58mm -> 264 CSS px ticket */
function pvDots(paper) { return PAPER_DOTS[paper] || 384; }
function pvTicketWidth(paper) { return Math.round(pvDots(paper) * PV_PX_PER_DOT); }
function fieldCss(f, st, preview) {
  const lsPx = f.ls === 'custom' ? (Number(f.lsCustom) || 0) : (LS_PX[f.ls] != null ? LS_PX[f.ls] : 1);
  const color = preview ? (f.color || st.color || '#111111') : '#000000';
  let css;
  if (preview) {
    /* paper-scale: sizes are native dot-pixels -> CSS px (same proportion as the thermal bitmap) */
    const k = PV_PX_PER_DOT;
    const size = ((Number(f.size) || 20) * k).toFixed(2);
    const ls = (lsPx * k).toFixed(2);
    const lineExtra = ((Number(st.lineSpacing) || 0) * k).toFixed(2);
    const inside = (Math.min(Math.max(Number(st.insideSpacing) || 0, 0), 4) * 8 * k).toFixed(2);
    css = `font-size:${size}px;font-weight:${WEIGHT_NUM[f.weight] || 400};` +
      `font-style:${f.style === 'italic' ? 'italic' : 'normal'};text-align:${f.align || 'left'};` +
      `letter-spacing:${ls}px;color:${color};` +
      `line-height:calc(1.35em + ${lineExtra}px);margin:${inside}px 0;`;
  } else {
    css = `font-size:${Number(f.size) || 20}pt;font-weight:${WEIGHT_NUM[f.weight] || 400};` +
      `font-style:${f.style === 'italic' ? 'italic' : 'normal'};text-align:${f.align || 'left'};` +
      `letter-spacing:${lsPx}px;color:${color};` +
      `line-height:calc(1.35em + ${Number(st.lineSpacing) || 0}px);margin:${Number(st.insideSpacing) || 0}px 0;`;
  }
  if (preview && st.shadow) css += 'text-shadow:1px 1px 2px rgba(0,0,0,.35);';
  if (preview && st.outline) css += '-webkit-text-stroke:.6px currentColor;';
  return css;
}
function ticketInnerHtml(item, st, style, preview) {
  const F = style.fields;
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const ff = FF_STACK[style.fontFamily] || FF_STACK.default;
  let h = preview
    ? `<div class="pv-paper" style="width:${pvTicketWidth(st.paper)}px"><div class="lv-wrap" style="font-family:${ff}">`
    : `<div class="lv-wrap" style="font-family:${ff}">`;
  if (st.header && F.header.show)
    h += `<div class="lv" style="${fieldCss(F.header, style, preview)}">${esc(st.header)}</div>`;
  if (F.code.show) {
    const code = F.code.spaced ? esc(item.code).split('').join(' ') : esc(item.code);
    const codeLbl = F.code.label ? esc(labelPrefix(F.code, 'tkt.code')) : '';
    h += `<div class="lv" style="${fieldCss(F.code, style, preview)};border:2px dashed ${preview ? (F.code.color || style.color || '#111') : '#000'};padding:2mm;border-radius:2mm;">${codeLbl}${code}</div>`;
  }
  if (F.profile.show && item.pkg)
    h += `<div class="lv" style="${fieldCss(F.profile, style, preview)}">${F.profile.label ? esc(labelPrefix(F.profile, 'tkt.profileName')) : ''}${esc(item.pkg)}</div>`;
  // custom free-text lines (after profile, before period — the user's "WIFI Name / Nang Oo" slot)
  (style.customLines || []).forEach(cl => {
    if (!cl || !cl.show) return;
    const lines = [cl.label, cl.value].map(s => String(s == null ? '' : s).trim()).filter(Boolean);
    if (!lines.length) return;
    const size = Math.min(48, Math.max(8, Number(cl.size) || 20));
    const fs = preview ? (size * PV_PX_PER_DOT).toFixed(1) + 'px' : size + 'pt';
    const al = ['left', 'center', 'right'].includes(cl.align) ? cl.align : 'left';
    h += `<div class="lv" style="font-size:${fs};text-align:${al};${cl.bold ? 'font-weight:bold;' : ''}margin:2mm 0;">${lines.map(esc).join('<br>')}</div>`;
  });
  if (F.period.show && item.period)
    h += `<div class="lv" style="${fieldCss(F.period, style, preview)}">${F.period.label ? esc(labelPrefix(F.period, 'tkt.validity')) : ''}${esc(fmtPeriod(item.period))}</div>`;
  if (F.quota.show && item.quota != null)
    h += `<div class="lv" style="${fieldCss(F.quota, style, preview)}">${F.quota.label ? esc(labelPrefix(F.quota, 'tkt.quota')) : ''}${esc(fmtQuota(item.quota))}</div>`;
  if (F.datetime.show)
    h += `<div class="lv" style="${fieldCss(F.datetime, style, preview)}">${F.datetime.label ? esc(labelPrefix(F.datetime, 'tkt.datetime')) : ''}${esc(now)}</div>`;
  if (st.footer)
    h += `<hr><div class="lv" style="font-size:${preview ? (9 * PV_PX_PER_DOT).toFixed(1) + 'px' : '9pt'};text-align:center;margin:2mm 0;">${esc(st.footer)}</div>`;
  h += `</div>`;
  if (preview) h += `</div>`;
  return h;
}

/* ═══════════ GENERATE ═══════════ */
S.genOpts = { vlen: 8, vtype: 'alnum' };

function genQty() {
  return Math.min(500, Math.max(1, Number($('gen-qty').value) || 1));
}
function markCustomPreset() { S.genOpts.presetTouched = true; }

/* Confirmed working code-type mapping (verified against production-tested implementation):
   Alphanumeric -> "1", Alphabetic -> "2", Numeric -> "3"; length via codeSize (6-9). */
const CODE_TYPE_MAP = { alnum: '1', alpha: '2', numeric: '3' };
async function generateVouchers(btnId, lblId) {
  const { id, profile, pkg } = selectedPackage('gen-package');
  const qty = genQty();
  $('gen-err').classList.add('hidden');
  if (!id || !profile) { showErr('gen-err', t('err.pickPkg')); return null; }
  const btn = $(btnId);
  const lbl = $(lblId);
  btn.disabled = true; lbl.textContent = t('btn.generating');
  try {
    const list = await Api.voucherCreate(S.projectId, {
      quantity: qty, profile, userGroupId: id,
      createCodeType: CODE_TYPE_MAP[S.genOpts.vtype] || '1',
      codeSize: S.genOpts.vlen,
      packageName: pkg ? pkgName(pkg) : '',
    });
    const items = list.map(v => ({ code: vCode(v), pkg: pkg && pkgName(pkg), period: v.timePeriod, quota: v.quota }));
    showGenResult(items);
    // v1.5.54: remember session-generated codes so bulk delete can prove provenance
    try { items.forEach(i => { if (i.code) S.sessionGenCodes.add(i.code); }); } catch (e) {}
    try { Store.save({ lastGen: { when: Date.now(), pkg: pkg ? pkgName(pkg) : '', items } }); } catch (e) {}
    renderRecentGen();
    S.vouchers = []; // refresh list next time
    toast(tx('toast.generated', { n: list.length }));
    return items;
  } catch (e) {
    showErr('gen-err', e.message);
    return null;
  } finally {
    btn.disabled = false;
    lbl.textContent = t(btnId === 'btn-generate-print' ? 'g.btnPrint' : 'g.btn');
  }
}
async function doGenerate() { await generateVouchers('btn-generate', 'btn-generate-label'); }
async function doGeneratePrint() {
  const items = await generateVouchers('btn-generate-print', 'btn-generate-print-label');
  if (items && items.length) doPrint(items);
}

/* generate view controls */
function wireGenerateView() {
  // User Group select — two-way synced with header project selector
  const ug = $('gen-usergroup');
  if (ug && !ug.dataset.wired) {
    ug.dataset.wired = '1';
    ug.addEventListener('change', () => {
      $('project-select').value = ug.value;
      onProjectChange();
    });
  }
  document.querySelectorAll('#vlen-seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#vlen-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    S.genOpts.vlen = Number(b.dataset.vlen);
  }));
  document.querySelectorAll('#vtype-grid .codetype').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#vtype-grid .codetype').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    S.genOpts.vtype = b.dataset.vtype;
  }));
  document.querySelectorAll('#qty-presets button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#qty-presets button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('gen-qty').value = b.dataset.qty;
  }));
  $('gen-qty').addEventListener('input', () => {
    const v = Number($('gen-qty').value);
    document.querySelectorAll('#qty-presets button').forEach(x =>
      x.classList.toggle('active', String(v) === x.dataset.qty));
  });
  // v1.5.55: Custom Quantity — never select-all; collapse the caret to the
  // end of the existing value on focus so append/delete just works.
  // (type=number ignores setSelectionRange — native tap caret applies there.)
  $('gen-qty').addEventListener('focus', () => {
    const q = $('gen-qty');
    try { const n = String(q.value).length; q.setSelectionRange(n, n); } catch (e) {}
  });
}
function syncGenUserGroup() {
  const ug = $('gen-usergroup');
  if (!ug) return;
  ug.innerHTML = S.projects.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('') || '<option value="">—</option>';
  ug.value = S.projectId || '';
  syncIosPickerBtn(ug);
}

let genResultItems = [];
function showGenResult(items) {  genResultItems = items;
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

/* Recently generated — the last batch saved on this device (fills the tablet side panel). */
let recentGenItems = [];
function renderRecentGen() {
  const list = $('gen-recent-list');
  if (!list) return;
  const sub = $('gen-recent-sub');
  let lg = null;
  try { lg = Store.load().lastGen; } catch (e) {}
  recentGenItems = (lg && lg.items) || [];
  if (sub) sub.textContent = (lg && lg.when) ? fmtDate(lg.when) + (lg.pkg ? ' · ' + lg.pkg : '') : '';
  list.innerHTML = recentGenItems.length
    ? recentGenItems.map((it, i) =>
        `<span class="code-pill">${esc(it.code)}<button data-copy="${i}" title="${t('a.copy')}">${ic('copy', 'sm')}</button><button data-i="${i}" title="${t('a.queue')}">${ic('plus', 'sm')}</button></span>`).join('')
    : `<p class="muted">${t('g.recentEmpty')}</p>`;
  list.querySelectorAll('[data-copy]').forEach(b =>
    b.addEventListener('click', () => copyText(recentGenItems[Number(b.dataset.copy)].code)));
  list.querySelectorAll('[data-i]').forEach(b =>
    b.addEventListener('click', () => { addToQueue(recentGenItems[Number(b.dataset.i)]); }));
  ['btn-recent-print-all', 'btn-recent-queue-all'].forEach(id => {
    const e = $(id); if (e) e.disabled = !recentGenItems.length;
  });
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
  let html = '';
  for (let c = 0; c < st.copies; c++) {
    html += `<div class="ticket${st.paper === '58' ? ' narrow' : ''}">${ticketInnerHtml(item, st, PS, false)}</div>`;
  }
  return html;
}

/* ═══════════ BLUETOOTH THERMAL PRINTER (printer-v1 engine, APK only) ═══════════ */

function btBridge() {
  return (window.RuijieBridge && window.RuijieBridge.btState) ? window.RuijieBridge : null;
}

function btCall(fn) {
  const B = btBridge();
  if (!B) { toast(t('p.btNeedApk'), true); return null; }
  try { return fn(B); } catch (e) { toast(String(e && e.message || e), true); return null; }
}

/** Map our printStyle (PS) to printer-v1 PrintDesignSettings JSON keys. */
function nativePrintSettings() {
  const F = PS.fields;
  const W = (f) => f.weight === 'bold' ? 'BOLD' : f.weight === 'semibold' ? 'SEMI_BOLD' : f.weight === 'medium' ? 'MEDIUM' : 'REGULAR';
  const A = (f) => (f.align || 'left').toUpperCase();
  const ST = (f) => f.style === 'italic' ? 'ITALIC' : 'NORMAL';
  const lsMode = PS.ls === 'compact' ? 'COMPACT' : PS.ls === 'wide' ? 'WIDE' : PS.ls === 'custom' ? 'CUSTOM' : 'NORMAL';
  const ff = (PS.fontFamily || 'default').toLowerCase();
  const fontFamily = ff === 'monospace' ? 'MONOSPACE' : ff === 'serif' ? 'SERIF' : ff === 'sansserif' || ff === 'sans-serif' ? 'SANS_SERIF' : 'DEFAULT';
  const BLACK = 0xFF000000;
  return JSON.stringify({
    showVoucherCode: !!F.code.show, codeFontSize: +F.code.size || 28,
    codeBold: F.code.weight === 'bold', codeFontWeight: W(F.code), codeFontStyle: ST(F.code),
    codeAlignment: A(F.code), codeSpaced: !!F.code.spaced, codeColor: BLACK,
    showCodeLabel: !!F.code.label, codeLabelText: stripColon(F.code.labelText) || 'Voucher Code',
    showProfileName: !!F.profile.show, profileNameFontSize: +F.profile.size || 24,
    profileNameBold: F.profile.weight === 'bold', profileNameFontWeight: W(F.profile),
    profileNameFontStyle: ST(F.profile), profileNameAlignment: A(F.profile),
    showProfileNameLabel: !!F.profile.label, profileNameLabelText: stripColon(F.profile.labelText) || 'Profile Name', profileNameColor: BLACK,
    showPeriod: !!F.period.show, periodFontSize: +F.period.size || 24,
    periodBold: F.period.weight === 'bold', periodFontWeight: W(F.period),
    periodFontStyle: ST(F.period), periodAlignment: A(F.period),
    showPeriodLabel: !!F.period.label, periodLabelText: stripColon(F.period.labelText) || 'Period', periodColor: BLACK,
    showQuota: !!F.quota.show, quotaFontSize: +F.quota.size || 24,
    quotaBold: F.quota.weight === 'bold', quotaFontWeight: W(F.quota),
    quotaFontStyle: ST(F.quota), quotaAlignment: A(F.quota),
    showQuotaLabel: !!F.quota.label, quotaLabelText: stripColon(F.quota.labelText) || 'Quota', quotaColor: BLACK,
    showHeader: !!F.header.show, headerFontSize: +F.header.size || 26,
    headerBold: F.header.weight === 'bold', headerFontWeight: W(F.header),
    headerFontStyle: ST(F.header), headerAlignment: A(F.header),
    headerSeparator: ' - ', customHeaderName: ($('print-header') ? $('print-header').value.trim() : ''),
    headerColor: BLACK,
    insideVoucherSpacing: Math.max(0, Math.min(4, PS.insideSpacing | 0)),
    betweenVoucherSpacing: Math.max(0, Math.min(8, PS.betweenBlanks == null ? 1 : PS.betweenBlanks | 0)),
    showPrintDateTime: !!F.datetime.show, printDateTimeFontSize: +F.datetime.size || 20,
    printDateTimeBold: F.datetime.weight === 'bold', printDateTimeFontWeight: W(F.datetime),
    printDateTimeFontStyle: ST(F.datetime), printDateTimeAlignment: A(F.datetime),
    printDateTimeColor: BLACK,
    showPrintDateTimeLabel: !!F.datetime.label, printDateTimeLabelText: stripColon(F.datetime.labelText) || 'Print Date/Time',
    showStatus: false, statusFontSize: 20, statusBold: false,
    statusFontWeight: 'REGULAR', statusFontStyle: 'NORMAL', statusAlignment: 'LEFT', statusColor: BLACK,
    fontFamily: fontFamily, letterSpacingMode: lsMode, customLetterSpacing: +PS.lsCustom || 0,
    lineSpacingExtra: +PS.lineSpacing || 0,
    textShadowEnabled: false, shadowColor: 0x88000000, shadowOpacity: 0.5,
    shadowBlur: 3, shadowOffsetX: 2, shadowOffsetY: 2,
    textOutlineEnabled: false, outlineColor: BLACK, outlineWidth: 1,
    activePreset: 'CUSTOM',
    customLines: (PS.customLines || []).filter(cl => cl && cl.show).slice(0, 5).map(cl => ({
      label: String(cl.label || ''), value: String(cl.value || ''),
      fontSize: Math.min(48, Math.max(8, +cl.size || 20)),
      bold: !!cl.bold,
      alignment: ['LEFT', 'CENTER', 'RIGHT'].includes(String(cl.align || '').toUpperCase())
        ? String(cl.align).toUpperCase() : 'LEFT',
    })),
  });
}

function btVoucherPayload(items) {
  return items.map(it => ({
    code: it.code || '',
    profile: it.pkg || '',
    period: it.period != null ? fmtPeriod(it.period) : '',
    quota: it.quota != null ? fmtQuota(it.quota) : '',
    status: ''
  }));
}

function btRefresh() {
  const B = btBridge();
  const stEl = $('bt-status'), devEl = $('bt-devices'), prEl = $('bt-progress');
  if (!stEl) return;
  if (!B) { stEl.textContent = t('p.btNeedApk'); lastBtState = null; renderPrinterDots(); return; }
  let state = null;
  try { state = JSON.parse(B.btState() || '{}'); } catch (e) {}
  if (!state) return;
  lastBtState = state;
  renderPrinterDots();
  const label = { DISCONNECTED: t('p.btIdle'), CONNECTING: '…', CONNECTED: '', ERROR: '' }[state.state] || state.state;
  if (state.state === 'CONNECTED') {
    stEl.textContent = '● ' + (state.deviceName || state.deviceAddress || '');
    stEl.style.color = 'var(--green)';
  } else if (state.state === 'ERROR') {
    stEl.textContent = '● ' + (state.error || state.state);
    stEl.style.color = 'var(--red)';
  } else if (state.state === 'CONNECTING') {
    stEl.textContent = '● ' + t('p.btScanning');
    stEl.style.color = '';
  } else {
    stEl.textContent = '● ' + label;
    stEl.style.color = '';
  }
  if (!state.enabled) stEl.textContent += ' — Bluetooth off';
  // devices
  let devs = [];
  try { devs = JSON.parse(B.btDevices() || '[]'); } catch (e) {}
  devEl.innerHTML = devs.length ? devs.map((d, i) =>
    `<button class="code-pill" data-i="${i}" style="cursor:pointer">${esc(d.name || d.address)}${d.paired ? ' ✓' : ''}<br><small class="muted">${esc(d.address)}</small></button>`
  ).join('') : `<p class="muted">${t('p.btNoDevices')}</p>`;
  devEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const d = devs[Number(b.dataset.i)];
    btCall(B2 => B2.btConnect(d.address));
    setTimeout(btRefresh, 800);
  }));
  // progress + last result
  try {
    const p = JSON.parse(B.btProgress() || '{}');
    if (prEl) prEl.textContent = p.printing ? (p.message || '') : '';
    const r = B.btLastResult();
    if (r && r !== 'null') {
      const res = JSON.parse(r);
      toast(res.message || '', !res.ok);
      btRefreshSoon();
    }
  } catch (e) {}
}

let btTimer = null;
function btRefreshSoon() { setTimeout(btRefresh, 600); }

/* Real-time printer status dots (printer + generate views). Green = connected. */
let lastBtState = null;
function btCacheState() {
  const B = btBridge();
  lastBtState = null;
  if (!B) return null;
  try { lastBtState = JSON.parse(B.btState() || '{}'); } catch (e) { lastBtState = null; }
  return lastBtState;
}
function renderPrinterDots() {
  const st = lastBtState;
  const on = !!(st && st.state === 'CONNECTED');
  const name = on ? (st.deviceName || st.deviceAddress || '') : '';
  document.querySelectorAll('[data-printer-dot]').forEach(el => {
    el.classList.toggle('on', on);
    el.title = on ? name : t('p.btIdle');
  });
  document.querySelectorAll('[data-printer-label]').forEach(el => {
    el.textContent = on ? name : t('p.btIdle');
    el.style.color = on ? 'var(--green)' : '';
  });
  // v1.5.53: topbar printer status icon — green connected, default
  // (no color) when not connected, red on error.
  const topBtn = $('btn-printer-top');
  if (topBtn) {
    topBtn.classList.toggle('st-connected', on);
    topBtn.classList.toggle('st-error', !!(st && st.state === 'ERROR'));
    topBtn.title = on ? name : (st && st.state === 'ERROR' ? (st.error || 'Error') : t('p.btIdle'));
  }
}
function btPollStart() {
  btPollStop();
  btRefresh();
  btTimer = setInterval(() => {
    const v = S.currentView;
    if (v === 'view-printer') btRefresh();
    else { btCacheState(); renderPrinterDots(); } // v1.5.53: topbar icon stays live on every view
  }, 2500);
}
function btPollStop() { if (btTimer) { clearInterval(btTimer); btTimer = null; } }

/** Auto-connect to the last used printer (APK only). quiet=true skips toasts. */
function btAutoConnect(quiet) {
  const B = btBridge();
  if (!B || !B.btAutoConnect) return;
  let r = null;
  try { r = JSON.parse(B.btAutoConnect() || '{}'); } catch (e) { return; }
  if (!r) return;
  if (r.ok) {
    const prEl = $('bt-progress');
    if (prEl) prEl.textContent = t('p.btAutoTrying') + (r.name ? ' ' + r.name : '');
    btRefreshSoon(); setTimeout(btRefresh, 3000);
  } else if (!quiet && r.message) {
    toast(r.message, true);
  }
}

function initBtPrinter() {
  // auto-connect preference (persisted) — also drives native auto-reconnect
  // after unexpected loss (printer power cycle). Explicit disconnect never reconnects.
  const acBox = $('bt-autoconnect');
  const syncAutoReconnect = () => {
    try { btCall(B => (B.btSetAutoReconnect ? B.btSetAutoReconnect(!!acBox.checked) : null)); } catch (e) {}
  };
  if (acBox) {
    acBox.checked = !!Store.load().btAutoConnect;
    syncAutoReconnect();
    acBox.addEventListener('change', () => {
      Store.save({ btAutoConnect: acBox.checked });
      syncAutoReconnect();
      if (acBox.checked) btAutoConnect(true);
    });
  }
  $('btn-bt-scan').addEventListener('click', () => {
    const r = btCall(B => B.btScan());
    if (r) { try { if (!JSON.parse(r).ok) toast(JSON.parse(r).message, true); } catch (e) {} }
    btRefreshSoon(); setTimeout(btRefresh, 2500);
  });
  $('btn-bt-disconnect').addEventListener('click', () => { btCall(B => B.btDisconnect()); btRefreshSoon(); });
  $('btn-bt-test').addEventListener('click', () => {
    const r = btCall(B => B.btTestPrint(nativePrintSettings(), $('print-header') ? $('print-header').value.trim() : ''));
    if (r) btRefreshSoon();
  });
  $('btn-bt-print').addEventListener('click', () => {
    if (!S.queue.length) return toast(t('p.btNoQueue'), true);
    const st = printSettings();
    if (btPrintWithProgress(S.queue, st)) btRefreshSoon();
  });
}

/* ── v1.5.56: print progress sheet (iOS style) ──
   BT thermal prints run async on the native side. We poll btProgress()
   ({"printing","current","total"}) so the sheet shows exactly which
   vouchers printed and the live count. If the printer errors mid-batch,
   the sheet shows the voucher it stopped at + how many printed. */
let ppTimer = null, ppItems = [], ppCopies = 1, ppStart = 0;
function ppStopPoll() { if (ppTimer) { clearInterval(ppTimer); ppTimer = null; } }
function ppClose() { ppStopPoll(); closeModal('print-progress-modal'); }
function ppRender(doneCount, printing, failedAt, errMsg) {
  const n = ppItems.length;
  $('pp-body').innerHTML =
    `<p class="pp-status" id="pp-status"></p><div class="pp-list">` +
    ppItems.map((it, i) => {
      let cls = '', ic = '○', st = t('pp.sQueued');
      if (i < doneCount) { cls = 'done'; ic = '✓'; st = t('pp.sPrinted'); }
      else if (i === failedAt) { cls = 'failed'; ic = '⚠'; st = t('pp.sStopped'); }
      else if (i === doneCount && printing) { cls = 'active'; ic = '<span class="pp-spin">◌</span>'; st = t('pp.sPrinting'); }
      return `<div class="pp-row ${cls}"><span class="pp-ic">${ic}</span>` +
        `<span class="pp-code">${esc(it.code)}</span><span class="pp-state muted">${esc(st)}</span></div>`;
    }).join('') + `</div>`;
  const s = $('pp-status');
  if (failedAt >= 0) {
    s.className = 'pp-status err';
    s.innerHTML = esc(tx('pp.stopped', { c: doneCount, t: n })) +
      `<div class="pp-stop">${esc(tx('pp.stoppedAt', { code: ppItems[failedAt] ? ppItems[failedAt].code : '—' }))}</div>` +
      (errMsg ? `<div class="pp-stop small muted">${esc(errMsg)}</div>` : '');
  } else if (!printing && doneCount >= n) {
    s.className = 'pp-status ok';
    s.textContent = tx('pp.done', { n });
  } else {
    s.className = 'pp-status';
    s.textContent = tx('pp.printing', { c: doneCount, t: n });
  }
}
function ppPoll() {
  let prog = null;
  try {
    const B = btBridge();
    const s = B && B.btProgress ? B.btProgress() : null;
    prog = s ? JSON.parse(s) : null;
  } catch (e) { prog = null; }
  if (!prog) { ppStopPoll(); ppRender(0, false, 0, ''); return; }
  const cur = Math.max(0, Number(prog.current) || 0);
  const doneCount = Math.min(ppItems.length, Math.floor(cur / ppCopies));
  if (prog.printing) { ppRender(doneCount, true, -1); return; }
  // Native thread sets printing=true async — don't mistake the startup race
  // for a finished job: no result within 2s of start means "still starting".
  let res = null;
  try {
    const B = btBridge();
    const s = B && B.btLastResult ? B.btLastResult() : null;
    res = (s && s !== 'null') ? JSON.parse(s) : null;
  } catch (e) { res = null; }
  if (!res && Date.now() - ppStart < 2000) { ppRender(doneCount, true, -1); return; }
  ppStopPoll();
  if (res && res.ok) ppRender(ppItems.length, false, -1);
  else ppRender(doneCount, false, Math.min(doneCount, ppItems.length - 1), (res && res.message) || prog.message || '');
}
function openPrintProgress(items, copies) {
  ppStopPoll();
  ppItems = items.slice();
  ppCopies = Math.max(1, Number(copies) || 1);
  ppStart = Date.now();
  ppRender(0, true, -1);
  $('print-progress-modal').classList.remove('hidden');
  ppTimer = setInterval(ppPoll, 400);
}
/** Start a BT batch print with the progress sheet. Returns true when the
 *  native side accepted the job (sheet open, polling); false → caller falls
 *  through to system print, as before. */
function btPrintWithProgress(items, st) {
  const r = btCall(B => B.btPrint(JSON.stringify(btVoucherPayload(items)), nativePrintSettings(),
    st.header || '', st.paper, st.copies));
  let ok = false;
  try { const o = JSON.parse(r); ok = !!(o && o.ok); } catch (e) { ok = false; }
  if (!ok) return false;
  openPrintProgress(items, st.copies);
  return true;
}

function doPrint(items) {
  if (!items.length) return toast(t('err.noPrint'), true);
  const st = printSettings();
  // APK + Bluetooth thermal printer connected: print-all goes straight to the
  // thermal printer (same path as the queue print button).
  const bt = btCacheState();
  if (bt && bt.state === 'CONNECTED') {
    if (btPrintWithProgress(items, st)) { btRefreshSoon(); return; }
    // fall through to system print if the BT call failed
  }
  const blanks = PS.betweenBlanks > 0 ? `<div style="height:${PS.betweenBlanks * 14}px"></div>` : '';
  const html = items.map(it => ticketHtml(it, st)).join(blanks);
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

/** Standalone HTML document wrapper for the native print WebView. Thermal-safe: black only, no shadow/outline. */
function printDocHtml(ticketsHtml, st) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { margin: 0; }
    body { margin: 0; }
    .ticket { width: ${st.paper === '58' ? '58mm' : '80mm'}; margin: 0 auto; padding: 4mm 3mm; color: #000; page-break-after: always; }
    .ticket .lv-wrap { width: 100%; }
    .ticket hr { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
  </style></head><body>${ticketsHtml}</body></html>`;
}

/* ── print preview (sample ticket with current settings) ── */
function ticketPreviewHtml(item, st) {
  return `<div class="ticket-preview">${ticketInnerHtml(item, st, PS, true)}</div>
  <p class="muted small" style="text-align:center">${tx('pv.meta', { paper: esc(st.paper), copies: esc(String(st.copies)) })}</p>`;
}
function openPrintPreview() {
  const st = printSettings();
  $('preview-body').innerHTML = ticketPreviewHtml(
    { code: 'XXXX-XXXX', pkg: t('pv.sample'), period: 60, quota: 1024 }, st);
  $('preview-modal').classList.remove('hidden');
}

/* ═══════════ PRINT LAYOUT & SPACING MODAL ═══════════ */
let layoutDraft = null;
function previewBasics() {
  return {
    header: $('print-header').value.trim(),
    footer: $('print-footer').value.trim(),
    paper: $('print-paper').value, copies: 1,
  };
}
function previewSampleItem() {
  const v = (S.vouchers && S.vouchers.length) ? S.vouchers[0] : null;
  return {
    code: v ? vCode(v) : 'XXXX-XXXX',
    pkg: v ? (v.packageName || v.userGroupName || t('pv.sample')) : t('pv.sample'),
    period: v ? v.timePeriod : 60,
    quota: v ? v.quota : 1024,
    real: !!v,
  };
}
function openLayoutModal() {
  layoutDraft = cloneStyle(PS);
  layoutDraft.headerText = $('print-header') ? $('print-header').value : '';
  renderLayoutModal();
  $('layout-modal').classList.remove('hidden');
  refreshReveals($('layout-modal'));
}
const LABEL_TOGGLE_FIELDS = ['code', 'profile', 'period', 'quota', 'datetime'];
function layoutFieldCard(fd) {
  const f = layoutDraft.fields[fd.id];
  const boldChecked = (f.weight === 'bold' || f.weight === 'semibold') ? 'checked' : '';
  const headerRow = fd.id === 'header'
    ? `<div class="fld" style="margin:0 0 10px"><span class="fld-label">${t('pl.headerText')}</span>
         <input type="text" id="layout-header-text" class="fld-input" placeholder="${esc(t('pl.headerText'))}" value="${esc(layoutDraft.headerText || '')}"></div>` : '';
  const labelBlock = LABEL_TOGGLE_FIELDS.includes(fd.id)
    ? `<div class="fld" style="margin:8px 0 0"><label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="label" ${f.label ? 'checked' : ''}> ${t('pl.label')}</label>
       ${f.label ? `<input type="text" class="fld-input" style="margin-top:6px" data-lft="${fd.id}" placeholder="${esc(t('pl.labelText'))}" value="${esc(f.labelText || '')}">` : ''}</div>` : '';
  const spacedRow = fd.id === 'code'
    ? `<label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="spaced" ${f.spaced ? 'checked' : ''}> ${t('pl.spaced')}</label>` : '';
  return `<div class="field-card rv">
    <div class="fc-head"><span>${t(fd.labelKey)}</span>
      <label class="switch"><input type="checkbox" data-lf="${fd.id}" data-k="show" ${f.show ? 'checked' : ''}><span class="track"></span></label>
    </div>
    <div class="fc-body"${f.show ? '' : ' style="display:none"'}>
      ${headerRow}
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.fontSize')}</span>
        <div class="slider-row"><input type="range" min="8" max="48" step="1" value="${f.size}" data-lfr="${fd.id}"><b data-lfv="${fd.id}">${f.size} pt</b></div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="bold" ${boldChecked}> ${t('pl.bold')}</label>
        ${spacedRow}
      </div>
      ${labelBlock}
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.align')}</span>
        <div class="mini-seg">${['left', 'center', 'right'].map(a =>
          `<button type="button" data-lfa="${fd.id}" data-a="${a}" class="${f.align === a ? 'active' : ''}">${t('ty.' + a)}</button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}
function findCl(id) { return (layoutDraft.customLines || []).find(x => x.id === id); }

function customLineCard(cl, idx) {
  return `<div class="field-card rv" data-cl="${cl.id}">
    <div class="fc-head"><span>${t('pl.customLines')} ${idx + 1}</span>
      <div class="row" style="margin:0;gap:8px">
        <button type="button" class="icon-btn" data-cl-del="${cl.id}" aria-label="${esc(t('pl.removeLine'))}"><svg class="ic"><use href="#i-x"/></svg></button>
        <label class="switch"><input type="checkbox" data-cl-show="${cl.id}"${cl.show ? ' checked' : ''}><span class="track"></span></label>
      </div>
    </div>
    <div class="fc-body"${cl.show ? '' : ' style="display:none"'}>
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.lineLabel')}</span>
        <input type="text" class="fld-input" data-cl-label="${cl.id}" placeholder="WIFI Name" value="${esc(cl.label || '')}">
      </div>
      <div class="fld" style="margin:8px 0 0"><span class="fld-label">${t('pl.lineValue')}</span>
        <input type="text" class="fld-input" data-cl-value="${cl.id}" placeholder="Nang Oo" value="${esc(cl.value || '')}">
      </div>
      <div class="fld" style="margin:8px 0 0"><span class="fld-label">${t('pl.fontSize')}</span>
        <div class="slider-row"><input type="range" min="8" max="48" step="1" value="${cl.size || 20}" data-cl-size="${cl.id}"><b data-cl-sizeval="${cl.id}">${cl.size || 20} pt</b></div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <label class="check-row"><input type="checkbox" data-cl-bold="${cl.id}"${cl.bold ? ' checked' : ''}> ${t('pl.bold')}</label>
        <div class="mini-seg">${['left', 'center', 'right'].map(a =>
          `<button type="button" data-cl-align="${cl.id}" data-a="${a}" class="${(cl.align || 'left') === a ? 'active' : ''}">${t('ty.' + a)}</button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function renderCustomLines() {
  const wrap = $('layout-custom-lines');
  if (!wrap) return;
  layoutDraft.customLines = layoutDraft.customLines || [];
  wrap.innerHTML = layoutDraft.customLines.map(customLineCard).join('');
  // show toggle + remove (full re-render)
  wrap.querySelectorAll('input[data-cl-show]').forEach(inp => {
    inp.addEventListener('change', () => { findCl(inp.dataset.clShow).show = inp.checked; renderLayoutModal(); });
  });
  wrap.querySelectorAll('button[data-cl-del]').forEach(b => {
    b.addEventListener('click', () => {
      layoutDraft.customLines = layoutDraft.customLines.filter(x => x.id !== b.dataset.clDel);
      renderLayoutModal();
    });
  });
  // label/value/size/bold/align (live, no re-render)
  wrap.querySelectorAll('input[data-cl-label]').forEach(inp => {
    inp.addEventListener('input', () => { findCl(inp.dataset.clLabel).label = inp.value; updateLivePreviews(); });
  });
  wrap.querySelectorAll('input[data-cl-value]').forEach(inp => {
    inp.addEventListener('input', () => { findCl(inp.dataset.clValue).value = inp.value; updateLivePreviews(); });
  });
  wrap.querySelectorAll('input[data-cl-size]').forEach(r => {
    r.addEventListener('input', () => {
      findCl(r.dataset.clSize).size = Number(r.value);
      wrap.querySelector(`[data-cl-sizeval="${r.dataset.clSize}"]`).textContent = `${r.value} pt`;
      updateLivePreviews();
    });
  });
  wrap.querySelectorAll('input[data-cl-bold]').forEach(inp => {
    inp.addEventListener('change', () => { findCl(inp.dataset.clBold).bold = inp.checked; updateLivePreviews(); });
  });
  wrap.querySelectorAll('button[data-cl-align]').forEach(b => {
    b.addEventListener('click', () => {
      findCl(b.dataset.clAlign).align = b.dataset.a;
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      updateLivePreviews();
    });
  });
  const addB = $('layout-add-line');
  if (addB) addB.disabled = layoutDraft.customLines.length >= 5;
}

function renderLayoutModal() {
  const d = layoutDraft;
  $('layout-between').value = d.betweenBlanks;
  $('layout-between-val').textContent = `${d.betweenBlanks} ${t('pl.lines')}`;
  $('layout-inside').value = d.insideSpacing;
  $('layout-inside-val').textContent = d.insideSpacing === 0 ? `0 (${t('pl.compact')})` : String(d.insideSpacing);
  $('layout-fields').innerHTML = TYPO_FIELD_DEFS.map(layoutFieldCard).join('');
  // checkboxes (full re-render ok)
  $('layout-fields').querySelectorAll('input[data-lf]').forEach(inp => {
    inp.addEventListener('change', () => {
      const f = d.fields[inp.dataset.lf];
      const k = inp.dataset.k;
      if (k === 'bold') f.weight = inp.checked ? 'bold' : 'regular';
      else f[k] = inp.checked;
      renderLayoutModal();
    });
  });
  // size sliders (live, no re-render)
  $('layout-fields').querySelectorAll('input[data-lfr]').forEach(r => {
    r.addEventListener('input', () => {
      const f = d.fields[r.dataset.lfr];
      f.size = Number(r.value);
      document.querySelector(`[data-lfv="${r.dataset.lfr}"]`).textContent = `${f.size} pt`;
      updateLivePreviews();
    });
  });
  // label text inputs (live, no re-render)
  $('layout-fields').querySelectorAll('input[data-lft]').forEach(inp => {
    inp.addEventListener('input', () => {
      d.fields[inp.dataset.lft].labelText = inp.value;
      updateLivePreviews();
    });
  });
  // header text input (live, no re-render; applied to the Printer page on Save)
  const hi = $('layout-header-text');
  if (hi) hi.addEventListener('input', () => { layoutDraft.headerText = hi.value; updateLivePreviews(); });
  // alignment
  $('layout-fields').querySelectorAll('button[data-lfa]').forEach(b => {
    b.addEventListener('click', () => {
      const f = d.fields[b.dataset.lfa];
      f.align = b.dataset.a;
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      updateLivePreviews();
    });
  });
  renderCustomLines();
  updateLivePreviews();
  refreshReveals($('layout-modal'));
}
function updateLivePreviews() {
  const item = previewSampleItem();
  const st = previewBasics();
  // layout modal edits the header text in a draft — preview the draft while it is open
  if (layoutDraft && layoutDraft.headerText != null && !$('layout-modal').classList.contains('hidden')) st.header = layoutDraft.headerText;
  const dots = pvDots(st.paper);
  const ll = $('layout-live-label');
  if (ll) ll.textContent = tx('pl.liveFmt', { paper: st.paper || '58', dots });
  const tl = $('typo-live-label');
  if (tl) tl.textContent = tx('ty.liveFmt', { paper: st.paper || '58' });
  if (layoutDraft) $('layout-preview').innerHTML = ticketInnerHtml(item, st, layoutDraft, true);
  if (typoDraft) {
    $('typo-preview').innerHTML = ticketInnerHtml(item, st, typoDraft, true);
    $('typo-real-badge').classList.toggle('hidden', !item.real);
  }
}
function wireLayoutModal() {
  $('layout-between').addEventListener('input', e => {
    layoutDraft.betweenBlanks = Number(e.target.value);
    $('layout-between-val').textContent = `${layoutDraft.betweenBlanks} ${t('pl.lines')}`;
  });
  $('layout-inside').addEventListener('input', e => {
    layoutDraft.insideSpacing = Number(e.target.value);
    $('layout-inside-val').textContent = layoutDraft.insideSpacing === 0 ? `0 (${t('pl.compact')})` : String(layoutDraft.insideSpacing);
    updateLivePreviews();
  });
  $('layout-reset').addEventListener('click', () => {
    layoutDraft = defaultPrintStyle();
    layoutDraft.headerText = $('print-header') ? $('print-header').value : '';
    renderLayoutModal();
  });
  $('layout-save').addEventListener('click', () => {
    const headerText = layoutDraft.headerText != null ? layoutDraft.headerText : '';
    delete layoutDraft.headerText;
    PS = cloneStyle(layoutDraft); savePrintStyle();
    if ($('print-header')) { $('print-header').value = headerText; Store.save({ printHeader: headerText.trim() }); }
    closeModal('layout-modal'); toast(t('toast.styleSaved'));
  });
  $('layout-cancel').addEventListener('click', () => closeModal('layout-modal'));
  $('layout-close').addEventListener('click', () => closeModal('layout-modal'));
  $('layout-modal').addEventListener('click', e => { if (e.target === $('layout-modal')) closeModal('layout-modal'); });
  $('layout-open-typo').addEventListener('click', () => { closeModal('layout-modal'); setTimeout(openTypoModal, 220); });
  // custom free-text lines: add (max 5)
  $('layout-add-line').addEventListener('click', () => {
    layoutDraft.customLines = layoutDraft.customLines || [];
    if (layoutDraft.customLines.length >= 5) return;
    layoutDraft.customLines.push(defaultCustomLine());
    renderCustomLines();
    updateLivePreviews();
    refreshReveals($('layout-modal'));
  });
}

/* ═══════════ TYPOGRAPHY / FONT SETTINGS MODAL ═══════════ */
let typoDraft = null, typoTab = 'code';
const TYPO_TABS = [
  { id: 'code', key: 'ty.tabCode' }, { id: 'profile', key: 'ty.tabProfile' },
  { id: 'period', key: 'ty.tabPeriod' }, { id: 'quota', key: 'ty.tabQuota' },
  { id: 'datetime', key: 'ty.tabDatetime' }, { id: 'header', key: 'ty.tabHeader' },
];
function openTypoModal() {
  typoDraft = cloneStyle(PS);
  typoTab = 'code';
  renderTypoModal();
  $('typo-modal').classList.remove('hidden');
  refreshReveals($('typo-modal'));
}
function touchTypo() {
  if (typoDraft.preset !== 'custom') {
    typoDraft.preset = 'custom';
    document.querySelectorAll('#typo-presets .chip').forEach(x => x.classList.toggle('active', x.dataset.preset === 'custom'));
  }
}
function swatchHtml(colors, cur, attr, showAuto) {
  return (showAuto ? [`<button type="button" class="swatch auto" ${attr}="auto" title="${t('ty.auto')}">Auto</button>`] : []).concat(
    colors.map(c => `<button type="button" class="swatch${cur === c ? ' active' : ''}" style="background:${c}" ${attr}="${c}" aria-label="${c}">${cur === c ? ic('check', 'sm') : ''}</button>`)
  ).join('');
}
function renderTypoModal() {
  const d = typoDraft;
  document.querySelectorAll('#typo-presets .chip').forEach(x => x.classList.toggle('active', x.dataset.preset === d.preset));
  document.querySelectorAll('#typo-fontfamily .chip').forEach(x => x.classList.toggle('active', x.dataset.ff === d.fontFamily));
  document.querySelectorAll('#typo-align button').forEach(x => x.classList.toggle('active', x.dataset.align === d.align));
  $('typo-colors').innerHTML = swatchHtml(TYPO_COLORS, d.color, 'data-gcolor', false);
  document.querySelectorAll('#typo-ls .chip').forEach(x => x.classList.toggle('active', x.dataset.ls === d.ls));
  $('typo-linespacing').value = d.lineSpacing;
  $('typo-linespacing-val').textContent = `+${d.lineSpacing} px`;
  $('typo-shadow').checked = d.shadow;
  $('typo-outline').checked = d.outline;
  $('typo-tabs').innerHTML = TYPO_TABS.map(tb =>
    `<button type="button" class="tab2${typoTab === tb.id ? ' active' : ''}" data-tytab="${tb.id}" role="tab">${t(tb.key)}</button>`).join('');
  document.querySelectorAll('#typo-tabs .tab2').forEach(b => b.addEventListener('click', () => { typoTab = b.dataset.tytab; renderTypoModal(); }));
  renderTypoFieldConfig();
  wireTypoStatics();
  updateLivePreviews();
}
function renderTypoFieldConfig() {
  const d = typoDraft, f = d.fields[typoTab];
  const szPreset = f.size === 20 ? 'small' : f.size === 26 ? 'medium' : f.size === 32 ? 'large' : 'custom';
  $('typo-field-config').innerHTML = `
    <div class="fld"><span class="fld-label">${t('ty.fontSize')}: ${f.size} pt</span>
      <div class="chip-grid" id="typo-szpresets">
        ${[['small', 20, 'ty.szSmall'], ['medium', 26, 'ty.szMedium'], ['large', 32, 'ty.szLarge'], ['custom', 0, 'ty.szCustom']].map(([k, v, tk]) =>
          `<button type="button" class="chip${szPreset === k ? ' active' : ''}" data-sz="${v}">${t(tk)}${v ? ` (${v})` : ''}</button>`).join('')}
      </div>
      <div class="size-stepper" style="margin-top:10px">
        <div class="stepper">
          <button type="button" id="typo-sz-minus" aria-label="−">−</button>
          <input id="typo-sz-val" type="number" min="8" max="48" value="${f.size}" inputmode="numeric">
          <button type="button" id="typo-sz-plus" aria-label="+">+</button>
        </div><b>pt</b>
      </div>
    </div>
    <div class="fld"><span class="fld-label">${t('ty.fontWeight')}</span>
      <div class="chip-grid" id="typo-weight">
        ${[['regular', 'ty.wRegular'], ['medium', 'ty.wMedium'], ['semibold', 'ty.wSemibold'], ['bold', 'ty.wBold']].map(([k, tk]) =>
          `<button type="button" class="chip${f.weight === k ? ' active' : ''}" data-w="${k}">${t(tk)}</button>`).join('')}
      </div>
    </div>
    <div class="fld"><span class="fld-label">${t('ty.fontStyle')}</span>
      <div class="mini-seg" id="typo-fstyle">
        <button type="button" data-fs="normal" class="${f.style === 'normal' ? 'active' : ''}">${t('ty.stNormal')}</button>
        <button type="button" data-fs="italic" class="${f.style === 'italic' ? 'active' : ''}">${t('ty.stItalic')}</button>
      </div>
    </div>
    <div class="fld"><span class="fld-label">${t('ty.align')}</span>
      <div class="mini-seg" id="typo-falign">
        ${['left', 'center', 'right'].map(a => `<button type="button" data-fa="${a}" class="${f.align === a ? 'active' : ''}">${t('ty.' + a)}</button>`).join('')}
      </div>
    </div>
    <div class="fld"><span class="fld-label">${t('ty.color')}</span>
      <div class="swatches" id="typo-fcolors">${swatchHtml(TYPO_COLORS, f.color, 'data-fcolor', true)}</div>
    </div>
    <div class="fld"><span class="fld-label">${t('ty.letterSpacing')}</span>
      <div class="chip-grid" id="typo-fls">
        ${[['compact', 'ty.lsCompact'], ['normal', 'ty.lsNormal'], ['wide', 'ty.lsWide'], ['custom', 'ty.lsCustom']].map(([k, tk]) =>
          `<button type="button" class="chip${f.ls === k ? ' active' : ''}" data-fls="${k}">${t(tk)}</button>`).join('')}
      </div>
      ${f.ls === 'custom' ? `<div class="slider-row" style="margin-top:10px"><input type="range" id="typo-flscustom" min="0" max="12" step="1" value="${f.lsCustom}"><b>+${f.lsCustom} px</b></div>` : ''}
    </div>`;
  $('typo-field-config').querySelectorAll(':scope > .fld').forEach(el => el.classList.add('rv'));
  refreshReveals($('typo-modal'));
  // size presets
  document.querySelectorAll('#typo-szpresets .chip').forEach(b => b.addEventListener('click', () => {
    const v = Number(b.dataset.sz);
    if (v) { f.size = v; touchTypo(); renderTypoFieldConfig(); updateLivePreviews(); }
  }));
  const setSize = v => {
    f.size = Math.min(48, Math.max(8, Math.round(v) || 8));
    $('typo-sz-val').value = f.size; touchTypo(); updateLivePreviews();
  };
  $('typo-sz-minus').addEventListener('click', () => setSize(f.size - 1));
  $('typo-sz-plus').addEventListener('click', () => setSize(f.size + 1));
  $('typo-sz-val').addEventListener('input', e => setSize(Number(e.target.value)));
  // weight / style / align / color / ls
  document.querySelectorAll('#typo-weight .chip').forEach(b => b.addEventListener('click', () => { f.weight = b.dataset.w; touchTypo(); renderTypoFieldConfig(); updateLivePreviews(); }));
  document.querySelectorAll('#typo-fstyle button').forEach(b => b.addEventListener('click', () => { f.style = b.dataset.fs; touchTypo(); renderTypoFieldConfig(); updateLivePreviews(); }));
  document.querySelectorAll('#typo-falign button').forEach(b => b.addEventListener('click', () => { f.align = b.dataset.fa; touchTypo(); renderTypoFieldConfig(); updateLivePreviews(); }));
  document.querySelectorAll('#typo-fcolors .swatch').forEach(b => b.addEventListener('click', () => {
    f.color = b.dataset.fcolor === 'auto' ? null : b.dataset.fcolor; touchTypo(); renderTypoFieldConfig(); updateLivePreviews();
  }));
  document.querySelectorAll('#typo-fls .chip').forEach(b => b.addEventListener('click', () => { f.ls = b.dataset.fls; touchTypo(); renderTypoFieldConfig(); updateLivePreviews(); }));
  const flsc = $('typo-flscustom');
  if (flsc) flsc.addEventListener('input', e => {
    f.lsCustom = Number(e.target.value);
    e.target.nextElementSibling.textContent = `+${f.lsCustom} px`;
    touchTypo(); updateLivePreviews();
  });
}
/** wire the static (non-re-rendered) typo controls — idempotent */
function wireTypoStatics() {
  const once = (id, evt, fn) => {
    const el = $(id);
    if (!el || el.dataset.wired) return;
    el.dataset.wired = '1';
    el.addEventListener(evt, fn);
  };
  document.querySelectorAll('#typo-presets .chip').forEach(b => {
    if (b.dataset.wired) return; b.dataset.wired = '1';
    b.addEventListener('click', () => { applyPreset(typoDraft, b.dataset.preset); renderTypoModal(); });
  });
  document.querySelectorAll('#typo-fontfamily .chip').forEach(b => {
    if (b.dataset.wired) return; b.dataset.wired = '1';
    b.addEventListener('click', () => { typoDraft.fontFamily = b.dataset.ff; touchTypo(); renderTypoModal(); });
  });
  document.querySelectorAll('#typo-align button').forEach(b => {
    if (b.dataset.wired) return; b.dataset.wired = '1';
    b.addEventListener('click', () => {
      typoDraft.align = b.dataset.align;
      TYPO_FIELD_DEFS.forEach(fd => { typoDraft.fields[fd.id].align = b.dataset.align; });
      touchTypo(); renderTypoModal();
    });
  });
  $('typo-colors').querySelectorAll('.swatch').forEach(b => {
    b.addEventListener('click', () => { typoDraft.color = b.dataset.gcolor; touchTypo(); renderTypoModal(); });
  });
  document.querySelectorAll('#typo-ls .chip').forEach(b => {
    if (b.dataset.wired) return; b.dataset.wired = '1';
    b.addEventListener('click', () => { typoDraft.ls = b.dataset.ls; touchTypo(); renderTypoModal(); });
  });
  once('typo-linespacing', 'input', e => {
    typoDraft.lineSpacing = Number(e.target.value);
    $('typo-linespacing-val').textContent = `+${typoDraft.lineSpacing} px`;
    touchTypo(); updateLivePreviews();
  });
  once('typo-shadow', 'change', e => { typoDraft.shadow = e.target.checked; touchTypo(); updateLivePreviews(); });
  once('typo-outline', 'change', e => { typoDraft.outline = e.target.checked; touchTypo(); updateLivePreviews(); });
  once('typo-reset-colors', 'click', () => {
    typoDraft.color = '#111111';
    TYPO_FIELD_DEFS.forEach(fd => { typoDraft.fields[fd.id].color = null; });
    touchTypo(); renderTypoModal();
  });
  once('typo-save', 'click', () => {
    PS = cloneStyle(typoDraft); savePrintStyle(); closeModal('typo-modal'); toast(t('toast.styleSaved'));
  });
  once('typo-cancel', 'click', () => closeModal('typo-modal'));
  once('typo-close', 'click', () => closeModal('typo-modal'));
}
function wireTypoModal() {
  $('typo-modal').addEventListener('click', e => { if (e.target === $('typo-modal')) closeModal('typo-modal'); });
}

/* ═══════════ MORE ═══════════ */
function moreHome() {
  S.moreFn = null;
  S.moreStack = [];
  $('more-menu').classList.remove('hidden');
  $('more-content').innerHTML = '';
}
/* v1.5.34: every More sub-page pushes a history entry carrying its depth,
 * so the SYSTEM back button walks More sub-pages (AP clients → Devices →
 * More menu) instead of jumping to whatever tab was open before. v1.5.36:
 * the in-app back button is removed per user request — the phone's system
 * back button is the only way back; popstate below re-renders the right
 * level from the history entry's moreDepth. */
function moreShell(title, inner) {
  $('more-menu').classList.add('hidden');
  $('more-content').innerHTML = `<div class="card"><h2>${title}</h2>${inner}</div>`;
  // The caller sets S.moreFn just before calling moreShell — capture it as
  // this level's re-renderer. Same-level re-renders (language refresh,
  // post-reboot refresh) don't push a duplicate entry.
  const rerender = S.moreFn;
  if (rerender && !S._moreRestoring) {
    const top = S.moreStack[S.moreStack.length - 1];
    if (top !== rerender) {
      S.moreStack.push(rerender);
      try { history.pushState({ view: 'view-more', moreDepth: S.moreStack.length }, ''); } catch (e) {}
    }
  }
}

async function moreAccounts() {
  S.moreFn = moreAccounts;
  moreShell(`${ic('user', 'sm')} ${esc(t('ma.title'))}`, `<div id="ma-list"><p class="muted">${t('more.loading')}</p></div>
    <div class="row"><button class="btn" id="ma-add">${ic('plus', 'sm')}<span>${t('ma.add')}</span></button></div><div id="ma-form"></div>`);
  $('ma-add').addEventListener('click', () => {
    const pkgOpts = S.packages.map(p => `<option value="${esc(pkgGroupId(p))}|${esc(pkgProfileId(p))}">${esc(pkgName(p))}</option>`).join('');
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
  S.moreFn = moreUserGroups;
  moreShell(`${ic('box', 'sm')} ${esc(t('mg.title'))}`, `<div id="mg-list"><p class="muted">${t('more.loading')}</p></div>`);
  try {
    await ensurePackages();
    $('mg-list').innerHTML = S.packages.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>${t('mg.name')}</th><th>${t('mg.validity')}</th><th>${t('mg.data')}</th><th>${t('mg.price')}</th></tr>
      ${S.packages.map(p => `<tr><td>${esc(pkgName(p))}</td><td>${esc(fmtPeriod(p.timePeriod))}</td>
        <td>${esc(fmtQuota(p.quota || p.flowQuota))}</td><td>${esc(p.price || p.packagePrice || '—')}</td></tr>`).join('')}
      </table></div>` : `<p class="muted">${t('mg.none')}</p>`;
  } catch (e) { $('mg-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

/* ── Device status light · v1.5.14 ──
   green = online, gray = offline, red = error/unknown */
function devStatus(d) {
  const raw = d.onlineStatus || d.status || (d.online === true ? 'Online' : d.online === false ? 'Offline' : '') || '';
  const v = String(raw).trim().toLowerCase();
  if (/^(on|online|1|up|connected|normal)$/.test(v)) return { cls: 'st-on', label: String(raw) };
  if (/^(off|offline|0|down|disconnected)$/.test(v)) return { cls: 'st-off', label: String(raw) };
  if (!v) return { cls: 'st-off', label: '—' };
  return /error|fail|fault|abnorm|alarm|exception/.test(v)
    ? { cls: 'st-err', label: String(raw) } : { cls: 'st-off', label: String(raw) };
}

async function moreDevices() {
  S.moreFn = moreDevices;
  moreShell(`${ic('signal', 'sm')} ${esc(t('md.title'))}`, `
    <div class="chips" id="md-chips">
      <button class="chip active" data-t="">${t('md.all')}</button>
      <button class="chip" data-t="AP">AP</button>
      <button class="chip" data-t="Switch">Switch</button>
      <button class="chip" data-t="Gateway">Gateway</button>
      <button class="chip" data-t="local">${t('md.local')}</button>
    </div>${Api.ssoLoggedIn() ? '' : `<p class="muted small">${t('md.needSsoHint')}</p>`}${GwApi.loggedIn() ? '' : `<p class="muted small">${t('md.needGw')}</p>`}<div id="md-list" style="margin-top:10px"><p class="muted">${t('more.loading')}</p></div>`);
  const DEV_TYPES = ['AP', 'Switch', 'Gateway'];
  const load = async (type) => {
    $('md-list').innerHTML = `<p class="muted">${t('more.loading')}</p>`;
    // v1.5.16: "local" chip = gateway-local devices (LAN eWeb, incl. China APs).
    // The All tab merges cloud + local-only devices (deduped by serialNumber).
    if (type === 'local') {
      try {
        const list = await GwApi.deviceList();
        renderDeviceRows(list, []);
      } catch (e) {
        const m = String((e && e.message) || e);
        $('md-list').innerHTML = `<p class="err">${esc(m === 'GW_NOT_LOGGED_IN' ? t('md.needGw') : m === 'GW_PWD_ENC_PENDING' ? t('gw.encPending') : m)}</p>`;
      }
      return;
    }
    // v1.5.15: SSO webproxy device list (portal API — every type works).
    // Open API fallback (no SSO): only AP works, Switch/Gateway 404.
    const sso = Api.ssoLoggedIn();
    const ssoType = tp => tp === 'Switch' ? 'SWITCH' : tp === 'Gateway' ? 'GATEWAY' : (tp || '');
    // v1.5.24: the AP chip also pulls WR (home routers — often run in AP mode,
    // e.g. EW3200GX-PRO) so their rows and client badges show up too.
    const types = (type === 'AP' && sso) ? ['AP', 'WR'] : (type ? [type] : (sso ? [''] : DEV_TYPES));
    const jobs = types.map(tp =>
      sso ? Api.deviceListSso(S.projectId, ssoType(tp), 1, 100)
          : Api.deviceList(S.projectId, tp, 0, 100));
    // All tab + gateway connected: also pull the local list for the merge.
    const wantLocalMerge = !type && GwApi.loggedIn();
    if (wantLocalMerge) jobs.push(GwApi.deviceList().catch(() => []));
    // v1.5.22: per-AP client counts — one sta_users call in parallel, grouped by AP serial.
    const clientP = (type === '' || type === 'AP')
      ? Api.allOnlineClients(Number(S.projectId)).catch(() => [])
      : Promise.resolve(null);
    const results = await Promise.allSettled(jobs);
    const seen = new Set(), list = [], errs = [];
    let deadSession = false;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        (Array.isArray(r.value) ? r.value : []).forEach(d => {
          const k = d.serialNumber || d.sn || d.mac || JSON.stringify(d);
          if (!seen.has(k)) { seen.add(k); list.push(d); }
        });
      } else if (i < types.length) {
        if (ssoDeadSession(r.reason)) deadSession = true; // v1.5.53: stale portal session
        else errs.push(types[i] + ': ' + ((r.reason && r.reason.message) || r.reason || 'error'));
      }
    });
    // v1.5.53: dead session → queue a one-shot retry of this exact load and
    // silently re-authenticate. The retry fires on the next successful login;
    // genuine errors still render as before.
    if (deadSession && sso) {
      const retryType = type;
      ssoQueueRetry(() => load(retryType));
      ssoSilentReauth();
    }
    let cliByAp = null, apNames = null;
    const clients = await clientP;
    if (clients) {
      cliByAp = new Map(); apNames = new Map();
      clients.forEach(c => {
        const sn = String(c.sn || c.apSn || '');
        if (!cliByAp.has(sn)) cliByAp.set(sn, []);
        cliByAp.get(sn).push(c);
        if (sn && c.deviceAliasName && !apNames.has(sn)) apNames.set(sn, c.deviceAliasName);
      });
      list.forEach(d => {
        const sn = String(d.serialNumber || d.sn || '');
        if (sn && !apNames.has(sn)) apNames.set(sn, d.aliasName || d.alias || d.deviceAliasName || d.name || sn);
      });
    }
    S.devicesFetchedAt = Date.now(); // v1.5.54: last-fetched timestamp
    renderDeviceRows(list, errs, cliByAp, apNames);
  };
  const renderDeviceRows = (list, errs, cliByAp, apNames) => {
    if (!list.length) { $('md-list').innerHTML = `<p class="err">${esc(errs.join(' · ') || t('md.none'))}</p>`; return; }
    const warn = errs.length ? `<p class="warn small">${esc(t('md.partial'))}: ${esc(errs.join(' · '))}</p>` : '';
    const fts = S.devicesFetchedAt ? ` · ${esc(t('v.updated'))} ${esc(fmtTime(S.devicesFetchedAt))}` : ''; // v1.5.54
    $('md-list').innerHTML = `${warn}<p class="muted small">${tx('md.total', { n: list.length })}${fts}</p>` +
      `<div class="wrap-scroll"><table class="data">
        <tr><th>${t('md.sn')}</th><th>${t('md.model')}</th><th>${t('md.status')}</th><th>${t('md.action')}</th></tr>
        ${list.map(d => {
          const sn = d.serialNumber || d.sn || '';
          const nm = d.aliasName || d.alias || d.deviceAliasName || d.name || sn;
          const st = devStatus(d);
          const localTag = d.local ? ` <small class="muted">· ${esc(t('md.localTag'))}</small>` : '';
          // Local reboot wire format not captured yet — no reboot button on local rows (v1.5.16).
          const rb = (!d.local && sn) ? `<button class="btn" data-reboot="${esc(sn)}" data-name="${esc(nm)}">${ic('refresh', 'sm')}<span>${t('md.reboot')}</span></button>` : '';
          // v1.5.22: per-AP client count badge → tap opens that AP's client list.
          // v1.5.24: WR (home router, e.g. EW3200GX-PRO in AP mode) counts too.
          // v1.5.29: gateway-local APs (incl. China-version APs invisible to
          //   Cloud) are AP rows when they carry staNum or an AP-like
          //   deviceType/product/model — not just RAP models.
          const isApRow = (() => {
            const ct = String(d.commonType || '').toUpperCase();
            if (ct) return ct === 'AP' || ct === 'WR';
            if (!d.local) return false;
            if (d.staNums != null) return true;
            const hay = (String(d.deviceType || '') + ' ' + String(d.product || '') + ' ' + String(d.model || '')).toUpperCase();
            if (/^RAP/i.test(String(d.model || ''))) return true;
            return /\bAP\b/.test(hay) && !/SWITCH|GATEWAY/.test(hay);
          })();
          const ncli = (cliByAp && sn) ? (cliByAp.get(String(sn)) || []).length : 0;
          // v1.5.29: local APs show the gateway's staNum when Cloud has none.
          const ncliLocal = (d.local && d.staNums != null) ? Number(d.staNums) : 0;
          const ncliShow = ncli > 0 ? ncli : ncliLocal;
          const showCli = isApRow && sn && (ncliShow > 0 || !d.local);
          const cb = showCli ? `<button class="btn" data-apclients="${esc(sn)}" data-apname="${esc(nm)}" data-aplocal="${d.local ? '1' : ''}" title="${esc(t('ac.title'))}">${ic('user', 'sm')}<span>${ncliShow}</span></button>` : '';
          return `<tr><td>${esc(nm)}${localTag}<br><small class="muted">${esc(sn || d.mac || '')}</small></td>
          <td>${esc(d.productClass || d.model || d.productModel || '')}</td>
          <td><span class="st-dot ${st.cls}"></span>${esc(st.label)}</td>
          <td>${rb}${cb}</td></tr>`;
        }).join('')}
        </table></div>`;
    document.querySelectorAll('#md-list [data-reboot]').forEach(b => b.addEventListener('click', () => rebootDevice(b.dataset.reboot, b.dataset.name)));
    document.querySelectorAll('#md-list [data-apclients]').forEach(b => b.addEventListener('click', () => apClientsView(b.dataset.apclients, b.dataset.apname, apNames, b.dataset.aplocal === '1')));
  };
  document.querySelectorAll('#md-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#md-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); load(c.dataset.t);
  }));
  load('');
}

/* ── Device reboot (Cloud portal via SSO) · v1.5.13 ──
   Button-only: no web portal, no CLI. Android-APK-only (SSO bridge);
   the portal reboots by device serial number (snList). */
async function rebootDevice(sn, name) {
  if (!Api.ssoLoggedIn()) { toast(t('md.needSso'), true); return; }
  if (!confirm(tx('md.rebootConfirm', { name: name || sn }))) return;
  toast(t('md.rebooting'));
  try {
    await Api.deviceReboot(sn);
    toast(t('md.rebootOk'));
  } catch (e) { toast(e.message || t('md.rebootFail'), true); }
  if (S.moreFn === moreDevices) moreDevices();
}

/* Extract display values for one Online-Clients record. Pure and
 * unit-testable. Field names verified 2026-09-28 against the portal's own
 * GLOBAL_USERS response (read-only): mac, ip, userName (capital N — the app
 * previously read `username`, which is why the Details column was empty),
 * ssid, deviceName (AP), account/authType (voucher), band/channel/rssi,
 * activeSec/onlineTime, flowUpDown/downRate/upRate, staLabelName,
 * manufacturer/staModel/staOs, connectType. Missing → '—', never fabricated.
 * Open-API fallback records (sta_users) carry a subset; portal-only fields
 * stay '—' there. */
const mcFields = (c, viaPortal, vmap) => {
  c = c || {};
  const mac = c.mac || '—';
  const ip = viaPortal ? (c.ip || '—') : (c.userIp || c.ip || '—');
  const name = viaPortal
    ? String(c.alias || c.userName || c.staModel || '').trim()
    : String(c.hostname || c.username || c.userName || '').trim();
  // v1.5.26 rule: the open-API sta_users has no account field — attribute a
  // voucher only when the username verifies against the voucher map.
  // Device/host names are NEVER shown as vouchers.
  const acct = viaPortal
    ? String(c.account || c.authAccount || c.authName || '').trim()
    : (() => { const u = String(c.username || '').trim(); return (u && vmap && vmap.has(u)) ? u : ''; })();
  const authType = viaPortal ? String(c.authType || '').trim() : '';
  const ssid = c.ssid || '—';
  const ap = viaPortal ? (c.deviceName || '—') : '—';
  const since = fmtTs(c.onlineTime);
  const durMs = viaPortal
    ? (Number(c.activeSec) > 0 ? Number(c.activeSec) * 1000
      : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN))
    : (Number(c.activeTime) > 0 ? Number(c.activeTime)
      : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN));
  const sig = [c.rssi != null && c.rssi !== '' ? String(c.rssi) + ' dBm' : '',
               c.band || '', c.channel ? 'ch ' + c.channel : ''].filter(Boolean).join(' · ') || '—';
  const total = viaPortal ? fmtBytes(c.flowUpDown) : '—';
  const live = !viaPortal ? '—'
    : ((c.downRate == null || c.downRate === '') && (c.upRate == null || c.upRate === '')
      ? '—' : [fmtRate(c.downRate), fmtRate(c.upRate)].join(' / '));
  const dev = viaPortal
    ? (() => {
        const maker = String(c.manufacturer || '').trim();
        const model = String(c.staModel || '').trim();
        const modelFull = (maker && model && model.toLowerCase().startsWith(maker.toLowerCase()))
          ? model : [maker, model].filter(Boolean).join(' ');
        return [c.staLabelName || '', modelFull, c.staOs || ''].filter(Boolean).join(' · ') || '—';
      })()
    : '—';
  const conn = viaPortal ? (c.connectType || '—') : '—';
  return { mac, ip, name, acct, authType, ssid, ap, since, dur: fmtDur(durMs), sig, total, live, dev, conn };
};

/* Client connection status for the Online-Clients view. Pure and
 * unit-testable.
 *   active    — voucher-authenticated, voucher still valid (green)
 *   timeup    — voucher's time quota exhausted (pure-time voucher) (orange)
 *   datalimit — voucher's data quota exhausted (quota voucher) (red)
 *   noauth    — WiFi associated but no portal/voucher account: the portal
 *               code was never entered (gray)
 *   unknown   — account present but the voucher is not in the voucher list
 *               (deleted/aged out) (purple)
 * Follows the v1.5.47 fill rule: quota vouchers are governed by DATA
 * (usedQuota/quota), pure-time vouchers by TIME (usedTime/timePeriod).
 * Never guesses: anything unverifiable is 'noauth' or 'unknown'. */
const clientStatusOf = (acct, vmap) => {
  const a = String(acct || '').trim();
  if (!a) return 'noauth';
  const v = vmap ? vmap.get(a) : null;
  if (!v) return 'unknown';
  const q = Number(v.quota) || 0, uq = Number(v.usedQuota) || 0;
  const p = Number(v.timePeriod) || 0, ut = Number(v.usedTime) || 0;
  // Each dimension is checked on its own: a quota voucher whose time ran
  // out while data remains is 'timeup', not 'datalimit'. When both are
  // spent, data takes priority per the v1.5.47 fill convention.
  if (q > 0 && uq >= q) return 'datalimit';
  if (p > 0 && ut >= p) return 'timeup';
  // Expired with no fully-spent dimension (e.g. past expiry date): fall back
  // to the voucher's governing dimension, mirroring the voucher list.
  if (String(v.status) === '3') return q > 0 ? 'datalimit' : 'timeup';
  return 'active';
};
const CSTS = ['active', 'timeup', 'datalimit', 'noauth', 'unknown'];
const CST_META = {
  active: { key: 'mc.fActive' },
  timeup: { key: 'mc.fTimeUp' },
  datalimit: { key: 'mc.fDataUp' },
  noauth: { key: 'mc.fNoAuth' },
  unknown: { key: 'mc.fUnknown' },
};

/* v1.5.41: quota-exhausted counts as expired for the COLOR — Cloud may
 * still report status 2 ("in use") after the data quota is fully spent
 * (verified 2026-09-28: voucher 14045577, used 1025 MB / quota 1024 MB,
 * Cloud still "In use"). Per user decision: never show green just because
 * Cloud says so. Missing usedQuota → not "gone" (never guess). */
function voucherQuotaGone(v) {
  const q = Number(v && v.quota) || 0, uq = Number(v && v.usedQuota) || 0;
  return q > 0 && uq >= q;
}

/* v1.5.40: shared voucher cell — plan · period · price + status color,
 * identical on EVERY AP/client view (gateway China APs, Cloud APs,
 * Online Clients). v1.5.41: red when Cloud says expired (status 3) OR the
 * data quota is exhausted (voucherQuotaGone) even if Cloud still says
 * "in use"; green only for genuinely usable in-use vouchers. The map
 * itself is refetched from Cloud on each view open (apClientVoucherMap
 * force), so colors track Cloud in realtime instead of session cache.
 * extraSubs: optional extra sub-lines shown above plan·period·price. */
function voucherCellHtml(vcode, vmap, extraSubs) {
  const code = String(vcode || '').trim();
  if (!code) return '—';
  const v = vmap ? vmap.get(code) : null;
  const vpkg = v ? voucherPkgName(v) : '';
  const vper = v && v.timePeriod ? fmtPeriod(v.timePeriod) : '';
  const vprc = v ? fmtMoney(pkgPriceNum(v)) : '';
  const vsub = [vpkg, vper, vprc].filter(Boolean).join(' · ');
  const vst = v ? String(v.status) : '';
  const vstCls = (vst === '3' || voucherQuotaGone(v)) ? 'vcode-expired' : vst === '2' ? 'vcode-inuse' : '';
  // v1.5.55: code seen on a client but absent from the Cloud voucher list
  // (deleted/aged-out) — mark old/unknown instead of bare black. Only when
  // the map actually loaded (non-empty); an empty map means load failure.
  const unknownMark = (!v && vmap && vmap.size > 0)
    ? `<br><small class="vcode-unknown">⚑ ${esc(t('v.unknown'))}</small>` : '';
  const subs = [].concat(extraSubs || [], vsub ? [vsub] : []).filter(Boolean).map(esc).join('<br>');
  return `<b${vstCls ? ` class="${vstCls}"` : ''}>${esc(code)}</b>` + unknownMark +
    (subs ? `<br><small class="muted">${subs}</small>` : '');
}

/* ═══════════ v1.5.55 · iOS bottom-sheet picker ═══════════
   Replaces the native <select> dropdown animation with an iOS action
   sheet (spring slide-up from the bottom). The native select stays in the
   DOM (hidden) so all existing .value reads and 'change' handlers keep
   working; the sheet mirrors its options at open time (always fresh). */
function iosPickerLabel(sel) {
  const o = sel.options[sel.selectedIndex];
  return o ? o.textContent.trim() : '—';
}
function syncIosPickerBtn(sel) {
  const btn = sel && sel._iosBtn;
  if (btn) {
    const v = btn.querySelector('.ios-picker-val');
    if (v) v.textContent = iosPickerLabel(sel);
  }
}
function enhanceIosPicker(sel) {
  if (!sel || sel._iosBtn) return;
  sel.classList.add('ios-native-hide');
  sel.setAttribute('tabindex', '-1');
  sel.setAttribute('aria-hidden', 'true');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ios-picker-btn';
  btn.setAttribute('aria-label', sel.getAttribute('aria-label') || iosPickerLabel(sel));
  btn.innerHTML = `<span class="ios-picker-val"></span><svg class="ic"><use href="#i-chev-r"/></svg>`;
  sel.parentNode.insertBefore(btn, sel.nextSibling);
  sel._iosBtn = btn;
  btn.addEventListener('click', () => openIosPicker(sel));
  sel.addEventListener('change', () => syncIosPickerBtn(sel));
  syncIosPickerBtn(sel);
}
function openIosPicker(sel) {
  closeIosPicker();
  const ov = document.createElement('div');
  ov.className = 'ios-sheet-ov';
  const sheet = document.createElement('div');
  sheet.className = 'ios-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.innerHTML = `<div class="sheet-handle"></div><div class="ios-sheet-opts"></div>`;
  const optsEl = sheet.querySelector('.ios-sheet-opts');
  Array.from(sel.options).forEach(o => {
    if (!o.value && !o.textContent.trim()) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ios-sheet-opt' + (o.selected ? ' active' : '');
    const lbl = document.createElement('span');
    lbl.textContent = o.textContent.trim() || '—';
    b.appendChild(lbl);
    if (o.selected) b.insertAdjacentHTML('beforeend', '<svg class="ic"><use href="#i-check"/></svg>');
    b.addEventListener('click', () => {
      sel.value = o.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      syncIosPickerBtn(sel);
      closeIosPicker();
    });
    optsEl.appendChild(b);
  });
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'ios-sheet-cancel';
  cancel.textContent = t('a.cancel');
  cancel.addEventListener('click', closeIosPicker);
  sheet.appendChild(cancel);
  ov.appendChild(sheet);
  ov.addEventListener('click', e => { if (e.target === ov) closeIosPicker(); });
  document.body.appendChild(ov);
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
}
function closeIosPicker() {
  const ov = document.querySelector('.ios-sheet-ov');
  if (ov) ov.remove();
}
function initIosPickers() {
  ['project-select', 'gen-usergroup', 'gen-package'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) enhanceIosPicker(sel);
  });
}

/* ═══════════ v1.5.55 · scroll-reveal (iOS spring) ═══════════ */
let _rvObserver = null;
function refreshReveals(scope) {
  const root = scope || document;
  if (!('IntersectionObserver' in window)) {
    root.querySelectorAll('.rv:not(.inview)').forEach(el => el.classList.add('inview'));
    return;
  }
  if (!_rvObserver) {
    _rvObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('inview'); _rvObserver.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
  }
  root.querySelectorAll('.rv:not(.inview):not([data-rv])').forEach(el => {
    el.setAttribute('data-rv', '1');
    _rvObserver.observe(el);
  });
}

/* ═══════════ v1.5.55 · client kick (sticky clients) ═══════════
   Two UX forms ship now: (a) Settings auto-kick toggle, (b) per-client
   Disconnect button on sticky rows. EXECUTION IS GATED: the kick wire
   format is NOT verified (cloud itself is erroring), so KICK_VERIFIED
   stays false until a live test proves it — requestKick() refuses until
   then and says so honestly. Never kicks non-sticky clients. */
const KICK_VERIFIED = false;
async function requestKick(c, opts) {
  opts = opts || {};
  if (!KICK_VERIFIED) {
    if (!opts.auto) toast(t('kick.pending'), true);
    return false;
  }
  return false; // unreachable until verified
}
function kickStickyClient(c) {
  const mac = c && (c.mac || c.userMac);
  if (!mac) return;
  if (!confirm(t('kick.confirm'))) return;
  requestKick(c, { auto: false });
}
function initKickSettings() {
  const tg = $('kick-auto');
  if (tg) {
    tg.checked = !!Store.load().kickAuto;
    tg.addEventListener('change', () => Store.save({ kickAuto: tg.checked }));
  }
  const st = $('kick-status');
  if (st) st.textContent = t('kick.standby');
}
function autoKickScan(list) {
  if (!KICK_VERIFIED) return;
  if (!Store.load().kickAuto) return;
  (list || []).forEach(c => {
    const st = clientStatusOf(String(c.account || c.authAccount || '').trim(), mcCache && mcCache.vmap);
    if (st === 'datalimit' || st === 'timeup') requestKick(c, { auto: true });
  });
}

/* Online-Clients render cache: fetch once per visit, re-render locally on
 * filter/names-toggle so chips feel instant. */
let mcCache = null;
async function moreClients() {
  S.moreFn = moreClients;
  moreShell(`${ic('monitor', 'sm')} ${esc(t('mc.title'))}`, `<div id="mc-list"><p class="muted">${t('more.loading')}</p></div>`);
  const pid = Number(S.projectId);
  // Prefer the portal client API (SSO): its records carry the full verified
  // field set (voucher account/authType, AP deviceName, rssi/band/channel,
  // activeSec/onlineTime, traffic, device model/OS). Falls back to the open
  // API when SSO is unavailable or the portal call fails.
  let list = [], viaPortal = false, srcNote = '';
  const ssoOk = Api.ssoLoggedIn();
  if (ssoOk) {
    try {
      let hasAuth = null;
      try { hasAuth = await Api.portalAuthStatus(pid); } catch (e) { hasAuth = null; }
      list = await Api.portalClients(pid, { pageSize: 1000, authCount: hasAuth !== false, connectType: '' }) || [];
      viaPortal = true;
      try { cachePortalVouchers(list); } catch (e) { /* voucher cache is best-effort */ }
      if (hasAuth === false) srcNote = t('ac.noAuthCfg');
    } catch (e) { srcNote = t('ac.portalErr') + ': ' + String((e && e.message) || e || '').slice(0, 140); }
  } else {
    srcNote = t('ac.needSso');
  }
  if (!viaPortal) {
    try { list = await Api.onlineClients(pid, 0, 200) || []; }
    catch (e) { $('mc-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  }
  let vmap = new Map();
  try { vmap = await apClientVoucherMap(pid, true); } catch (e) { /* voucher enrichment optional */ }
  // v1.5.56: merge China/local-AP clients from the gateway's own STA list.
  // The portal snapshot only covers Cloud-managed APs, so STAs on
  // China/local APs never appear in it. The gateway sees them on the LAN —
  // append the ones whose MAC is absent from the portal list as extra rows
  // (AP name shown; columns the gateway doesn't report render as —).
  // Portal rows are never modified or duplicated. Voucher attribution for
  // merged rows comes only from the local MAC/IP cache of genuinely
  // observed portal vouchers; unknown stays honest —.
  let gwMerged = 0;
  try {
    if (typeof GwApi !== 'undefined' && GwApi.loggedIn()) {
      const stas = await GwApi.staList();
      if (stas && stas.length) {
        const seen = new Set((list || []).map(c => normMac(c.mac || c.userMac || c.staMac)));
        let apNames = {};
        try {
          const devs = await GwApi.deviceList();
          (devs || []).forEach(d => { if (d.serialNumber) apNames[String(d.serialNumber)] = d.name || d.deviceName || String(d.serialNumber); });
        } catch (e) { /* AP names best-effort */ }
        const vc = getVoucherCache();
        (stas || []).forEach(s => {
          const mac = normMac(s.mac);
          if (!mac || seen.has(mac)) return;
          seen.add(mac);
          const row = {
            mac: s.mac, ip: s.ip || '', userName: s.host || '',
            ssid: s.ssid || '',
            deviceName: (s.apSn && apNames[String(s.apSn)]) || s.apSn || '',
            rssi: (s.rssi != null && s.rssi !== '') ? s.rssi : null,
            __gw: true,
          };
          const cv = vc.byMac.get(mac) || (row.ip ? vc.byIp.get(String(row.ip).trim()) : null);
          if (cv) row.account = cv;
          list.push(row); gwMerged++;
        });
      }
    }
  } catch (e) { /* best-effort: the portal list stands alone */ }
  if (gwMerged) srcNote = (srcNote ? srcNote + ' · ' : '') + tx('mc.gwMerged', { n: gwMerged });
  if (viaPortal && !srcNote && !list.some(c => String(c.account || c.authAccount || c.authName || '').trim())) {
    srcNote = t('ac.portalNoAcct');
  }
  mcCache = {
    list, viaPortal, vmap, srcNote,
    filter: (mcCache && mcCache.filter) || 'all',
    showNames: Store.load().clientShowNames !== false,
  };
  S.clientsFetchedAt = Date.now(); // v1.5.54: last-fetched timestamp
  renderMcList();
}

/* ═══════════ v1.5.54: client auth history ═══════════
   Uses the verified /samTransfer/userauthlogs/bypage endpoint (portal SSO).
   Shows recent login/logout records: voucher account, MAC, login/logout time. */
async function moreHistory() {
  S.moreFn = moreHistory;
  moreShell(`${ic('clock', 'sm')} ${esc(t('mh.title'))}`, `<div id="mh-list"><p class="muted">${t('more.loading')}</p></div>`);
  if (!Api.ssoLoggedIn()) {
    $('mh-list').innerHTML = `<p class="err">${esc(t('mh.needSso'))}</p>`;
    return;
  }
  try {
    const list = await Api.portalAuthLogs(Number(S.projectId)) || [];
    if (!list.length) {
      $('mh-list').innerHTML = `<p class="muted">${esc(t('mh.empty'))}</p>`;
      return;
    }
    // Newest first by login time
    list.sort((a, b) => Number(b.loginTimes || 0) - Number(a.loginTimes || 0));
    $('mh-list').innerHTML =
      `<p class="muted small">${list.length} records${S.clientsFetchedAt ? ' · ' + esc(t('v.updated')) + ' ' + esc(fmtTime(Date.now())) : ''}</p>` +
      `<div class="list">` + list.slice(0, 100).map(r => {
        const acct = esc(r.account || '—');
        const mac = esc(r.userMac || '');
        const login = fmtDate(r.loginTimes);
        const logout = r.logoutTimes ? fmtDate(r.logoutTimes) : '—';
        const reason = r.logoutReason ? ` <small class="muted">· ${esc(r.logoutReason)}</small>` : '';
        return `<div class="voucher-row"><span class="status-dot s2"></span>
          <div class="voucher-meta"><div class="voucher-code">${acct}</div>
          <div class="pkg">${mac} · ${esc(login)} → ${esc(logout)}${reason}</div></div></div>`;
      }).join('') + `</div>`;
  } catch (e) {
    $('mh-list').innerHTML = `<p class="err">${esc(e.message || String(e))}</p>`;
  }
}

function renderMcList() {
  const { list, viaPortal, vmap, srcNote } = mcCache;
  const { filter, showNames } = mcCache;
  const sts = list.map(c => clientStatusOf(mcFields(c, viaPortal, vmap).acct, vmap));
  const counts = { all: list.length };
  CSTS.forEach(s => counts[s] = 0);
  sts.forEach(s => counts[s]++);
  const srcLine = `📡 ${esc(viaPortal ? t('ac.srcPortal') : t('ac.srcApi'))}${srcNote ? ' · ' + esc(srcNote) : ''}${S.clientsFetchedAt ? ' · ' + esc(t('v.updated')) + ' ' + esc(fmtTime(S.clientsFetchedAt)) : ''}`; // v1.5.54: last-fetched
  const seg = (key, label, n) =>
    `<button type="button" class="${filter === key ? 'active' : ''}" data-mcf="${key}">${esc(label)} (${n})</button>`;
  const segHtml = `<div class="segmented seg-scroll" role="tablist">` +
    seg('all', t('mc.fAll'), counts.all) +
    CSTS.map(s => seg(s, t(CST_META[s].key), counts[s])).join('') + `</div>`;
  /* v1.5.57: iOS client cells — status-tinted device icon tile, headline +
     sub-lines, status badge; replaces the 8-column desktop table. */
  const clientIcon = f => {
    const d = ((f.dev || '') + ' ' + (f.name || '')).toLowerCase();
    if (/ipc|camera|ezviz/.test(d)) return 'eye';
    if (/laptop|notebook|macbook|desktop|\bpc\b/.test(d)) return 'monitor';
    return 'wifi';
  };
  const voucherInline = (vcode, vm) => voucherCellHtml(vcode, vm).replace(/<br>/g, ' · ');
  let cells = '';
  list.forEach((c, i) => {
    if (filter !== 'all' && sts[i] !== filter) return;
    const f = mcFields(c, viaPortal, vmap);
    const st = sts[i];
    // v1.5.53: anomaly flags — neutral wording, never accusatory.
    // "suspicious": online with no voucher attribution but showing real
    //   usage (traffic or long session) — worth a review, not a verdict.
    // "sticky": voucher quota exhausted (datalimit/timeup) yet the client
    //   is still in the online list — the AP didn't disconnect it.
    const flags = [];
    if (st === 'noauth' && viaPortal) {
      const bytes = Number(c.flowUpDown) || 0;
      const durMs = Number(c.activeSec) > 0 ? Number(c.activeSec) * 1000
        : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : 0);
      if (bytes > 50 * 1024 * 1024 || durMs > 2 * 3600 * 1000) flags.push('suspicious');
    }
    if (st === 'datalimit' || st === 'timeup') flags.push('sticky');
    const title = (showNames && f.name) ? f.name : f.mac;
    const sub1 = [(title !== f.mac ? f.mac : ''), (f.ip !== '—' ? f.ip : '')].filter(Boolean).join(' · ');
    const vLine = f.acct ? voucherInline(f.acct, vmap) : `<span class="muted">—</span>`;
    // device line: drop the model token when it duplicates the shown name
    let devTxt = f.dev;
    if (showNames && f.name && devTxt && devTxt !== '—') {
      const parts = devTxt.split(' · ').filter(p => p.trim().toLowerCase() !== f.name.trim().toLowerCase());
      devTxt = parts.join(' · ') || '—';
    }
    const info = [f.ssid, f.conn, f.ap, f.since, f.dur, f.sig,
      (f.total !== '—' ? f.total : ''), (f.live !== '—' ? '⇅ ' + f.live : ''),
      (devTxt !== '—' ? devTxt : '')].filter(x => x && x !== '—').join(' · ');
    // v1.5.55: per-client disconnect on sticky rows (quota spent, still online).
    // Execution gated by KICK_VERIFIED — the button explains until then.
    const kickBtn = flags.includes('sticky')
      ? `<button type="button" class="mc-kick" data-kick="${esc(f.mac)}">${esc(t('kick.btn'))}</button>` : '';
    const foot = (flags.length || kickBtn)
      ? `<div class="mc-foot"><span>${flags.map(fl =>
        `<span class="mc-flag flag-${fl}">⚑ ${esc(t('mc.flag.' + fl))}</span>`).join('')}</span>${kickBtn}</div>` : '';
    cells += `<div class="set-row mc-row">` +
      `<span class="set-ico mc-ico cst-${st}">${ic(clientIcon(f), '')}</span>` +
      `<div class="t"><div class="mc-top"><span class="t-main">${esc(title)}</span>` +
      `<span class="mc-badge cst-${st}">${esc(t(CST_META[st].key))}</span></div>` +
      (sub1 ? `<div class="sub">${esc(sub1)}</div>` : '') +
      `<div class="sub">${vLine}</div>` +
      (info ? `<div class="sub">${esc(info)}</div>` : '') +
      foot + `</div></div>`;
  });
  $('mc-list').innerHTML =
    `<div class="mc-head"><p class="mc-sub">${esc(tx('mc.total', { n: list.length }))} · ${srcLine}</p>` +
    `<button type="button" id="mc-names" class="ios-text-btn${showNames ? ' on' : ''}">👤 ${esc(t('ac.names'))}</button></div>` +
    segHtml +
    (cells ? `<div class="set-group mc-list">${cells}</div>` : `<p class="muted">${esc(t('mc.none'))}</p>`);
  document.querySelectorAll('#mc-list [data-kick]').forEach(b => b.addEventListener('click', () => {
    const list = (mcCache && mcCache.list) || [];
    const c = list.find(x => normMac(x.mac || x.userMac) === normMac(b.dataset.kick));
    if (c) kickStickyClient(c);
  }));
  document.querySelectorAll('#mc-list [data-mcf]').forEach(b => b.addEventListener('click', () => {
    mcCache.filter = b.dataset.mcf;
    renderMcList();
  }));
  const nb = $('mc-names');
  if (nb) nb.addEventListener('click', () => {
    mcCache.showNames = !mcCache.showNames;
    Store.save({ clientShowNames: mcCache.showNames });
    renderMcList();
  });
}

/* ── Per-AP clients · v1.5.22 ──
   One sta_users call (staType=currentUser) grouped by AP serial gives the
   per-AP client list: MAC/IP, voucher code (client username), connect time
   (onlineTime), duration (activeTime), signal. The voucher code is matched
   against the voucher list for package/price; unmatched codes are shown raw,
   never guessed. Tapping a client loads its onofflineUserHistory — consecutive
   records on different AP serials mean the client roamed between APs. */
let _acVMap = null, _acVMapPid = 0;
/* v1.5.40: force=true refetches the voucher list from Cloud so voucher
 * statuses (expired/in-use) are realtime at view-open time. The old
 * session-long cache is what kept expired vouchers green. On fetch
 * failure the last-known map is returned instead of an empty one, so an
 * offline view still shows the previous enrichment instead of losing it. */
async function apClientVoucherMap(pid, force) {
  if (!force && _acVMap && _acVMapPid === pid) return _acVMap;
  try {
    const vs = await Api.voucherListAll(Number(pid), null);
    const m = new Map();
    (vs || []).forEach(v => { const c = vCode(v); if (c && !m.has(c)) m.set(c, v); });
    _acVMap = m; _acVMapPid = pid;
    return m;
  } catch (e) {
    if (_acVMap && _acVMapPid === pid) return _acVMap;
    throw e;
  }
}
const fmtDur = ms => {
  ms = Number(ms);
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};
const fmtTs = ts => {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return '—';
  try { return new Date(n).toLocaleString(); } catch (e) { return '—'; }
};
// Portal client records carry flowUpDown (total traffic, bytes) and
// downRate/upRate (live traffic, bps). Units verified against the portal's
// own rendering (MB for totals, bps/Kbps for live rates). Missing → '—'.
const fmtBytes = b => {
  if (b == null || b === '') return '—';
  const n = Number(b);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
};
const fmtRate = bps => {
  if (bps == null || bps === '') return '—';
  const n = Number(bps);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return `${n}bps`;
  if (n < 1000000) return `${(n / 1000).toFixed(2)}Kbps`;
  return `${(n / 1000000).toFixed(2)}Mbps`;
};
const apNameOf = (sn, apNames, fallback) => (apNames && apNames.get(String(sn))) || fallback || sn || '—';

/* ── Gateway-local AP client list (China APs) · v1.5.29 ──
 * Renders STA records from GwApi.staList() in the same table style as the
 * Cloud per-AP client view.
 * v1.5.31: voucher codes via MAC matching — the gateway reports no
 * auth-account field, but the Cloud portal's client list (authCount=true)
 * DOES carry per-client voucher accounts. When SSO is logged in, build a
 * MAC→voucher map from the portal and fill the Voucher column for any
 * gateway STA whose MAC appears there. Unmatched stays "—" (honest).
 * v1.5.33: MAC FORMAT FIX — the portal reports MACs dotted
 * (60c7.be3a.bea5) while the gateway reports colon-separated
 * (60:C7:BE:3A:BE:A5); plain uppercase-compare never matched. normMac
 * strips every non-hex character so both sides compare equal. */
const normMac = s => String(s || '').toUpperCase().replace(/[^0-9A-F]/g, '');
/* Build MAC→voucher and IP→voucher lookup maps from portal client records.
 * Pure and unit-testable. Portal records carry `account` (the voucher code
 * for voucher-auth clients) — verified 2026-09-28 against the portal's own
 * GLOBAL_USERS response. MAC is the primary key (normMac-normalized, so the
 * portal's dotted form 60c7.be3a.bea5 matches the gateway's 60:C7:BE:3A:BE:A5);
 * IP is a secondary fallback for STAs whose MAC didn't match. */
const gwVoucherMaps = plist => {
  const byMac = new Map(), byIp = new Map();
  (plist || []).forEach(p => {
    const acct = String(p.account || p.authAccount || p.authName || '').trim();
    if (!acct) return;
    const mac = normMac(p.mac || p.staMac);
    if (mac && !byMac.has(mac)) byMac.set(mac, acct);
    const ip = String(p.ip || '').trim();
    if (ip && !byIp.has(ip)) byIp.set(ip, acct);
  });
  return { byMac, byIp };
};
/* Voucher account for one gateway STA record: MAC match first, then IP
 * fallback. Returns '' when nothing matches — never fabricated. */
const gwVoucherForSta = (sta, byMac, byIp) =>
  (byMac && byMac.get(normMac(sta && sta.mac))) ||
  (byIp && sta && sta.ip && byIp.get(String(sta.ip).trim())) || '';

/* ── Voucher Authenticate records map · v1.5.39 ──
 * Build MAC→voucher / IP→voucher lookups from the portal's Auth Clients
 * records (Api.portalAuthUsers). Verified field names (portal's own code):
 * account, userIp, userMac, authType ("15" = Voucher). Pure and
 * unit-testable. A record's account is mapped ONLY when it is a genuine
 * voucher present in the voucher list — this keeps non-voucher auth
 * accounts (802.1X usernames, etc.) out of the voucher column without
 * guessing auth types. MAC is normMac-normalized (the portal reports
 * dotted form like 2285.27e9.c122). */
const authVoucherMaps = (records, voucherMap) => {
  const byMac = new Map(), byIp = new Map();
  (records || []).forEach(r => {
    const acct = String(r.account || '').trim();
    if (!acct) return;
    if (!voucherMap || !voucherMap.has(acct)) return;
    const mac = normMac(r.userMac);
    if (mac && !byMac.has(mac)) byMac.set(mac, acct);
    const ip = String(r.userIp || '').trim();
    if (ip && !byIp.has(ip)) byIp.set(ip, acct);
  });
  return { byMac, byIp };
};

/* ── Voucher MAC/IP cache · v1.5.37 ──
 * The portal's current-user snapshot only lists clients on Cloud-managed
 * APs *right now* — a client sitting on a China/local AP is absent, so the
 * gateway AP-clients view can't match its voucher live. But every portal
 * Online Clients load sees genuine MAC→voucher / IP→voucher pairs for the
 * visible clients; persist them locally (7-day TTL, 5000-entry cap) so the
 * gateway view can fall back to the last known voucher when the live
 * snapshot has no entry. Live data always wins; cached values are real
 * portal data observed earlier, never fabricated. */
const VCACHE_TTL = 7 * 24 * 3600 * 1000;
const VCACHE_MAX = 5000;
function cachePortalVouchers(plist) {
  let stored = null;
  try { stored = Store.load().vcache || null; } catch (e) { stored = null; }
  const m = (stored && stored.m) || {}, i = (stored && stored.i) || {};
  const now = Date.now();
  let touched = false;
  (plist || []).forEach(p => {
    const acct = String(p.account || p.authAccount || p.authName || '').trim();
    if (!acct) return;
    const mac = normMac(p.mac || p.staMac);
    if (mac) { m[mac] = { v: acct, ts: now }; touched = true; }
    const ip = String(p.ip || '').trim();
    if (ip) { i[ip] = { v: acct, ts: now }; touched = true; }
  });
  if (!touched) return;
  const cutoff = now - VCACHE_TTL;
  [m, i].forEach(obj => {
    Object.keys(obj).forEach(k => { if (!obj[k] || obj[k].ts < cutoff) delete obj[k]; });
    const keys = Object.keys(obj);
    if (keys.length > VCACHE_MAX) {
      keys.sort((a, b) => obj[a].ts - obj[b].ts).slice(0, keys.length - VCACHE_MAX)
        .forEach(k => delete obj[k]);
    }
  });
  try { Store.save({ vcache: { m, i } }); } catch (e) { /* cache is best-effort */ }
}
function getVoucherCache() {
  const byMac = new Map(), byIp = new Map();
  let stored = null;
  try { stored = Store.load().vcache || null; } catch (e) { stored = null; }
  const cutoff = Date.now() - VCACHE_TTL;
  const m = (stored && stored.m) || {}, i = (stored && stored.i) || {};
  Object.keys(m).forEach(k => { const e = m[k]; if (e && e.v && e.ts >= cutoff) byMac.set(k, e.v); });
  Object.keys(i).forEach(k => { const e = i[k]; if (e && e.v && e.ts >= cutoff) byIp.set(k, e.v); });
  return { byMac, byIp };
}
async function renderGwApClients(apSn, apName, clients, staTotal) {
  const showNames = Store.load().clientShowNames !== false;
  if (!clients.length) { $('ac-list').innerHTML = `<p class="muted">${esc(t('ac.none'))}</p>`; return; }
  // MAC → voucher code from the Cloud portal (SSO). The portal joins
  // auth-account data when authCount=true (v1.5.28 parity). NOTE: this is a
  // *current* snapshot — clients sitting on China/local APs are absent.
  // v1.5.37: the local voucher cache (populated from every portal Online
  // Clients load) fills those gaps; live data always wins.
  // v1.5.39: the portal's Voucher Authenticate records (auth-server data,
  // AP-independent) sit between live and cache — they cover China-AP
  // clients the live snapshot never lists. Priority: live > auth > cache.
  // Also try the local voucher map (open-API path) as a fallback.
  let vmap = new Map();
  try { vmap = await apClientVoucherMap(Number(S.projectId), true); } catch (e) {}
  let vByMac = new Map(), vByIp = new Map();
  let aByMac = new Map(), aByIp = new Map();
  if (Api.ssoLoggedIn()) {
    try {
      const pid = Number(S.projectId);
      let hasAuth = null;
      try { hasAuth = await Api.portalAuthStatus(pid); } catch (e) { hasAuth = null; }
      const plist = await Api.portalClients(pid, { pageSize: 1000, authCount: hasAuth !== false });
      ({ byMac: vByMac, byIp: vByIp } = gwVoucherMaps(plist));
      try { cachePortalVouchers(plist); } catch (e) { /* best-effort */ }
      try {
        const arecs = await Api.portalAuthUsers(pid);
        ({ byMac: aByMac, byIp: aByIp } = authVoucherMaps(arecs, vmap));
      } catch (e) { /* auth records best-effort — live + cache still apply */ }
    } catch (e) { /* portal voucher enrichment optional — stay honest "—" */ }
  }
  const vcache = getVoucherCache();
  const srcLine = `<p class="muted small">📡 ${esc(t('ac.srcGateway'))}</p>`;
  $('ac-list').innerHTML =
    `<p class="muted small">${esc(tx('ac.total', { n: clients.length }))}</p>` +
    srcLine +
    `<div class="chips"><button class="chip${showNames ? ' active' : ''}" id="ac-names">👤 ${esc(t('ac.names'))}</button></div>` +
    `<div class="wrap-scroll"><table class="data">` +
    `<tr><th>${t('mc.mac')}</th><th>${t('ac.voucher')}</th><th>${t('ac.ssid')}</th><th>${t('ac.signal')}</th></tr>` +
    clients.map(c => {
      const mac = c.mac || '—';
      const sig = (c.rssi !== '' && c.rssi != null) ? String(c.rssi) + ' dBm' : '—';
      const subs = [c.ip, (showNames ? c.host : '')].filter(Boolean).map(esc).join('<br>');
      const hostLine = subs ? `<br><small class="muted">${subs}</small>` : '';
      const vcode = gwVoucherForSta(c, vByMac, vByIp) || gwVoucherForSta(c, aByMac, aByIp) || gwVoucherForSta(c, vcache.byMac, vcache.byIp);
      // v1.5.40: shared voucher cell (plan · period · price + status color).
      const vcell = voucherCellHtml(vcode, vmap);
      return `<tr><td>${esc(mac)}${hostLine}</td>` +
        `<td>${vcell}</td>` +
        `<td><small>${esc(c.ssid || '—')}</small></td>` +
        `<td><small>${esc(sig)}</small></td></tr>`;
    }).join('') + `</table></div>`;
  $('ac-names').addEventListener('click', () => {
    Store.save({ clientShowNames: !showNames });
    apClientsView(apSn, apName, null, true);
  });
}

async function apClientsView(apSn, apName, apNames, isLocalAp) {
  const pid = Number(S.projectId);
  S.moreFn = () => apClientsView(apSn, apName, apNames, isLocalAp);
  moreShell(`${ic('user', 'sm')} ${esc(apName || apSn)} <small class="muted">· ${esc(t('ac.title'))}</small>`,
    `<div id="ac-list"><p class="muted">${t('more.loading')}</p></div>`);
  try {
    // v1.5.29: gateway-local APs (China-version APs invisible to Cloud) —
    // their clients come from the gateway's own STA list, not Cloud.
    if (isLocalAp && typeof GwApi !== 'undefined' && GwApi.loggedIn()) {
      let stas = [];
      try { stas = await GwApi.staList(); } catch (e) { stas = []; }
      // Match STAs to this AP by serial or by AP MAC (find the AP's MAC
      // from the last gateway device list when available).
      let apMac = '';
      try {
        const devs = await GwApi.deviceList();
        const me = (devs || []).find(d => String(d.serialNumber || '') === String(apSn));
        if (me) apMac = String(me.mac || '').toUpperCase();
      } catch (e) { /* device list optional for matching */ }
      const mine = (stas || []).filter(s =>
        String(s.apSn || '') === String(apSn) ||
        (apMac && String(s.apMac || '').toUpperCase() === apMac));
      // If STAs carry no AP link at all, show all (gateway-local view).
      const clients = mine.length ? mine : ((stas || []).length && !(stas || []).some(s => s.apSn || s.apMac) ? stas : []);
      if (clients.length || (stas || []).length) {
        await renderGwApClients(apSn, apName, clients, stas.length);
        return;
      }
      // Gateway STA modules unavailable — fall through to Cloud (honest "—").
    }
    // v1.5.25: prefer the portal client API (SSO) — its records carry
    // `account` (the auth account = voucher code for voucher-auth clients),
    // which the open-API sta_users does not return. Falls back to the
    // open API when SSO is unavailable or the portal call fails/empties.
    // v1.5.27: self-diagnosing — the view now reports exactly which source
    // was used and why vouchers are missing (SSO not logged in / portal
    // error / portal returned rows but no auth accounts), so a single
    // on-device test gives the definitive answer instead of silent "—".
    // v1.5.28: portal parity — check /intl/auth/v2/status first and send
    // authCount=true when the project has auth configured, exactly like the
    // portal's own client list does. That flag is what makes the backend
    // join auth-account data into the records.
    let clients = [], viaPortal = false, srcNote = '';
    const ssoOk = Api.ssoLoggedIn();
    if (ssoOk) {
      try {
        let hasAuth = null;
        try { hasAuth = await Api.portalAuthStatus(pid); }
        catch (e) { hasAuth = null; }
        const list = await Api.portalClients(pid, { linkedDevice: apSn, authCount: hasAuth !== false });
        const mineP = (list || []).filter(c =>
          String(c.linkedDevice || '') === String(apSn) ||
          (apName && String(c.deviceName || '') === String(apName)));
        if (mineP.length) {
          clients = mineP; viaPortal = true;
          if (hasAuth === false) srcNote = t('ac.noAuthCfg');
        }
        else srcNote = t('ac.portalNoMatch');
      } catch (e) { srcNote = t('ac.portalErr') + ': ' + String((e && e.message) || e || '').slice(0, 140); }
    } else {
      srcNote = t('ac.needSso');
    }
    if (!viaPortal) {
      const all = await Api.allOnlineClients(pid);
      clients = (all || []).filter(c => String(c.sn || c.apSn || '') === String(apSn));
    }
    let vmap = new Map();
    try { vmap = await apClientVoucherMap(pid, true); } catch (e) { /* voucher enrichment optional */ }
    // v1.5.26: the portal's own client table (GLOBAL_USERS, /network/current/user/
    // global/page) renders its auth columns from record.account — the auth account
    // (voucher code for voucher-auth clients), shown only when the project has
    // auth configured. record.userName is the DEVICE/host name (portal display
    // order: alias || userName || staModel || mac) — v1.5.25 wrongly fell back to
    // it, which is why device names appeared in the Voucher column.
    // The open-API sta_users has no account field at all: it can only attribute
    // a voucher when the value verifies against the voucher map; otherwise "—".
    // Device/host names are NEVER shown as vouchers.
    const acctOf = c => {
      if (viaPortal) return String(c.account || c.authAccount || c.authName || '').trim();
      const u = String(c.username || '').trim();
      return (u && vmap.has(u)) ? u : '';
    };
    const devNameOf = c => viaPortal
      ? String(c.alias || c.userName || '').trim()
      : String(c.hostname || '').trim();
    const showNames = Store.load().clientShowNames !== false;
    const mine = clients;
    if (!mine.length) { $('ac-list').innerHTML = `<p class="muted">${esc(t('ac.none'))}</p>`; return; }
    // v1.5.27: portal returned rows but none carry an auth account — the
    // SSIDs here are not doing cloud voucher auth (e.g. WPA2-PSK or a
    // router-local portal), so "—" is the honest answer.
    // v1.5.28: don't overwrite the no-auth-configured note — that's the
    // more precise diagnosis.
    if (viaPortal && !srcNote && !mine.some(c => String(c.account || c.authAccount || c.authName || '').trim())) {
      srcNote = t('ac.portalNoAcct');
    }
    const srcLine = `<p class="muted small">📡 ${esc(viaPortal ? t('ac.srcPortal') : t('ac.srcApi'))}${srcNote ? ' · ' + esc(srcNote) : ''}${S.clientsFetchedAt ? ' · ' + esc(t('v.updated')) + ' ' + esc(fmtTime(S.clientsFetchedAt)) : ''}</p>`; // v1.5.54: last-fetched
    const vCount = mine.filter(c => vmap.has(acctOf(c))).length;
    $('ac-list').innerHTML =
      `<p class="muted small">${esc(tx('ac.total', { n: mine.length }))} · ${esc(tx('ac.voucherN', { n: vCount }))}</p>` +
      srcLine +
      `<div class="chips"><button class="chip${showNames ? ' active' : ''}" id="ac-names">👤 ${esc(t('ac.names'))}</button></div>` +
      `<div class="wrap-scroll"><table class="data">` +
      `<tr><th>${t('mc.mac')}</th><th>${t('ac.voucher')}</th><th>${t('ac.ssid')}</th><th>${t('ac.since')} / ${t('ac.duration')}</th><th>${t('ac.signal')}</th></tr>` +
      mine.map((c, i) => {
        const mac = c.mac || '—';
        const acct = acctOf(c);
        // v1.5.40: shared voucher cell — plan · period · price + status
        // color, same as the gateway AP view.
        const since = fmtTs(c.onlineTime);
        // v1.5.25: portal records carry activeSec (seconds); open API uses activeTime (ms).
        const durMs = viaPortal
          ? (Number(c.activeSec) > 0 ? Number(c.activeSec) * 1000
            : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN))
          : (Number(c.activeTime) > 0 ? Number(c.activeTime)
            : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN));
        const sig = [c.rssi ? String(c.rssi) + ' dBm' : '', c.band || '', c.channel ? 'ch ' + c.channel : ''].filter(Boolean).join(' · ') || '—';
        const ip = viaPortal ? (c.ip || '') : (c.userIp || c.ip || '');
        const dn = showNames ? devNameOf(c) : '';
        const subs = [ip, dn].filter(Boolean).map(esc).join('<br>');
        const hostLine = subs ? `<br><small class="muted">${subs}</small>` : '';
        const ssid = c.ssid || '—';
        return `<tr data-accli="${i}" style="cursor:pointer"><td>${esc(mac)}${hostLine}</td>` +
          `<td>${voucherCellHtml(acct, vmap)}</td>` +
          `<td><small>${esc(ssid)}</small></td>` +
          `<td><small>${esc(since)}<br>${esc(fmtDur(durMs))}</small></td>` +
          `<td><small>${esc(sig)}</small></td></tr>` +
          `<tr data-acroam="${i}" style="display:none"><td colspan="5"><div id="ac-roam-${i}"><p class="muted small">${t('more.loading')}</p></div></td></tr>`;
      }).join('') + `</table></div><p class="muted small">${esc(t('ac.tapRoam'))}</p>`;
    $('ac-names').addEventListener('click', () => {
      Store.save({ clientShowNames: !showNames });
      apClientsView(apSn, apName, apNames);
    });
    document.querySelectorAll('#ac-list [data-accli]').forEach(row => {
      row.addEventListener('click', async () => {
        const i = row.dataset.accli;
        const rrow = document.querySelector(`#ac-list [data-acroam="${i}"]`);
        const box = $('ac-roam-' + i);
        if (rrow.style.display !== 'none') { rrow.style.display = 'none'; return; }
        rrow.style.display = '';
        if (box.dataset.done) return;
        box.dataset.done = '1';
        try {
          const c = mine[Number(i)];
          const hist = await Api.clientHistory(pid, c.mac);
          const recs = (hist || [])
            .map(h => ({ t: Number(h.onlineTime || h.updateTime || 0), sn: String(h.sn || h.apSn || ''), nm: h.deviceAliasName || '' }))
            .filter(r => r.t > 0 && r.sn)
            .sort((a, b) => a.t - b.t);
          const roams = [];
          for (let k = 1; k < recs.length; k++) {
            if (recs[k].sn !== recs[k - 1].sn) roams.push({ from: recs[k - 1], to: recs[k] });
          }
          box.innerHTML = roams.length
            ? `<p class="small"><b>${esc(t('ac.roamTitle'))}</b></p>` + roams.map(r =>
                `<p class="small">${esc(apNameOf(r.from.sn, apNames, r.from.nm))} → ${esc(apNameOf(r.to.sn, apNames, r.to.nm))}<br><small class="muted">${esc(fmtTs(r.to.t))}</small></p>`).join('')
            : `<p class="muted small">${esc(t('ac.roamNone'))}</p>`;
        } catch (e) { box.innerHTML = `<p class="err small">${esc(e.message || e)}</p>`; }
      });
    });
  } catch (e) { $('ac-list').innerHTML = `<p class="err">${esc(e.message || e)}</p>`; }
}

async function moreNetworks() {
  S.moreFn = moreNetworks;
  moreShell(`${ic('globe', 'sm')} ${esc(t('mn.title'))}`, `<div id="mn-tree"><p class="muted">${t('more.loading')}</p></div>
    <div class="row"><button class="btn" id="mn-add">${ic('plus', 'sm')}<span>${t('mn.add')}</span></button></div><div id="mn-form"></div>`);
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

/* ═══════════ SALES LEDGER (ရောင်းရငွေစာရင်း) · v1.5.9 ═══════════
   Official portal "Voucher Report" style: No. | Profile Name | Price |
   Quantity (made) | Activated Accounts (sold) | Total Price, with
   Last 1/7/30 Days + Custom filters and a Total row.
   Sale-day rule: a voucher counts on the day it was FIRST USED
   (activation), whether it is now used or expired. Ruijie validity
   starts at first authentication, so activation = expiryTime − timePeriod.
   Falls back to createTime only when underivable (disclosed in UI). */
function voucherActivatedTime(v) {
  const exp = Number(v.expiryTime), per = Number(v.timePeriod);
  if (exp > 0 && per > 0) {
    const t = exp - per * 60000; // timePeriod is in minutes
    if (t > 946684800000 && t <= Date.now() + 86400000) return t; // sanity: after 2000, not future
  }
  return null;
}
const fmtMoney = n => `${Number(n || 0).toLocaleString('en-US')} Ks`;
function pkgPriceNum(p) {
  const n = parseFloat(String(p.price || p.packagePrice || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function voucherPkgName(v) { return v.packageName || v.userGroupName || ''; }

// v1.5.53: sales-ledger range windows. "Today" = start of today (local) →
// now; "Yesterday" = start of yesterday → start of today (local), so the
// two days are distinct choices. ("day1" kept for backward compatibility.)
function salesRangeBounds(range, nowMs) {
  const dayMs = 864e5;
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  const startToday = d.getTime();
  if (range === 'today') return [startToday, nowMs];
  if (range === 'yday') return [startToday - dayMs, startToday];
  if (range === 'day1') {
    d.setDate(d.getDate() - 1);
    return [d.getTime(), nowMs];
  }
  if (range === 'day7') return [nowMs - 7 * dayMs, nowMs];
  if (range === 'day30') return [nowMs - 30 * dayMs, nowMs];
  return [0, Infinity];
}
async function moreSales() {
  const todayStr = new Date().toISOString().slice(0, 10);
  S.moreFn = moreSales;
  moreShell(`${ic('chart', 'sm')} ${esc(t('sl.title'))}`,
    `<div class="chips" id="sl-chips">
       <button class="chip active" data-r="today">${t('sl.today')}</button>
       <button class="chip" data-r="yday">${t('sl.yday')}</button>
       <button class="chip" data-r="day7">${t('sl.day7')}</button>
       <button class="chip" data-r="day30">${t('sl.day30')}</button>
       <button class="chip" data-r="custom">${t('sl.custom')}</button>
     </div>
     <div id="sl-custom" class="row hidden" style="margin-top:10px">
       <label style="flex:1">${t('sl.from')} <input type="date" id="sl-from" value="${todayStr}"></label>
       <label style="flex:1">${t('sl.to')} <input type="date" id="sl-to" value="${todayStr}"></label>
     </div>
     <div id="sl-list" style="margin-top:10px"><p class="muted">${t('more.loading')}</p></div>
     <div class="row"><button class="btn" id="sl-refresh">${ic('refresh', 'sm')}<span>${t('sl.refreshV')}</span></button></div>
     <p class="muted small">${t('sl.dateNote2')}</p>`);
  await ensurePackages();
  const priceByPkg = {};
  S.packages.forEach(p => { const nm = pkgName(p); if (nm && !(nm in priceByPkg)) priceByPkg[nm] = pkgPriceNum(p); });

  let range = 'today';
  let prevTotals = null; /* v1.5.56: animate sales totals on change */
  const dayMs = 864e5;
  const rangeBounds = () => {
    if (range === 'custom') {
      const now = Date.now();
      const f = $('sl-from').value, tt = $('sl-to').value;
      const s = f ? new Date(f + 'T00:00:00').getTime() : 0;
      const e = tt ? new Date(tt + 'T00:00:00').getTime() + dayMs : now + dayMs;
      return [s, e];
    }
    return salesRangeBounds(range, Date.now());
  };
  // Sale day = day the voucher was FIRST USED (activation), whether it is
  // now used (2) or expired (3). Falls back to creation time when the
  // activation cannot be derived (disclosed in the note below the table).
  const saleTimeOf = v => voucherActivatedTime(v) || (v.createTime || 0);

  const render = () => {
    const [rs, re] = rangeBounds();
    const byPkg = {};
    const grp = v => {
      const nm = voucherPkgName(v) || t('sl.unknownPkg');
      if (!byPkg[nm]) byPkg[nm] = { made: 0, sold: 0 };
      return byPkg[nm];
    };
    // Quantity: vouchers created in the period (any status)
    S.vouchers.forEach(v => {
      const ct = v.createTime || 0;
      if (ct >= rs && ct < re) grp(v).made++;
    });
    // Activated Accounts: used/expired vouchers whose FIRST USE falls in the period
    S.vouchers.forEach(v => {
      const st = String(v.status);
      if (st !== '2' && st !== '3') return;
      const stime = saleTimeOf(v);
      if (stime >= rs && stime < re) grp(v).sold++;
    });
    let tm = 0, ts = 0, tr = 0;
    const rows = Object.keys(byPkg).sort().map((nm, i) => {
      const g = byPkg[nm], price = priceByPkg[nm] || 0, rev = g.sold * price;
      tm += g.made; ts += g.sold; tr += rev;
      return `<tr><td>${i + 1}</td><td>${esc(nm)}</td>` +
        `<td class="num">${price ? esc(fmtMoney(price)) : '—'}</td>` +
        `<td class="num">${g.made.toLocaleString()}</td>` +
        `<td class="num"><b>${g.sold.toLocaleString()}</b></td>` +
        `<td class="num"><b>${price ? esc(fmtMoney(rev)) : '—'}</b></td></tr>`;
    }).join('');
    $('sl-list').innerHTML =
      `<div class="wrap-scroll"><table class="data">` +
      `<tr><th>${t('sl.no')}</th><th>${t('sl.profile')}</th><th class="num">${t('sl.price')}</th>` +
      `<th class="num">${t('sl.made')}</th><th class="num">${t('sl.activated')}</th><th class="num">${t('sl.totalPrice')}</th></tr>` +
      rows +
      `<tr><td colspan="3"><b>${t('sl.total')}</b></td>` +
      `<td class="num"><b id="sl-tm"></b></td>` +
      `<td class="num"><b id="sl-ts"></b></td>` +
      `<td class="num"><b id="sl-tr"></b></td></tr>` +
      `</table></div>`;
    // v1.5.56: iOS-style animated totals (tween from the previously shown values)
    const pt = prevTotals || { tm, ts, tr };
    animNum($('sl-tm'), tm, null, pt.tm);
    animNum($('sl-ts'), ts, null, pt.ts);
    animNum($('sl-tr'), tr, n => fmtMoney(Math.round(n)), pt.tr);
    prevTotals = { tm, ts, tr };
  };

  document.querySelectorAll('#sl-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#sl-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    range = c.dataset.r;
    $('sl-custom').classList.toggle('hidden', range !== 'custom');
    render();
  }));
  $('sl-from').addEventListener('change', render);
  $('sl-to').addEventListener('change', render);
  $('sl-refresh').addEventListener('click', async () => { await loadVouchers(); render(); });
  render();
}

/* ═══════════ SETTINGS ═══════════ */
function fillSettings() {
  const c = Api.cfg || {};
  $('set-cloud').value = c.cloud || '';
  $('set-appid').value = c.appid || '';
  $('set-proxy').value = c.proxy || '';
  $('set-secret').value = '';
  refreshSsoCard();
  refreshGwCard();
  refreshMonitorCard();
  refreshLiveCard();
}

/* ── v1.5.57: live voucher stats card in Settings ── */
function refreshLiveCard() {
  const tg = $('live-enable');
  if (!tg) return;
  const cfg = getLiveStats();
  tg.checked = cfg.enabled;
  document.querySelectorAll('#live-int-seg [data-live-int]').forEach(b =>
    b.classList.toggle('active', +b.dataset.liveInt === cfg.secs));
  const row = $('live-int-row');
  if (row) row.classList.toggle('hidden', !cfg.enabled);
}
function onLiveToggle() {
  const on = $('live-enable').checked;
  setLiveStats({ enabled: on });
  refreshLiveCard();
  restartLiveStats(on); // enabling refreshes once immediately
}

/* ── SSO session (Ruijie account login, Android APK only) ───────
 * Needed for voucher delete, which the public Open API does not offer. */
function refreshSsoCard() {
  const card = $('sso-card');
  if (!card) return;
  const statusEl = $('sso-status'), btn = $('btn-sso');
  const savedRow = $('sso-saved-row'), savedEmail = $('sso-saved-email');
  const rememberEl = $('sso-remember'), autoEl = $('sso-autologin');
  const switchBtn = $('btn-sso-switch');
  const extras = [savedRow, rememberEl && rememberEl.closest('.set-row'), autoEl && autoEl.closest('.set-row'), switchBtn].filter(Boolean);
  if (!hasSso()) {
    statusEl.textContent = t('sso.onlyAndroid');
    btn.classList.add('hidden');
    extras.forEach(el => el.classList.add('hidden'));
    return;
  }
  btn.classList.remove('hidden');
  extras.forEach(el => el.classList.remove('hidden'));
  const loggedIn = Api.ssoLoggedIn();
  statusEl.textContent = loggedIn ? t('sso.connected') : t('sso.notConnected');
  btn.querySelector('span').textContent = loggedIn ? t('sso.logout') : t('sso.login');
  btn.dataset.mode = loggedIn ? 'logout' : 'login';
  // Saved-account rows (v1.5.52): email is exposed, never the password.
  try {
    const info = JSON.parse(window.RuijieBridge.ssoAccountInfo());
    if (savedEmail) savedEmail.textContent = info.has && info.email ? info.email : '—';
    if (rememberEl) rememberEl.checked = !!info.rememberWanted;
    if (autoEl) autoEl.checked = !!info.autoLogin;
  } catch (e) { /* bridge older than v1.5.52: rows stay default */ }
}
function onSsoButton() {
  if (!hasSso()) { toast(t('sso.onlyAndroid'), true); return; }
  const btn = $('btn-sso');
  if (btn.dataset.mode === 'logout') {
    // v1.5.52: explicit logout suppresses the one-shot startup auto-login
    // for the rest of this app session.
    window.__ssoAutoTried = true;
    window.__ssoExplicitLogout = true; // v1.5.53: no silent re-auth after this
    window.RuijieBridge.ssoLogout();
  } else {
    try { window.RuijieBridge.ssoLogin(); }
    catch (e) { toast(t('sso.onlyAndroid'), true); }
  }
}
/* v1.5.52: switch account = forget saved creds + drop SSO cookies + fresh login dialog. */
function onSsoSwitch() {
  if (!hasSso()) { toast(t('sso.onlyAndroid'), true); return; }
  window.__ssoAutoTried = true; // this tap opens the dialog itself
  window.__ssoExplicitLogout = true; // v1.5.53: no silent re-auth after this
  try { window.RuijieBridge.ssoForgetAccount(); } catch (e) {}
  try { window.RuijieBridge.ssoLogout(); } catch (e) {}
  toast(t('sso.forgotten'));
  refreshSsoCard();
  try { window.RuijieBridge.ssoLogin(); }
  catch (e) { toast(t('sso.onlyAndroid'), true); }
}
function onSsoRemember() {
  if (!hasSso()) return;
  const on = $('sso-remember').checked;
  try { window.RuijieBridge.ssoSetRemember(on); } catch (e) {}
  if (!on && $('sso-autologin')) $('sso-autologin').checked = false;
  refreshSsoCard();
}
function onSsoAutoLogin() {
  if (!hasSso()) return;
  try { window.RuijieBridge.ssoSetAutoLogin($('sso-autologin').checked); } catch (e) {}
}

/* v1.5.52: one-shot startup SSO auto-login. Opens the SSO login dialog
 * automatically when saved credentials + auto-login are enabled and no
 * portal session exists. The cover auto-submits the saved credentials, so
 * the dialog closes by itself on success. Fires at most once per app
 * launch (window.__ssoAutoTried); an explicit logout sets the flag so the
 * dialog never reopens by itself afterwards. Never breaks startup. */
function maybeSsoAutoLogin() {
  if (window.__ssoAutoTried) return;
  window.__ssoAutoTried = true;
  if (!hasSso()) return;
  try {
    const info = JSON.parse(window.RuijieBridge.ssoAccountInfo() || '{}');
    if (!info.has || !info.autoLogin) return;
    let loggedIn = false;
    try { loggedIn = !!JSON.parse(window.RuijieBridge.ssoStatus() || '{}').loggedIn; } catch (e) {}
    if (loggedIn) return;
    window.RuijieBridge.ssoLogin();
  } catch (e) { /* never break startup */ }
}

/* ── Device offline monitor (Android APK only, v1.5.52) ──────────
 * Background JobScheduler check (APs + Gateways): circular-badge
 * notification + custom sound, even with the app closed. */
function hasMonitor() {
  return !!(window.RuijieBridge && window.RuijieBridge.monitorInfo);
}
/** Push the current Cloud connection into the native monitor. The secret is
 *  passed straight to native private prefs — never logged, never displayed. */
function syncMonitorConfig() {
  if (!hasMonitor()) return;
  try {
    const cfg = Api.cfg || Api.loadCfg();
    if (!cfg) return;
    window.RuijieBridge.monitorSync(JSON.stringify({
      cloud: cfg.cloud || '', appid: cfg.appid || '',
      secret: cfg.secret || '', groupId: Number(S.projectId) || 0,
    }));
  } catch (e) {}
}
function refreshMonitorCard() {
  const card = $('mon-card');
  if (!card) return;
  const tg = $('mon-enable'), st = $('mon-status'), btn = $('btn-mon-check');
  const tgRow = tg && tg.closest('.set-row');
  if (!hasMonitor()) {
    st.textContent = t('mon.onlyAndroid');
    if (tgRow) tgRow.classList.add('hidden');
    btn.classList.add('hidden');
    return;
  }
  if (tgRow) tgRow.classList.remove('hidden');
  btn.classList.remove('hidden');
  let info = {};
  try { info = JSON.parse(window.RuijieBridge.monitorInfo()); } catch (e) {}
  tg.checked = !!info.enabled;
  st.textContent = info.enabled ? t('mon.on')
    : (!info.hasConfig ? t('mon.noConfig') : t('mon.off'));
}
function onMonitorToggle() {
  if (!hasMonitor()) return;
  const on = $('mon-enable').checked;
  try {
    if (on) {
      syncMonitorConfig();
      window.RuijieBridge.monitorRequestPermission();
    }
    window.RuijieBridge.monitorSetEnabled(on);
  } catch (e) {}
  setTimeout(refreshMonitorCard, 400);
}
function onMonitorCheckNow() {
  if (!hasMonitor()) { toast(t('mon.onlyAndroid'), true); return; }
  syncMonitorConfig();
  try { window.RuijieBridge.monitorCheckNow(); toast(t('mon.checking')); }
  catch (e) { toast(t('mon.onlyAndroid'), true); }
}

/* ── Gateway-local session (Android APK only) ───────────────────
 * Direct LAN connection to the user's own gateway eWeb. The password is
 * entered here in Settings and kept on this device only — never in chat,
 * never in logs, never sent anywhere except the gateway itself. */
const GW_STORE_KEYS = { ip: 'gwIp', pass: 'gwPass', auto: 'gwAuto' };
/* Gateway password is remembered on this device (localStorage) once the
 * user enters it — it stays until they change it. Never in chat, never in
 * logs, never sent anywhere except the gateway itself. */
const GwMem = { pass: '' };
function gwStored() {
  const s = Store.load();
  return { ip: s[GW_STORE_KEYS.ip] || '100.88.200.103', pass: GwMem.pass || s[GW_STORE_KEYS.pass] || '' };
}
function refreshGwCard() {
  const statusEl = $('gw-status'), btn = $('btn-gw');
  if (!statusEl || !btn) return;
  const st = gwStored();
  if ($('gw-ip') && !$('gw-ip').value) $('gw-ip').value = st.ip;
  if ($('gw-pass') && !$('gw-pass').value) $('gw-pass').value = st.pass;
  if (!hasGw()) {
    statusEl.textContent = t('gw.onlyAndroid');
    btn.classList.add('hidden');
    return;
  }
  btn.classList.remove('hidden');
  const on = GwApi.loggedIn();
  statusEl.textContent = on ? t('gw.connected') : t('gw.notConnected');
  btn.querySelector('span').textContent = on ? t('gw.disconnect') : t('gw.connect');
  btn.dataset.mode = on ? 'logout' : 'login';
}
async function onGwButton() {
  if (!hasGw()) { toast(t('gw.onlyAndroid'), true); return; }
  const btn = $('btn-gw');
  if (btn.dataset.mode === 'logout') {
    /* Explicit disconnect: stop auto-connect until the next manual login.
     * The remembered password is KEPT (the user said: keep using it until
     * it is changed) — only the auto-connect flag is turned off. */
    GwApi.logout();
    Store.save({ [GW_STORE_KEYS.auto]: false });
    refreshGwCard();
    toast(t('gw.bye'));
    return;
  }
  const ip = ($('gw-ip').value || '').trim() || '100.88.200.103';
  const pass = $('gw-pass').value || '';
  if (!pass) { toast(t('gw.needInfo'), true); return; }
  btn.disabled = true;
  try {
    await GwApi.login(ip, 'admin', pass);
    /* Remember the gateway password ONLY after a successful login — a
     * failed attempt must never overwrite the previously remembered one.
     * gwAuto=true: from now on the app re-connects by itself (startup +
     * session expiry) until the user explicitly disconnects. */
    Store.save({ [GW_STORE_KEYS.ip]: ip, [GW_STORE_KEYS.pass]: pass, [GW_STORE_KEYS.auto]: true });
    GwMem.pass = pass;
    toast(t('gw.ok'));
  } catch (e) {
    const m = String((e && e.message) || e);
    toast(/password encrypt|GW_PWD_ENC_PENDING/.test(m) ? t('gw.encPending') : m, true);
  } finally {
    btn.disabled = false;
    refreshGwCard();
  }
}

/* ═══════════ DIAGNOSTICS (Settings → စစ်ဆေးမှုများ) ═══════════
 * Login tests and voucher tests run separately (user picks which part
 * is broken). Read-only: nothing is created, deleted or changed.
 * The report is saved as .txt through the Android system file picker
 * (SAF), so the user chooses where it goes. */
const Diag = { results: [], running: false };

function diagAdd(section, name, status, detail) {
  Diag.results.push({ section, name, status, detail: String(detail || '') });
  renderDiagResults();
}
function diagStatusBadge(s) {
  const label = s === 'pass' ? t('diag.pass') : s === 'fail' ? t('diag.fail') : t('diag.skip');
  const color = s === 'pass' ? '#16a34a' : s === 'fail' ? '#dc2626' : '#9ca3af';
  const icon = s === 'pass' ? '✓' : s === 'fail' ? '✗' : '–';
  return `<span style="display:inline-block;min-width:86px;text-align:center;font-size:12px;font-weight:700;color:#fff;background:${color};border-radius:20px;padding:3px 10px;margin-right:8px">${icon} ${esc(label)}</span>`;
}
function renderDiagResults() {
  const box = $('diag-results');
  if (!box) return;
  const pad = $('diag-results-pad');
  if (!Diag.results.length) { box.innerHTML = ''; if (pad) pad.classList.add('hidden'); return; }
  if (pad) pad.classList.remove('hidden');
  box.innerHTML = Diag.results.map(r =>
    `<div style="display:flex;align-items:flex-start;gap:4px;padding:8px 0;border-top:1px solid var(--hair, #eee)">`
    + `<div style="flex-shrink:0;padding-top:1px">${diagStatusBadge(r.status)}</div>`
    + `<div style="min-width:0"><div style="font-weight:600;font-size:13px">${esc(r.name)}</div>`
    + (r.detail ? `<div class="muted small" style="word-break:break-word">${esc(r.detail)}</div>` : '')
    + `</div></div>`
  ).join('');
}
async function runDiagnostics() {
  if (Diag.running) return;
  const doLogin = $('diag-login') && $('diag-login').checked;
  const doVoucher = $('diag-voucher') && $('diag-voucher').checked;
  if (!doLogin && !doVoucher) { toast(t('diag.pickOne'), true); return; }
  Diag.running = true;
  Diag.results = [];
  renderDiagResults();
  const runBtn = $('btn-diag-run'), saveBtn = $('btn-diag-save');
  runBtn.disabled = true;
  runBtn.querySelector('span').textContent = t('diag.running');
  saveBtn.classList.add('hidden');

  if (doLogin) {
    // L1 — Open API auth (App ID/Secret)
    try {
      await Api.testConnection();
      diagAdd('login', 'App ID / App Secret', 'pass', t('toast.connected'));
    } catch (e) { diagAdd('login', 'App ID / App Secret', 'fail', e.message); }
    // L2/L3 — SSO (Android only)
    if (hasSso()) {
      let loggedIn = false;
      try { loggedIn = Api.ssoLoggedIn(); } catch (e) { /* ignore */ }
      diagAdd('login', 'Ruijie အကောင့် (SSO cookie)', loggedIn ? 'pass' : 'fail',
        loggedIn ? t('sso.connected') : t('sso.notConnected'));
      try {
        const info = JSON.parse(window.RuijieBridge.diagCookieInfo());
        const parts = [];
        for (const u of Object.keys(info)) {
          const host = u.replace('https://', '');
          const names = info[u] || [];
          parts.push(host + ': ' + (names.length ? names.join(', ') : '—'));
        }
        diagAdd('login', 'SSO cookie domains', 'pass', parts.join('  |  '));
      } catch (e) { diagAdd('login', 'SSO cookie domains', 'fail', e.message); }
      // L4 — portal session probe: delete envelope for a voucher code that
      // cannot exist. The portal checks the session first, so "not login"
      // means the portal session is missing; any other answer means the
      // session is alive (the fake voucher is simply not found). Nothing
      // real is deleted.
      try {
        const env = Api.ssoDeleteEnvelope('PROBE000', '00000000-0000-0000-0000-000000000000', S.projectId || 1);
        const res = JSON.parse(window.RuijieBridge.portalProbe(JSON.stringify(env)));
        if (res.error) diagAdd('login', t('diag.portalProbe'), 'fail', res.error);
        else if (res.notLogin) diagAdd('login', t('diag.portalProbe'), 'fail',
          'portal: "not login" — portal session မရှိသေးပါ (ထွက်ပြီး ပြန် login လုပ်ပါ)'
          + (res.sentCookies ? ' · sent: ' + res.sentCookies : ''));
        else diagAdd('login', t('diag.portalProbe'), 'pass',
          'portal session ok · HTTP ' + res.http + ' (ကုဒ်အတုမို့ မတွေ့တာ ပုံမှန်ပါ)'
          + (res.sentCookies ? ' · sent: ' + res.sentCookies : ''));
      } catch (e) { diagAdd('login', t('diag.portalProbe'), 'fail', e.message); }
      // L5 — login trace: proves whether the portal SSO handshake completed
      try {
        const tr = JSON.parse(window.RuijieBridge.diagLoginTrace());
        const urls = tr.urls || [];
        const tail = urls.slice(-3).map(u => u.replace(/^https?:\/\//, '')).join(' → ');
        diagAdd('login', t('diag.loginTrace'), tr.result === 'success' ? 'pass' : 'skip',
          'result=' + tr.result + (tr.at ? ' · ' + tr.at : '') + ' · steps=' + urls.length + (tail ? ' · ' + tail : ''));
      } catch (e) { diagAdd('login', t('diag.loginTrace'), 'fail', e.message); }
    } else {
      diagAdd('login', 'Ruijie အကောင့် (SSO)', 'skip', t('sso.onlyAndroid'));
    }
  }

  if (doVoucher) {
    // V1 — voucher list (read-only, first page)
    if (S.projectId) {
      try {
        const { count, list } = await Api.voucherListPage(S.projectId, 0, 5);
        const sample = (list[0] && (list[0].voucherCode || list[0].codeNo)) || '';
        diagAdd('voucher', 'Voucher စာရင်း', 'pass',
          'count=' + count + (sample ? ', sample=' + sample : ''));
      } catch (e) { diagAdd('voucher', 'Voucher စာရင်း', 'fail', e.message); }
    } else {
      diagAdd('voucher', 'Voucher စာရင်း', 'skip', 'project not selected');
    }
    // V2 — delete readiness: LOCAL check only, no request is sent
    try {
      const ssoOk = hasSso() && Api.ssoLoggedIn();
      const env = Api.ssoDeleteEnvelope('TESTCODE', 'TEST-UUID', S.projectId || 1);
      const shapeOk = env.api === '/intlSamVoucher/v2/delete'
        && env.authParams && env.authParams.method === 'DELETE'
        && env.method === 'DELETE' && env.module === 'default'
        && env.params && env.params[0] && env.params[0].voucherCode === 'TESTCODE'
        && env.querys && env.querys.ids === 'TEST-UUID' && env.querys.lang === 'en';
      if (ssoOk && shapeOk) diagAdd('voucher', 'ဖျက်ဖို့အဆင်သင့်ဖြစ်မှု', 'pass', 'SSO ok · envelope ok (တကယ်မဖျက်ပါ)');
      else diagAdd('voucher', 'ဖျက်ဖို့အဆင်သင့်ဖြစ်မှု', 'fail',
        [!ssoOk ? t('sso.notConnected') : '', !shapeOk ? 'envelope shape' : ''].filter(Boolean).join(' · '));
    } catch (e) { diagAdd('voucher', 'ဖျက်ဖို့အဆင်သင့်ဖြစ်မှု', 'fail', e.message); }
  }

  saveBtn.classList.remove('hidden');
  runBtn.disabled = false;
  runBtn.querySelector('span').textContent = t('diag.run');
  Diag.running = false;
}
function diagReportText() {
  const L = [];
  L.push('Ruijie Voucher App — Diagnostic Report');
  L.push('Date: ' + new Date().toLocaleString());
  L.push('App version: ' + APP_VERSION + ' (Android APK)');
  try { L.push('Project: ' + (S.projectId || '—')); } catch (e) { /* ignore */ }
  L.push('');
  let sec = '';
  for (const r of Diag.results) {
    const s = r.section === 'login' ? 'Login' : 'Voucher';
    if (s !== sec) { sec = s; L.push('[' + s + ']'); }
    L.push('  ' + r.status.toUpperCase() + ' — ' + r.name + (r.detail ? ': ' + r.detail : ''));
  }
  L.push('');
  L.push('Note: nothing real was created, deleted or changed.');
  L.push('The portal session probe uses a voucher code that cannot exist,');
  L.push('so it deletes nothing — it only checks whether the portal');
  L.push('session is alive.');
  // Full login trace (URLs only, no credentials)
  try {
    if (window.RuijieBridge && window.RuijieBridge.diagLoginTrace) {
      const tr = JSON.parse(window.RuijieBridge.diagLoginTrace());
      if (tr.urls && tr.urls.length) {
        L.push('');
        L.push('[Login trace] result=' + tr.result + (tr.at ? ' at ' + tr.at : ''));
        tr.urls.forEach((u, i) => L.push('  ' + (i + 1) + '. ' + u));
      }
    }
  } catch (e) { /* ignore */ }
  return L.join('\n');
}
function diagB64(s) {
  return btoa(unescape(encodeURIComponent(s)));
}
function saveDiagReport() {
  if (!Diag.results.length) return;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const fname = 'ruijie-diagnostic-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate())
    + '-' + p(d.getHours()) + p(d.getMinutes()) + '.txt';
  const b64 = diagB64(diagReportText());
  if (window.RuijieBridge && window.RuijieBridge.diagSaveReport) {
    // Android: system file picker — the user chooses where the .txt goes.
    try { window.RuijieBridge.diagSaveReport(fname, b64); }
    catch (e) { toast(t('diag.saveFail') + e.message, true); }
  } else {
    // Web fallback: direct download.
    const blob = new Blob([diagReportText()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast(t('diag.saved'));
  }
}
// Native file-picker result → toast. Registered once at startup.
window._diagEvent = function (name) {
  if (name === 'saved') toast(t('diag.saved'));
  else if (name === 'cancel') toast(t('diag.saveCancel'));
  else toast(t('diag.saveFail'), true);
};
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
  const sep = $('set-err-pad'); if (sep) sep.classList.add('hidden');
  Api.saveCfg(nc);
  try {
    await Api.testConnection();
    toast(t('toast.saved'));
    S.vouchers = []; S.packages = [];
    loadProjects().then(loadVouchers);
    loadAccountInfo();
  } catch (e) { showErr('set-err', t('err.connectFail') + e.message); }
}

/* ═══════════ v1.5.54: pull-to-refresh ═══════════
   Swipe down at the top of any view to refresh it. Pure JS so it works
   on web + APK. Only triggers when #main is scrolled to the very top. */
function ptrRefresh() {
  const v = S.currentView || 'view-vouchers';
  if (v === 'view-vouchers') { loadVouchers(); return; }
  if (v === 'view-printer') { try { renderQueue(); } catch (e) {} try { btCacheState(); } catch (e) {} try { renderPrinterDots(); } catch (e) {} return; }
  if (v === 'view-generate') { try { ensurePackages(); } catch (e) {} try { renderRecentGen(); } catch (e) {} try { btCacheState(); } catch (e) {} return; }
  if (v === 'view-more') {
    const top = S.moreStack[S.moreStack.length - 1];
    if (top) { try { top(); } catch (e) {} }
    return;
  }
  if (v === 'view-settings') { try { fillSettings(); } catch (e) {} return; }
}
function initPullToRefresh() {
  const main = $('main'), ind = $('ptr-indicator');
  if (!main || !ind) return;
  let startY = null;
  const THRESHOLD = 70, ARM = 10; /* must still be past THRESHOLD on release */
  main.addEventListener('touchstart', e => {
    if (main.scrollTop <= 0 && e.touches.length === 1) {
      startY = e.touches[0].clientY;
      ind.classList.remove('show', 'ready');
      ind.querySelector('.ic').classList.remove('spin');
    } else startY = null;
  }, { passive: true });
  main.addEventListener('touchmove', e => {
    if (startY == null || main.scrollTop > 0) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > ARM) ind.classList.add('show');
    else ind.classList.remove('show'); /* pushed back up: cancel the hint live */
    ind.classList.toggle('ready', dy >= THRESHOLD);
  }, { passive: true });
  const cancel = () => { startY = null; ind.classList.remove('show', 'ready'); };
  main.addEventListener('touchend', e => {
    const dy = startY == null ? 0 : (e.changedTouches[0].clientY - startY);
    const go = dy >= THRESHOLD && ind.classList.contains('show');
    cancel();
    if (!go) return; /* pulled then pushed back up: no refresh */
    ind.classList.add('show');
    ind.querySelector('.ic').classList.add('spin');
    try { ptrRefresh(); } catch (err) {}
    setTimeout(() => ind.classList.remove('show'), 900);
  }, { passive: true });
  main.addEventListener('touchcancel', cancel, { passive: true });
}

/* ═══════════ INIT ═══════════ */
function init() {
  if (init._done) return; // guard against double script evaluation
  init._done = true;
  initTheme();
  initLang();
  initLiquidWobble();
  initPullToRefresh();
  initIosPickers();   // v1.5.55: bottom-sheet pickers for project/usergroup/package
  initKickSettings(); // v1.5.55: kick toggle + status
  initTabbarDrag();   // v1.5.55: press-drag along the tabbar to switch pages

  // password peek toggles
  document.querySelectorAll('[data-peek]').forEach(b => b.addEventListener('click', () => {
    const i = $(b.dataset.peek);
    if (i) i.type = i.type === 'password' ? 'text' : 'password';
  }));

  $('btn-connect').addEventListener('click', doConnect);
  document.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', () => switchView(tb.dataset.view)));
  $('project-select').addEventListener('change', onProjectChange);

  // v1.5.53: search opens ONLY on magnifier tap; toggles closed.
  // Single source of truth = .open class, so it can never get stuck open.
  const searchInput = $('voucher-search'), searchWrap = $('search-wrap'), searchBtn = $('btn-search');
  const isSearchOpen = () => searchWrap.classList.contains('open');
  const setSearchOpen = (open) => {
    searchWrap.classList.toggle('open', open);
    if (open) { searchInput.focus(); }
    else {
      searchInput.value = ''; S.vFilter = '';
      searchWrap.classList.remove('has-text');
      renderVouchers(); searchInput.blur();
    }
  };
  searchInput.addEventListener('input', e => {
    S.vFilter = e.target.value;
    searchWrap.classList.toggle('has-text', !!e.target.value);
    renderVouchers();
  });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') setSearchOpen(false); });
  searchBtn.addEventListener('click', () => {
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers');
    setSearchOpen(!isSearchOpen());
  });
  $('search-clear').addEventListener('click', () => {
    if (searchInput.value) {
      searchInput.value = ''; S.vFilter = '';
      searchWrap.classList.remove('has-text');
      renderVouchers(); searchInput.focus();
    } else setSearchOpen(false); // X on empty field closes the search
  });
  // v1.5.53: topbar printer icon → printer view
  $('btn-printer-top').addEventListener('click', () => switchView('view-printer'));
  $('btn-refresh-vouchers').addEventListener('click', function () {
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers');
    this.classList.add('spinning');
    loadVouchers().finally(() => this.classList.remove('spinning'));
  });
  // v1.5.54: bulk select
  $('btn-bulk-select').addEventListener('click', toggleBulkMode);
  $('btn-bulk-print').addEventListener('click', bulkPrint);
  $('btn-bulk-delete').addEventListener('click', bulkDelete);
  $('btn-bulk-cancel').addEventListener('click', toggleBulkMode);

  document.querySelectorAll('#voucher-status-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#voucher-status-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); S.vStatus = c.dataset.s; renderVouchers();
  }));
  $('modal-close').addEventListener('click', () => closeModal('modal'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal('modal'); });
  $('modal-print').addEventListener('click', () => { if (modalVoucher) doPrint([{ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }]); });
  $('modal-queue').addEventListener('click', () => { if (modalVoucher) addToQueue({ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }); });
  $('modal-delete').addEventListener('click', deleteVoucher);

  // print progress sheet (v1.5.56)
  $('pp-close').addEventListener('click', ppClose);
  $('pp-done').addEventListener('click', ppClose);
  $('print-progress-modal').addEventListener('click', e => { if (e.target === $('print-progress-modal')) ppClose(); });

  // print preview sheet
  $('preview-close').addEventListener('click', () => closeModal('preview-modal'));
  $('preview-modal').addEventListener('click', e => { if (e.target === $('preview-modal')) closeModal('preview-modal'); });
  $('btn-print-preview').addEventListener('click', openPrintPreview);
  $('btn-preview-print').addEventListener('click', () => {
    closeModal('preview-modal');
    doPrint([{ code: 'TEST-1234', pkg: t('tkt.test'), period: 60, quota: 1024 }]);
  });

  // steppers
  wireStepper('copies-minus', 'copies-plus', 'print-copies', 1, 10);

  // iOS segmented paper size (syncs hidden select used by printSettings)
  document.querySelectorAll('#paper-seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#paper-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('print-paper').value = b.dataset.paper;
    Store.save({ printPaper: b.dataset.paper });
  }));

  // theme picker (Settings → Appearance)
  document.querySelectorAll('#theme-grid .theme-opt').forEach(b =>
    b.addEventListener('click', () => applyTheme(b.dataset.themeOpt)));

  // language (မြန်မာ / English)
  document.querySelectorAll('#lang-seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  $('btn-generate').addEventListener('click', doGenerate);
  $('btn-generate-print').addEventListener('click', doGeneratePrint);
  $('btn-gen-print-all').addEventListener('click', () => doPrint(genResultItems));
  $('btn-recent-print-all').addEventListener('click', () => doPrint(recentGenItems));
  $('btn-recent-queue-all').addEventListener('click', () => { recentGenItems.forEach(addToQueue); });
  $('btn-gen-queue-all').addEventListener('click', () => { genResultItems.forEach(addToQueue); });
  $('btn-print-test').addEventListener('click', () => doPrint([{ code: 'TEST-1234', pkg: t('tkt.test'), period: 60, quota: 1024 }]));
  $('btn-queue-print').addEventListener('click', () => doPrint(S.queue));
  $('btn-queue-clear').addEventListener('click', () => { S.queue = []; renderQueue(); });

  // print layout & typography
  loadPrintStyle();
  wireGenerateView();
  wireLayoutModal();
  // bluetooth thermal printer (printer-v1 engine, APK only)
  initBtPrinter();
  btPollStart();
  // auto-connect to the last used printer if the user enabled it
  if (Store.load().btAutoConnect) setTimeout(() => btAutoConnect(true), 2000);
  wireTypoModal();
  $('btn-print-layout').addEventListener('click', openLayoutModal);
  $('btn-print-typo').addEventListener('click', openTypoModal);

  document.querySelectorAll('#more-menu .menu-item').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.more;
    if (k === 'accounts') moreAccounts();
    else if (k === 'usergroups') moreUserGroups();
    else if (k === 'devices') moreDevices();
    else if (k === 'clients') moreClients();
    else if (k === 'history') moreHistory(); // v1.5.54
    else if (k === 'networks') moreNetworks();
  else if (k === 'sales') moreSales();
  }));

  $('btn-save-settings').addEventListener('click', saveSettings);
  $('btn-sso').addEventListener('click', onSsoButton);
  const _sw = $('btn-sso-switch'); if (_sw) _sw.addEventListener('click', onSsoSwitch);
  const _rm = $('sso-remember'); if (_rm) _rm.addEventListener('change', onSsoRemember);
  const _al = $('sso-autologin'); if (_al) _al.addEventListener('change', onSsoAutoLogin);
  const _me = $('mon-enable'); if (_me) _me.addEventListener('change', onMonitorToggle);
  const _mc = $('btn-mon-check'); if (_mc) _mc.addEventListener('click', onMonitorCheckNow);
  // v1.5.57: live voucher stats — auto-refresh of the 4 stat cards
  const _le = $('live-enable'); if (_le) _le.addEventListener('change', onLiveToggle);
  document.querySelectorAll('#live-int-seg [data-live-int]').forEach(b => b.addEventListener('click', () => {
    setLiveStats({ secs: +b.dataset.liveInt });
    refreshLiveCard();
    restartLiveStats(false);
  }));
  restartLiveStats(false);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) liveStatsTick(false); });
  $('btn-gw').addEventListener('click', onGwButton);
  $('btn-diag-run').addEventListener('click', runDiagnostics);
  $('btn-diag-save').addEventListener('click', saveDiagReport);
  // SSO login/logout events from the native dialog
  /* v1.5.53: silent re-authentication after the portal session dies
 * mid-session (e.g. stale cookies after the app was swiped away / the phone
 * restarted — Devices showed "not login"/403). Uses the saved account when
 * auto-login is enabled; the SSO dialog opens and auto-submits by itself.
 * Loop-safe: at most one silent re-auth per 5 minutes, and never after an
 * explicit user logout (window.__ssoExplicitLogout). */
let ssoLastReauth = 0;
/* v1.5.53: one-shot retry of the portal operation that died with the session.
   When a portal call fails with a dead session, the caller stores a retry
   closure here and kicks off silent re-auth. On the next successful login
   the closure runs ONCE, then is cleared — so Devices reloads instead of
   leaving a "not login"/403 banner. Never retries genuine 403s. */
let ssoPendingRetry = null;
function ssoDeadSession(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  return m.includes('session expired') || m.includes('not login') || m.includes('ssojump');
}
function ssoQueueRetry(fn) {
  ssoPendingRetry = fn; // at most one pending retry; a newer failure replaces it
}
function ssoSilentReauth() {
  if (!hasSso()) return;
  const now = Date.now();
  if (now - ssoLastReauth < 5 * 60 * 1000) return;
  let info = null;
  try { info = JSON.parse(window.RuijieBridge.ssoAccountInfo() || '{}'); } catch (e) {}
  if (!info || !info.has || !info.autoLogin) return;
  ssoLastReauth = now;
  try { window.RuijieBridge.ssoLogin(); } catch (e) { /* never break the UI */ }
}
  document.addEventListener('ruijie-sso', (e) => {
    refreshSsoCard();
    if (e.detail === 'login') {
      window.__ssoExplicitLogout = false; // a fresh login clears the flag
      toast(t('sso.welcome'));
      // v1.5.53: run the one-shot retry of the operation that died, if any.
      if (ssoPendingRetry) {
        const fn = ssoPendingRetry; ssoPendingRetry = null;
        try { fn(); } catch (err) { /* never break the UI */ }
      }
    }
    if (e.detail === 'logout') {
      if (window.__ssoExplicitLogout) { toast(t('sso.bye')); ssoPendingRetry = null; }
      else ssoSilentReauth(); // dead session → silently re-authenticate
    }
  });
  $('btn-disconnect').addEventListener('click', () => {
    if (!confirm(t('confirm.signout'))) return;
    Api.clearCfg();
    location.reload();
  });

  applyLang();

  Api.loadCfg();
  // Login stays clean: proxy has a working default and is editable in Settings.
  // Show the login proxy field only on web when no proxy is saved yet (it is required there).
  const pf = $('cfg-proxy');
  const needProxyField = !hasBridge() && !(Api.cfg && Api.cfg.proxy);
  if (pf && pf.closest('label')) pf.closest('label').style.display = needProxyField ? '' : 'none';
  if (Api.cfg && Api.cfg.appid) enterApp();
  else $('view-connect').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
