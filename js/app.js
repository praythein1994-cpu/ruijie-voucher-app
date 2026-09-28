/**
 * Ruijie Voucher App — UI logic (vanilla JS) · v1.2.0
 * iOS design · SVG icon system · EN/MY i18n · tablet layouts
 */
'use strict';

const APP_VERSION = '1.5.25';

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
  'tkt.profileName': { my: 'Profile အမည်: ', en: 'Profile Name: ' },
  'pl.openLayout': { my: 'Print Layout & Spacing', en: 'Print Layout & Spacing' },
  'pl.title': { my: 'Print Layout & Spacing', en: 'Print Layout & Spacing' },
  'pl.reset': { my: 'မူလအတိုင်း ပြန်ထားမယ်', en: 'Reset Defaults' },
  'pl.live': { my: 'တိုက်ရိုက်အစမ်းကြည့်ခြင်း (58mm / 384 dots):', en: 'LIVE OUTPUT PREVIEW (58mm / 384 dots):' },
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
  'mc.mac': { my: 'MAC / IP', en: 'MAC / IP' },
  'mc.ssid': { my: 'SSID', en: 'SSID' },
  'ac.title': { my: 'AP ချိတ်ဆက်သူများ', en: 'AP clients' },
  'ac.none': { my: 'ချိတ်ဆက်ထားသူမရှိပါ', en: 'No connected clients' },
  'ac.total': { my: 'စုစုပေါင်း {n} ယောက်', en: '{n} clients' },
  'ac.voucherN': { my: 'voucher နဲ့ {n} ယောက်', en: '{n} on vouchers' },
  'ac.voucher': { my: 'Voucher', en: 'Voucher' },
  'ac.since': { my: 'စချိတ်ချိန်', en: 'Connected at' },
  'ac.duration': { my: 'ကြာချိန်', en: 'Duration' },
  'ac.signal': { my: 'ဆစ်ဂနယ်', en: 'Signal' },
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
  if (!$('layout-modal').classList.contains('hidden')) renderLayoutModal();
  if (!$('typo-modal').classList.contains('hidden')) renderTypoModal();
  if (S.account) loadAccountInfo();
  if (S.moreFn) S.moreFn();
}

/* ── helpers ── */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  loadProjects().then(() => { switchView('view-vouchers', false); try { history.replaceState({ view: 'view-vouchers' }, ''); } catch (e) {} S.currentView = 'view-vouchers'; });
  // Vouchers start immediately with the stored project (in parallel with
  // the project list) instead of waiting for it — the list reconciles after.
  if (S.projectId) loadVouchers();
  loadAccountInfo();
}

function switchView(id, push) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(tb => tb.classList.toggle('active', tb.dataset.view === id));
  if (id === 'view-vouchers' && S.vouchers.length === 0 && !S._vouchersLoading) loadVouchers();
  if (id === 'view-generate') { ensurePackages(); renderRecentGen(); btCacheState(); renderPrinterDots(); }
  if (id === 'view-printer') { renderQueue(); btCacheState(); renderPrinterDots(); }
  if (id === 'view-settings') fillSettings();
  // SPA back-button support: one back press walks views instead of killing the app.
  if (push !== false) {
    try { history.pushState({ view: id }, ''); } catch (e) {}
  }
  S.currentView = id;
}

// System back button: close an open modal first, else let popstate walk the view stack.
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
    try { history.pushState({ view: S.currentView || 'view-vouchers' }, ''); } catch (err) {}
    return;
  }
  const v = e.state && e.state.view;
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
  Store.save({ projectId: S.projectId });
  syncGenUserGroup();
}

function onProjectChange() {
  S.projectId = $('project-select').value;
  Store.save({ projectId: S.projectId });
  syncGenUserGroup();
  S.vouchers = [];
  S.packages = [];
  loadVouchers();
}

/* ═══════════ VOUCHERS ═══════════ */
async function loadVouchers() {
  if (!S.projectId) return;
  // Generation guard: a newer load (e.g. project switch mid-flight)
  // supersedes this one — stale results are discarded, never rendered.
  const gen = (S._voucherGen = (S._voucherGen || 0) + 1);
  S._vouchersLoading = true;
  const listEl = $('voucher-list');
  $('voucher-count').textContent = '';
  // iOS-style skeleton shimmer
  listEl.innerHTML = Array.from({ length: 6 }, () =>
    '<div class="skel"><div class="bar" style="width:52%"></div><div class="bar" style="width:34%"></div></div>').join('');
  try {
    const all = await Api.voucherListAll(S.projectId, (done, total) => {
      if (gen === S._voucherGen) $('voucher-count').textContent = `${t('v.loading')} ${done}/${total}`;
    });
    if (gen !== S._voucherGen) return; // superseded — discard
    S.vouchers = all;
    // newest first
    S.vouchers.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    renderVouchers();
  } catch (e) {
    if (gen !== S._voucherGen) return; // superseded — discard
    listEl.innerHTML = `<div class="empty"><div class="big">${ic('alert', 'xl')}</div><p><b>${t('v.loadFail')}</b></p><p class="small">${esc(e.message)}</p></div>`;
  } finally {
    if (gen === S._voucherGen) S._vouchersLoading = false;
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
  $('modal-body').innerHTML = `<dl class="kv">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
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
function defaultField(id) {
  const base = { show: true, size: 20, align: 'left', color: null, weight: 'regular', style: 'normal', ls: 'normal', lsCustom: 2, label: false, spaced: false };
  switch (id) {
    case 'header':   return Object.assign(base, { size: 14, align: 'center', weight: 'bold' });
    case 'code':     return Object.assign(base, { size: 30, align: 'center', weight: 'bold', spaced: true, ls: 'wide', lsCustom: 3 });
    case 'profile':  return Object.assign(base, { size: 22, label: true });
    case 'period':   return Object.assign(base, { size: 22, label: true });
    case 'quota':    return Object.assign(base, { show: false, size: 22, label: true });
    case 'datetime': return Object.assign(base, { show: false, size: 18, align: 'center' });
  }
  return base;
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
function fieldCss(f, st, preview) {
  const lsPx = f.ls === 'custom' ? (Number(f.lsCustom) || 0) : (LS_PX[f.ls] != null ? LS_PX[f.ls] : 1);
  const color = preview ? (f.color || st.color || '#111111') : '#000000';
  let css = `font-size:${Number(f.size) || 20}pt;font-weight:${WEIGHT_NUM[f.weight] || 400};` +
    `font-style:${f.style === 'italic' ? 'italic' : 'normal'};text-align:${f.align || 'left'};` +
    `letter-spacing:${lsPx}px;color:${color};` +
    `line-height:calc(1.35em + ${Number(st.lineSpacing) || 0}px);margin:${Number(st.insideSpacing) || 0}px 0;`;
  if (preview && st.shadow) css += 'text-shadow:1px 1px 2px rgba(0,0,0,.35);';
  if (preview && st.outline) css += '-webkit-text-stroke:.6px currentColor;';
  return css;
}
function ticketInnerHtml(item, st, style, preview) {
  const F = style.fields;
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const ff = FF_STACK[style.fontFamily] || FF_STACK.default;
  let h = `<div class="lv-wrap" style="font-family:${ff}">`;
  if (st.header && F.header.show)
    h += `<div class="lv" style="${fieldCss(F.header, style, preview)}">${esc(st.header)}</div>`;
  if (F.code.show) {
    const code = F.code.spaced ? esc(item.code).split('').join(' ') : esc(item.code);
    h += `<div class="lv" style="${fieldCss(F.code, style, preview)};border:2px dashed ${preview ? (F.code.color || style.color || '#111') : '#000'};padding:2mm;border-radius:2mm;">${code}</div>`;
  }
  if (F.profile.show && item.pkg)
    h += `<div class="lv" style="${fieldCss(F.profile, style, preview)}">${F.profile.label ? esc(t('tkt.profileName')) : ''}${esc(item.pkg)}</div>`;
  if (F.period.show && item.period)
    h += `<div class="lv" style="${fieldCss(F.period, style, preview)}">${F.period.label ? esc(t('tkt.validity')) : ''}${esc(fmtPeriod(item.period))}</div>`;
  if (F.quota.show && item.quota != null)
    h += `<div class="lv" style="${fieldCss(F.quota, style, preview)}">${F.quota.label ? esc(t('tkt.quota')) : ''}${esc(fmtQuota(item.quota))}</div>`;
  if (F.datetime.show)
    h += `<div class="lv" style="${fieldCss(F.datetime, style, preview)}">${esc(now)}</div>`;
  if (st.footer)
    h += `<hr><div class="lv" style="font-size:9pt;text-align:center;margin:2mm 0;">${esc(st.footer)}</div>`;
  h += `</div>`;
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
}
function syncGenUserGroup() {
  const ug = $('gen-usergroup');
  if (!ug) return;
  ug.innerHTML = S.projects.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('') || '<option value="">—</option>';
  ug.value = S.projectId || '';
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
    showProfileName: !!F.profile.show, profileNameFontSize: +F.profile.size || 24,
    profileNameBold: F.profile.weight === 'bold', profileNameFontWeight: W(F.profile),
    profileNameFontStyle: ST(F.profile), profileNameAlignment: A(F.profile),
    showProfileNameLabel: !!F.profile.label, profileNameColor: BLACK,
    showPeriod: !!F.period.show, periodFontSize: +F.period.size || 24,
    periodBold: F.period.weight === 'bold', periodFontWeight: W(F.period),
    periodFontStyle: ST(F.period), periodAlignment: A(F.period),
    showPeriodLabel: !!F.period.label, periodColor: BLACK,
    showQuota: !!F.quota.show, quotaFontSize: +F.quota.size || 24,
    quotaBold: F.quota.weight === 'bold', quotaFontWeight: W(F.quota),
    quotaFontStyle: ST(F.quota), quotaAlignment: A(F.quota),
    showQuotaLabel: !!F.quota.label, quotaColor: BLACK,
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
    showStatus: false, statusFontSize: 20, statusBold: false,
    statusFontWeight: 'REGULAR', statusFontStyle: 'NORMAL', statusAlignment: 'LEFT', statusColor: BLACK,
    fontFamily: fontFamily, letterSpacingMode: lsMode, customLetterSpacing: +PS.lsCustom || 0,
    lineSpacingExtra: +PS.lineSpacing || 0,
    textShadowEnabled: false, shadowColor: 0x88000000, shadowOpacity: 0.5,
    shadowBlur: 3, shadowOffsetX: 2, shadowOffsetY: 2,
    textOutlineEnabled: false, outlineColor: BLACK, outlineWidth: 1,
    activePreset: 'CUSTOM'
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
}
function btPollStart() {
  btPollStop();
  btRefresh();
  btTimer = setInterval(() => {
    const v = S.currentView;
    if (v === 'view-printer') btRefresh();
    else if (v === 'view-generate') { btCacheState(); renderPrinterDots(); }
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
  // auto-connect preference (persisted)
  const acBox = $('bt-autoconnect');
  if (acBox) {
    acBox.checked = !!Store.load().btAutoConnect;
    acBox.addEventListener('change', () => {
      Store.save({ btAutoConnect: acBox.checked });
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
    const r = btCall(B => B.btPrint(JSON.stringify(btVoucherPayload(S.queue)), nativePrintSettings(),
      st.header || '', st.paper, st.copies));
    if (r) btRefreshSoon();
  });
}

function doPrint(items) {
  if (!items.length) return toast(t('err.noPrint'), true);
  const st = printSettings();
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
  renderLayoutModal();
  $('layout-modal').classList.remove('hidden');
}
function layoutFieldCard(fd) {
  const f = layoutDraft.fields[fd.id];
  const boldChecked = (f.weight === 'bold' || f.weight === 'semibold') ? 'checked' : '';
  const extra = fd.id === 'code'
    ? `<label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="spaced" ${f.spaced ? 'checked' : ''}> ${t('pl.spaced')}</label>`
    : (['profile', 'period', 'quota'].includes(fd.id)
      ? `<label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="label" ${f.label ? 'checked' : ''}> ${t('pl.label')}</label>` : '');
  return `<div class="field-card">
    <div class="fc-head"><span>${t(fd.labelKey)}</span>
      <label class="switch"><input type="checkbox" data-lf="${fd.id}" data-k="show" ${f.show ? 'checked' : ''}><span class="track"></span></label>
    </div>
    <div class="fc-body"${f.show ? '' : ' style="display:none"'}>
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.fontSize')}</span>
        <div class="slider-row"><input type="range" min="8" max="48" step="1" value="${f.size}" data-lfr="${fd.id}"><b data-lfv="${fd.id}">${f.size} pt</b></div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <label class="check-row"><input type="checkbox" data-lf="${fd.id}" data-k="bold" ${boldChecked}> ${t('pl.bold')}</label>
        ${extra}
      </div>
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.align')}</span>
        <div class="mini-seg">${['left', 'center', 'right'].map(a =>
          `<button type="button" data-lfa="${fd.id}" data-a="${a}" class="${f.align === a ? 'active' : ''}">${t('ty.' + a)}</button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
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
  // alignment
  $('layout-fields').querySelectorAll('button[data-lfa]').forEach(b => {
    b.addEventListener('click', () => {
      const f = d.fields[b.dataset.lfa];
      f.align = b.dataset.a;
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      updateLivePreviews();
    });
  });
  updateLivePreviews();
}
function updateLivePreviews() {
  const item = previewSampleItem();
  const st = previewBasics();
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
  $('layout-reset').addEventListener('click', () => { layoutDraft = defaultPrintStyle(); renderLayoutModal(); });
  $('layout-save').addEventListener('click', () => {
    PS = cloneStyle(layoutDraft); savePrintStyle(); closeModal('layout-modal'); toast(t('toast.styleSaved'));
  });
  $('layout-cancel').addEventListener('click', () => closeModal('layout-modal'));
  $('layout-close').addEventListener('click', () => closeModal('layout-modal'));
  $('layout-modal').addEventListener('click', e => { if (e.target === $('layout-modal')) closeModal('layout-modal'); });
  $('layout-open-typo').addEventListener('click', () => { closeModal('layout-modal'); setTimeout(openTypoModal, 220); });
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
  moreShell(`${ic('box', 'sm')} ${esc(t('mg.title'))}`, `<div id="mg-list"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = moreUserGroups;
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
  moreShell(`${ic('signal', 'sm')} ${esc(t('md.title'))}`, `
    <div class="chips" id="md-chips">
      <button class="chip active" data-t="">${t('md.all')}</button>
      <button class="chip" data-t="AP">AP</button>
      <button class="chip" data-t="Switch">Switch</button>
      <button class="chip" data-t="Gateway">Gateway</button>
      <button class="chip" data-t="local">${t('md.local')}</button>
    </div>${Api.ssoLoggedIn() ? '' : `<p class="muted small">${t('md.needSsoHint')}</p>`}${GwApi.loggedIn() ? '' : `<p class="muted small">${t('md.needGw')}</p>`}<div id="md-list" style="margin-top:10px"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = moreDevices;
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
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        (Array.isArray(r.value) ? r.value : []).forEach(d => {
          const k = d.serialNumber || d.sn || d.mac || JSON.stringify(d);
          if (!seen.has(k)) { seen.add(k); list.push(d); }
        });
      } else if (i < types.length) errs.push(types[i] + ': ' + ((r.reason && r.reason.message) || r.reason || 'error'));
    });
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
    renderDeviceRows(list, errs, cliByAp, apNames);
  };
  const renderDeviceRows = (list, errs, cliByAp, apNames) => {
    if (!list.length) { $('md-list').innerHTML = `<p class="err">${esc(errs.join(' · ') || t('md.none'))}</p>`; return; }
    const warn = errs.length ? `<p class="warn small">${esc(t('md.partial'))}: ${esc(errs.join(' · '))}</p>` : '';
    $('md-list').innerHTML = `${warn}<p class="muted small">${tx('md.total', { n: list.length })}</p>` +
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
          const isApRow = (() => {
            const ct = String(d.commonType || '').toUpperCase();
            if (ct) return ct === 'AP' || ct === 'WR';
            return d.local ? /^RAP/i.test(String(d.model || '')) : false;
          })();
          const ncli = (cliByAp && sn) ? (cliByAp.get(String(sn)) || []).length : 0;
          const showCli = isApRow && sn && (ncli > 0 || !d.local);
          const cb = showCli ? `<button class="btn" data-apclients="${esc(sn)}" data-apname="${esc(nm)}" title="${esc(t('ac.title'))}">${ic('user', 'sm')}<span>${ncli}</span></button>` : '';
          return `<tr><td>${esc(nm)}${localTag}<br><small class="muted">${esc(sn || d.mac || '')}</small></td>
          <td>${esc(d.productClass || d.model || d.productModel || '')}</td>
          <td><span class="st-dot ${st.cls}"></span>${esc(st.label)}</td>
          <td>${rb}${cb}</td></tr>`;
        }).join('')}
        </table></div>`;
    document.querySelectorAll('#md-list [data-reboot]').forEach(b => b.addEventListener('click', () => rebootDevice(b.dataset.reboot, b.dataset.name)));
    document.querySelectorAll('#md-list [data-apclients]').forEach(b => b.addEventListener('click', () => apClientsView(b.dataset.apclients, b.dataset.apname, apNames)));
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

/* ── Per-AP clients · v1.5.22 ──
   One sta_users call (staType=currentUser) grouped by AP serial gives the
   per-AP client list: MAC/IP, voucher code (client username), connect time
   (onlineTime), duration (activeTime), signal. The voucher code is matched
   against the voucher list for package/price; unmatched codes are shown raw,
   never guessed. Tapping a client loads its onofflineUserHistory — consecutive
   records on different AP serials mean the client roamed between APs. */
let _acVMap = null, _acVMapPid = 0;
async function apClientVoucherMap(pid) {
  if (_acVMap && _acVMapPid === pid) return _acVMap;
  const vs = await Api.voucherListAll(Number(pid), null);
  const m = new Map();
  (vs || []).forEach(v => { const c = vCode(v); if (c && !m.has(c)) m.set(c, v); });
  _acVMap = m; _acVMapPid = pid;
  return m;
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
const apNameOf = (sn, apNames, fallback) => (apNames && apNames.get(String(sn))) || fallback || sn || '—';

async function apClientsView(apSn, apName, apNames) {
  const pid = Number(S.projectId);
  moreShell(`${ic('user', 'sm')} ${esc(apName || apSn)} <small class="muted">· ${esc(t('ac.title'))}</small>`,
    `<div id="ac-list"><p class="muted">${t('more.loading')}</p></div>`);
  S.moreFn = () => apClientsView(apSn, apName, apNames);
  try {
    // v1.5.25: prefer the portal client API (SSO) — its records carry
    // `account` (the auth account = voucher code for voucher-auth clients),
    // which the open-API sta_users does not return. Falls back to the
    // open API when SSO is unavailable or the portal call fails/empties.
    let clients = [], viaPortal = false;
    if (Api.ssoLoggedIn()) {
      try {
        const list = await Api.portalClients(pid, { linkedDevice: apSn });
        const mineP = (list || []).filter(c =>
          String(c.linkedDevice || '') === String(apSn) ||
          (apName && String(c.deviceName || '') === String(apName)));
        if (mineP.length) { clients = mineP; viaPortal = true; }
      } catch (e) { /* fall through to open API */ }
    }
    if (!viaPortal) {
      const all = await Api.allOnlineClients(pid);
      clients = (all || []).filter(c => String(c.sn || c.apSn || '') === String(apSn));
    }
    let vmap = new Map();
    try { vmap = await apClientVoucherMap(pid); } catch (e) { /* voucher enrichment optional */ }
    const acctOf = c => String((viaPortal ? (c.account || c.userName) : (c.username || c.hostname)) || '').trim();
    const mine = clients;
    if (!mine.length) { $('ac-list').innerHTML = `<p class="muted">${esc(t('ac.none'))}</p>`; return; }
    const vCount = mine.filter(c => vmap.has(acctOf(c))).length;
    $('ac-list').innerHTML =
      `<p class="muted small">${esc(tx('ac.total', { n: mine.length }))} · ${esc(tx('ac.voucherN', { n: vCount }))}</p>` +
      `<div class="wrap-scroll"><table class="data">` +
      `<tr><th>${t('mc.mac')}</th><th>${t('ac.voucher')}</th><th>${t('ac.since')} / ${t('ac.duration')}</th><th>${t('ac.signal')}</th></tr>` +
      mine.map((c, i) => {
        const mac = c.mac || '—';
        const user = acctOf(c);
        const v = user ? vmap.get(user) : null;
        const pkg = v ? voucherPkgName(v) : '';
        const price = v ? fmtMoney(pkgPriceNum(v)) : '';
        const since = fmtTs(c.onlineTime);
        // v1.5.25: portal records carry activeSec (seconds); open API uses activeTime (ms).
        const durMs = viaPortal
          ? (Number(c.activeSec) > 0 ? Number(c.activeSec) * 1000
            : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN))
          : (Number(c.activeTime) > 0 ? Number(c.activeTime)
            : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : NaN));
        const sig = [c.rssi ? String(c.rssi) + ' dBm' : '', c.band || '', c.channel ? 'ch ' + c.channel : ''].filter(Boolean).join(' · ') || '—';
        const ip = viaPortal ? (c.ip || '') : (c.userIp || c.ip || '');
        const sub = viaPortal
          ? ((c.userName && String(c.userName) !== user) ? String(c.userName) : '')
          : ((c.hostname && c.username) ? String(c.hostname) : '');
        const hostLine = (ip || sub) ? `<br><small class="muted">${esc(ip)}${(ip && sub) ? '<br>' : ''}${esc(sub)}</small>` : '';
        return `<tr data-accli="${i}" style="cursor:pointer"><td>${esc(mac)}${hostLine}</td>` +
          `<td>${esc(user || '—')}${v ? `<br><small class="muted">${esc(pkg)}${price ? ' · ' + esc(price) : ''}</small>` : ''}</td>` +
          `<td><small>${esc(since)}<br>${esc(fmtDur(durMs))}</small></td>` +
          `<td><small>${esc(sig)}</small></td></tr>` +
          `<tr data-acroam="${i}" style="display:none"><td colspan="4"><div id="ac-roam-${i}"><p class="muted small">${t('more.loading')}</p></div></td></tr>`;
      }).join('') + `</table></div><p class="muted small">${esc(t('ac.tapRoam'))}</p>`;
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

async function moreSales() {
  const todayStr = new Date().toISOString().slice(0, 10);
  moreShell(`${ic('chart', 'sm')} ${esc(t('sl.title'))}`,
    `<div class="chips" id="sl-chips">
       <button class="chip active" data-r="day1">${t('sl.day1')}</button>
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
  S.moreFn = () => moreSales();
  await ensurePackages();
  const priceByPkg = {};
  S.packages.forEach(p => { const nm = pkgName(p); if (nm && !(nm in priceByPkg)) priceByPkg[nm] = pkgPriceNum(p); });

  let range = 'day1';
  const dayMs = 864e5;
  const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); };
  const rangeBounds = () => {
    const s0 = startOfToday(), now = Date.now();
    if (range === 'day1') return [s0, now];
    if (range === 'day7') return [s0 - 6 * dayMs, now];
    if (range === 'day30') return [s0 - 29 * dayMs, now];
    if (range === 'custom') {
      const f = $('sl-from').value, tt = $('sl-to').value;
      const s = f ? new Date(f + 'T00:00:00').getTime() : 0;
      const e = tt ? new Date(tt + 'T00:00:00').getTime() + dayMs : now + dayMs;
      return [s, e];
    }
    return [0, Infinity];
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
      `<td class="num"><b>${tm.toLocaleString()}</b></td>` +
      `<td class="num"><b>${ts.toLocaleString()}</b></td>` +
      `<td class="num"><b>${esc(fmtMoney(tr))}</b></td></tr>` +
      `</table></div>`;
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
}

/* ── SSO session (Ruijie account login, Android APK only) ───────
 * Needed for voucher delete, which the public Open API does not offer. */
function refreshSsoCard() {
  const card = $('sso-card');
  if (!card) return;
  const statusEl = $('sso-status'), btn = $('btn-sso');
  if (!hasSso()) {
    statusEl.textContent = t('sso.onlyAndroid');
    btn.classList.add('hidden');
    return;
  }
  btn.classList.remove('hidden');
  const loggedIn = Api.ssoLoggedIn();
  statusEl.textContent = loggedIn ? t('sso.connected') : t('sso.notConnected');
  btn.querySelector('span').textContent = loggedIn ? t('sso.logout') : t('sso.login');
  btn.dataset.mode = loggedIn ? 'logout' : 'login';
}
function onSsoButton() {
  if (!hasSso()) { toast(t('sso.onlyAndroid'), true); return; }
  const btn = $('btn-sso');
  if (btn.dataset.mode === 'logout') {
    window.RuijieBridge.ssoLogout();
  } else {
    try { window.RuijieBridge.ssoLogin(); }
    catch (e) { toast(t('sso.onlyAndroid'), true); }
  }
}

/* ── Gateway-local session (Android APK only) ───────────────────
 * Direct LAN connection to the user's own gateway eWeb. The password is
 * entered here in Settings and kept on this device only — never in chat,
 * never in logs, never sent anywhere except the gateway itself. */
const GW_STORE_KEYS = { ip: 'gwIp' };
/* Gateway password lives in JS memory only — never persisted to
 * localStorage, so it does not survive an app restart and is never
 * written to disk by the web layer. */
const GwMem = { pass: '' };
function gwStored() {
  const s = Store.load();
  return { ip: s[GW_STORE_KEYS.ip] || '100.88.200.103', pass: GwMem.pass || '' };
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
    GwApi.logout();
    refreshGwCard();
    toast(t('gw.bye'));
    return;
  }
  const ip = ($('gw-ip').value || '').trim() || '100.88.200.103';
  const pass = $('gw-pass').value || '';
  if (!pass) { toast(t('gw.needInfo'), true); return; }
  btn.disabled = true;
  try {
    Store.save({ [GW_STORE_KEYS.ip]: ip });
    try { Store.save({ gwPass: '', gwUser: '' }); } catch (_) {} // drop legacy persisted secrets
    GwMem.pass = pass;
    await GwApi.login(ip, 'admin', pass);
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
  if (!Diag.results.length) { box.innerHTML = ''; return; }
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
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers');
    // toggle: tap again while open to collapse (the ✕ was unreachable when empty)
    if (searchWrap.classList.contains('open')) { collapseSearch(); return; }
    searchWrap.classList.add('open');
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
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers');
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
    else if (k === 'networks') moreNetworks();
  else if (k === 'sales') moreSales();
  }));

  $('btn-save-settings').addEventListener('click', saveSettings);
  $('btn-sso').addEventListener('click', onSsoButton);
  $('btn-gw').addEventListener('click', onGwButton);
  $('btn-diag-run').addEventListener('click', runDiagnostics);
  $('btn-diag-save').addEventListener('click', saveDiagReport);
  // SSO login/logout events from the native dialog
  document.addEventListener('ruijie-sso', (e) => {
    refreshSsoCard();
    if (e.detail === 'login') toast(t('sso.welcome'));
    if (e.detail === 'logout') toast(t('sso.bye'));
  });
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
