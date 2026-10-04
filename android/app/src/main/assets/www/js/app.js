/**
 * Ruijie Voucher App — UI logic (vanilla JS) · v1.2.0
 * iOS design · SVG icon system · EN/MY i18n · tablet layouts
 */
'use strict';

const APP_VERSION = '1.5.172'; // stamped at build time from VERSION_NAME (build-apk.sh step 1c)

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
  'pf.title': { my: 'အကောင့်ဝင်မယ်', en: 'Sign in' },
  'pf.sub': { my: 'နာမည်တစ်လုံးတည်းရိုက်ပါ', en: 'Just type your name' },
  'pf.namePh': { my: 'နာမည် (ဥပမာ praythein)', en: 'Name (e.g. praythein)' },
  'pf.login': { my: 'ဝင်မယ်', en: 'Sign in' },
  'pf.create': { my: 'Create acc', en: 'Create acc' },
  'pf.manual': { my: 'ရိုးရိုး ချိတ်ဆက်မယ်', en: 'Manual connect' },
  'pf.notFound': { my: 'ဒီနာမည်နဲ့ profile မတွေ့ပါ', en: 'No profile found for this name' },
  'pf.badName': { my: 'နာမည် မှားနေပါတယ်', en: 'Invalid name' },
  'pf.looking': { my: 'ရှာနေသည်…', en: 'Looking up…' },
  'pf.newTitle': { my: 'အကောင့်အသစ်ဖွင့်မယ်', en: 'Create account' },
  'pf.name': { my: 'နာမည်', en: 'Name' },
  'pf.email': { my: 'Ruijie mail', en: 'Ruijie mail' },
  'pf.password': { my: 'Ruijie password', en: 'Ruijie password' },
  'pf.writeKey': { my: 'Sync key (မရှိရင် ချန်ထားပါ)', en: 'Sync key (optional)' },
  'pf.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'pf.back': { my: 'နောက်သို့', en: 'Back' },
  'pf.saved': { my: 'သိမ်းပြီးပါပြီ', en: 'Saved' },
  'pf.needFields': { my: 'အကုန်ဖြည့်ပါ', en: 'Fill in all fields' },
  'pf.syncOff': { my: 'ဖုန်းထဲပဲ သိမ်းထားသည် (server မရောက်)', en: 'Saved on this phone only (server unreachable)' },
  'pf.createBtn': { my: 'Create', en: 'Create' },
  'pf.complete': { my: 'Complete ✓', en: 'Complete ✓' },
  'pf.allSaved': { my: '၃ ခုလုံး (ဖုန်း + GitHub + Render) ရောက်ပြီ', en: 'Reached all 3 (phone + GitHub + Render)' },
  'pf.tierPhone': { my: 'ဖုန်း', en: 'Phone' },
  'pf.tierGithub': { my: 'GitHub', en: 'GitHub' },
  'pf.tierRender': { my: 'Render', en: 'Render' },
  'pf.tierFail': { my: 'တစ်ချို့မရောက်သေးပါ — ထပ်နှိပ်ပါ', en: 'Some tiers failed — tap again to retry' },
  'pf.slowConn': { my: 'လိုင်းနှေးနေတယ်၊ ခဏနေထပ်စမ်းပါ', en: 'Connection is slow, try again shortly' },
  'pf.backToLogin': { my: 'Login ပြန်သွားမယ်', en: 'Back to login' },
  'pf.update': { my: 'Profile ပြင်မယ်', en: 'Update profile' },
  'pf.updateTitle': { my: 'Profile ပြင်မယ်', en: 'Update profile' },
  'pf.updateBtn': { my: 'Update', en: 'Update' },
  'pf.keyNeeded': { my: 'Sync key လိုနေပါတယ် — ဖြည့်ပြီးထပ်နှိပ်ပါ', en: 'Sync key required — fill it in and retry' },
  'pf.typeNameFirst': { my: 'နာမည်အရင်ရိုက်ပါ', en: 'Type your name first' },
  'pf.verifyFail': { my: 'App ID/Secret စမ်းတာ မအောင်မြင်ပါ', en: 'App ID/Secret verification failed' },
  /* v1.5.144 — owner login PIN (praythein profile only) */
  'pin.unlockTitle': { my: 'PIN ရိုက်ပါ', en: 'Enter PIN' },
  'pin.unlockSub': { my: 'PrayThein အကောင့်အတွက် ၆-လုံး PIN', en: '6-digit PIN for the PrayThein account' },
  'pin.setupTitle': { my: 'PIN သတ်မှတ်ပါ', en: 'Set your PIN' },
  'pin.setupSub': { my: '၆-လုံး PIN အသစ် ရိုက်ပါ', en: 'Enter a new 6-digit PIN' },
  'pin.setupConfirm': { my: 'PIN ကို ထပ်ရိုက်ပြီး အတည်ပြုပါ', en: 'Re-enter the PIN to confirm' },
  'pin.wrong': { my: 'PIN မှားနေပါတယ်', en: 'Wrong PIN' },
  'pin.mismatch': { my: 'PIN ချင်း မတူပါ — အစက ပြန်ရိုက်ပါ', en: 'PINs do not match — start over' },
  'pin.need6': { my: 'PIN က ဂဏန်း ၆ လုံး ဖြစ်ရမယ်', en: 'PIN must be 6 digits' },
  'pin.curPin': { my: 'လက်ရှိ PIN (၆ လုံး)', en: 'Current PIN (6 digits)' },
  'pin.newPin': { my: 'PIN အသစ် (၆ လုံး)', en: 'New PIN (6 digits)' },
  'pin.confirmPin': { my: 'PIN အတည်ပြုပါ', en: 'Confirm PIN' },
  'pin.curWrong': { my: 'လက်ရှိ PIN မှားနေပါတယ်', en: 'Current PIN is wrong' },
  'pin.sending': { my: 'Server ကို ပို့နေသည်…', en: 'Sending to server…' },
  'pin.serverFail': { my: 'Server ကို PIN မပို့နိုင်သေးပါ — လိုင်းစစ်ပြီး ၆ လုံး ပြန်ရိုက်ပါ', en: 'Could not send the PIN to the server — check connection and re-enter the 6 digits' },
  'pin.serverOld': { my: 'Proxy အသစ် မရောက်သေးပါ — proxy update လုပ်ပြီးမှ ထပ်စမ်းပါ', en: 'Proxy is not updated yet — update the proxy and try again' },
  's.myProfile': { my: 'My Profile (နာမည် login)', en: 'My Profile (name login)' },
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
  'search.cancel': { my: 'မလုပ်တော့ဘူး', en: 'cancel' },
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
  'v.delN': { my: 'ဖျက်မယ် ({n})', en: 'Delete ({n})' },
  'v.deleting': { my: 'ဖျက်နေတယ် {i}/{n}…', en: 'Deleting {i}/{n}…' },
  'v.deleted': { my: 'ဖျက်ပြီးပြီ ✓', en: 'Deleted ✓' },
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
  // 2026-10-01 (user): manual delete is expired-vouchers-only
  'del.onlyExpired': { my: 'ကုန်ဆုံးသွားတဲ့ ဗောက်ချာပဲ ဖျက်လို့ရပါတယ်', en: 'Only expired vouchers can be deleted' },
  // v1.5.101: bulk Delete Expired Vouchers (Ruijie Cloud style) + Reset
  'v.more': { my: 'ပို၍', en: 'More' },
  'v.delExpired': { my: 'သက်တမ်းကုန်တွေ ဖျက်မယ်', en: 'Delete Expired Vouchers' },
  'v.delExpiredConfirm': { my: 'သက်တမ်းကုန်ဗောက်ချာ {n} ခုကို ဖျက်မှာလား?', en: 'Delete {n} expired vouchers?' },
  'v.delExpiredNone': { my: 'သက်တမ်းကုန်ဗောက်ချာ မရှိပါ', en: 'No expired vouchers' },
  'v.delExpiredFound': { my: 'ခု တွေ့တယ်', en: 'vouchers found' },
  'v.delExpiredDone': { my: '{ok} ခု ဖျက်ပြီးပြီ', en: 'Deleted {ok}' },
  'v.delExpiredPickDate': { my: 'ဘယ်ရက်ထိ သက်တမ်းကုန်တာကို ဖျက်မလဲ?', en: 'Delete vouchers expired through…' },
  'v.delExpiredShowCount': { my: 'အရေအတွက် ကြည့်မယ်', en: 'Show count' },
  'v.reset': { my: 'Reset', en: 'Reset' },
  'v.resetConfirm': { my: 'ရွေးထားတဲ့ ဗောက်ချာ {n} ခုကို reset လုပ်မှာလား? (သုံးပြီးသားအချက်အလက် ပြန်စမယ်)', en: 'Reset {n} selected vouchers? (usage will be cleared)' },
  'v.resetNone': { my: 'ဗောက်ချာ ရွေးထားတာ မရှိပါ', en: 'No vouchers selected' },
  'v.resetDone': { my: '{ok} ခု reset ပြီးပြီ', en: 'Reset {ok}' },
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
  // v1.5.77: AdBlock DNS toggle (gateway DHCP option 6, voucher VLAN 20)
  'dns.title': { my: 'AdBlock DNS', en: 'AdBlock DNS' },
  'dns.toggle': { my: 'AdBlock DNS (VLAN {v})', en: 'AdBlock DNS (VLAN {v})' },
  'dns.sub': { my: 'DNS အဆင့်မှာ ad/tracker domain တွေ စစ်ထုတ်မယ်', en: 'Filters ad/tracker domains at DNS level' },
  'dns.vlan': { my: 'VLAN', en: 'VLAN' },
  'dns.current': { my: 'လက်ရှိ DNS (VLAN {v})', en: 'Current DNS (VLAN {v})' },
  'dns.note': { my: 'DNS အဆင့်မှာပဲ စစ်တာမို့ app/video ad အားလုံး မတားနိုင်ပါ', en: 'DNS-level only — cannot block all in-app/video ads' },
  'dns.inherit': { my: '(အလိုအလျောက်)', en: '(inherited)' },
  'dns.onlyAndroid': { my: 'ဒါကို Android app မှာပဲ သုံးလို့ရပါတယ်', en: 'Only available in the Android app' },
  'dns.needGw': { my: 'အရင် Gateway ချိတ်ပါ', en: 'Connect the gateway first' },
  'dns.on': { my: 'AdBlock DNS ဖွင့်ပြီးပါပြီ', en: 'AdBlock DNS enabled' },
  'dns.off': { my: 'AdBlock DNS ပိတ်ပြီး DNS အဟောင်းပြန်ထားပြီးပါပြီ', en: 'AdBlock DNS disabled, original DNS restored' },
  'dns.badVlan': { my: 'VLAN နံပါတ် မှားနေပါတယ် (ဥပမာ 20)', en: 'Invalid VLAN number (e.g. 20)' },
  'dns.vlanChanged': { my: 'VLAN ပြောင်းပြီးပါပြီ — AdBlock ပြန်ဖွင့်ပါ', en: 'VLAN changed — please enable AdBlock again' },
  'gw.bye': { my: 'Gateway ဖြုတ်ပြီးပါပြီ', en: 'Gateway disconnected' },
  'gw.encPending': { my: 'စကားဝှက် encrypt နည်းလမ်း မရသေးပါ — gateway login JS လိုနေပါတယ်', en: 'Password encryption method not captured yet — need the gateway login JS' },
  'md.local': { my: '🏠 Local', en: '🏠 Local' },
  'md.localTag': { my: 'local', en: 'local' },
  'md.needGw': { my: 'Local device တွေမြင်ရရန် Settings → Gateway (ဒေသတွင်း) မှာ ချိတ်ပါ', en: 'Connect in Settings → Gateway (local) to see local devices' },
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
  'a.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'a.ok': { my: 'OK', en: 'OK' },
  'a.delete': { my: 'ဖျက်မယ်', en: 'Delete' },
  'kick.kick': { my: 'ဖြုတ်မယ်', en: 'Disconnect' },
  'block.block': { my: 'Block မယ်', en: 'Block' },
  'block.unblock': { my: 'Unblock', en: 'Unblock' },
  'unbind.unbind': { my: 'ဖြုတ်မယ်', en: 'Unbind' },
  'confirm.signoutBtn': { my: 'ထွက်မယ်', en: 'Sign out' },
  'a.cancel': { my: 'မလုပ်တော့ပါ', en: 'Cancel' },
  'v.unknown': { my: 'အဟောင်း/မသိ', en: 'old/unknown' },
  'kick.title': { my: 'Client ဖြုတ်ချခြင်း', en: 'Client Disconnect' },
  'kick.auto': { my: 'Quota ပြည့်ရင် အလိုအလျောက် ဖြုတ်မယ်', en: 'Auto-disconnect when quota is spent' },
  'kick.autoSub': { my: 'Voucher limit ပြည့်ပြီး ဆက်ချိတ်နေတဲ့ client ကို ဖြုတ်ခိုင်းမယ်', en: 'Disconnect clients still online after their voucher quota is spent' },
  'kick.status': { my: 'အခြေအနေ', en: 'Status' },
  'kick.soon': { my: 'Cloud verify ပြီးမှ အလုပ်လုပ်မယ်', en: 'Activates after cloud verification' },
  'kick.ssid': { my: 'Voucher SSID', en: 'Voucher SSID' },
  'kick.ssidPh': { my: 'ဥပမာ ShopWiFi', en: 'e.g. ShopWiFi' },
  'kick.ssidDetect': { my: 'Auto', en: 'Auto' },
  'kick.ssidDetected': { my: 'Auto-detect: {ssid}', en: 'Auto-detected: {ssid}' },
  'kick.ssidNotFound': { my: 'Voucher client မတွေ့ပါ — Online Clients အရင်ဖွင့်ပါ', en: 'No voucher clients found — open Online Clients first' },
  'kick.ssidSub': { my: 'သံသယရှိ flag က ဒီ SSID ပေါ်ကလူတွေအတွက်ပဲ ပြမယ် (မထည့်ရင် အားလုံးပြ)', en: 'Suspicious flag only shows for clients on this SSID (empty = all)' },
  'kick.vlan': { my: 'Voucher VLAN', en: 'Voucher VLAN' },
  'kick.vlanSub': { my: 'သံသယရှိ flag က ဒီ VLAN ပေါ်ကလူတွေအတွက်ပဲ ပြမယ် — captive portal သုံးတဲ့ VLAN ကို အလိုအလို ရွေးပေးမယ်', en: 'Suspicious flag only shows for clients on this VLAN — the captive-portal VLAN is auto-selected' },
  'kick.interval': { my: 'ဘယ်နှစ်မိနစ်တစ်ခါ စစ်မလဲ', en: 'Check every N minutes' },
  'v.delExpiredThrough': { my: 'ရက်စွဲ', en: 'Through' },
  'kick.btn': { my: 'ဖြုတ်မယ်', en: 'Disconnect' },
  'block.btn': { my: 'Block မယ်', en: 'Block' },
  'block.confirm': { my: 'ဒီ MAC ကို Block မလား? (ပြန်ချိတ်လို့မရတော့ပါ)', en: 'Block this MAC? (It will not be able to reconnect)' },
  'block.done': { my: 'Block ပြီးပါပြီ', en: 'Blocked' },
  'unblock.btn': { my: 'Unblock မယ်', en: 'Unblock' },
  'unblock.confirm': { my: 'ဒီ MAC ကို Unblock မလား?', en: 'Unblock this MAC?' },
  'unblock.done': { my: 'Unblock ပြီးပါပြီ', en: 'Unblocked' },
  'unbind.btn': { my: 'MAC ဖြုတ်မယ်', en: 'Unbind MAC' },
  'unbind.loading': { my: 'MAC စာရင်း ဖတ်နေပါတယ်…', en: 'Loading bound MACs…' },
  'unbind.none': { my: 'Bind ထားတဲ့ MAC မရှိပါ', en: 'No bound MAC' },
  'unbind.confirm': { my: 'ဒီ MAC ကို unbind လုပ်မှာလား?', en: 'Unbind this MAC?' },
  'unbind.done': { my: 'MAC unbind ပြီးပါပြီ', en: 'MAC unbound' },
  'unbind.fail': { my: 'Unbind မရပါ: ', en: 'Unbind failed: ' },
  'm.wifi': { my: 'WiFi', en: 'WiFi' },
  'm.wifiSub': { my: 'SSID များ', en: 'SSIDs' },
  'wifi.title': { my: 'WiFi (SSID)', en: 'WiFi (SSID)' },
  'wifi.refresh': { my: 'ပြန်ဖတ်', en: 'Refresh' },
  'wifi.add': { my: 'SSID အသစ်ဆောက်', en: 'Add SSID' },
  'wifi.name': { my: 'SSID နာမည်', en: 'SSID name' },
  'wifi.password': { my: 'Password', en: 'Password' },
  'wifi.newPassword': { my: 'Password အသစ်', en: 'New password' },
  'wifi.encryption': { my: 'Encryption', en: 'Encryption' },
  'wifi.changePw': { my: 'Password ချိန်းမယ်', en: 'Change password' },
  'wifi.create': { my: 'ဆောက်မယ်', en: 'Create' },
  'wifi.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'wifi.cancel': { my: 'မလုပ်တော့ဘူး', en: 'Cancel' },
  'wifi.created': { my: 'SSID ဆောက်ပြီးပြီ', en: 'SSID created' },
  'wifi.pwChanged': { my: 'Password ချိန်းပြီးပြီ', en: 'Password changed' },
  'wifi.confirmPw': { my: 'Password ချိန်းမှာလား?', en: 'Change the password?' },
  'wifi.oldPassword': { my: 'Password အဟောင်း', en: 'Current password' },
  'wifi.show': { my: 'ပြ', en: 'Show' },
  'wifi.hide': { my: 'ဖျောက်', en: 'Hide' },
  'wifi.delete': { my: 'ဖျက်မယ်', en: 'Delete' },
  'wifi.confirmDel': { my: 'ဒီ SSID ကို ဖျက်မှာလား? ချိတ်ထားသူတွေ ပြတ်သွားမယ်။', en: 'Delete this SSID? Connected clients will drop.' },
  'wifi.deleted': { my: 'SSID ဖျက်ပြီးပြီ', en: 'SSID deleted' },
  'wifi.noPw': { my: '(မရှိ)', en: '(none)' },
  'wifi.needSso': { my: 'Portal login လိုပါတယ်', en: 'Portal login required' },
  // 2026-10-01 (user): per-client speed limit on SSID
  'wifi.speed': { my: 'Speed', en: 'Speed' },
  'wifi.curSpeed': { my: 'လက်ရှိ — တင် {up} Mbps / ချ {down} Mbps', en: 'Current — {up} Mbps up / {down} Mbps down' },
  'wifi.upRate': { my: 'တင် (Upload) — Mbps', en: 'Upload cap — Mbps' },
  'wifi.downRate': { my: 'ချ (Download) — Mbps', en: 'Download cap — Mbps' },
  'wifi.confirmSpeed': { my: '{ssid} အတွက် client တစ်ယောက်ချင်းစီ speed ကန့်သတ်ချက် — တင် {up} Mbps / ချ {down} Mbps သိမ်းမှာလား?', en: 'Set per-client caps for {ssid} — {up} Mbps up / {down} Mbps down?' },
  'wifi.speedSaved': { my: 'Speed limit သိမ်းပြီးပြီ', en: 'Speed limit saved' },
  'wifi.badSpeed': { my: 'Speed 0 သို့မဟုတ် အပေါင်းကိန်း ထည့်ပါ', en: 'Enter 0 or a positive number' },
  'wifi.rename': { my: 'နာမည်ပြောင်းမယ်', en: 'Rename' },
  'wifi.newName': { my: 'WiFi နာမည်အသစ်', en: 'New WiFi name' },
  'wifi.nameChanged': { my: 'WiFi နာမည် ပြောင်းပြီးပြီ', en: 'WiFi name changed' },
  'wifi.confirmRename': { my: '{old} → {new} နာမည်ပြောင်းမှာလား?', en: 'Rename {old} → {new}?' },
  'wifi.badName': { my: 'နာမည် ထည့်ပါ (32 လုံးအထိ)', en: 'Enter a name (up to 32 chars)' },
  'wifi.nameExists': { my: 'ဒီ နာမည် ရှိနေပြီးသား', en: 'This name is already in use' },
  'kick.confirm': { my: 'ဒီ client ကို ဖြုတ်မလား?', en: 'Disconnect this client?' },
  'kick.warnQuota': { my: 'quota ကျန်သေးတယ်', en: 'quota remains' },
  'kick.warnTime': { my: 'အချိန်ကျန်သေးတယ်', en: 'time remains' },
  'kick.warnRemain': { my: 'သတိ — ဒီ voucher မှာ {parts}။ ဖြုတ်လိုက်ရင် ကျန်တာတွေ သုံးမရတော့ဘူး။\n\nဆက်ဖြုတ်မလား?', en: 'Warning — this voucher still has {parts}. Disconnecting will waste them.\n\nDisconnect anyway?' },
  'learn.avg': { my: 'ပျမ်းမျှ သုံးစွဲမှု', en: 'Typical usage' },
  'learn.fast': { my: 'ပုံမှန်ထက် မြန်မြန်ကုန်နေတယ်', en: 'Burning faster than usual' },
  'kick.pending': { my: 'Kick မရသေးဘူး — cloud ကောင်းမှ verify လုပ်မယ်', en: 'Kick not available yet — will verify when the cloud is healthy' },
  'kick.done': { my: 'ဖြုတ်ပြီးပြီ', en: 'Disconnected' },
  'kick.norecord': { my: 'Client အချက်အလက် ရှာမတွေ့ပါ', en: 'Client auth record not found' },
  'kick.active': { my: 'အသင့်ဖြစ်နေပြီ', en: 'Active' },
  'kick.standby': { my: 'စောင့်နေတယ်', en: 'Standby' },
  'kick.bgOn': { my: 'နောက်ခံ auto-kick ပွင့်နေပြီ — ဖုန်းမှိန်နေလည်း ၁၅ မိနစ်တစ်ခါ စစ်ပေးမယ်', en: 'Background auto-kick on — checks every 15 min, even with the screen off' },
  'kick.bgOff': { my: 'ပိတ်ထားတယ်', en: 'Off' },
  'kick.bgNoConfig': { my: 'ဖွင့်ထားပေမဲ့ cloud ချိတ်ဆက်မှုမရှိသေးဘူး', en: 'On, but no cloud connection saved yet' },
  'kick.bgSoon': { my: 'နောက်ခံစနစ် စတင်နေပြီ…', en: 'Starting background service…' },
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
  'pl.tearLine': { my: 'ဖြဲဖို့ မျဉ်းကြောင်း', en: 'Tear-off line between vouchers' },
  'pl.tearLineSub': { my: 'ဗောက်ချာများကြား ဖြဲရန် မျဉ်းကြောင်း — စာရွက်အပို မကုန်ပါ', en: 'Dashed cut guide inside the existing gap — no extra paper' },
  'pl.midDivider': { my: 'အလယ် ခြားမျဉ်း', en: 'Middle divider line' },
  'pl.midDividerSub': { my: 'ကပ်ထားသော စာကြောင်းများကြား ဒေါင်လိုက်မျဉ်း', en: 'Vertical divider between docked custom-line parts' },
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
  'pl.nudge': { my: 'ဘေးရွေ့ (mm)', en: 'Nudge sideways (mm)' },
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
  'p.btSetDefault': { my: 'Default လုပ်မယ်', en: 'Set as Default' },
  'p.btDefaultSaved': { my: 'Default ပရင်တာ မှတ်ပြီးပြီ', en: 'Default printer saved' },
  'p.btDefaultCleared': { my: 'Default ပရင်တာ ဖျက်ပြီးပြီ', en: 'Default printer cleared' },
  'm.title': { my: 'နောက်ထပ်', en: 'More' },
  'm.accounts': { my: 'Auth Accounts', en: 'Auth Accounts' },
  'm.accountsSub': { my: 'အသုံးပြုသူများ', en: 'Users' },
  'm.usergroups': { my: 'User Groups', en: 'User Groups' },
  'm.usergroupsSub': { my: 'အုပ်စုများ', en: 'Groups' },
  'm.devices': { my: 'Devices', en: 'Devices' },
  'm.devicesSub': { my: 'စက်များ', en: 'Devices' },
  'm.firmware': { my: 'Firmware update', en: 'Firmware update' },
  'm.firmwareSub': { my: 'စက်အပ်ဒိတ်များ', en: 'Device firmware' },
  'fw.title': { my: 'Firmware update', en: 'Firmware update' },
  'fw.checking': { my: 'အပ်ဒိတ်စစ်နေပါတယ်…', en: 'Checking for firmware…' },
  'fw.none': { my: 'စက်မရှိပါ', en: 'No devices' },
  'fw.upToDate': { my: 'နောက်ဆုံးဗားရှင်းပါ', en: 'Up to date' },
  'fw.cur': { my: 'လက်ရှိ', en: 'Current' },
  'fw.new': { my: 'အသစ်', en: 'New' },
  'fw.update': { my: 'တင်မယ်', en: 'Update' },
  'fw.sending': { my: 'ခိုင်းနေပါတယ်…', en: 'Sending…' },
  'fw.updating': { my: 'တင်နေပါတယ်…', en: 'Updating…' },
  'fw.rebooting': { my: 'စက်ပြန်တက်နေပါတယ်…', en: 'Rebooting…' },
  'fw.done': { my: 'ပြီးပါပြီ ✓', en: 'Done ✓' },
  'fw.needSso': { my: 'Ruijie အကောင့် login လိုပါတယ်', en: 'Ruijie login required' },
  'fw.confirm': { my: '{name} ကို {ver} တင်မှာလား? စက်ခနရပ်မည်။', en: 'Update {name} to {ver}? Device will restart.' },
  'fw.avail': { my: 'အပ်ဒိတ်ရရှိနိုင်ပါတယ်', en: 'Update available' },
  'fw.checkAgain': { my: 'ပြန်စစ်မယ်', en: 'Check again' },
  'm.traffic': { my: 'Traffic', en: 'Traffic' },
  'm.trafficSub': { my: 'ဒေတာစီးဆင်းမှု', en: 'Flow table' },
  'm.overview': { my: 'Overview', en: 'Overview' },
  'm.overviewSub': { my: 'အကျဉ်းချုပ်', en: 'Dashboard' },
  'm.qos': { my: 'QoS', en: 'QoS' },
  'm.qosSub': { my: 'ဂိမ်းလိုင်းဦးစားပေး', en: 'Gaming priority' },
  'q.title': { my: 'QoS — ဂိမ်းဦးစားပေး', en: 'QoS — Gaming Priority' },
  'q.smart': { my: 'Smart QoS', en: 'Smart QoS' },
  'q.on': { my: 'ဖွင့်', en: 'ON' },
  'q.off': { my: 'ပိတ်', en: 'OFF' },
  'q.up': { my: 'Uplink', en: 'Uplink' },
  'q.down': { my: 'Downlink', en: 'Downlink' },
  'q.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'q.refresh': { my: 'ပြန်ဖတ်', en: 'Refresh' },
  'q.synced': { my: 'Gateway နဲ့ sync လုပ်ပြီးချိန်', en: 'Synced with gateway' },
  'q.saving': { my: 'သိမ်းနေတယ်…', en: 'Saving…' },
  'q.saved': { my: 'သိမ်းပြီးပြီ ✓', en: 'Saved ✓' },
  'q.fail': { my: 'မအောင်မြင်ဘူး', en: 'Failed' },
  'q.smartHint': { my: 'Smart QoS ဖွင့်ထားရင် manual speed limit တွေ အလုပ်မလုပ်ဘူး။ Portal group limit တွေက ဆက်အလုပ်လုပ်တယ်။', en: 'When Smart QoS is on, manual speed limits are inactive. Portal group limits still apply.' },
  'q.keygrp': { my: 'Key Group (အမြင့်ဆုံးဦးစားပေး)', en: 'Key Group (highest priority)' },
  'q.keygrpHint': { my: 'ဒီ app တွေရဲ့ traffic ကို အမြဲဦးစားပေးမယ်', en: 'Traffic from these apps is always prioritized' },
  'q.appPh': { my: 'App နာမည် (ဥပမာ MobileLegends)', en: 'App name (e.g. MobileLegends)' },
  'q.noApps': { my: 'App မရှိသေးဘူး', en: 'No apps yet' },
  'q.appid': { my: 'App Identification', en: 'App Identification' },
  'q.appidHint': { my: 'DPI — memory 9MB သုံးတယ်။ Gateway offline သွားရင် ပိတ်လိုက်။', en: 'DPI — uses 9MB memory. Turn off if gateway goes offline.' },
  'q.confirmSmart': { my: 'Smart QoS ပြောင်းမလား?', en: 'Change Smart QoS?' },
  'q.confirmApp': { my: 'Key Group သိမ်းမလား?', en: 'Save Key Group?' },
  'q.confirmAppId': { my: 'App Identification ပြောင်းမလား?', en: 'Change App Identification?' },
  'q.selApp': { my: 'App ရွေး…', en: 'Select app…' },
  'q.noTree': { my: 'App list ရမရ — Gateway Capture နဲ့ စစ်ပါ', en: 'App list unavailable' },
  'q.manualApp': { my: 'App နာမည် ရိုက်ထည့်ပါ (ဥပမာ MobileLegends)', en: 'Type app name (e.g. MobileLegends)' },
  'q.nameHint': { my: 'နာမည် အတိအကျ မှန်ရမယ် — space မပါ, စာလုံးအကြီးအသေး မှန်ရမယ်။ ဥပမာ: MobileLegends, PUBG', en: 'Name must match exactly — no spaces, case-sensitive. E.g.: MobileLegends, PUBG' },
  'q.treeLoading': { my: 'App list တင်နေတယ်…', en: 'Loading app list…' },
  'q.retry': { my: 'ပြန်ကြိုးစားမယ်', en: 'Retry' },
  'q.needAppId': { my: 'App Identification ဖွင့်မှ list ရမယ်။', en: 'Turn on App Identification to load the list.' },
  'q.pol': { my: 'Custom QoS Policy', en: 'Custom QoS Policy' },
  'q.add': { my: 'အသစ်', en: 'Add' },
  'q.noPol': { my: 'Policy မရှိသေးဘူး', en: 'No policies yet' },
  'q.confirmDel': { my: 'ဒီ policy ဖျက်မလား?', en: 'Delete this policy?' },
  'q.addPol': { my: 'Policy အသစ်', en: 'New Policy' },
  'q.editPol': { my: 'Policy ပြင်', en: 'Edit Policy' },
  'q.polName': { my: 'Policy နာမည်', en: 'Policy Name' },
  'q.polIp': { my: 'IP / IP Range', en: 'IP / IP Range' },
  'q.upLimit': { my: 'Uplink Limit', en: 'Uplink Limit' },
  'q.dnLimit': { my: 'Downlink Limit', en: 'Downlink Limit' },
  'q.cancel': { my: 'မလုပ်တော့', en: 'Cancel' },
  'm.webauth': { my: 'Web Auth', en: 'Web Auth' },
  'm.webauthSub': { my: 'ဝင်ရောက်ခွင့်စီမံခန့်ခွဲမှု', en: 'Portal config' },
  'wa.title': { my: 'Web Authentication', en: 'Web Authentication' },
  'wa.needGw': { my: 'Gateway login လိုအပ်သည်', en: 'Gateway login required' },
  'wa.enable': { my: 'Authentication', en: 'Authentication' },
  'wa.adUrl': { my: 'Auth Server URL', en: 'Auth Server URL' },
  'wa.https': { my: 'HTTPS Redirection', en: 'HTTPS Redirection' },
  'wa.idle': { my: 'Idle Client Timeout', en: 'Idle Client Timeout' },
  'wa.min': { my: 'မိနစ်', en: 'min' },
  'wa.wifiList': { my: 'Wi-Fi List', en: 'Wi-Fi List' },
  'wa.vlan': { my: 'VLAN', en: 'VLAN' },
  'wa.ipRange': { my: 'IP Range', en: 'IP Range' },
  'wa.add': { my: 'ထည့်မယ်', en: 'Add' },
  'wa.del': { my: 'ဖျက်မယ်', en: 'Delete' },
  'wa.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'wa.saved': { my: 'သိမ်းဆည်းပြီးပါပြီ', en: 'Saved' },
  'wa.confirm': { my: 'Web Authentication setting တွေ gateway မှာ ပြောင်းမှာသေချာပါသလား?', en: 'Save Web Authentication settings to the gateway?' },
  'wa.loading': { my: 'ဖတ်နေသည်…', en: 'Loading…' },
  'wa.loadFail': { my: 'Gateway မှ ဖတ်မရပါ', en: 'Could not read from gateway' },
  'wg.title': { my: 'Global Config', en: 'Global Config' },
  'wg.proto': { my: 'Protocol', en: 'Protocol' },
  'wg.stateUrl': { my: 'Personal Status Page', en: 'Personal Status Page' },
  'wg.remindDays': { my: 'သက်တမ်းကုန်ခါနီး ကြိုသတိပေးရန်', en: 'Remind before expiration' },
  'wg.days': { my: 'ရက်', en: 'days' },
  'wg.remindInterval': { my: 'ထပ်သတိပေးရန်', en: 'Remind every' },
  'wg.hours': { my: 'နာရီ', en: 'hours' },
  'wg.idle': { my: 'Idle Client Timeout', en: 'Idle Client Timeout' },
  'wg.httpCheck': { my: 'HTTP Injection Prevention', en: 'HTTP Injection Prevention' },
  'wg.confirm': { my: 'Global Config တွေ gateway မှာ ပြောင်းမှာသေချာပါသလား?', en: 'Save Global Config to the gateway?' },
  'al.title': { my: 'Allowlist', en: 'Allowlist' },
  'al.mac': { my: 'MAC Allowlist', en: 'MAC Allowlist' },
  'al.domain': { my: 'Domain Allowlist', en: 'Domain Allowlist' },
  'al.add': { my: 'Add', en: 'Add' },
  'al.macPh': { my: 'MAC လိပ်စာ (ဥပမာ C4:B2:5B:26:45:26)', en: 'MAC address (e.g. C4:B2:5B:26:45:26)' },
  'al.badMac': { my: 'MAC လိပ်စာ မမှန်ပါ', en: 'Invalid MAC address' },
  'al.dupMac': { my: 'ဒီ MAC ရှိပြီးသား', en: 'This MAC is already listed' },
  'al.empty': { my: 'မရှိသေးပါ', en: 'No entries' },
  'al.readonly': { my: 'ကြည့်ရန်သာ', en: 'View only' },
  'al.confirm': { my: 'MAC Allowlist ကို gateway မှာ သိမ်းမှာသေချာပါသလား?', en: 'Save the MAC allowlist to the gateway?' },
  'm.clients': { my: 'Online Clients', en: 'Online Clients' },
  'm.history': { my: 'History', en: 'History' },
  'm.historySub': { my: 'ဝင်ထွက်မှတ်တမ်း', en: 'Auth history' },
  'mh.title': { my: 'ဝင်ထွက်မှတ်တမ်း', en: 'Client History' },
  'mh.empty': { my: 'မှတ်တမ်းမရှိပါ', en: 'No history' },
  'mh.needSso': { my: 'SSO login လိုအပ်သည်', en: 'SSO login required' },
  'mh.shared': { my: 'မျှသုံးနေနိုင်', en: 'Possibly shared' },
  'mh.susp': { my: 'သံသယရှိ', en: 'Suspicious' },
  'mh.rotation': { my: 'MAC ချိန်းထားတာ', en: 'MAC rotated' },
  'mh.reason': { my: 'ပြုတ်ရတဲ့အကြောင်း', en: 'Logout reason' },
  'mh.online': { my: 'အခုသုံးနေဆဲ', en: 'Still online' },
  'mh.grpSub': { my: '{n} ကြိမ် · စက် {m} လုံး', en: '{n} sessions · {m} devices' },
  'm.clientsSub': { my: 'ချိတ်ထားသူများ', en: 'Connected' },
  'm.networks': { my: 'Networks', en: 'Networks' },
  'm.networksSub': { my: 'ကွန်ရက်များ', en: 'Networks' },
  'm.sales': { my: 'ရောင်းရငွေ', en: 'Sales' },
  'm.salesSub': { my: 'ရောင်းရငွေစာရင်း', en: 'Sales ledger' },
  'm.recorder': { my: 'Recorder', en: 'Recorder' },
  'm.recorderSub': { my: 'Portal လုပ်ဆောင်ချက်မှတ်တမ်း', en: 'Record portal actions' },
  'm.gwrecorder': { my: 'Gateway Capture', en: 'Gateway Capture' },
  'm.gwrecorderSub': { my: 'Gateway API ဖမ်းယူမှု', en: 'Capture gateway API calls' },
  'm.appdevices': { my: 'App Devices', en: 'App Devices' },
  'm.appdevicesSub': { my: 'သွင်းထားတဲ့ဖုန်းများ', en: 'Installed phones' },
  'dev.lockTitle': { my: 'ဒီ device ကို ပိတ်ထားပါတယ်', en: 'This device is blocked' },
  'dev.lockMsg': { my: 'Pray Thein က ဒီ device ကို ပိတ်ထားပါတယ်။ သုံးချင်ရင် သူ့ကို ဆက်သွယ်ပါ။', en: 'Pray Thein has blocked this device. Contact him to request access.' },
  'dev.pendingTitle': { my: 'ခွင့်ပြုချက် စောင့်နေပါတယ်', en: 'Waiting for approval' },
  'dev.pendingMsg': { my: 'ဒီ device ကို မှတ်ထားပြီးပါပြီ — Pray Thein ခွင့်ပြုမှ သုံးလို့ရမယ်။', en: 'This device is registered — you can use the app once Pray Thein approves it.' },
  'dev.retry': { my: 'ပြန်စစ်မယ်', en: 'Retry' },
  'dev.copied': { my: 'ကူးယူပြီးပြီ', en: 'Copied' },
  'dev.copyFail': { my: 'ကူးမရပါ', en: "Couldn't copy" },
  'ad.loadFail': { my: 'စာရင်း ရမလာပါ', en: "Couldn't load the device list" },
  'ad.saveFail': { my: 'သိမ်းမရပါ', en: "Couldn't save" },
  'ad.saved': { my: 'သိမ်းပြီးပြီ', en: 'Saved' },
  'ad.allow': { my: 'ခွင့်ပြုမယ်', en: 'Allow' },
  'ad.block': { my: 'ပိတ်မယ်', en: 'Block' },
  'ad.allowed': { my: 'ခွင့်ပြုပြီး', en: 'Allowed' },
  'ad.pending': { my: 'စောင့်နေတယ်', en: 'Pending' },
  'ad.blocked': { my: 'ပိတ်ထားတယ်', en: 'Blocked' },
  'ad.thisDevice': { my: 'ဒီဖုန်း', en: 'This phone' },
  'ad.maxDevices': { my: 'Device အရေအတွက် ကန့်သတ်ချက်', en: 'Device limit' },
  'ad.maxDevicesSub': { my: 'ကျော်ရင် အသစ်‌တွေ ခွင့်ပြုချက်စောင့်ရမယ်', en: 'New devices beyond this wait for approval' },
  'ad.requireApproval': { my: 'Device အသစ်တိုင်း ခွင့်ပြုချက်တောင်းမယ်', en: 'Require approval for new devices' },
  'ad.requireApprovalSub': { my: 'ဖွင့်ထားရင် သွင်းသမျှ device တိုင်း စောင့်ရမယ်', en: 'Every new install waits for your approval' },
  'ad.lastSeen': { my: 'နောက်ဆုံးသုံးတာ', en: 'Last seen' },
  'ad.unknownDevice': { my: 'အမည်မသိ device', en: 'Unknown device' },
  'ad.empty': { my: 'device မရှိသေးပါ', en: 'No devices yet' },
  'ad.confirmBlock': { my: 'ဒီ device ကို ပိတ်မှာလား?', en: 'Block this device?' },
  'rec.done': { my: 'မှတ်တမ်းသိမ်းပြီးပြီ', en: 'Recording saved' },
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
  'sl.yday': { my: 'မနေ့က', en: 'Yesterday' },
  'sl.day7': { my: 'နောက်ဆုံး ၇ ရက်', en: 'Last 7 Days' },
  'sl.day30': { my: 'နောက်ဆုံး ၃၀ ရက်', en: 'Last 30 Days' },
  'sl.no': { my: 'စဉ်', en: 'No.' },
  'sl.profile': { my: 'Profile အမည်', en: 'Profile Name' },
  'sl.profileShort': { my: 'Profile', en: 'Profile' },
  'sl.priceShort': { my: 'ဈေး', en: 'Price' },
  'sl.made': { my: 'ထုတ်လုပ်ပြီး', en: 'Quantity' },
  'sl.activated': { my: 'စတင်သုံးစွဲသူ', en: 'Activated Accounts' },
  'sl.activatedShort': { my: 'active', en: 'active' },
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
  'mg.add': { my: 'အသစ်ထည့်မယ်', en: 'Add' },
  'mg.del': { my: 'ဖျက်မယ်', en: 'Delete' },
  'mg.edit': { my: 'ပြင်မယ်', en: 'Edit' },
  'mg.confirmDel': { my: '"{name}" group ကို ဖျက်မှာသေချာပါသလား? (ပြန်ယူလို့မရပါ)', en: 'Delete the "{name}" group? This cannot be undone.' },
  'mg.deleted': { my: 'Group ဖျက်ပြီးပါပြီ', en: 'Group deleted' },
  'mg.needIds': { my: 'Group ID မရပါ — list ပြန်ဖွင့်ကြည့်ပါ', en: 'Group ID unavailable — reopen the list' },
  /* v1.5.95: user group add form */
  'ug.name': { my: 'အမည်', en: 'Name' },
  'ug.price': { my: 'ဈေး', en: 'Price' },
  'ug.quota': { my: 'ဒေတာ', en: 'Quota' },
  'ug.noOfDevice': { my: 'စက်အရေအတွက်', en: 'Devices' },
  'ug.timePeriod': { my: 'သက်တမ်း', en: 'Validity' },
  'ug.timePeriodTotal': { my: 'စုစုပေါင်းသက်တမ်း', en: 'Total validity' },
  'ug.timePeriodDaily': { my: 'နေ့စဉ်သက်တမ်း', en: 'Daily validity' },
  'ug.timePeriodDailyCustom': { my: 'နေ့စဉ်သက်တမ်း (custom)', en: 'Daily validity (custom)' },
  'ug.uploadRateLimit': { my: 'Upload limit', en: 'Upload limit' },
  'ug.downloadRateLimit': { my: 'Download limit', en: 'Download limit' },
  'ug.packageType': { my: 'Package အမျိုးအစား', en: 'Package type' },
  'ug.bindSsid': { my: 'Bind SSID', en: 'Bind SSID' },
  'ug.ip': { my: 'IP range', en: 'IP range' },
  'ug.kickOffType': { my: 'Kick off type', en: 'Kick off type' },
  'ug.durationCtrlType': { my: 'Duration ctrl type', en: 'Duration ctrl type' },
  'ug.limitedTimes': { my: 'Limited times', en: 'Limited times' },
  'ug.lowQuota': { my: 'Low quota', en: 'Low quota' },
  'ug.lowUploadRateLimit': { my: 'Low upload limit', en: 'Low upload limit' },
  'ug.lowDownloadRateLimit': { my: 'Low download limit', en: 'Low download limit' },
  'ug.lowProfileStatus': { my: 'Low profile status', en: 'Low profile status' },
  'ug.isBindSsid': { my: 'SSID bind', en: 'Bind SSID' },
  'ug.bindMac': { my: 'MAC bind', en: 'Bind MAC' },
  'ug.create': { my: 'ဖန်တီးမယ်', en: 'Create' },
  'ug.cancel': { my: 'မလုပ်တော့ဘူး', en: 'Cancel' },
  'ug.needName': { my: 'အမည်ထည့်ပေးပါ', en: 'Enter a name' },
  'ug.needLogin': { my: 'အရင် login ဝင်ပါ', en: 'Please log in first' },
  'ug.done': { my: 'User group ဖန်တီးပြီးပါပြီ', en: 'User group created' },
  'ug.updated': { my: 'User group ပြင်ပြီးပါပြီ', en: 'User group updated' },
  'ug.devices': { my: 'တစ်ပြိုင်တည်း သုံးနိုင်မည့်စက်', en: 'Concurrent Devices' },
  'ug.bindMacFirst': { my: 'ပထမဆုံး သုံးစဉ်က MAC bind လုပ်မယ်', en: 'Bind MAC on first use' },
  'ug.bindMacTip': { my: 'ဖွင့်ထားရင် voucher ကို ပထမဆုံး အသုံးပြုတဲ့ စက်နဲ့ ချိတ်ထားမည်', en: 'When on, the voucher locks to the first device that uses it' },
  'ug.quotaTip': { my: 'ဒေတာ ကုန်သွားရင် voucher သက်တမ်း ကုန်မည်', en: 'The voucher expires when the data runs out' },
  'ug.period': { my: 'သက်တမ်း', en: 'Period' },
  'ug.totalDur': { my: 'စုစုပေါင်း ကြာချိန်', en: 'Total duration' },
  'ug.dailyDur': { my: 'နေ့စဉ် ကြာချိန်', en: 'Daily duration' },
  'ug.duration': { my: 'ကြာချိန်', en: 'Duration' },
  'ug.dataQuota': { my: 'ဒေတာ ပမာဏ', en: 'Data Quota' },
  'ug.upSpeed': { my: 'Upload မြန်နှုန်း', en: 'Upload Speed' },
  'ug.downSpeed': { my: 'Download မြန်နှုန်း', en: 'Download Speed' },
  'ug.unlimited': { my: 'အကန့်အသတ်မရှိ', en: 'Unlimited' },
  'ug.custom': { my: 'ကိုယ်တိုင်ထည့်မယ်', en: 'Custom' },
  'ug.customVal': { my: 'တန်ဖိုး ရိုက်ထည့်ပါ', en: 'Enter a value' },
  'ug.save': { my: 'သိမ်းမယ်', en: 'Save' },
  'ug.namePh': { my: 'User Group အမည် ထည့်ပါ', en: 'Please enter the User Group Name' },
  'ug.pricePh': { my: 'ဈေးနှုန်း ထည့်ပါ', en: 'Please enter the price.' },
  'ug.min': { my: 'မိနစ်', en: 'Minutes' },
  'ug.hr': { my: 'နာရီ', en: 'Hour' },
  'ug.day': { my: 'ရက်', en: 'Day' },
  'ug.wk': { my: 'ပတ်', en: 'Week' },
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
  'md.upgrade': { my: 'အပ်ဒိတ်တင်', en: 'Upgrade' },
  'md.upCheck': { my: 'အပ်ဒိတ်စစ်နေပါသည်…', en: 'Checking for upgrades…' },
  'md.upNone': { my: '{name} အတွက် အပ်ဒိတ်အသစ်မရှိပါ', en: 'No new firmware for {name}' },
  'md.upCur': { my: 'လက်ရှိ', en: 'Current' },
  'md.upNew': { my: 'အသစ်', en: 'New' },
  'md.upRec': { my: 'အကြံပြု', en: 'Recommended' },
  'md.upConfirm': { my: '{name} ကို {ver} တင်မှာလား? စက်ခနရပ်မည်။', en: 'Upgrade {name} to {ver}? The device will briefly go offline.' },
  'md.upSending': { my: 'အပ်ဒိတ်ခိုင်းနေပါသည်…', en: 'Sending upgrade…' },
  'md.upOk': { my: 'အပ်ဒိတ်ခိုင်းပြီးပါပြီ', en: 'Upgrade command sent' },
  'md.upFail': { my: 'အပ်ဒိတ်တင်မရပါ', en: 'Upgrade failed' },
  'md.upNeedSso': { my: 'အပ်ဒိတ်တင်ဖို့အတွက် Ruijie အကောင့်နဲ့ ဝင်ထားဖို့လိုပါတယ် (ဆက်တင် → Ruijie အကောင့်)', en: 'Upgrade needs Ruijie account login (Settings → Ruijie account)' },
  'md.total': { my: 'စုစုပေါင်း {n} လုံး', en: 'Total {n} devices' },
  'md.partial': { my: 'အချို့စက်များ မရသေးပါ', en: 'Some device types failed to load' },
  'md.needSsoHint': { my: 'Switch/Gateway အပြည့်အစုံမြင်ရရန် Settings မှာ Ruijie အကောင့်ဝင်ပါ', en: 'Log in to your Ruijie account in Settings to see Switch/Gateway' },
  'mt.title': { my: 'Traffic (Flow Table)', en: 'Traffic (Flow Table)' },
  'mt.refresh': { my: 'ပြန်ဖတ်', en: 'Refresh' },
  'mt.hint': { my: 'Gateway ချိတ်ထားမှ မြင်ရမည်။ Refresh တစ်ခါနှိပ်တိုင်း ~166 kB ဆွဲမည်။', en: 'Needs a gateway connection. Each refresh pulls ~166 kB.' },
  'mt.flows': { my: 'Flow {n} · {time} က ရထားတာ', en: '{n} flows · updated {time}' },
  'mt.topTalker': { my: 'ဒေတာပိုသုံးသူ', en: 'Over Data' },
  'mt.ip': { my: 'IP', en: 'IP' },
  'mt.conns': { my: 'ချိတ်ဆက်မှု', en: 'Conns' },
  'mt.up': { my: 'အတက်', en: 'Up' },
  'mt.down': { my: 'အဆင်း', en: 'Down' },
  'mt.upRate': { my: 'အတက်နှုန်း', en: 'Up rate' },
  'mt.downRate': { my: 'အဆင်းနှုန်း', en: 'Down rate' },
  'mt.est': { my: '(ခန့်မှန်း)', en: '(est.)' },
  'mt.noData': { my: 'client traffic မရှိပါ', en: 'No client traffic' },
  'ov.title': { my: 'အကျဉ်းချုပ်', en: 'Overview' },
  'ov.trafficRanking': { my: 'Traffic Ranking', en: 'Traffic Ranking' },
  'ov.newClients': { my: 'Newly Connected Clients', en: 'Newly Connected Clients' },
  'ov.refresh': { my: 'ပြန်ဖတ်', en: 'Refresh' },
  'ov.updated': { my: '{time} က ရထားတာ', en: 'updated {time}' },
  'ov.noTraffic': { my: 'traffic data မရှိပါ — gateway ချိတ်ထားမှ မြင်ရမည်', en: 'No traffic data — connect the gateway to see it' },
  'ov.noNew': { my: 'ဗောက်ချာသုံး client အသစ်မရှိပါ', en: 'No new voucher clients' },
  'ov.needSso': { my: 'client နာမည်တွေမြင်ရရန် Ruijie အကောင့်ဝင်ပါ', en: 'Log in to the Ruijie account to see client names' },
  'ov.voucher': { my: 'ဗောက်ချာ', en: 'Voucher' },
  'mt.cumNote': { my: 'စုစုပေါင်းတွေက လက်ရှိ flow table ထဲက counter တွေပါ — billing total မဟုတ်ပါ။ နှုန်းတွေက snapshot နှစ်ခုကြား ခန့်မှန်းချက်ပါ။', en: 'Totals are cumulative counters of currently-tracked flows — not billing totals. Rates are estimates between two snapshots.' },
  'mt.dnsTitle': { my: 'DNS စစ်ဆေးမှု', en: 'DNS check' },
  'mt.dnsNote': { my: 'AdGuard (94.140.14.14) မသုံးတဲ့ client တွေက DHCP DNS ကို ကျော်သုံးနေတာ (hardcoded DNS / DoT) ဖြစ်နိုင်တယ်။', en: 'Clients not using AdGuard (94.140.14.14) may bypass DHCP DNS with hardcoded DNS / DoT.' },
  'md.needSso': { my: 'ပြန်ဖွင့်ဖို့အတွက် Ruijie အကောင့်နဲ့ ဝင်ထားဖို့လိုပါတယ် (ဆက်တင် → Ruijie အကောင့်)', en: 'Reboot needs Ruijie account login (Settings → Ruijie account)' },
  'mc.title': { my: 'Online Clients', en: 'Online Clients' },
  'mc.search': { my: 'Voucher / IP / MAC နဲ့ရှာမယ်', en: 'Search voucher / IP / MAC' },
  'mc.noMatch': { my: 'ရှာမတွေ့ပါ', en: 'No matches' },
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
  'mc.fBlocked': { my: 'Block ထားတယ်', en: 'Blocked' },
  'mc.blockEmpty': { my: 'Block ထားတာ မရှိပါ', en: 'No blocked devices' },
  'mc.blockLocal': { my: 'ဒီဖုန်း', en: 'This phone' },
  'mc.blockPortal': { my: 'Portal', en: 'Portal' },
  'mc.flag.suspicious': { my: 'သံသယရှိ', en: 'Suspend' },
  'mc.flag.sticky': { my: 'ကုန်ပြီးသားဆက်ချိတ်နေ', en: 'Quota spent, still online' },
  'mc.flag.kicked': { my: 'ဖြုတ်ပြီး', en: 'Kicked' },
  'mc.flag.weaksig': { my: 'ဆစ်ဂနယ်အားနည်း', en: 'Weak signal' },
  'mc.flag.toptalker': { my: 'ဒေတာပိုသုံး', en: 'Over Data' },
  'mc.flag.highloss': { my: 'ပက်ကက်ပျက်များနေ', en: 'High packet loss' },
  'mc.dQuality': { my: 'လိုင်းအရည်အသွေး', en: 'Line quality' },
  'mc.qSig': { my: 'ဆစ်ဂနယ်', en: 'Signal' },
  'mc.qRate': { my: 'လက်ရှိအမြန်နှုန်း', en: 'Current rate' },
  'mc.qTotal': { my: 'စုစုပေါင်းသုံးစွဲမှု', en: 'Total transferred' },
  'mc.qLoss': { my: 'ပက်ကက်ပျက်နှုန်း', en: 'Packet loss' },
  'mc.dVoucher': { my: 'ဗောက်ချာ', en: 'Voucher' },
  'mc.dNetwork': { my: 'ကွန်ရက်', en: 'Network' },
  'mc.dSession': { my: 'ဆက်ရှင်', en: 'Session' },
  'mc.dDevice': { my: 'စက်', en: 'Device' },
  'mc.dIp': { my: 'IP', en: 'IP' },
  'mc.dMac': { my: 'MAC', en: 'MAC' },
  'mc.dSsid': { my: 'SSID', en: 'SSID' },
  'mc.dAp': { my: 'AP', en: 'AP' },
  'mc.dConn': { my: 'ချိတ်ဆက်မှု', en: 'Connection' },
  'mc.dSince': { my: 'စချိန်', en: 'Since' },
  'mc.dDur': { my: 'ကြာချိန်', en: 'Duration' },
  'mc.dSig': { my: 'ဆစ်ဂနယ်', en: 'Signal' },
  'mc.dTraffic': { my: 'ဒေတာစုစုပေါင်း', en: 'Total traffic' },
  'mc.dLive': { my: 'လက်ရှိမြန်နှုန်း', en: 'Live rate' },
  'mc.dProfile': { my: 'ပက်ကေ့ချ်', en: 'Package' },
  'mc.dPrice': { my: 'ဈေး', en: 'Price' },
  'mc.dStatus': { my: 'အခြေအနေ', en: 'Status' },
  'mc.dLastUsed': { my: 'နောက်ဆုံးသုံးခဲ့သည်မှာ', en: 'Last used' },
  'mc.dDaysAgo': { my: '{n}ရက်', en: '{n}Days' },
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
  's.themeApple': { my: 'Apple', en: 'Apple' },
  's.language': { my: 'ဘာသာစကား', en: 'Language' },
  'upd.title': { my: 'အပ်ဒိတ်', en: 'App Update' },
  'upd.check': { my: 'အပ်ဒိတ်စစ်မယ်', en: 'Check for updates' },
  'upd.availTitle': { my: 'အပ်ဒိတ်ရရှိနိုင်ပါတယ်', en: 'Update available' },
  'upd.dlInstall': { my: 'ဒေါင်းလုပ်လုပ် & တင်မယ်', en: 'Download & Install' },
  'upd.auto': { my: 'အော်တိုဒေါင်းလုပ်လုပ်မယ်', en: 'Auto-download updates' },
  'upd.autoSub': { my: 'ဗားရှင်းအသစ်တွေ့ရင် အလိုအလို ဒေါင်းလုပ်မယ်', en: 'Download new versions automatically' },
  'upd.checking': { my: 'စစ်နေတယ်…', en: 'Checking…' },
  'upd.latest': { my: 'နောက်ဆုံးဗားရှင်းပဲ', en: 'Already on the latest version' },
  'upd.found': { my: 'ဗားရှင်းအသစ် {v} တွေ့ပြီ — ဒေါင်းလုပ်မလား?', en: 'New version {v} found — download?' },
  'upd.downloading': { my: 'ဒေါင်းလုပ်နေတယ်… {p}%', en: 'Downloading… {p}%' },
  'upd.downloaded': { my: 'ဒေါင်းလုပ်ပြီးပြီ — တပ်ဆင်မလား?', en: 'Download complete — install?' },
  'upd.install': { my: 'တပ်ဆင်မယ်', en: 'Install' },
  'upd.failed': { my: 'ဒေါင်းလုပ်မအောင်မြင်ပါ', en: 'Download failed' },
  'upd.needPerm': { my: '"Install unknown apps" ခွင့်ပြုပေးပါ', en: 'Please allow "Install unknown apps"' },
  'upd.apkOnly': { my: 'အပ်ဒိတ်က Android app သီးသန့်ပါ', en: 'In-app update is Android-app only' },
  'upd.netErr': { my: 'စစ်လို့မရပါ — အင်တာနက်စစ်ပါ', en: "Couldn't check — verify internet" },
  'upd.ready': { my: 'ဗားရှင်းအသစ် အသင့်ဖြစ်ပြီ', en: 'New version ready' },
  'upd.readySub': { my: 'တပ်ဆင်ဖို့ အသင့်ဖြစ်နေပါပြီ', en: 'Ready to install' },
  'upd.readyTitle': { my: 'UPDATE Ready', en: 'UPDATE Ready' },
  'upd.whatsNew': { my: 'ဒီ update မှာပါမဲ့အချက်များ', en: "What's new in this update" },
  'upd.updateNow': { my: 'Update Now', en: 'Update Now' },
  'upd.noNotes': { my: 'အချက်အလက်မရှိပါ', en: 'No details available' },
  'upd.bannerNew': { my: 'ဗားရှင်းအသစ် {v} ထွက်ပြီ — နှိပ်ပြီး ကြည့်မယ်', en: 'New version {v} is out — tap to view' },
  'upd.bannerReady': { my: 'UPDATE Ready {v} — နှိပ်ပြီး တပ်ဆင်မယ်', en: 'UPDATE Ready {v} — tap to install' },
  'upd.preTitle': { my: 'တပ်ဆင်ဖို့ အသင့်ဖြစ်ပြီ', en: 'Ready to install' },
  'upd.preBody': { my: 'ခဏနေ system installer ပွင့်လာမယ်။\n\n1. Play Protect က "Unknown app" လို့ပြရင် → "Install anyway" ကိုနှိပ်ပါ\n2. Xiaomi security scan ပေါ်လာရင် → "Install" / "Continue" ကိုနှိပ်ပါ\n\nPlay Store ပြင်ပက သွင်းတဲ့ app တိုင်း ဒီလိုပဲမို့ ပုံမှန်ပါ။', en: 'The system installer will open now.\n\n1. If Play Protect shows "Unknown app" → tap "Install anyway"\n2. If Xiaomi shows a security scan → tap "Install" / "Continue"\n\nThis is normal for apps installed outside the Play Store.' },
  'upd.gone': { my: 'ဒေါင်းလုပ်ဖိုင် မတွေ့တော့ပါ — ပြန်ဒေါင်းလုပ်ပေးပါ', en: 'Downloaded file not found — please download again' },
  'upd.notiTitle': { my: 'P Manager အပ်ဒိတ်', en: 'P Manager update' },
  'upd.notiText': { my: 'ဗားရှင်း {v} ဒေါင်းလုပ်ပြီးပြီ — တပ်ဆင်ဖို့ နှိပ်ပါ', en: 'Version {v} downloaded — tap to install' },
  'upd.checkFail': { my: 'အပ်ဒိတ်စစ်မရပါ — နောက်မှ ထပ်စစ်မယ်', en: "Couldn't check for updates — will retry later" },
  's.layout': { my: 'အပြင်အဆင်', en: 'Layout' },
  's.layoutAuto': { my: 'အလိုအလျောက်', en: 'Auto' },
  's.layoutAutoSub': { my: 'စခရင်အရွယ်အစားအလိုက် ရွေးမယ်', en: 'Follow screen size' },
  's.layoutPhone': { my: 'ဖုန်း', en: 'Phone' },
  's.layoutPhoneSub': { my: 'ဖုန်း view အမြဲသုံးမယ်', en: 'Always use phone view' },
  's.layoutTablet': { my: 'တက်ဘလက်', en: 'Tablet' },
  's.layoutTabletSub': { my: 'တက်ဘလက် view အမြဲသုံးမယ်', en: 'Always use tablet view' },
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
  'fmt.month': { my: ' လ', en: ' Month' },
  'fmt.months': { my: ' လ', en: ' Months' },
  'fmt.day': { my: ' ရက်', en: ' Day' },
  'fmt.days': { my: ' ရက်', en: ' Days' },
  'fmt.hour': { my: ' နာရီ', en: ' Hour' },
  'fmt.hours': { my: ' နာရီ', en: ' Hours' },
  'fmt.min': { my: ' မိနစ်', en: ' Minute' },
  'fmt.mins': { my: ' မိနစ်', en: ' Minutes' },
  'fmt.sec': { my: ' စက္ကန့်', en: ' Second' },
  'fmt.secs': { my: ' စက္ကန့်', en: ' Seconds' },
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
  if (S.bulkMode) updateBulkCount(); // v1.5.141: premium delete bar title follows language
  renderQueue();
  if (modalVoucher && !$('modal').classList.contains('hidden')) openVoucherDetail(modalVoucher.uuid);
  if (!$('preview-modal').classList.contains('hidden')) openPrintPreview();
  if (!$('layout-modal').classList.contains('hidden')) renderLayoutModal();
  if (!$('typo-modal').classList.contains('hidden')) renderTypoModal();
  if (S.account) loadAccountInfo();
  if (S.moreFn) S.moreFn();
  updateDnsLabels(); // v1.5.84: VLAN-specific AdBlock labels survive language switch
  fillThemeLayoutSelects(); // v1.5.84: theme/layout picker labels follow language
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
/* v1.5.97: full unit words with singular/plural — "1 Day", "3 Days" (user request) */
const fmtUnit = (n, one, many) => n + (Number(n) === 1 ? t(one) : t(many));
const fmtPeriod = mins => {
  if (!mins) return '—';
  mins = Number(mins);
  if (mins % 43200 === 0) return fmtUnit(mins / 43200, 'fmt.month', 'fmt.months');
  if (mins % 1440 === 0) return fmtUnit(mins / 1440, 'fmt.day', 'fmt.days');
  if (mins % 60 === 0) return fmtUnit(mins / 60, 'fmt.hour', 'fmt.hours');
  return fmtUnit(mins, 'fmt.min', 'fmt.mins');
};
const fmtQuota = mb => {
  if (!mb && mb !== 0) return '—';
  mb = Number(mb);
  if (mb <= 0) return t('fmt.unlimited');
  return mb >= 1024 ? (mb / 1024).toFixed(mb % 1024 ? 1 : 0) + ' GB' : mb + ' MB';
};
/* Smart duration for remaining time: "18 Hours 13 Minutes", "2 Days 3 Hours" — built from cloud minutes. */
const fmtRemain = mins => {
  if (mins === null || mins === undefined || mins === '') return '—';
  mins = Math.round(Number(mins));
  if (!isFinite(mins)) return '—';
  mins = Math.max(0, mins);
  if (mins === 0) return fmtUnit(0, 'fmt.min', 'fmt.mins');
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const p = [];
  if (d) p.push(fmtUnit(d, 'fmt.day', 'fmt.days'));
  if (h) p.push(fmtUnit(h, 'fmt.hour', 'fmt.hours'));
  if (m || !p.length) p.push(fmtUnit(m, 'fmt.min', 'fmt.mins'));
  return p.join(' ');
};
/* Live ticking variant with seconds: "18 Hours 12 Minutes 45 Seconds". Driven by the local clock
   from the cloud snapshot — time always passes at 1s/s, so this is exact. */
const fmtRemainSecs = secs => {
  secs = Math.max(0, Math.round(Number(secs)));
  if (!isFinite(secs)) return '—';
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600),
        m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const p = [];
  if (d) p.push(fmtUnit(d, 'fmt.day', 'fmt.days'));
  if (h || d) p.push(fmtUnit(h, 'fmt.hour', 'fmt.hours'));
  p.push(fmtUnit(m, 'fmt.min', 'fmt.mins'));
  p.push(fmtUnit(s, 'fmt.sec', 'fmt.secs'));
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
   v1.5.68: used = 0 (nothing consumed yet) means 100% REMAINS → full blue
   fill, not white. White is reserved for fully-consumed vouchers; a fresh
   in-use voucher must never look "spent".
   Returns {pct, txt} or null → null means "original row" (no fill):
   fully consumed, or usage data missing (never guessed). */
function remainInfo(v) {
  const q = Number(v && v.quota) || 0;
  if (q > 0) {
    if (v.usedQuota === null || v.usedQuota === undefined || v.usedQuota === '') return null;
    const used = Number(v.usedQuota);
    if (!isFinite(used) || used < 0) return null;
    const rem = q - used;
    if (rem <= 0) return null;
    return { pct: Math.max(0, Math.min(100, (rem / q) * 100)), txt: fmtQuota(rem) };
  }
  const p = Number(v && v.timePeriod) || 0;
  if (p > 0) {
    if (v.usedTime === null || v.usedTime === undefined || v.usedTime === '') return null;
    const used = Number(v.usedTime);
    if (!isFinite(used) || used < 0) return null;
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
const THEMES = ['light', 'dark', 'glass', 'neo', 'clay', 'apple'];
const THEME_META = { light: '#EDF1F8', dark: '#000000', glass: '#141A3D', neo: '#E0E5EC', clay: '#E9EDF5', apple: '#FFFFFF' };
const THEME_I18N = { light: 's.themeLight', dark: 's.themeDark', glass: 's.themeGlass', neo: 's.themeNeo', clay: 's.themeClay', apple: 's.themeApple' };
const LAYOUT_I18N = { auto: 's.layoutAuto', phone: 's.layoutPhone', tablet: 's.layoutTablet' };
/** v1.5.84: theme/layout are iOS bottom-sheet pickers (like Profile/Package) — fill select options in the current language. */
function fillThemeLayoutSelects() {
  const ts = $('set-theme');
  if (ts) {
    ts.innerHTML = '';
    THEMES.forEach(th => {
      const o = document.createElement('option');
      o.value = th; o.textContent = t(THEME_I18N[th]);
      ts.appendChild(o);
    });
    ts.value = document.documentElement.dataset.theme || 'light';
    syncIosPickerBtn(ts);
  }
  const ls = $('set-layout');
  if (ls) {
    ls.innerHTML = '';
    LAYOUTS.forEach(m => {
      const o = document.createElement('option');
      o.value = m; o.textContent = t(LAYOUT_I18N[m]);
      ls.appendChild(o);
    });
    let cur = 'auto';
    try { cur = localStorage.getItem('rv-layout') || 'auto'; } catch (e) {}
    if (!LAYOUTS.includes(cur)) cur = 'auto';
    ls.value = cur;
    syncIosPickerBtn(ls);
  }
}
function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'light';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('rv-theme', theme); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[theme] || '#EDF1F8';
  const ts = $('set-theme');
  if (ts && ts.value !== theme) { ts.value = theme; syncIosPickerBtn(ts); }
}
function initTheme() {
  let theme = null;
  try { theme = localStorage.getItem('rv-theme'); } catch (e) {}
  if (!THEMES.includes(theme)) {
    theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  applyTheme(theme);
}

/* ── v1.5.63: layout mode — Auto / Phone / Tablet ──
   Auto (default): no data-layout attribute; the min-width media queries decide.
   Phone: html[data-layout="phone"] — wide-screen rules suppressed via
     html:not([data-layout="phone"]) prefixes; phone rules forced.
   Tablet: html[data-layout="tablet"] — duplicate wide-screen rules apply
     without the media query. */
const LAYOUTS = ['auto', 'phone', 'tablet'];
function applyLayoutMode(mode) {
  if (!LAYOUTS.includes(mode)) mode = 'auto';
  const root = document.documentElement;
  if (mode === 'auto') root.removeAttribute('data-layout');
  else root.setAttribute('data-layout', mode);
  try { localStorage.setItem('rv-layout', mode); } catch (e) {}
  const ls = $('set-layout');
  if (ls && ls.value !== mode) { ls.value = mode; syncIosPickerBtn(ls); }
  syncCompactClass(mode); // v1.5.65: dedicated iOS-compact phone system
}
/* v1.5.65 — dedicated compact phone view. One class drives the whole
 * compact system (css: html.ph-compact …): on when layout is forced to
 * phone, or when Auto lands on a narrow (phone-width) screen. A single
 * class avoids duplicating every compact rule for [data-layout] and
 * @media; the matchMedia listener keeps Auto correct on rotate/resize. */
let _compactMql = null;
function syncCompactClass(mode) {
  const root = document.documentElement;
  const m = LAYOUTS.includes(mode) ? mode : 'auto';
  const narrow = () => { try { return window.matchMedia('(max-width: 680px)').matches; } catch (e) { return false; } };
  const apply = () => root.classList.toggle('ph-compact', m === 'phone' || (m === 'auto' && narrow()));
  apply();
  if (m === 'auto' && !_compactMql) {
    try {
      _compactMql = window.matchMedia('(max-width: 680px)');
      const onChange = () => { if (!document.documentElement.hasAttribute('data-layout')) apply(); };
      if (_compactMql.addEventListener) _compactMql.addEventListener('change', onChange);
      else if (_compactMql.addListener) _compactMql.addListener(onChange);
    } catch (e) {}
  }
}
function initLayoutMode() {
  let m = null;
  try { m = localStorage.getItem('rv-layout'); } catch (e) {}
  applyLayoutMode(m);
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
  syncAutoKickConfig(); // v1.5.66: same creds for the bg auto-kick
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
  if (!e) return;
  e.textContent = msg;
  e.classList.remove('hidden');
  const pad = $(id + '-pad');
  if (pad) pad.classList.remove('hidden');
}

/* ═══════════ NAMED PROFILE LOGIN (v1.5.79) ═══════════
 * Type one name -> the app fills App ID/Secret + Ruijie account and signs in.
 * Lookup order: phone (instant) -> github direct (15s) -> render proxy (15s).
 * Name matching is case- and space-insensitive ("Pray Thein" == "praythein").
 * Create pushes to all 3 tiers; "Complete" shows only when all 3 confirm. */
const DEFAULT_PROXY = 'https://ruijie-voucher-proxy.onrender.com';

/* 'create' | 'update' — which mode the profile form is in. */
let profileFormMode = 'create';
/** v1.5.144: pinHash of the profile being updated (never shown in the form). */
let pfnExistingPinHash = '';
/* Where the form's back/done button returns: 'gate' | 'app'. */
let profileFormReturn = 'gate';

/* ═══════════ v1.5.142: LOGIN AUTO-EXPAND MORPH ═══════════
 * Video reference: the login card blooms from a small pill every time a
 * login screen appears. The pill shows the primary action label (set via
 * data-pill from i18n), holds ~300ms, then springs open; the glow orb
 * fades back in as the card expands. */
function playLoginMorph(card, pillKey) {
  if (!card) return;
  try { card.dataset.pill = t(pillKey); } catch (e) {}
  card.classList.remove('morph-open');
  card.classList.add('morph-collapsed');
  void card.offsetWidth; // commit the collapsed state before animating
  setTimeout(() => {
    card.classList.remove('morph-collapsed');
    card.classList.add('morph-open'); // clip children until fully bloomed
    setTimeout(() => card.classList.remove('morph-open'), 750);
  }, 300);
}
function showProfileGate() {
  profileFormReturn = 'gate';
  $('view-connect').classList.add('hidden');
  $('view-profile-new').classList.add('hidden');
  pinHide(); // v1.5.144: never leave the PIN screen layered under the gate
  $('view-profile').classList.remove('hidden');
  playLoginMorph(document.querySelector('#view-profile .connect-card'), 'pf.login'); // v1.5.142
  setTimeout(() => { try { $('pf-name').focus(); } catch (e) {} }, 50);
}

/* ═══════════ OWNER PIN GATE (v1.5.144) ═══════════
 * The "praythein" profile is PIN-protected: 6 digits, stored as SHA-256 hex
 * (profile.pinHash) across all 3 tiers. Other profiles skip this entirely.
 * - unlock: profile already has a pinHash → must match to log in / to open
 *   the profile form (the form pre-fills the real App ID/Secret).
 * - setup: no pinHash yet → enter twice, then the hash MUST reach the server
 *   (all tiers echo it back) before the login continues, so the same PIN
 *   works after changing phones. A half-synced PIN is rolled back. */

/** Compact pure-JS SHA-256 (fallback when WebCrypto is unavailable). */
function sha256hex(str) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bytes = new TextEncoder().encode(String(str));
  const l = bytes.length;
  const words = [];
  for (let i = 0; i < l; i++) words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
  words[(((l + 8) >> 6) << 4) + 15] = l * 8;
  const w = new Array(64);
  for (let j = 0; j < words.length; j += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[j + i] | 0;
    for (let i = 16; i < 64; i++) {
      const x0 = w[i - 15], x1 = w[i - 2];
      const s0 = ((x0 >>> 7) | (x0 << 25)) ^ ((x0 >>> 18) | (x0 << 14)) ^ (x0 >>> 3);
      const s1 = ((x1 >>> 17) | (x1 << 15)) ^ ((x1 >>> 19) | (x1 << 13)) ^ (x1 >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H = H.map((x, i) => (x + [a, b, c, d, e, f, g, h][i]) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

/** SHA-256 hex of the typed PIN. WebCrypto first, pure-JS fallback.
 *  Never throws — returns '' when hashing is impossible. */
async function pinHash(pin) {
  const s = String(pin || '');
  try {
    if (window.crypto && window.crypto.subtle) {
      const d = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* fall through to the pure-JS implementation */ }
  try { return sha256hex(s); } catch (e) { return ''; }
}

let pinState = null;

function pinHide() {
  const v = $('view-pin');
  if (v) v.classList.add('hidden');
}

/** Show the PIN screen. mode: 'unlock' | 'setup'. onOk(profile) continues. */
function pinShow(mode, profile, onOk) {
  for (const id of ['view-connect', 'view-profile', 'view-profile-new']) {
    const el = $(id); if (el) el.classList.add('hidden');
  }
  const app = $('app'); if (app) app.classList.add('hidden');
  $('view-pin').classList.remove('hidden');
  pinState = { mode, profile, onOk, phase: mode === 'setup' ? 'new' : 'type', first: '' };
  $('pin-title').textContent = t(mode === 'setup' ? 'pin.setupTitle' : 'pin.unlockTitle');
  $('pin-sub').textContent = t(mode === 'setup' ? 'pin.setupSub' : 'pin.unlockSub');
  $('pin-err').classList.add('hidden');
  pinPaint('');
  try { playLoginMorph(document.querySelector('#view-pin .pin-card'), mode === 'setup' ? 'pin.setupTitle' : 'pin.unlockTitle'); } catch (e) {}
  const inp = $('pin-input');
  inp.value = '';
  setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { try { inp.focus(); } catch (e2) {} } }, 60);
}

function pinPaint(digits) {
  const dots = $('pin-dots').children;
  for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i < digits.length);
}

function pinFail(key) {
  const errEl = $('pin-err');
  errEl.textContent = t(key);
  errEl.classList.remove('hidden');
  const card = document.querySelector('#view-pin .pin-card');
  if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  const inp = $('pin-input');
  inp.value = '';
  pinPaint('');
  setTimeout(() => { try { inp.focus(); } catch (e) {} }, 400);
}

async function pinSubmit(digits) {
  const st = pinState;
  if (!st) return;
  if (!/^\d{6}$/.test(digits)) { pinFail('pin.need6'); return; }
  if (st.mode === 'unlock') {
    const want = String(st.profile.pinHash || '').toLowerCase();
    const got = await pinHash(digits);
    if (got && got === want) {
      const cb = st.onOk, prof = st.profile;
      pinState = null; pinHide();
      try { await cb(prof); }
      catch (e) { showProfileGate(); showErr('profile-err', t('err.connectFail') + (e && e.message ? e.message : e)); }
    } else pinFail('pin.wrong');
    return;
  }
  // setup: two phases — new PIN, then confirm
  const errEl = $('pin-err');
  if (st.phase === 'new') {
    st.first = digits;
    st.phase = 'confirm';
    $('pin-sub').textContent = t('pin.setupConfirm');
    $('pin-input').value = '';
    pinPaint('');
    errEl.classList.add('hidden');
    return;
  }
  if (digits !== st.first) {
    st.phase = 'new'; st.first = '';
    $('pin-sub').textContent = t('pin.setupSub');
    pinFail('pin.mismatch');
    return;
  }
  const hash = await pinHash(digits);
  if (!/^[0-9a-f]{64}$/.test(hash || '')) { pinFail('pin.need6'); return; }
  const key = Profiles.normName(st.profile.name);
  const updated = { ...st.profile, name: key, pinHash: hash };
  // strict: the PIN must reach the server (all tiers) before the login
  // continues — otherwise a new phone would not know this PIN.
  const inp = $('pin-input');
  inp.disabled = true;
  $('pin-sub').textContent = t('pin.sending');
  let serverOk = false;
  try {
    const proxy = ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY).replace(/\/+$/, '');
    let rkey = '';
    try { rkey = localStorage.getItem('rv_profile_key') || ''; } catch (e) {}
    // phone tier first (gates this device), then the server must echo the hash
    try { Profiles.put(updated); } catch (e) {}
    const res = await Profiles.pushRemote(key, updated, rkey, proxy);
    serverOk = res.proxy === 'ok' && res.github === 'ok' &&
      String(res.pinHash || '').toLowerCase() === hash;
  } catch (e) { serverOk = false; }
  inp.disabled = false;
  if (!serverOk) {
    // roll the phone tier back: a half-synced PIN is worse than none
    try { Profiles.put(st.profile); } catch (e) {}
    st.phase = 'new'; st.first = '';
    $('pin-sub').textContent = t('pin.setupSub');
    pinFail('pin.serverFail');
    return;
  }
  const cb = st.onOk;
  pinState = null; pinHide();
  try { await cb(updated); }
  catch (e) { showProfileGate(); showErr('profile-err', t('err.connectFail') + (e && e.message ? e.message : e)); }
}

async function doProfileLogin() {
  const errId = 'profile-err';
  const errEl = $(errId);
  if (errEl) errEl.classList.add('hidden');
  const name = Profiles.normName($('pf-name').value);
  if (!name) return showErr(errId, t('pf.badName'));
  const btn = $('btn-profile-login');
  const lbl = $('btn-profile-login-label');
  btn.disabled = true;
  if (lbl) lbl.textContent = t('pf.looking');
  try {
    const proxy = ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY).replace(/\/+$/, '');
    const res = await Profiles.lookup(name, proxy);
    if (res.status === 'found') {
      // v1.5.144: the owner's profile is PIN-gated; other names log straight in
      if (Profiles.normName(res.profile.name) === 'praythein') {
        const hasPin = /^[0-9a-f]{64}$/i.test(String(res.profile.pinHash || ''));
        pinShow(hasPin ? 'unlock' : 'setup', res.profile, (p) => applyProfile(p));
        return;
      }
      await applyProfile(res.profile); return;
    }
    if (res.status === 'error') return showErr(errId, t('pf.slowConn'));
    return showErr(errId, t('pf.notFound'));
  } catch (e) {
    showErr(errId, t('err.connectFail') + (e && e.message ? e.message : e));
  } finally {
    btn.disabled = false;
    if (lbl) lbl.textContent = t('pf.login');
  }
}

/** Apply a profile: save Open-API cfg, stash SSO creds natively, connect, enter. */
/* SSO (APK only): stash the profile's portal creds natively, enable
 * auto-login, then open the login dialog — the injected cover auto-submits
 * the saved creds, so a profile login never makes the user tap Sign In
 * manually. Best-effort: never throws, never blocks the login flow. */
function ssoLoginWithProfile(profile) {
  if (!hasBridge() || !profile || !profile.email) return false;
  try {
    if (window.RuijieBridge.ssoSaveCreds) window.RuijieBridge.ssoSaveCreds(profile.email, profile.password || '');
    if (window.RuijieBridge.ssoSetAutoLogin) window.RuijieBridge.ssoSetAutoLogin(true);
    // fix1: silent login at app entry — dialog hidden, iOS loading shown instead
    if (window.RuijieBridge.ssoLoginSilent) { showIosLoading(); window.RuijieBridge.ssoLoginSilent(); }
    else window.RuijieBridge.ssoLogin();
    return true;
  } catch (e) { hideIosLoading(); return false; }
}
async function applyProfile(profile) {
  const cfg = {
    cloud: (profile.cloud || 'https://cloud-as.ruijienetworks.com').replace(/\/+$/, ''),
    appid: String(profile.appid || '').trim(),
    secret: String(profile.secret || ''),
    proxy: String(profile.proxy || '').replace(/\/+$/, ''),
  };
  if (!cfg.appid || !cfg.secret) throw new Error(t('err.needCreds'));
  if (!hasBridge() && !cfg.proxy) throw new Error(t('err.needProxy'));
  Api.saveCfg(cfg);
  try { localStorage.setItem('rv_profile_name', String(profile.name || '')); } catch (e) {}
  syncMonitorConfig(); // v1.5.52: push cloud creds to the bg offline monitor
  syncAutoKickConfig(); // v1.5.66: same creds for the bg auto-kick
  ssoLoginWithProfile(profile); // SSO (APK only): stash creds + auto-submit; best-effort
  const info = await Api.testConnection();
  S.account = info;
  enterApp();
  toast(t('toast.connected'));
}

/* ── Profile form (create + update) ─────────────────────────────
 * Create: APP ID, SECRET, MAIL, PASSWORD (+name) -> push to all 3 tiers ->
 *   "Complete" only when phone + render + github all confirm.
 * Update: same form pre-filled; the new App ID/Secret are verified with a
 *   live testConnection before anything is pushed. */
function openProfileForm(mode, presetName) {
  profileFormMode = mode;
  $('view-profile').classList.add('hidden');
  $('view-connect').classList.add('hidden');
  $('app').classList.add('hidden');
  $('view-profile-new').classList.remove('hidden');
  // reset to the form state (not the done state)
  $('profile-new-form').classList.remove('hidden');
  $('profile-new-done').classList.add('hidden');
  const tiersBox = $('profile-new-tiers');
  tiersBox.classList.add('hidden');
  tiersBox.innerHTML = '';
  playLoginMorph(document.querySelector('#view-profile-new .connect-card'), 'pf.create'); // v1.5.142
  const errEl = $('profile-new-err');
  if (errEl) errEl.classList.add('hidden');
  // title + button per mode
  $('pfn-title-create').classList.toggle('hidden', mode !== 'create');
  $('pfn-title-update').classList.toggle('hidden', mode !== 'update');
  $('btn-profile-new-save-label').textContent = t(mode === 'update' ? 'pf.updateBtn' : 'pf.createBtn');
  // the sync-key field stays hidden unless the proxy demands a key
  $('pfn-key-wrap').classList.add('hidden');
  $('pfn-key').value = '';
  // v1.5.144: PIN fields — visible only for the owner's profile
  pfnExistingPinHash = '';
  $('pfn-pin').value = '';
  $('pfn-pin2').value = '';
  $('pfn-curpin').value = '';
  $('pfn-curpin-wrap').classList.add('hidden');
  const isPrayForm = Profiles.normName(presetName || (mode === 'create' ? $('pfn-name').value : '')) === 'praythein';
  $('pfn-pin-wrap').classList.toggle('hidden', !isPrayForm);
  if (!$('pfn-cloud').value) $('pfn-cloud').value = 'https://cloud-as.ruijienetworks.com';
  if (!$('pfn-proxy').value) $('pfn-proxy').value = (Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY;
  const nm = $('pfn-name');
  if (mode === 'update') {
    nm.value = presetName || '';
    nm.disabled = true;
    fillProfileForm(presetName);
  } else {
    nm.disabled = false;
  }
}

/** Look the profile up (3-tier) and pre-fill the form for update mode. */
async function fillProfileForm(name) {
  const proxy = ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY).replace(/\/+$/, '');
  const res = await Profiles.lookup(name, proxy);
  if (res.status !== 'found') {
    showErr('profile-new-err', res.status === 'error' ? t('pf.slowConn') : t('pf.notFound'));
    return;
  }
  const p = res.profile;
  $('pfn-cloud').value = p.cloud || 'https://cloud-as.ruijienetworks.com';
  $('pfn-appid').value = p.appid || '';
  $('pfn-secret').value = p.secret || '';
  $('pfn-proxy').value = p.proxy || ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY);
  $('pfn-email').value = p.email || '';
  $('pfn-pass').value = p.password || '';
  // v1.5.144: remember (don't display) the existing PIN hash; the current-PIN
  // field appears only when one is set.
  pfnExistingPinHash = /^[0-9a-f]{64}$/i.test(String(p.pinHash || '')) ? String(p.pinHash).toLowerCase() : '';
  $('pfn-curpin-wrap').classList.toggle('hidden', !pfnExistingPinHash);
}

function showProfileNew() {
  profileFormReturn = 'gate';
  openProfileForm('create');
}

/** Gate "Update profile" link: the name comes from the gate input. */
function showProfileUpdate() {
  const name = Profiles.normName($('pf-name').value);
  if (!name) { showErr('profile-err', t('pf.typeNameFirst')); return; }
  profileFormReturn = 'gate';
  // v1.5.144: the owner's form pre-fills the real App ID/Secret, so opening
  // it needs the PIN first (unless no PIN exists yet — the form then forces
  // setting one on save).
  if (name === 'praythein') {
    const proxy = ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY).replace(/\/+$/, '');
    Profiles.lookup(name, proxy).then(res => {
      const prof = res.status === 'found' ? res.profile : null;
      if (prof && /^[0-9a-f]{64}$/i.test(String(prof.pinHash || ''))) {
        pinShow('unlock', prof, () => openProfileForm('update', name));
      } else {
        openProfileForm('update', name);
      }
    });
    return;
  }
  openProfileForm('update', name);
}

/** Settings → My Profile: the name comes from the last applied profile. */
function showProfileUpdateFromSettings() {
  let name = '';
  try { name = localStorage.getItem('rv_profile_name') || ''; } catch (e) {}
  if (!name) { toast(t('pf.typeNameFirst')); return; }
  profileFormReturn = 'app';
  openProfileForm('update', name);
}

/** Back button on the form (and the done panel): return where we came from. */
function profileFormBack() {
  if (profileFormReturn === 'app') {
    $('view-profile-new').classList.add('hidden');
    $('app').classList.remove('hidden');
  } else {
    showProfileGate();
  }
}

async function doProfileCreate() {
  const errId = 'profile-new-err';
  const errEl = $(errId);
  if (errEl) errEl.classList.add('hidden');
  const tiersBox = $('profile-new-tiers');
  tiersBox.classList.add('hidden');
  tiersBox.innerHTML = '';
  const isUpdate = profileFormMode === 'update';
  const p = {
    name: $('pfn-name').value,
    display: $('pfn-name').value.trim(),
    cloud: $('pfn-cloud').value.trim(),
    appid: $('pfn-appid').value.trim(),
    secret: $('pfn-secret').value,
    proxy: $('pfn-proxy').value.trim(),
    email: $('pfn-email').value.trim(),
    password: $('pfn-pass').value,
  };
  // v1.5.144: owner PIN — create requires a new 6-digit PIN; update keeps the
  // existing one unless a new PIN is typed (changing it needs the current PIN).
  if (Profiles.normName($('pfn-name').value) === 'praythein') {
    const curPin = $('pfn-curpin').value.replace(/\D/g, '');
    const newPin = $('pfn-pin').value.replace(/\D/g, '');
    const newPin2 = $('pfn-pin2').value.replace(/\D/g, '');
    const wantsNewPin = !isUpdate || !pfnExistingPinHash || newPin || newPin2;
    let finalHash = isUpdate ? pfnExistingPinHash : '';
    if (wantsNewPin) {
      if (isUpdate && pfnExistingPinHash) {
        if ((await pinHash(curPin)) !== pfnExistingPinHash) return showErr(errId, t('pin.curWrong'));
      }
      if (!/^\d{6}$/.test(newPin)) return showErr(errId, t('pin.need6'));
      if (newPin !== newPin2) return showErr(errId, t('pin.mismatch'));
      finalHash = await pinHash(newPin);
      if (!/^[0-9a-f]{64}$/.test(finalHash || '')) return showErr(errId, t('pin.need6'));
    }
    p.pinHash = finalHash;
  }
  const bad = Profiles.validate(p);
  if (bad) return showErr(errId, t('pf.needFields'));
  const btn = $('btn-profile-new-save');
  btn.disabled = true;
  try {
    const normKey = Profiles.normName(p.name);
    const proxy = (p.proxy || DEFAULT_PROXY).replace(/\/+$/, '');
    if (isUpdate) {
      // verify the new App ID/Secret with a live call before pushing anything
      const cfg = {
        cloud: (p.cloud || 'https://cloud-as.ruijienetworks.com').replace(/\/+$/, ''),
        appid: p.appid,
        secret: p.secret,
        proxy,
      };
      const prevCfg = Api.cfg ? { ...Api.cfg } : null;
      Api.saveCfg(cfg);
      try {
        await Api.testConnection();
      } catch (e) {
        if (prevCfg) Api.saveCfg(prevCfg); else Api.clearCfg();
        return showErr(errId, t('pf.verifyFail'));
      }
    }
    // tier 1: this phone
    let phoneOk = false;
    try { Profiles.put({ ...p, name: normKey }); phoneOk = true; } catch (e) {}
    // tiers 2+3: proxy (render disk + github write-through)
    let key = '';
    try { key = localStorage.getItem('rv_profile_key') || ''; } catch (e) {}
    const keyTyped = $('pfn-key').value;
    if (keyTyped) { key = keyTyped; try { localStorage.setItem('rv_profile_key', keyTyped); } catch (e) {} }
    const res = await Profiles.pushRemote(normKey, { ...p, name: normKey }, key, proxy);
    if (res.proxy === 'key') {
      // the proxy demands a sync key: reveal the field and let the user retry
      $('pfn-key-wrap').classList.remove('hidden');
      return showErr(errId, t('pf.keyNeeded'));
    }
    const tiers = { phone: phoneOk, render: res.proxy === 'ok', github: res.github === 'ok' };
    // v1.5.144: the server must echo the PIN hash back — an old proxy drops
    // unknown fields, and a half-synced PIN would break the next phone.
    const wantPin = Profiles.normName($('pfn-name').value) === 'praythein';
    const pinOk = !wantPin ||
      (!!p.pinHash && String(res.pinHash || '').toLowerCase() === String(p.pinHash).toLowerCase());
    renderProfileTiers(tiers);
    if (tiers.phone && tiers.render && tiers.github && pinOk) {
      showProfileDone();
    } else if (tiers.phone && tiers.render && tiers.github && !pinOk) {
      showErr(errId, t('pin.serverOld'));
    } else {
      showErr(errId, t('pf.tierFail'));
    }
  } finally {
    btn.disabled = false;
  }
}

/** Per-tier checkmarks under the form. tiers: {phone, render, github} | null. */
function renderProfileTiers(tiers) {
  const box = $('profile-new-tiers');
  if (!tiers) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  const row = (ok, label) =>
    '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
    '<span style="font-weight:700;color:' + (ok ? '#34C759' : '#FF3B30') + '">' + (ok ? '✓' : '✗') + '</span>' +
    '<span>' + label + '</span></div>';
  box.innerHTML =
    row(tiers.phone, t('pf.tierPhone')) +
    row(tiers.github, t('pf.tierGithub')) +
    row(tiers.render, t('pf.tierRender'));
  box.classList.remove('hidden');
}

/** "Complete" state: all 3 tiers confirmed. */
function showProfileDone() {
  $('profile-new-form').classList.add('hidden');
  const box = $('profile-done-tiers');
  const row = (label) =>
    '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
    '<span style="font-weight:700;color:#34C759">✓</span><span>' + label + '</span></div>';
  box.innerHTML =
    row(t('pf.tierPhone')) + row(t('pf.tierGithub')) + row(t('pf.tierRender'));
  $('profile-new-done').classList.remove('hidden');
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
// v1.5.123: refresh all synced settings UI after a pull
function refreshSyncedUI(st2) {
  try {
    if (!st2) st2 = Store.load();
    if (st2.printHeader && $('print-header')) $('print-header').value = st2.printHeader;
    if (st2.printFooter && $('print-footer')) $('print-footer').value = st2.printFooter;
    if (st2.printPaper && $('print-paper')) $('print-paper').value = st2.printPaper;
    if (st2.printCopies && $('print-copies')) $('print-copies').value = st2.printCopies;
    if (st2.liveStats && typeof st2.liveStats === 'object') {
      const le = $('live-enable');
      if (le) le.checked = !!st2.liveStats.enabled;
      if (typeof refreshLiveCard === 'function') refreshLiveCard();
      document.querySelectorAll('#live-int-seg [data-live-int]').forEach(b => {
        b.classList.toggle('active', +b.dataset.liveInt === +st2.liveStats.secs);
      });
    }
    if (st2.kickAuto !== undefined && $('kick-auto')) $('kick-auto').checked = !!st2.kickAuto;
    if (st2.kickIntervalMin !== undefined && $('kick-interval')) $('kick-interval').value = st2.kickIntervalMin;
    if (st2.voucherVlan !== undefined && $('kick-vlan') && typeof ensureVlanOptions === 'function') {
      try { ensureVlanOptions(); } catch (e) {}
    }
    if (st2.adDnsOn !== undefined && $('dns-adblock')) $('dns-adblock').checked = !!st2.adDnsOn;
    if (st2.adDnsVlan !== undefined && $('dns-vlan')) $('dns-vlan').value = st2.adDnsVlan;
    if (st2.teleOn !== undefined && $('tele-on')) $('tele-on').checked = st2.teleOn !== false;
    if (st2.updateAutoDl !== undefined && $('upd-auto')) $('upd-auto').checked = !!st2.updateAutoDl;
    // v1.5.126: refresh print layout/style (reload PS from Store)
    if (st2.printStyle && typeof loadPrintStyle === 'function') {
      try { loadPrintStyle(); } catch (e) {}
    }
    // v1.5.125: refresh device offline monitor UI
    if (st2._monEnabled !== undefined && typeof refreshMonitorCard === 'function') {
      try { refreshMonitorCard(); } catch (e) {}
    }
  } catch (e) {}
}
function enterApp() {
  /* User-requested: the app always starts in English. A manual language
   * switch still works for the session; the next startup is English again. */
  try { setLang('en'); } catch (e) {}
  $('view-connect').classList.add('hidden');
  $('view-profile').classList.add('hidden');
  $('view-profile-new').classList.add('hidden');
  devHideLock(); // v1.5.143: in case we arrived via the lock-screen retry
  $('app').classList.remove('hidden');
  // v1.5.143: App Devices admin is visible to the owner profile only.
  try { $('more-appdevices').hidden = !devIsAdmin(); } catch (e) {}
  const st = Store.load();
  if (st.printHeader) $('print-header').value = st.printHeader;
  if (st.printFooter) $('print-footer').value = st.printFooter;
  if (st.printPaper && st.printPaper !== '80') $('print-paper').value = st.printPaper;
  if (st.printCopies) $('print-copies').value = st.printCopies;
  // sync iOS segmented paper control with stored value (80mm removed — always 58mm)
  const pp = ($('print-paper').value === '80' ? '58' : $('print-paper').value) || '58';
  document.querySelectorAll('#paper-seg button').forEach(b =>
    b.classList.toggle('active', b.dataset.paper === pp));
  loadProjects().then(() => { switchView('view-vouchers', false); try { history.replaceState({ view: 'view-vouchers' }, ''); } catch (e) {} S.currentView = 'view-vouchers'; startupSync(); });
  // Vouchers start immediately with the stored project (in parallel with
  // the project list) instead of waiting for it — the list reconciles after.
  if (S.projectId) loadVouchers();
  loadAccountInfo();
  // v1.5.120: pull synced settings from other phones (last-write-wins)
  const doSettingsPull = () => {
    try {
      if (typeof SettingsSync !== 'undefined') SettingsSync.pull().then(r => {
        if (r && r.ok && r.applied) refreshSyncedUI(Store.load());
      });
    } catch (e) {}
  };
  doSettingsPull();
  // v1.5.121: periodic settings pull every 60s + manual sync button
  setInterval(doSettingsPull, 60000);
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
    if (el.id === 'search-clear') return; // v1.5.101: search ✕ stays static (no wobble)
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
  return !!document.querySelector('.modal:not(.hidden)') || !!document.querySelector('.ios-sheet-ov');
}
function closeAnySheet() {
  document.querySelectorAll('.ios-sheet-ov').forEach(ov => ov.remove());
}
function closeAnyModal() {
  document.querySelectorAll('.modal:not(.hidden)').forEach(m => closeModal(m.id));
}
/* v1.5.92: Back is handled entirely through WebView history.
   Native onBackPressed() just calls goBack(); this handler decides what
   that back means. If a modal is open, the back press popped a view state
   underneath it — close the modal and push the current view back so the
   user stays where they were. */
window.addEventListener('popstate', (e) => {
  const st = e.state || {};
  if (anyModalOpen()) {
    const cur = S.currentView || 'view-vouchers';
    closeAnyModal();
    closeAnySheet();
    // Restore the view entry that Back just popped, so the next Back
    // goes to the previous view instead of skipping one.
    try { history.pushState({ view: cur }, ''); } catch (err) {}
    return;
  }
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
  syncAutoKickConfig(); // v1.5.66
}

function onProjectChange() {
  S.projectId = $('project-select').value;
  S.portalBlockedMacs = null; // v1.5.117: deny-list belongs to the project
  Store.save({ projectId: S.projectId });
  syncGenUserGroup();
  syncMonitorConfig();
  syncAutoKickConfig(); // v1.5.66
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
    // v1.5.132: share the code→voucher map with Online Clients so the
    // client list doesn't re-fetch ALL vouchers on every load.
    // v1.5.171: also stamp _acVMapAt so apClientVoucherMap() treats this
    // as fresh and skips its own refetch.
    try {
      const m = new Map();
      for (const v of all) { const c = vCode(v); if (c && !m.has(c)) m.set(c, v); }
      _acVMap = m; _acVMapPid = Number(S.projectId); _acVMapAt = Date.now();
    } catch (e) { /* map is best-effort */ }
    // newest first
    S.vouchers.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    try { for (const v of S.vouchers) Learn.record(v); } catch (e) { /* learning is best-effort */ }
    Tele.flush(); // v1.5.75: flush queued telemetry (best-effort)
    renderVouchers();
  } catch (e) {
    if (gen !== S._voucherGen) return; // superseded — discard
    // v1.5.75: report sync failures for monitoring
    Tele.log('sync.failed', String((e && e.message) || e || '').slice(0, 200)); Tele.flush();
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
    // v1.5.66: filter on EFFECTIVE status — spent/kicked vouchers leave
    // "In use" and appear under "Expired" even while Cloud still says 2.
    if (S.vStatus && vEffStatus(v) !== S.vStatus) return false;
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
  // v1.5.66: effective status — stats match the filters exactly.
  const n1 = S.vouchers.filter(v => vEffStatus(v) === '1').length;
  const n2 = S.vouchers.filter(v => vEffStatus(v) === '2').length;
  const n3 = S.vouchers.filter(v => vEffStatus(v) === '3').length;
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
  if (!list.length) {
    el.innerHTML = (S.vFilter || S.vStatus)
      ? `<div class="empty"><div class="big">${ic('search', 'xl')}</div><p><b>${t('v.noResult')}</b></p><p class="small">${t('v.noResultSub')}</p></div>`
      : `<div class="empty"><div class="big">${ic('ticket', 'xl')}</div><p><b>${t('v.empty')}</b></p><p class="small">${t('v.emptySub')}</p></div>`;
    return;
  }
  el.innerHTML = list.slice(0, 300).map(v => {
    const ri = remainInfo(v); // v1.5.53: decreasing remaining-resource fill
    const es = vEffStatus(v); // v1.5.66: badge/dot follow effective status
    return `
    <div class="voucher-row" data-uuid="${esc(v.uuid)}">
      <button type="button" class="bulk-check" data-bulk="${esc(v.uuid)}" aria-label="select"><span class="tick">✓</span></button>
      ${ri ? `<div class="remain-fill" style="width:${ri.pct.toFixed(1)}%"></div>` : ''}
      <span class="status-dot s${esc(es)}"></span>
      <div class="voucher-meta">
        <div class="voucher-code">${esc(vCode(v))}</div>
        <div class="pkg">${esc(v.packageName || v.userGroupName || '')} · ${esc(fmtPeriod(v.timePeriod))}</div>
      </div>
      ${ri ? `<span class="remain-txt">${esc(ri.txt)}</span>` : ''}
      ${Learn.fastBurn(v) ? `<span class="flag-fast" title="${esc(t('learn.fast'))}">⚑</span>` : ''}
      <span class="badge s${esc(es)}">${esc(statusTxt(es))}</span>
      <span class="chev">${ic('chev')}</span>
    </div>`;
  }).join('');
  if (list.length > 300) el.innerHTML += `<div class="empty" style="padding:20px"><p class="small">${t('v.first300')}</p></div>`;
  el.querySelectorAll('.voucher-row').forEach(r => r.addEventListener('click', e => {
    if (S.bulkMode) {
      // v1.5.54: in bulk mode, row tap toggles the checkmark (v1.5.101: custom ✓, not native checkbox)
      if (e.target.closest('.bulk-check')) return; // let checkmark handle itself
      const cb = r.querySelector('.bulk-check');
      // v1.5.141: premium selection — the whole row highlights purple
      if (cb) { cb.classList.toggle('on'); r.classList.toggle('sel', cb.classList.contains('on')); updateBulkCount(); }
      return;
    }
    openVoucherDetail(r.dataset.uuid);
  }));
  el.querySelectorAll('.bulk-check').forEach(cb => cb.addEventListener('click', e => {
    e.stopPropagation(); cb.classList.toggle('on');
    const r = cb.closest('.voucher-row'); // v1.5.141: row highlight follows the check
    if (r) r.classList.toggle('sel', cb.classList.contains('on'));
    updateBulkCount();
  }));
}

/* ═══════════ v1.5.54: bulk select ═══════════ */
function toggleBulkMode() {
  S.bulkMode = !S.bulkMode;
  $('voucher-list').classList.toggle('bulk-mode', S.bulkMode);
  // v1.5.161: bulk delete/print inline in the actions row (1 row with Cancel)
  const bi = $('bulk-inline');
  if (bi) bi.style.display = S.bulkMode ? 'flex' : 'none';
  $('btn-voucher-more').style.display = S.bulkMode ? 'none' : '';
  $('btn-bulk-select').querySelector('span').textContent = S.bulkMode ? t('a.cancel') : t('v.select');
  if (!S.bulkMode) {
    document.querySelectorAll('.bulk-check').forEach(cb => cb.classList.remove('on'));
    document.querySelectorAll('.voucher-row.sel').forEach(r => r.classList.remove('sel')); // v1.5.141
  }
  updateBulkCount();
}
function bulkSelectedUuids() {
  return Array.from(document.querySelectorAll('.bulk-check.on')).map(cb => cb.dataset.bulk);
}
function updateBulkCount() {
  const n = bulkSelectedUuids().length;
  const bc = $('bulk-count');
  if (bc) bc.textContent = n; // v1.5.145: compact badge shows the count only
  const dt = $('bulk-del-title'); // v1.5.141: premium bar title (tablet layout only)
  if (dt) dt.textContent = n ? tx('v.delN', { n }) : t('v.bulkDelete');
  const bar = $('btn-bulk-delete');
  if (bar) {
    bar.classList.remove('done');
    bar.setAttribute('aria-label', n ? tx('v.delN', { n }) : t('v.bulkDelete'));
  }
  const pb = $('btn-bulk-print');
  if (pb) pb.disabled = !n;
  if (bar) bar.disabled = !n;
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
  if (!(await iosConfirm(tx('del.confirmBulkNew', { n: fresh.length, skip: skipTxt }), '', t('a.delete'), t('a.cancel'), true))) return;
  // v1.5.141: premium exit — selected rows fly out staggered, the bar shows progress
  const bar = $('btn-bulk-delete');
  const delTitle = $('bulk-del-title');
  fresh.forEach((v, i) => {
    const row = document.querySelector('.voucher-row[data-uuid="' + v.uuid + '"]');
    if (row) setTimeout(() => row.classList.add('leaving'), i * 70);
  });
  let ok = 0, fail = 0;
  for (const v of fresh) {
    if (delTitle) delTitle.textContent = tx('v.deleting', { i: ok + fail + 1, n: fresh.length });
    try { await Api.voucherDelete(S.projectId, v); ok++; }
    catch (e) { fail++; }
  }
  // Remove successfully deleted codes from the session set
  try { fresh.forEach(v => S.sessionGenCodes.delete(vCode(v))); } catch (e) {}
  // v1.5.141: success flash on the bar, then exit bulk mode + reload
  if (bar) { bar.classList.add('done'); bar.disabled = false; }
  if (delTitle) delTitle.textContent = t('v.deleted');
  toast(`${ok} ✓${fail ? ` · ${fail} ✗` : ''}${stale ? ` · ${stale} ⏭` : ''}`);
  setTimeout(() => { toggleBulkMode(); loadVouchers(); }, 900);
}

/* ═══════════ v1.5.113: bulk Delete Expired Vouchers (portal-verified) ═══════════
   Uses the REAL portal envelope (verified 2026-10-01 via Recorder):
   POST /authconfig/group/{gid}/api/agent/write with
   urlSuffix /macc3/batchDelete/voucher/{gid}, httpMethod DELETE,
   bodyParam {expireTime}. One call deletes ALL expired — no per-voucher
   loop. Replaces the v1.5.101 per-voucher SSO-bridge loop. */
/* ── iOS Liquid Glass confirm dialog (v1.5.116) ──
 * Replaces native confirm() — permanent design rule: iOS UI/UX only.
 * Returns a Promise<boolean>. */
function iosConfirm(title, msg, okText, cancelText, destructive) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'ios-alert-ov';
    ov.innerHTML =
      '<div class="ios-alert" role="alertdialog">' +
        '<div class="ios-alert-body">' +
          '<div class="ios-alert-title">' + esc(title) + '</div>' +
          (msg ? '<div class="ios-alert-msg">' + esc(msg) + '</div>' : '') +
        '</div>' +
        '<div class="ios-alert-btns">' +
          '<button class="ios-alert-btn" data-r="0">' + esc(cancelText || t('a.cancel')) + '</button>' +
          '<button class="ios-alert-btn' + (destructive ? ' destructive' : '') + '" data-r="1">' + esc(okText || t('a.ok')) + '</button>' +
        '</div>' +
      '</div>';
    const done = v => { ov.remove(); resolve(v); };
    ov.querySelectorAll('.ios-alert-btn').forEach(b =>
      b.addEventListener('click', () => done(b.dataset.r === '1')));
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
    document.body.appendChild(ov);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => ov.classList.add('open')));
  });
}

/* ── Expired-delete cutoff date picker (v1.5.116) ──
 * Returns 'YYYY-MM-DD' or null if the user cancels. */
function pickExpireDate() {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'ios-sheet-ov';
    const sheet = document.createElement('div');
    sheet.className = 'ios-sheet';
    sheet.setAttribute('role', 'dialog');
    const today = (() => {
      const d = new Date();
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    })();
    sheet.innerHTML =
      '<div class="sheet-handle"></div>' +
      '<div class="ios-sheet-title">' + esc(t('v.delExpiredPickDate')) + '</div>' +
      '<div style="padding:12px 16px"><input type="date" id="exp-date-cutoff" ' +
      'value="' + today + '" max="' + today + '" ' +
      'style="width:100%;font-size:17px;padding:10px;border-radius:10px;' +
      'border:1px solid var(--separator);background:var(--bg)"></div>' +
      '<div id="exp-count-result" style="padding:0 16px;min-height:24px;font-size:15px"></div>' +
      '<div class="ios-sheet-opts"></div>';
    const optsEl = sheet.querySelector('.ios-sheet-opts');
    const countBtn = document.createElement('button');
    countBtn.type = 'button';
    countBtn.className = 'ios-sheet-opt active';
    countBtn.innerHTML = '<span>' + esc(t('v.delExpiredShowCount')) + '</span>';
    // v1.5.155: auto-show count when date changes (no need to tap Show count)
    const dateInput = sheet.querySelector('#exp-date-cutoff');
    const doCount = async () => {
      const v = sheet.querySelector('#exp-date-cutoff').value || null;
      if (!v) return;
      const resultEl = sheet.querySelector('#exp-count-result');
      optsEl.innerHTML = '';
      optsEl.appendChild(countBtn);
      countBtn.disabled = true;
      resultEl.textContent = '…';
      try {
        const expireTime = endOfDayMs(v);
        let n = null;
        try {
          const cj = await Api.voucherExpireCountSso(Number(S.projectId), expireTime);
          n = extractExpireCount(cj);
        } catch (e) {}
        if (n === null) {
          // v1.5.130: filter by expiry date <= selected date, not just status
          n = (S.vouchers || []).filter(x => {
            if (vEffStatus(x) !== '3') return false;
            const exp = Number(x.expiryTime) || 0;
            return !exp || exp <= expireTime;
          }).length;
        }
        if (!n) {
          resultEl.textContent = t('v.delExpiredNone');
          countBtn.disabled = false;
          return;
        }
        resultEl.innerHTML = '<b>' + n + '</b> ' + esc(t('v.delExpiredFound'));
        // Replace Show count with Delete button
        optsEl.innerHTML = '';
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'ios-sheet-opt danger';
        delBtn.innerHTML = '<span>' + esc(t('a.delete')) + ' (' + n + ')</span>';
        delBtn.addEventListener('click', () => {
          closeExpDateSheet();
          resolve({ date: v, count: n, expireTime });
        });
        optsEl.appendChild(delBtn);
      } catch (e) {
        resultEl.textContent = String((e && e.message) || e || '');
        countBtn.disabled = false;
      }
    };
    dateInput.addEventListener('change', doCount);
    // v1.5.129: two-step - show count in dialog, then reveal Delete button
    countBtn.addEventListener('click', doCount);
    optsEl.appendChild(countBtn);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'ios-sheet-cancel';
    cancel.textContent = t('a.cancel');
    cancel.addEventListener('click', () => {
      closeExpDateSheet();
      resolve(null);
    });
    sheet.appendChild(cancel);
    ov.appendChild(sheet);
    ov.addEventListener('click', e => {
      if (e.target === ov) { closeExpDateSheet(); resolve(null); }
    });
    document.body.appendChild(ov);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => ov.classList.add('open')));
    // v1.5.155: auto-show count on open with default date
    setTimeout(() => { try { doCount(); } catch (e) {} }, 300);
  });
}
function closeExpDateSheet() {
  const ov = document.querySelector('.ios-sheet-ov');
  if (ov) ov.remove();
}
/** End of the picked day in local time — matches the portal's own cutoff
 *  (captured expireTime 1789579799999 = 2026-09-16 23:59:59.999 +0630). */
function endOfDayMs(ymd) {
  const parts = String(ymd || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => !isFinite(n))) return Date.now();
  return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
}

async function deleteExpiredVouchers() {
  if (!Api.ssoLoggedIn()) { toast(t('ac.needSso'), true); return; }
  // v1.5.129: pickExpireDate now returns {date, count, expireTime} after two-step dialog
  const picked = await pickExpireDate();
  if (!picked) return; // user cancelled
  const { date: pickedDate, count: n, expireTime } = picked;
  const okDel = await iosConfirm(
    tx('v.delExpiredConfirm', { n }),
    t('v.delExpiredThrough') + ' ' + pickedDate,
    t('a.delete'), t('a.cancel'), true);
  if (!okDel) return;
  try {
    await Api.voucherDeleteExpiredSso(Number(S.projectId), expireTime);
    toast(tx('v.delExpiredDone', { ok: n }));
  } catch (e) {
    toast(String((e && e.message) || e || ''), true);
    return;
  }
  loadVouchers();
}

/** Pull the expired count out of the portal's getExpireVoucherCount reply.
 *  Shape not yet seen in the wild — accept common wrappings, else null. */
function extractExpireCount(j) {
  if (j === null || j === undefined) return null;
  if (typeof j === 'number' && isFinite(j)) return j;
  if (typeof j !== 'object') return null;
  const d = j.data;
  if (typeof d === 'number' && isFinite(d)) return d;
  if (d && typeof d === 'object') {
    for (const k of ['count', 'total', 'expireCount', 'num']) {
      if (typeof d[k] === 'number' && isFinite(d[k])) return d[k];
    }
  }
  for (const k of ['count', 'total', 'expireCount', 'num']) {
    if (typeof j[k] === 'number' && isFinite(j[k])) return j[k];
  }
  return null;
}

/* ═══════════ v1.5.101: Reset selected vouchers (Ruijie Cloud style) ═══════════
   Reset clears a voucher's usage (used time/quota) back to fresh/unused.
   v1.5.104: uses the VERIFIED portal envelope (2026-10-01, from live portal
   JS): POST /intlSamVoucher/voucher/reset with
   params:{recordList:[uuids], voucherCode:"codes"} querys:{group_id}.
   The portal sends ONE call for all selected vouchers — we do the same. */
async function resetSelectedVouchers() {
  const uuids = bulkSelectedUuids();
  if (!uuids.length) { toast(t('v.resetNone')); return; }
  const vs = uuids.map(u => S.vouchers.find(x => x.uuid === u)).filter(Boolean);
  if (!(await iosConfirm(tx('v.resetConfirm', { n: vs.length }), '', t('v.reset'), t('a.cancel'), true))) return;
  try {
    await Api.voucherResetMany(S.projectId, vs);
    toast(tx('v.resetDone', { ok: vs.length }));
  } catch (e) {
    toast(tx('v.resetDone', { ok: 0 }) + ` · ${vs.length} ✗`);
  }
  if (S.bulkMode) toggleBulkMode();
  loadVouchers();
}

/* v1.5.101: voucher More menu (⋯) */
function toggleVoucherMore(show) {
  const m = $('voucher-more-menu');
  const willShow = show !== undefined ? show : m.classList.contains('hidden');
  m.classList.toggle('hidden', !willShow);
}


let modalVoucher = null;
function openVoucherDetail(uuid) {
  const v = S.vouchers.find(x => x.uuid === uuid);
  if (!v) return;
  modalVoucher = v;
  $('modal-title').innerHTML = ic('ticket', 'sm') + ' ' + esc(vCode(v));
  const rows = [
    [t('d.code'), `<b class="voucher-code">${esc(vCode(v))}</b> <button class="icon-btn" id="modal-copy" title="${t('a.copy')}" style="width:30px;height:30px">${ic('copy', 'sm')}</button>`],
    [t('d.status'), `<span class="badge s${esc(vEffStatus(v))}">${esc(statusTxt(vEffStatus(v)))}</span>`],
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
    [t('learn.avg'), esc(learnAvgTxt(v))], // v1.5.75: per-package usage average
    [t('d.maxClients'), esc(v.maxClients || '—')],
    [t('d.curClients'), esc(v.currentClients || 0)],
    ['Download limit', v.downloadRateLimit ? v.downloadRateLimit + ' KB/s' : '—'],
    ['Upload limit', v.uploadRateLimit ? v.uploadRateLimit + ' KB/s' : '—'],
    [t('d.price'), v.packagePrice ? esc(v.packagePrice) : '—'],
    [t('d.note'), esc(v.comment || v.nameRef || '—')],
    [t('d.macbind'), v.bindMac ? 'Yes' : 'No'],
  ];
  $('modal-body').innerHTML = `
  <dl class="kv">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
  $('modal-copy').addEventListener('click', ev => { ev.stopPropagation(); copyText(vCode(v)); });
  // v1.5.68: Disconnect on EVERY voucher preview (user request) — it takes
  // Print's spot for all vouchers, not just In use. (Queue / top-bar print
  // paths remain for printing.)
  $('modal-print').classList.add('hidden');
  $('modal-disconnect').classList.remove('hidden');
  // v1.5.86: MAC unbind button on voucher preview (user request)
  $('modal-unbind').classList.remove('hidden');
  // v1.5.129: Reset button on voucher detail (user request, like Ruijie Cloud)
  $('modal-reset').classList.remove('hidden');
  // v1.5.101: per-voucher delete REMOVED (user) — replaced by bulk Delete Expired Vouchers
  const wasOpen = !$('modal').classList.contains('hidden');
  $('modal').classList.remove('hidden');
  // v1.5.74: push a history entry so a browser Back press closes the
  // detail via the popstate handler (native APK back already closes open
  // modals through MainActivity). Skipped on re-render while already open
  // so a single Back press is always enough to exit.
  if (!wasOpen) { try { history.pushState({ view: S.currentView || 'view-vouchers', modal: 'voucher' }, ''); } catch (e) {} }
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
    if (age) age.textContent = liveBase.dataAt ? ' · ' + fmtUnit(Math.max(0, Math.round((Date.now() - liveBase.dataAt) / 1000)), 'fmt.sec', 'fmt.secs') + ' ago' : '';
  };
  const poll = async () => {
    if (!liveBase) return;
    try {
      // v1.5.132: was voucherListAll (EVERY voucher, every 45s) just to
      // refresh ONE voucher's live stats. One page is enough — the modal
      // only needs this voucher; the list itself has its own 60s refresher.
      const { list } = await Api.voucherListPage(S.projectId, 0, 200);
      const fv = (list || []).find(x => x.uuid === liveBase.uuid);
      if (!liveBase || !fv) return;
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

/* ═══════════ PACKAGES (user groups) ═══════════ */
async function ensurePackages() {
  if (!S.projectId) return;
  if (S.packages.length) { fillPackageSelects(); initGenPackageSave(); return; }
  try {
    S.packages = await Api.userGroupList(S.projectId);
    fillPackageSelects(); initGenPackageSave();
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
  const sel = $('gen-package');
  sel.innerHTML = opts || '<option value="">—</option>';
  // v1.5.129: restore last selected package
  try {
    const lastPkg = Store.load().lastGenPackage;
    if (lastPkg) {
      const opt = Array.from(sel.options).find(o => o.value === lastPkg);
      if (opt) sel.value = lastPkg;
    }
  } catch (e) {}
  syncIosPickerBtn(sel);
}
// v1.5.129: save package selection (attached once at init)
function initGenPackageSave() {
  try {
    const sel = $('gen-package');
    if (sel && !sel._pkgSaveInit) {
      sel._pkgSaveInit = true;
      sel.addEventListener('change', () => {
        try { Store.save({ lastGenPackage: sel.value }); } catch (e) {}
      });
    }
  } catch (e) {}
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
    dx: 0, // v1.5.58: free horizontal nudge in mm (+right / -left), beyond left/center/right
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
    tearLine: false, midDivider: false,
    fields,
    customLines: [],
  };
}
function cloneStyle(s) { return JSON.parse(JSON.stringify(s)); }
function mergePrintStyle(saved) {
  const d = defaultPrintStyle();
  if (!saved || typeof saved !== 'object') return d;
  const out = Object.assign(d, saved);
  out.tearLine = !!saved.tearLine; out.midDivider = !!saved.midDivider;
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
    Object.assign(st, { fontFamily: d.fontFamily, align: d.align, color: d.color, ls: d.ls, lsCustom: d.lsCustom, lineSpacing: 0, shadow: false, outline: false, betweenBlanks: 1, insideSpacing: 0, tearLine: false, midDivider: false });
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
  // custom free-text lines: the FIRST visible line docks — its label shares the
  // profile row (right side), its value shares the validity row (right side).
  // Lines 2..n keep their own rows between profile and validity.
  const visCls = (style.customLines || []).filter(cl => cl && cl.show &&
    [cl.label, cl.value].some(s => String(s == null ? '' : s).trim()));
  const dockCl = visCls[0] || null;
  const dockLabel = dockCl ? String(dockCl.label || '').trim() : '';
  const dockValue = dockCl ? String(dockCl.value || '').trim() : '';
  const clPartCss = (cl, align, docked) => {
    const size = Math.min(48, Math.max(8, Number(cl.size) || 20));
    const fs = preview ? (size * PV_PX_PER_DOT).toFixed(1) + 'px' : size + 'pt';
    const al = align || (['left', 'center', 'right'].includes(cl.align) ? cl.align : 'left');
    // v1.5.58: free horizontal nudge (+mm right / -mm left), beyond left/center/right
    const dx = Number(cl.dx) || 0;
    // Docked parts share the row's own vertical rhythm (the user's Inside Spacing),
    // so docking/undocking a value never changes the gap between rows.
    // Standalone custom-line rows keep their own 2mm breathing room.
    const vm = docked
      ? (preview
          ? `${(Math.min(Math.max(Number(style.insideSpacing) || 0, 0), 4) * 8 * PV_PX_PER_DOT).toFixed(2)}px`
          : `${Number(style.insideSpacing) || 0}px`)
      : '2mm';
    return `font-size:${fs};text-align:${al};${cl.bold ? 'font-weight:bold;' : ''}margin:${vm} 0;${dx ? `transform:translateX(${dx}mm);` : ''}`;
  };
  const dockRow = (leftHtml, text, cl) => {
    // v1.5.60: optional vertical divider between the field (left) and the
    // docked custom-line part (right) — toggleable, 2px, adds no row height.
    const midDiv = style.midDivider
      ? `<div style="align-self:stretch;border-left:2px dashed ${preview ? (style.color || '#111') : '#000'};margin:1mm 0"></div>`
      : '';
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:4mm">${leftHtml}${midDiv}<div class="lv" style="${clPartCss(cl, 'right', true)}">${esc(text)}</div></div>`;
  };
  const showProfile = F.profile.show && item.pkg;
  if (showProfile) {
    const left = `<div class="lv" style="${fieldCss(F.profile, style, preview)}">${F.profile.label ? esc(labelPrefix(F.profile, 'tkt.profileName')) : ''}${esc(item.pkg)}</div>`;
    h += dockLabel ? dockRow(left, dockLabel, dockCl) : left;
  } else if (dockLabel) {
    h += `<div class="lv" style="${clPartCss(dockCl)}">${esc(dockLabel)}</div>`;
  }
  visCls.slice(1).forEach(cl => {
    [cl.label, cl.value].map(s => String(s == null ? '' : s).trim()).filter(Boolean)
      .forEach(t => { h += `<div class="lv" style="${clPartCss(cl)}">${esc(t)}</div>`; });
  });
  const showPeriod = F.period.show && item.period;
  if (showPeriod) {
    const left = `<div class="lv" style="${fieldCss(F.period, style, preview)}">${F.period.label ? esc(labelPrefix(F.period, 'tkt.validity')) : ''}${esc(fmtPeriod(item.period))}</div>`;
    h += dockValue ? dockRow(left, dockValue, dockCl) : left;
  } else if (dockValue) {
    h += `<div class="lv" style="${clPartCss(dockCl)}">${esc(dockValue)}</div>`;
  }
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
S.genOpts = { vlen: 7, vtype: 'numeric' };

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
    // v1.5.60: voucher/create response carries no timePeriod/quota (manual §2.3.1)
    // → fall back to the selected package's validity/quota so the ticket shows the real period.
    const pkgPeriod = pkg ? pkg.timePeriod : undefined, pkgQuota = pkg ? pkg.quota : undefined;
    const items = list.map(v => ({ code: vCode(v), pkg: pkg && pkgName(pkg),
      period: v.timePeriod != null ? v.timePeriod : pkgPeriod,
      quota: v.quota != null ? v.quota : pkgQuota }));
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
    tearLine: !!PS.tearLine, midDivider: !!PS.midDivider,
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
      dxMm: Math.max(-20, Math.min(20, +cl.dx || 0)),
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
  const defAddr = state.defaultPrinterAddress || null;
  devEl.innerHTML = devs.length ? devs.map((d, i) => {
    const isDef = !!(defAddr && d.address === defAddr);
    return `<div class="bt-dev-row"><button class="bt-dev" data-connect="${i}"><span class="bt-dev-name">${esc(d.name || d.address)}${d.paired ? ' ✓' : ''}${isDef ? ' ★' : ''}</span><span class="bt-dev-mac">${esc(d.address)}</span></button>` +
      `<button class="bt-dev-star${isDef ? ' on' : ''}" data-default="${i}" title="${esc(t('p.btSetDefault'))}">★</button></div>`;
  }).join('') : `<p class="muted">${t('p.btNoDevices')}</p>`;
  devEl.querySelectorAll('[data-connect]').forEach(b => b.addEventListener('click', () => {
    const d = devs[Number(b.dataset.connect)];
    btCall(B2 => B2.btConnect(d.address));
    setTimeout(btRefresh, 800);
  }));
  devEl.querySelectorAll('[data-default]').forEach(b => b.addEventListener('click', () => {
    const d = devs[Number(b.dataset.default)];
    const isDef = !!(defAddr && d.address === defAddr);
    btCall(B2 => isDef ? B2.btClearDefault() : B2.btSetDefault(d.address));
    toast(t(isDef ? 'p.btDefaultCleared' : 'p.btDefaultSaved'));
    setTimeout(btRefresh, 600);
  }));
  // progress + last result
  try {
    const p = JSON.parse(B.btProgress() || '{}');
    if (prEl) {
      const msg = p.printing ? (p.message || '') : '';
      prEl.textContent = msg;
      const row = $('bt-progress-row');
      if (row) row.style.display = msg ? '' : 'none';
    }
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

function initBtPrinter() {
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

/** Gap between vouchers: betweenBlanks blank lines, or a tear-off line drawn
 *  inside the same space (zero extra paper). betweenBlanks=0 + tear line =
 *  exactly one line — the same paper as betweenBlanks=1. */
function tearGapHtml(st) {
  const n = Math.max(0, Number(st.betweenBlanks) || 0);
  if (!st.tearLine) return n > 0 ? `<div style="height:${n * 14}px"></div>` : '';
  const h = Math.max(n, 1) * 14;
  return `<div style="height:${h}px;position:relative">`
    + `<div style="position:absolute;left:0;right:0;top:50%;border-top:2px dashed #555"></div></div>`;
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
  const blanks = tearGapHtml(PS);
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
  return `<div class="ticket-preview"><div class="pv-fit">${ticketInnerHtml(item, st, PS, true)}</div>
  <p class="muted small" style="text-align:center">${tx('pv.meta', { paper: esc(st.paper), copies: esc(String(st.copies)) })}</p></div>`;
}
function openPrintPreview() {
  const st = printSettings();
  $('preview-body').innerHTML = ticketPreviewHtml(
    { code: 'XXXX-XXXX', pkg: t('pv.sample'), period: 60, quota: 1024 }, st);
  $('preview-modal').classList.remove('hidden');
  fitLivePreviews();
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
function previewSampleItems() {
  const vs = (S.vouchers && S.vouchers.length) ? S.vouchers.slice(0, 3) : [];
  const items = [];
  for (let i = 0; i < 3; i++) {
    const v = vs[i];
    items.push(v ? {
      code: vCode(v),
      pkg: v.packageName || v.userGroupName || t('pv.sample'),
      period: v.timePeriod, quota: v.quota, real: true,
    } : {
      code: 'XXXX-XXXX', pkg: t('pv.sample'), period: 60, quota: 1024, real: false,
    });
  }
  return items;
}
function previewSampleItem() { return previewSampleItems()[0]; }
function openLayoutModal() {
  layoutDraft = cloneStyle(PS);
  layoutDraft.headerText = $('print-header') ? $('print-header').value : '';
  renderLayoutModal();
  $('layout-modal').classList.remove('hidden');
  refreshReveals($('layout-modal'));
  // v1.5.70: the render above ran while hidden (stage width 0, fit skipped) —
  // re-fit once the modal is actually laid out so the 80mm ticket never
  // overflows the right edge on phone.
  requestAnimationFrame(() => { try { fitLivePreviews(); } catch (e) {} });
}
const LABEL_TOGGLE_FIELDS = ['code', 'profile', 'period', 'quota', 'datetime'];
// iOS-style toggle row (same switch as the field on/off toggle) — replaces the
// old circle checkboxes, whose checked state did not visibly change on device.
function layoutTglRow(fdId, k, checked, label) {
  return `<div class="switch-row"><span>${label}</span>`
    + `<label class="switch"><input type="checkbox" data-lf="${fdId}" data-k="${k}"${checked ? ' checked' : ''}><span class="track"></span></label></div>`;
}
function layoutFieldCard(fd) {
  const f = layoutDraft.fields[fd.id];
  const boldOn = f.weight === 'bold' || f.weight === 'semibold';
  const headerRow = fd.id === 'header'
    ? `<div class="fld" style="margin:0 0 10px"><span class="fld-label">${t('pl.headerText')}</span>
         <input type="text" id="layout-header-text" class="fld-input" placeholder="${esc(t('pl.headerText'))}" value="${esc(layoutDraft.headerText || '')}"></div>` : '';
  const labelBlock = LABEL_TOGGLE_FIELDS.includes(fd.id)
    ? `${layoutTglRow(fd.id, 'label', !!f.label, t('pl.label'))}`
      + `${f.label ? `<input type="text" class="fld-input" data-lft="${fd.id}" placeholder="${esc(t('pl.labelText'))}" value="${esc(f.labelText || '')}">` : ''}` : '';
  const spacedRow = fd.id === 'code'
    ? layoutTglRow(fd.id, 'spaced', !!f.spaced, t('pl.spaced')) : '';
  const boldRow = layoutTglRow(fd.id, 'bold', boldOn, t('pl.bold'));
  return `<div class="field-card rv">
    <div class="fc-head"><span>${t(fd.labelKey)}</span>
      <label class="switch"><input type="checkbox" data-lf="${fd.id}" data-k="show" ${f.show ? 'checked' : ''}><span class="track"></span></label>
    </div>
    <div class="fc-body"${f.show ? '' : ' style="display:none"'}>
      ${headerRow}
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.fontSize')}</span>
        <div class="slider-row"><input type="range" min="8" max="48" step="1" value="${f.size}" data-lfr="${fd.id}"><b data-lfv="${fd.id}">${f.size} pt</b></div>
      </div>
      ${boldRow}
      ${spacedRow}
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
      <div class="switch-row"><span>${t('pl.bold')}</span><label class="switch"><input type="checkbox" data-cl-bold="${cl.id}"${cl.bold ? ' checked' : ''}><span class="track"></span></label></div>
      <div class="fld" style="margin:0"><span class="fld-label">${t('pl.align')}</span>
        <div class="mini-seg">${['left', 'center', 'right'].map(a =>
          `<button type="button" data-cl-align="${cl.id}" data-a="${a}" class="${(cl.align || 'left') === a ? 'active' : ''}">${t('ty.' + a)}</button>`).join('')}
        </div>
      </div>
      <div class="fld" style="margin:8px 0 0"><span class="fld-label">${t('pl.nudge')}</span>
        <div class="slider-row"><input type="range" min="-20" max="20" step="0.5" value="${Number(cl.dx) || 0}" data-cl-dx="${cl.id}"><b data-cl-dxval="${cl.id}">${Number(cl.dx) || 0} mm</b></div>
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
  // v1.5.58: free horizontal nudge (live, no re-render)
  wrap.querySelectorAll('input[data-cl-dx]').forEach(r => {
    r.addEventListener('input', () => {
      findCl(r.dataset.clDx).dx = Number(r.value);
      wrap.querySelector(`[data-cl-dxval="${r.dataset.clDx}"]`).textContent = `${r.value} mm`;
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
  $('layout-tearline').checked = !!d.tearLine;
  $('layout-middivider').checked = !!d.midDivider;
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
  if (layoutDraft) {
    // v1.5.71 — ONE ticket preview (the two-up strip clipped on phone).
    // Same ticket the printer outputs, zoom-fitted to the stage below.
    $('layout-preview').innerHTML = '<div class="pv-fit">' + ticketInnerHtml(previewSampleItems()[0], st, layoutDraft, true) + '</div>';
  }
  if (typoDraft) {
    $('typo-preview').innerHTML = '<div class="pv-fit">' + ticketInnerHtml(item, st, typoDraft, true) + '</div>';
    $('typo-real-badge').classList.toggle('hidden', !item.real);
  }
  fitLivePreviews();
}
/* v1.5.71: fit the true-scale paper preview to narrow phone screens.
   The ticket renders at true native scale (80mm = 396 CSS px); on a phone
   that overflows the modal stage, so the preview block is zoomed down to
   fit the stage width. CSS `zoom` (not transform: scale) scales the layout
   box too — nothing clips, no leftover whitespace, no scrollbars.
   (transform: scale only scaled the paint: the old code then shrank the
   layout box to the scaled size, clipping the ticket's right/bottom —
   the "half ticket" bug.) Desktop/tablet keep the 1:1 true scale. */
function fitLivePreviews() {
  document.querySelectorAll('.live-preview .pv-fit, .ticket-preview .pv-fit').forEach(fit => {
    fit.style.zoom = ''; // reset to natural size for measuring
    const stage = fit.parentElement;
    if (!stage || stage.clientWidth === 0) return; // modal hidden — nothing to fit
    const paper = fit.querySelector('.pv-paper');
    const ticketW = paper ? (parseFloat(paper.style.width) || paper.offsetWidth || 0) : 0;
    if (!ticketW) return;
    const cs = getComputedStyle(stage);
    const avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const s = Math.min(1, avail / ticketW);
    if (s >= 1) return; // fits: keep the true 1:1 scale
    fit.style.zoom = s;
  });
}
let _fitPvT = 0;
window.addEventListener('resize', () => {
  clearTimeout(_fitPvT);
  _fitPvT = setTimeout(() => { try { fitLivePreviews(); } catch (e) {} }, 150);
});
function wireLayoutModal() {
  $('layout-between').addEventListener('input', e => {
    layoutDraft.betweenBlanks = Number(e.target.value);
    $('layout-between-val').textContent = `${layoutDraft.betweenBlanks} ${t('pl.lines')}`;
    updateLivePreviews();
  });
  $('layout-inside').addEventListener('input', e => {
    layoutDraft.insideSpacing = Number(e.target.value);
    $('layout-inside-val').textContent = layoutDraft.insideSpacing === 0 ? `0 (${t('pl.compact')})` : String(layoutDraft.insideSpacing);
    updateLivePreviews();
  });
  // v1.5.60: tear-off line + middle divider toggles (live preview, saved with layout)
  $('layout-tearline').addEventListener('change', e => {
    layoutDraft.tearLine = e.target.checked;
    updateLivePreviews();
  });
  $('layout-middivider').addEventListener('change', e => {
    layoutDraft.midDivider = e.target.checked;
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
  // v1.5.70: same fit-after-visible as the layout modal.
  requestAnimationFrame(() => { try { fitLivePreviews(); } catch (e) {} });
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
      if (!(await iosConfirm(tx('del.confirm', { code: b.dataset.del }), '', t('a.delete'), t('a.cancel'), true))) return;
      try { await Api.accountDelete(S.projectId, b.dataset.del); toast(t('del.done')); moreAccounts(); }
      catch (e) { toast(e.message, true); }
    }));
  } catch (e) { $('ma-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function moreUserGroups() {
  S.moreFn = moreUserGroups;
  moreShell(`${ic('box', 'sm')} ${esc(t('mg.title'))}`, `<div id="mg-list"><p class="muted">${t('more.loading')}</p></div>
    <div class="row"><button class="btn" id="mg-add">${ic('plus', 'sm')}<span>${t('mg.add')}</span></button></div><div id="mg-form"></div>`);
  $('mg-add').addEventListener('click', () => { renderUserGroupForm(); });
  try {
    await ensurePackages();
    $('mg-list').innerHTML = S.packages.length ? `<div class="wrap-scroll"><table class="data">
      <tr><th>${t('mg.name')}</th><th>${t('mg.validity')}</th><th>${t('mg.data')}</th><th>${t('mg.price')}</th><th></th></tr>
      ${S.packages.map((p, i) => `<tr><td>${esc(pkgName(p))}</td><td>${esc(fmtPeriod(p.timePeriod))}</td>
        <td>${esc(fmtQuota(p.quota || p.flowQuota))}</td><td>${esc(p.price || p.packagePrice || '—')}</td>
        <td><button class="btn sm mg-editbtn" data-mgedit="${i}" aria-label="${esc(t('mg.edit'))}">${ic('pencil', 'sm')}<span class="btn-t">${t('mg.edit')}</span></button>
        <button class="btn danger sm mg-delbtn" data-mgdel="${i}" aria-label="${esc(t('mg.del'))}">${ic('trash', 'sm')}<span class="btn-t">${t('mg.del')}</span></button></td></tr>`).join('')}
      </table></div>` : `<p class="muted">${t('mg.none')}</p>`;
    $('mg-list').querySelectorAll('[data-mgedit]').forEach(b => b.addEventListener('click', () => {
      renderUserGroupForm(S.packages[Number(b.dataset.mgedit)]);
    }));
    $('mg-list').querySelectorAll('[data-mgdel]').forEach(b => b.addEventListener('click', () => {
      deleteUserGroup(S.packages[Number(b.dataset.mgdel)]);
    }));
  } catch (e) { $('mg-list').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

/* ── User group delete · v1.5.96 ──
 * 2-step portal delete, both envelopes verified 2026-10-01 from the user's
 * DevTools capture of a real portal delete (Delete -> confirm OK).
 * Destructive: single strong confirm naming the group. Never auto-called. */
async function deleteUserGroup(p) {
  if (!p) return;
  const name = pkgName(p);
  if (!(await iosConfirm(t('mg.confirmDel').replace('{name}', name), '', t('a.delete'), t('a.cancel'), true))) return;
  const ugId = pkgGroupId(p), profId = pkgProfileId(p);
  if (!ugId || !profId) { toast(t('mg.needIds'), true); return; }
  let tenantId = '';
  try {
    const bi = JSON.parse((window.RuijieBridge && window.RuijieBridge.ssoAccountInfo()) || '{}');
    if (bi) tenantId = bi.tenantId || bi.defaultTenantId || '';
  } catch (e) {}
  try {
    await Api.userGroupDeleteSso(S.projectId, tenantId, ugId, profId);
    toast(t('mg.deleted'));
    moreUserGroups();
  } catch (e) { toast((e && e.message) || String(e), true); }
}

/* ── User group add form · v1.5.96 ──
 * Matches the official Ruijie Cloud app's Add User Group screen (user-supplied
 * screenshots 2026-10-01): 8 fields with fixed option lists + defaults.
 * iOS UI/UX: bottom-sheet pickers, iOS toggle, segmented period control.
 * Verified API units from portal capture (2026-10-01): duration = minutes
 * (timePeriod: 30 = "30 Minutes"), quota = MB (100 = "100 MB"),
 * rate limits = Kbps (256 = "256 Kbps"), noOfDevice = string ("3").
 * Inferred — verify on first test save: devices Unlimited -> "0" (portal
 * convention); Daily duration -> durationCtrlType 1 + timePeriodDaily. */
function renderUserGroupForm(editP) {
  const isEdit = !!(editP && typeof editP === 'object');
  // Prefill from the existing group in edit mode; list fields mirror the
  // portal's group record (quota=MB, timePeriod=minutes, rate=Kbps).
  const pv = k => isEdit && editP[k] !== undefined && editP[k] !== null ? editP[k] : '';
  const pNum = k => { const v = Number(pv(k)); return isFinite(v) ? v : 0; };
  const OPT = {
    devices: [['0', t('ug.unlimited')], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9']],
    duration: [['0', t('ug.unlimited')], ['30', '30 ' + t('ug.min')], ['60', '1 ' + t('ug.hr')], ['120', '2 ' + t('ug.hr')], ['1440', '1 ' + t('ug.day')], ['2880', '2 ' + t('ug.day')], ['10080', '1 ' + t('ug.wk')], ['20160', '2 ' + t('ug.wk')], ['custom', t('ug.custom')]],
    quota: [['0', t('ug.unlimited')], ['100', '100 MB'], ['200', '200 MB'], ['500', '500 MB'], ['1024', '1 GB'], ['2048', '2 GB'], ['custom', t('ug.custom')]],
    speed: [['0', t('ug.unlimited')], ['256', '256 Kbps'], ['512', '512 Kbps'], ['1024', '1 Mbps'], ['2048', '2 Mbps'], ['5120', '5 Mbps'], ['10240', '10 Mbps'], ['custom', t('ug.custom')]],
  };
  const pick = (id, opts, label, help) =>
    `<div class="ug-row"><span class="ug-lab">${esc(label)}${help ? ` <span class="ug-q" title="${esc(help)}">?</span>` : ''}</span>` +
    `<select id="ug-${id}" class="ug-sel" aria-label="${esc(label)}">` +
    opts.map(o => `<option value="${o[0]}">${esc(o[1])}</option>`).join('') + `</select></div>` +
    `<div class="ug-custom" id="ugc-${id}" hidden><input id="ugx-${id}" type="number" inputmode="numeric" min="0" placeholder="${esc(t('ug.customVal'))}"></div>`;
  $('mg-form').innerHTML = `<div class="ug-card">
    <div class="ug-field"><span class="ug-lab">${isEdit ? esc(t('mg.edit')) : ''} ${esc(t('ug.name'))}</span>
      <input id="ug-name" type="text" class="ug-input" placeholder="${esc(t('ug.namePh'))}" value="${esc(isEdit ? pkgName(editP) : '')}"></div>
    ${pick('devices', OPT.devices, t('ug.devices'))}
    <div class="ug-row"><span class="ug-lab">${esc(t('ug.bindMacFirst'))} <span class="ug-q" title="${esc(t('ug.bindMacTip'))}">?</span></span>
      <label class="switch"><input id="ug-bindmac" type="checkbox"${isEdit && Number(pv('bindMac')) ? ' checked' : ''}><span class="track"></span></label></div>
    <div class="ug-sect">${esc(t('ug.period'))}</div>
    <div class="segmented ug-seg" id="ug-pseg">
      <button type="button" class="active" data-p="total">${esc(t('ug.totalDur'))}</button>
      <button type="button" data-p="daily">${esc(t('ug.dailyDur'))}</button>
    </div>
    ${pick('duration', OPT.duration, t('ug.duration'))}
    ${pick('quota', OPT.quota, t('ug.dataQuota'), t('ug.quotaTip'))}
    ${pick('upspeed', OPT.speed, t('ug.upSpeed'))}
    ${pick('downspeed', OPT.speed, t('ug.downSpeed'))}
    <div class="ug-field"><span class="ug-lab">${esc(t('ug.price'))}</span>
      <input id="ug-price" type="text" class="ug-input" inputmode="decimal" placeholder="${esc(t('ug.pricePh'))}" value="${esc(isEdit ? String(pv('price') || pv('packagePrice') || '') : '')}"></div>
    <button class="ug-save" id="ug-do">${esc(isEdit ? t('mg.edit') : t('ug.save'))}</button>
    <button class="ug-cancel" id="ug-cancel">${esc(t('ug.cancel'))}</button>
  </div>`;
  // iOS bottom-sheet pickers + Custom inline inputs
  ['devices', 'duration', 'quota', 'upspeed', 'downspeed'].forEach(id => {
    const s = $('ug-' + id);
    if (!s) return;
    enhanceIosPicker(s);
    s.addEventListener('change', () => { const c = $('ugc-' + id); if (c) c.hidden = s.value !== 'custom'; });
  });
  // edit mode: prefill selects (matching option, else Custom + value)
  if (isEdit) {
    const setSel = (id, v) => {
      const s = $('ug-' + id); if (!s) return;
      const sv = String(v);
      const has = Array.prototype.some.call(s.options, o => o.value === sv);
      s.value = has ? sv : 'custom';
      const c = $('ugc-' + id), x = $('ugx-' + id);
      if (c) c.hidden = s.value !== 'custom';
      if (x && s.value === 'custom') x.value = sv;
      if (typeof s.refreshIosPicker === 'function') { try { s.refreshIosPicker(); } catch (e) {} }
    };
    setSel('devices', pv('noOfDevice') === '' ? '0' : pv('noOfDevice'));
    const isDaily = Number(pv('durationCtrlType')) === 1 || (pNum('timePeriodDaily') > 0 && pNum('timePeriod') === 0);
    const pseg = $('ug-pseg');
    if (pseg) pseg.querySelectorAll('button').forEach(x => x.classList.toggle('active', (x.dataset.p === 'daily') === isDaily));
    try { pseg.dataset.cur = isDaily ? 'daily' : 'total'; } catch (e) {}
    setSel('duration', isDaily ? pNum('timePeriodDaily') : pNum('timePeriod'));
    setSel('quota', pNum('quota') || pNum('flowQuota'));
    setSel('upspeed', pNum('uploadRateLimit'));
    setSel('downspeed', pNum('downloadRateLimit'));
    window._ugEditPeriod = isDaily ? 'daily' : 'total';
  }
  // segmented period type
  let periodType = (isEdit && window._ugEditPeriod) ? window._ugEditPeriod : 'total';
  try { delete window._ugEditPeriod; } catch (e) { window._ugEditPeriod = undefined; }
  $('ug-pseg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    periodType = b.dataset.p;
    $('ug-pseg').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
  });
  $('ug-cancel').addEventListener('click', () => { $('mg-form').innerHTML = ''; });
  $('ug-do').addEventListener('click', async () => {
    const name = String(($('ug-name') || {}).value || '').trim();
    if (!name) { toast(t('ug.needName'), true); return; }
    const gv = id => {
      const s = $('ug-' + id);
      if (!s) return 0;
      if (s.value === 'custom') return Math.max(0, parseInt(String((($('ugx-' + id) || {}).value || '0')), 10) || 0);
      return Math.max(0, parseInt(s.value, 10) || 0);
    };
    const devSel = $('ug-devices');
    const noOfDevice = devSel ? String(devSel.value) : '0'; // string; '0' = Unlimited (portal convention — verify on first save)
    const durMin = gv('duration'), quotaMB = gv('quota'), upK = gv('upspeed'), downK = gv('downspeed');
    const isDaily = periodType === 'daily';
    const fields = {
      name, price: String(($('ug-price') || {}).value || '').trim(),
      quota: quotaMB, noOfDevice,
      timePeriod: isDaily ? 0 : durMin, timePeriodTotal: 0,
      timePeriodDaily: isDaily ? durMin : 0, timePeriodDailyCustom: 0,
      uploadRateLimit: upK, downloadRateLimit: downK,
      packageType: 'COMMON', bindSsid: '', isBindSsid: false,
      bindMac: !!($('ug-bindmac') || {}).checked, ip: '',
      kickOffType: 1, durationCtrlType: isDaily ? 1 : 0, limitedTimes: 0,
      lowQuota: 0, lowUploadRateLimit: 0, lowDownloadRateLimit: 0, lowProfileStatus: 0,
    };
    // tenant email + tenantId (same resolution as voucher unbind)
    let email = (S.account && (S.account.account || S.account.email)) || '';
    let tenantId = '';
    try {
      const bi = JSON.parse((window.RuijieBridge && window.RuijieBridge.ssoAccountInfo()) || '{}');
      if (bi) { if (!email && bi.email) email = bi.email; tenantId = bi.tenantId || bi.defaultTenantId || ''; }
    } catch (e) {}
    if (!email) { toast(t('ug.needLogin'), true); return; }
    $('ug-do').disabled = true;
    try {
      if (isEdit) {
        await Api.userGroupEditSso(S.projectId, email, tenantId, editP, fields);
        toast(t('ug.updated'));
        $('mg-form').innerHTML = '';
        moreUserGroups();
      } else {
        await Api.userGroupAddSso(S.projectId, email, tenantId, fields);
        toast(t('ug.done'));
        $('mg-form').innerHTML = '';
        moreUserGroups();
      }
    } catch (e) { toast((e && e.message) || String(e), true); }
    $('ug-do').disabled = false;
  });
  const first = $('ug-name');
  if (first) first.focus();
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

/* v1.5.53: silent re-authentication after the portal session dies mid-session
 * (e.g. stale cookies after the app was swiped away / the phone restarted —
 * Devices showed "not login"/403). Uses the saved account when auto-login is
 * enabled; the SSO dialog stays hidden and auto-submits by itself.
 * Loop-safe: at most one silent re-auth per 5 minutes, and never after an
 * explicit user logout (window.__ssoExplicitLogout).
 * v1.5.98: top-level scope (was inside init() → ReferenceError from moreDevices);
 * uses ssoLoginSilent like startup (v1.5.94 fix1). */
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
  // v1.5.98: was calling the VISIBLE ssoLogin() — use silent like startup (v1.5.94 fix1)
  if (window.RuijieBridge.ssoLoginSilent) { showIosLoading(); window.RuijieBridge.ssoLoginSilent(); }
  else { try { window.RuijieBridge.ssoLogin(); } catch (e) { /* never break the UI */ } }
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
    // Cloud devices carry no IP from the portal — enrich from the gateway's
    // neighbor/MAC table (best-effort; the gateway already reported these).
    if (wantLocalMerge && results.length > types.length) {
      try {
        const gr = results[types.length];
        const gwArr = (gr && gr.status === 'fulfilled' && Array.isArray(gr.value)) ? gr.value : [];
        const macToIp = new Map();
        gwArr.forEach(g => {
          const m = normMac(g.mac || g.devMac || '');
          const ip = String(g.ip || '').trim();
          if (m && ip && !macToIp.has(m)) macToIp.set(m, ip);
        });
        if (macToIp.size) {
          list.forEach(d => {
            if (d.ip || d.deviceIp || d.ipAddress || d.mgmtIp) return;
            const m = normMac(d.mac || d.deviceMac || '');
            if (m && macToIp.has(m)) d.ip = macToIp.get(m);
          });
        }
      } catch (e) {}
    }
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
          // v1.5.78: local reboot wire format verified (devSta.set devReboot) —
          // local rows get the reboot button too (gateway bridge, APK).
          const rb = sn ? `<button class="btn" data-reboot="${esc(sn)}" data-name="${esc(nm)}" data-local="${d.local ? '1' : ''}">${ic('refresh', 'sm')}<span>${t('md.reboot')}</span></button>` : '';
          // v1.5.145: firmware upgrade moved to More → Firmware update
          // (dedicated screen); device rows keep Reboot only.
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
          return `<tr><td>${esc(nm)}${localTag}<br><small class="muted">${esc(sn || d.mac || '')}</small>${(() => {
            // Cloud device list carries the management IP as `localIp`
            // (verified from the portal's own device-list JS bundle);
            // `cpeIp` is the egress IP. Gateway-local rows use `ip`.
            const ip = d.localIp || d.ip || d.deviceIp || d.ipAddress || d.mgmtIp || '';
            return ip ? `<br><small class="muted">${esc(t('mt.ip'))}: ${esc(ip)}</small>` : '';
          })()}</td>
          <td>${esc(d.productClass || d.model || d.productModel || '')}</td>
          <td><span class="st-dot ${st.cls}"></span>${esc(st.label)}</td>
          <td>${rb}${cb}</td></tr>`;
        }).join('')}
        </table></div>`;
    document.querySelectorAll('#md-list [data-reboot]').forEach(b => b.addEventListener('click', () => rebootDevice(b.dataset.reboot, b.dataset.name, b.dataset.local === '1')));
    document.querySelectorAll('#md-list [data-apclients]').forEach(b => b.addEventListener('click', () => apClientsView(b.dataset.apclients, b.dataset.apname, apNames, b.dataset.aplocal === '1')));
  };
  document.querySelectorAll('#md-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#md-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); load(c.dataset.t);
  }));
  load('');
}

/* ── Device reboot (v1.5.13 SSO portal · v1.5.78 gateway-local) ──
   Button-only: no web portal, no CLI. Local rows use the verified
   devSta.set devReboot envelope (APK gateway bridge); cloud rows use
   the SSO portal bridge as before. */
async function rebootDevice(sn, name, isLocal) {
  if (!(await iosConfirm(tx('md.rebootConfirm', { name: name || sn }), '', t('md.reboot'), t('a.cancel'), true))) return;
  toast(t('md.rebooting'));
  try {
    if (isLocal) {
      if (!GwApi.loggedIn()) { toast(t('md.needGw'), true); return; }
      await GwApi.deviceReboot(sn);
    } else {
      if (!Api.ssoLoggedIn()) { toast(t('md.needSso'), true); return; }
      await Api.deviceReboot(sn);
    }
    toast(t('md.rebootOk'));
  } catch (e) { toast(e.message || t('md.rebootFail'), true); }
  if (S.moreFn === moreDevices) moreDevices();
}

/* ── Device firmware upgrade (v1.5.131 SSO portal) ──
   Per-device flow, verified against the portal's own upgradeDeviceModal
   bundle: POST /upgrade/condition/check {groupId} returns checkInofs
   (per-model: deviceSns comma-joined, deviceSoftware, recommendSoftware,
   real_recommendSoftware, newestSoftwareVersion, real_newestSoftwareVersion,
   firmwareId, newestFirmwareId, releaseNotes); POST /upgrade/device
   {snList, jobUniqueId, targetVersion, schedule, retryTimes, firmwareId,
   groupId} starts the job. Cloud rows only (needs SSO login). */
async function upgradeDeviceFlow(sn, name) {
  if (!Api.ssoLoggedIn()) { toast(t('md.upNeedSso'), true); return; }
  const gid = Number(S.projectId) || 0;
  if (!gid) { toast(t('md.upFail'), true); return; }
  toast(t('md.upCheck'));
  let infos;
  try {
    infos = await Api.upgradeConditionCheck(gid);
  } catch (e) { toast(e.message || t('md.upFail'), true); return; }
  const info = (infos || []).find(x =>
    String(x.deviceSns || '').split(',').some(s => s.trim() === sn));
  const cur = info ? (info.deviceSoftware || info.softwareVersion || '') : '';
  const rec = info ? (info.real_recommendSoftware || info.recommendSoftware || '') : '';
  const newest = info ? (info.real_newestSoftwareVersion || info.newestSoftwareVersion || '') : '';
  const opts = [];
  if (rec && rec !== cur) opts.push({ ver: rec, fid: info.firmwareId || null, rec: true });
  if (newest && newest !== cur && newest !== rec) opts.push({ ver: newest, fid: info.newestFirmwareId || null, rec: false });
  if (!opts.length) { toast(tx('md.upNone', { name: name || sn })); return; }
  const pick = await pickUpgradeVersion(name || sn, cur, opts, info);
  if (!pick) return;
  if (!(await iosConfirm(tx('md.upConfirm', { name: name || sn, ver: pick.ver }), '', t('md.upgrade'), t('a.cancel'), true))) return;
  toast(t('md.upSending'));
  try {
    await Api.upgradeDevice({ snList: [sn], targetVersion: pick.ver, firmwareId: pick.fid, groupId: gid, retryTimes: 3 });
    toast(t('md.upOk'));
  } catch (e) { toast(e.message || t('md.upFail'), true); }
}

/* Firmware version picker (bottom sheet). Returns {ver, fid} or null. */
function pickUpgradeVersion(name, cur, opts, info) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'ios-sheet-ov';
    const sheet = document.createElement('div');
    sheet.className = 'ios-sheet';
    sheet.setAttribute('role', 'dialog');
    const notes = info ? (info.newestReleaseNotes || info.releaseNotes || '') : '';
    sheet.innerHTML =
      '<div class="sheet-handle"></div>' +
      '<div class="ios-sheet-title">' + esc(name) + '</div>' +
      '<div style="padding:0 16px 8px;font-size:15px">' +
        esc(t('md.upCur')) + ': <b>' + esc(cur || '—') + '</b></div>' +
      (notes ? '<div style="padding:0 16px 8px;font-size:13px;color:var(--secondary)">' +
        esc(String(notes).slice(0, 300)) + '</div>' : '') +
      '<div class="ios-sheet-opts"></div>';
    const optsEl = sheet.querySelector('.ios-sheet-opts');
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ios-sheet-opt' + (i === 0 ? ' active' : '');
      b.innerHTML = '<span>' + esc(t('md.upNew')) + ': <b>' + esc(o.ver) + '</b>' +
        (o.rec ? ' <small class="muted">· ' + esc(t('md.upRec')) + '</small>' : '') + '</span>';
      b.addEventListener('click', () => { close(); resolve(o); });
      optsEl.appendChild(b);
    });
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'ios-sheet-opt';
    cancel.innerHTML = '<span>' + esc(t('a.cancel')) + '</span>';
    cancel.addEventListener('click', () => { close(); resolve(null); });
    optsEl.appendChild(cancel);
    const onKey = e => { if (e.key === 'Escape') { close(); resolve(null); } };
    document.addEventListener('keydown', onKey);
    ov.appendChild(sheet);
    ov.addEventListener('click', e => { if (e.target === ov) { close(); resolve(null); } });
    document.body.appendChild(ov);
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
  });
}

/* ── Firmware update · dedicated More screen (v1.5.145) ──
 * Moved out of the Devices rows per user request. Per-device rows show
 * current vs available firmware; tapping Update reuses the verified
 * upgradeDeviceFlow trigger. Progress is HONEST: the portal API reports
 * no live percentage, so the row shows real observed stages
 * (sending → updating → rebooting → done) with an indeterminate
 * animation — never a fake 1–100% bar. Completion is confirmed by
 * re-checking /upgrade/condition/check for the new version. */
async function moreFirmware() {
  S.moreFn = moreFirmware;
  moreShell(`${ic('up', 'sm')} ${esc(t('fw.title'))}`, `<div id="fw-list"><p class="muted">${t('more.loading')}</p></div>`);
  if (!Api.ssoLoggedIn()) {
    $('fw-list').innerHTML = `<p class="err">${esc(t('fw.needSso'))}</p>`;
    return;
  }
  $('fw-list').innerHTML = `<p class="muted">${esc(t('fw.checking'))}</p>`;
  try {
    const gid = Number(S.projectId) || 0;
    if (!gid) throw new Error(t('fw.needSso'));
    const [devRes, infos] = await Promise.all([
      Api.deviceListSso(gid, '', 1, 100).catch(() => null),
      Api.upgradeConditionCheck(gid),
    ]);
    const devs = (devRes && (devRes.list || devRes.data || devRes)) || [];
    const infoBySn = new Map();
    for (const info of infos || []) {
      for (const sn of String(info.deviceSns || '').split(',')) {
        const k = sn.trim();
        if (k) infoBySn.set(k, info);
      }
    }
    const rows = (Array.isArray(devs) ? devs : []).map(d => {
      const sn = String(d.serialNumber || d.sn || '');
      if (!sn) return null;
      const info = infoBySn.get(sn) || null;
      const cur = info ? (info.deviceSoftware || info.softwareVersion || '') : '';
      const rec = info ? (info.real_recommendSoftware || info.recommendSoftware || '') : '';
      const newest = info ? (info.real_newestSoftwareVersion || info.newestSoftwareVersion || '') : '';
      const avail = (rec && rec !== cur) ? { ver: rec, fid: info.firmwareId || null }
        : (newest && newest !== cur && newest !== rec) ? { ver: newest, fid: info.newestFirmwareId || null } : null;
      return {
        sn,
        name: d.aliasName || d.alias || d.deviceAliasName || d.name || sn,
        model: d.productClass || d.model || d.productModel || '',
        cur, avail,
        fid: avail ? avail.fid : null,
      };
    }).filter(Boolean);
    S._fwRows = rows;
    if (!S._fwState) S._fwState = {};
    if (!rows.length) { $('fw-list').innerHTML = `<p class="muted">${esc(t('fw.none'))}</p>`; return; }
    renderFwRows();
  } catch (e) {
    $('fw-list').innerHTML = `<p class="err">${esc(e.message || String(e))}</p>`;
  }
}
function renderFwRows() {
  const el = $('fw-list');
  if (!el) return;
  const rows = S._fwRows || [];
  const expanded = S._fwExpanded || (S._fwExpanded = {});
  el.innerHTML = `<div class="row" style="margin-bottom:8px"><button class="btn sm" id="fw-recheck">${ic('refresh', 'sm')}<span class="btn-t">${esc(t('fw.checkAgain'))}</span></button></div>`
  + `<div class="list">` + rows.map((x, i) => {
    const st = (S._fwState || {})[x.sn] || { stage: 'idle' };
    const isExp = !!expanded[x.sn];
    // v1.5.146: the dot means something now — green = up to date, orange = update available
    const dotCls = x.avail ? 's2' : 's1';
    const stageHtml =
      st.stage === 'sending' ? `<div class="fw-prog"><div class="fw-bar"></div></div><div class="pkg muted">${esc(t('fw.sending'))}</div>`
      : st.stage === 'updating' ? `<div class="fw-prog"><div class="fw-bar"></div></div><div class="pkg muted">${esc(t('fw.updating'))}</div>`
      : st.stage === 'rebooting' ? `<div class="fw-prog"><div class="fw-bar"></div></div><div class="pkg muted">${esc(t('fw.rebooting'))}</div>`
      : st.stage === 'done' ? `<div class="pkg" style="color:var(--green);font-weight:600">${esc(t('fw.done'))}</div>`
      : st.stage === 'error' ? `<div class="pkg" style="color:var(--red)">${esc(st.err || t('md.upFail'))}</div>`
      : '';
    const availBadge = x.avail ? ` <span class="fw-badge">${esc(t('fw.avail'))}</span>` : '';
    const verHtml = x.cur
      ? `<div class="pkg fw-ver" style="font-size:13px">${esc(t('fw.cur'))}: <b>${esc(x.cur)}</b></div>`
        + (x.avail
          ? `<div class="pkg fw-ver" style="font-size:13px">${esc(t('fw.new'))}: <b style="color:var(--blue)">${esc(x.avail.ver)}</b></div>`
          : `<div class="pkg muted" style="font-size:12.5px">${esc(t('fw.upToDate'))} ✓</div>`)
      : `<div class="pkg muted">—</div>`;
    const btn = (st.stage === 'idle' || st.stage === 'error') && x.avail
      ? `<button class="btn sm primary fw-upbtn" data-fwup="${i}">${ic('up', 'sm')}<span>${esc(t('fw.update'))} → ${esc(x.avail.ver)}</span></button>` : '';
    return `<div class="voucher-row fw-row${isExp ? ' fw-exp' : ''}" data-fwrow="${i}"><span class="status-dot ${dotCls}"></span>
      <div class="voucher-meta"><div class="voucher-code" style="font-size:15px">${esc(x.name)}${availBadge}</div>
      <div class="pkg muted small fw-ver">${esc(x.sn)}${x.model ? ' · ' + esc(x.model) : ''}</div>
      ${verHtml}${stageHtml}</div>
      <div class="fw-actions">${btn}<span class="fw-chev">${ic(isExp ? 'chev-up' : 'chev-down', 'sm')}</span></div></div>`;
  }).join('') + `</div>`;
  const rc = $('fw-recheck');
  if (rc) rc.addEventListener('click', () => { S._fwRows = null; moreFirmware(); });
  el.querySelectorAll('[data-fwup]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); fwStartUpgrade(Number(b.dataset.fwup)); }));
  // v1.5.146: tap a row to expand/collapse long text (full version strings)
  el.querySelectorAll('[data-fwrow]').forEach(r =>
    r.addEventListener('click', () => {
      const x = (S._fwRows || [])[Number(r.dataset.fwrow)];
      if (!x) return;
      S._fwExpanded[x.sn] = !S._fwExpanded[x.sn];
      renderFwRows();
    }));
}
/* Trigger + honest stage tracking for one device. */
async function fwStartUpgrade(idx) {
  const x = (S._fwRows || [])[idx];
  if (!x || !x.avail) return;
  if (!(await iosConfirm(tx('fw.confirm', { name: x.name, ver: x.avail.ver }), '', t('fw.update'), t('a.cancel'), true))) return;
  const gid = Number(S.projectId) || 0;
  const st = S._fwState[x.sn] = { stage: 'sending' };
  renderFwRows();
  try {
    await Api.upgradeDevice({ snList: [x.sn], targetVersion: x.avail.ver, firmwareId: x.fid, groupId: gid, retryTimes: 3 });
  } catch (e) {
    st.stage = 'error'; st.err = e.message || String(e);
    renderFwRows();
    return;
  }
  st.stage = 'updating';
  renderFwRows();
  // Poll for real completion: the device's reported version becomes the target.
  // Offline (no info) mid-upgrade → rebooting stage. 20 min cap, 45 s interval.
  const deadline = Date.now() + 20 * 60 * 1000;
  for (;;) {
    await new Promise(r => setTimeout(r, 45000));
    if (Date.now() > deadline) break;
    try {
      const infos = await Api.upgradeConditionCheck(gid);
      const info = (infos || []).find(y =>
        String(y.deviceSns || '').split(',').some(s => s.trim() === x.sn));
      if (!info) { st.stage = 'rebooting'; }
      else {
        const cur = info.deviceSoftware || info.softwareVersion || '';
        if (cur && cur === x.avail.ver) { st.stage = 'done'; break; }
        st.stage = st.stage === 'rebooting' ? 'updating' : st.stage;
      }
    } catch (e) { /* keep polling on transient errors */ }
    renderFwRows();
  }
  renderFwRows();
}

/* ── Flow Table traffic view (More → Traffic) · v1.5.78 ──
   Read-only, gateway-local (APK only). Manual refresh ONLY — one poll is
   ~166 kB on the EG105G-V3. Combined view: per-client up/down totals,
   estimated live speed (needs two snapshots), top talker, per-client DNS
   servers (AdBlock DNS verification). */
/* ── v1.5.87: WiFi SSID management (More → WiFi) ── */
async function moreWifi() {
  S.moreFn = moreWifi;
  moreShell(`${ic('signal', 'sm')} ${esc(t('wifi.title'))}`, `
    <div><button class="btn" id="wifi-refresh">${ic('refresh', 'sm')}<span>${t('wifi.refresh')}</span></button>
    <button class="btn primary" id="wifi-add">${ic('plus', 'sm')}<span>${t('wifi.add')}</span></button>
    <span class="muted small" id="wifi-meta"></span></div>
    <div id="wifi-body" style="margin-top:10px"><p class="muted">${t('more.loading')}</p></div>`);
  $('wifi-refresh').addEventListener('click', loadSsids);
  $('wifi-add').addEventListener('click', openSsidAdd);
  loadSsids();
}

async function loadSsids() {
  const body = $('wifi-body'), meta = $('wifi-meta');
  if (!body) return;
  if (!Api.ssoLoggedIn()) { body.innerHTML = `<p class="muted">${t('wifi.needSso')}</p>`; return; }
  body.innerHTML = `<p class="muted">${t('more.loading')}</p>`;
  try {
    const { list } = await Api.ssidListSso(S.projectId);
    S.ssidList = list;
    if (meta) meta.textContent = list.length + ' SSID';
    if (!list.length) { body.innerHTML = `<p class="muted">—</p>`; return; }
    body.innerHTML = list.map(s => {
      const nm = esc(s.ssidName || '—');
      const enc = esc(s.encryptionMode || '');
      // v1.5.90: portal returns ishidden as string 'false'/'true', not boolean —
      // the string 'false' is truthy in JS, so compare explicitly.
      const isHid = s.ishidden === true || String(s.ishidden).toLowerCase() === 'true';
      const hid = isHid ? ' (hidden)' : '';
      // 2026-10-01: per-client speed caps shown under the SSID name (full text, no truncation)
      const spd = fmtSsidSpeed(s);
      // Ruijie Cloud WLAN list style: encryption · band · VLAN, then speed caps
      const band = fmtSsidBand(s);
      const vlan = (s.vlanId !== undefined && s.vlanId !== null && String(s.vlanId) !== '')
        ? 'VLAN ' + esc(String(s.vlanId)) : '';
      const sub = [enc, band, vlan, spd ? esc(spd) : ''].filter(Boolean).join(' · ');
      return `<div class="voucher-row ssid-row">
        <div class="ssid-info"><div class="ssid-name">${nm}${hid}</div>
        <div class="muted small">${sub}</div></div>
        <div class="ssid-actions">
        <button class="btn sm" data-ssidrename="${esc(s.ssidName || '')}" aria-label="${esc(t('wifi.rename'))}">${ic('pencil', 'sm')}<span class="btn-t">${t('wifi.rename')}</span></button>
        <button class="btn sm" data-ssidpw="${esc(s.ssidName || '')}" aria-label="${esc(t('wifi.changePw'))}">${ic('lock', 'sm')}<span class="btn-t">${t('wifi.changePw')}</span></button>
        <button class="btn sm danger" data-ssiddel="${esc(s.ssidName || '')}" aria-label="${esc(t('wifi.delete'))}">${ic('trash', 'sm')}<span class="btn-t">${t('wifi.delete')}</span></button>
        </div>
      </div>`;
    }).join('');
    body.querySelectorAll('[data-ssidrename]').forEach(b => b.addEventListener('click', () => openSsidRename(b.dataset.ssidrename)));
    body.querySelectorAll('[data-ssidpw]').forEach(b => b.addEventListener('click', () => openSsidPassword(b.dataset.ssidpw)));
    body.querySelectorAll('[data-ssiddel]').forEach(b => b.addEventListener('click', () => deleteSsid(b.dataset.ssiddel)));
  } catch (e) {
    body.innerHTML = `<p class="muted">Error: ${esc(e.message || e)}</p>`;
  }
}

async function deleteSsid(ssidName) {
  if (!(await iosConfirm(t('wifi.confirmDel'), ssidName, t('a.delete'), t('a.cancel'), true))) return;
  if (!(await iosConfirm(ssidName, t('wifi.confirmDel'), t('a.delete'), t('a.cancel'), true))) return;
  try {
    await Api.ssidDeleteSso(S.projectId, ssidName);
    toast(t('wifi.deleted')); loadSsids();
  } catch (e) { toast(e.message || e, true); }
}

function openSsidAdd() {
  if (!Api.ssoLoggedIn()) { toast(t('wifi.needSso')); return; }
  const body = $('wifi-body');
  body.innerHTML = `
    <div class="card" style="padding:14px;max-width:420px">
    <h3 style="margin:0 0 10px">${esc(t('wifi.add'))}</h3>
    <label class="fld"><span>${t('wifi.name')}</span><input id="sa-name" maxlength="32" autocomplete="off"></label>
    <label class="fld"><span>${t('wifi.password')}</span><input id="sa-pw" type="password" autocomplete="new-password"></label>
    <label class="fld"><span>${t('wifi.encryption')}</span><select id="sa-enc">
      <option value="wpa_wpa2-psk">WPA/WPA2-PSK</option>
      <option value="wpa2-psk">WPA2-PSK</option>
      <option value="wpa-psk">WPA-PSK</option>
      <option value="open">Open (no password)</option>
    </select></label>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" id="sa-ok">${t('wifi.create')}</button>
      <button class="btn" id="sa-cancel">${t('wifi.cancel')}</button>
    </div></div>`;
  $('sa-cancel').addEventListener('click', loadSsids);
  $('sa-ok').addEventListener('click', async () => {
    const name = $('sa-name').value.trim(), pw = $('sa-pw').value, enc = $('sa-enc').value;
    try {
      if (enc === 'open') {
        await Api.ssidCreateSso(S.projectId, { ssidName: name, password: '12345678', encryptionMode: 'open' });
      } else {
        await Api.ssidCreateSso(S.projectId, { ssidName: name, password: pw, encryptionMode: enc });
      }
      toast(t('wifi.created')); loadSsids();
    } catch (e) { toast(e.message || e, true); }
  });
}

function openSsidPassword(ssidName) {
  if (!Api.ssoLoggedIn()) { toast(t('wifi.needSso')); return; }
  const cur = (S.ssidList || []).find(s => String(s.ssidName || '') === String(ssidName));
  const oldPw = cur ? String(cur.password || '') : '';
  const body = $('wifi-body');
  body.innerHTML = `
    <div class="card" style="padding:14px;max-width:420px">
    <h3 style="margin:0 0 10px">${esc(ssidName)}</h3>
    <div class="fld"><span>${t('wifi.oldPassword')}</span>
      <input id="sp-old" type="password" readonly value="${esc(oldPw)}" placeholder="${t('wifi.noPw')}" style="width:100%">
      <button class="btn sm" id="sp-toggle" style="margin-top:8px;width:100%">${t('wifi.show')}</button>
    </div>
    <label class="fld"><span>${t('wifi.newPassword')}</span><input id="sp-pw" type="password" autocomplete="new-password"></label>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" id="sp-ok">${t('wifi.save')}</button>
      <button class="btn" id="sp-cancel">${t('wifi.cancel')}</button>
    </div></div>`;
  $('sp-toggle').addEventListener('click', () => {
    const inp = $('sp-old');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    $('sp-toggle').textContent = t(show ? 'wifi.hide' : 'wifi.show');
  });
  $('sp-cancel').addEventListener('click', loadSsids);
  $('sp-ok').addEventListener('click', async () => {
    const pw = $('sp-pw').value;
    if (!(await iosConfirm(t('wifi.confirmPw'), '', t('a.ok'), t('a.cancel'), false))) return;
    try {
      await Api.ssidSetPasswordSso(S.projectId, ssidName, pw);
      toast(t('wifi.pwChanged')); loadSsids();
    } catch (e) { toast(e.message || e, true); }
  });
}

/* WiFi name rename editor — iOS card style like the password/speed editors.
 * Renames via Api.ssidRenameSso (full-object PUT, only ssidName changed). */
function openSsidRename(ssidName) {
  if (!Api.ssoLoggedIn()) { toast(t('wifi.needSso')); return; }
  const body = $('wifi-body');
  body.innerHTML = `
    <div class="card" style="padding:14px;max-width:420px">
    <h3 style="margin:0 0 4px">${esc(t('wifi.rename'))}</h3>
    <p class="muted small" style="margin:0 0 12px">${esc(ssidName)}</p>
    <label class="fld"><span>${t('wifi.newName')}</span>
      <input id="sr-name" maxlength="32" autocomplete="off" value="${esc(ssidName)}"></label>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" id="sr-ok">${t('wifi.save')}</button>
      <button class="btn" id="sr-cancel">${t('wifi.cancel')}</button>
    </div></div>`;
  const inp = $('sr-name');
  inp.focus();
  inp.select();
  $('sr-cancel').addEventListener('click', loadSsids);
  $('sr-ok').addEventListener('click', async () => {
    const nm = inp.value.trim();
    if (!nm || nm.length > 32) { toast(t('wifi.badName'), true); return; }
    if (nm === ssidName) { loadSsids(); return; }
    if (!(await iosConfirm(tx('wifi.confirmRename', { old: ssidName, new: nm }), '', t('a.ok'), t('a.cancel'), false))) return;
    try {
      await Api.ssidRenameSso(S.projectId, ssidName, nm);
      toast(t('wifi.nameChanged')); loadSsids();
    } catch (e) {
      const msg = String(e.message || e);
      if (msg === 'SSID_BADNAME') toast(t('wifi.badName'), true);
      else if (msg === 'SSID_NAMEEXISTS') toast(t('wifi.nameExists'), true);
      else toast(msg, true);
    }
  });
}

/* 2026-10-01 (user): per-client speed limit editor for an SSID.
 * Shows the current per-client caps, edits in Mbps, saves via
 * Api.ssidSetRatesSso (full-object PUT, only upRate/downRate changed). */
/* Ruijie Cloud WLAN list style: show the radio band an SSID broadcasts on.
 * Portal field relatedRadio: '1' = 2.4G, '2' = 5G, '1,2' = both. */
function fmtSsidBand(s) {
  if (!s) return '';
  let r = s.relatedRadio;
  if (Array.isArray(r)) r = r.join(',');
  r = String(r || '').replace(/\s+/g, '');
  if (!r) return '';
  const has1 = r.split(',').includes('1'), has2 = r.split(',').includes('2');
  if (has1 && has2) return '2.4G/5G';
  if (has1) return '2.4G';
  if (has2) return '5G';
  return '';
}

function fmtSsidSpeed(s) {
  if (!s) return '';
  const up = s.upRate, down = s.downRate;
  if ((up === undefined || up === null || up === '') && (down === undefined || down === null || down === '')) return '';
  const f = v => (v === undefined || v === null || v === '') ? '—' : String(Api.ssidUnitToMbps(v));
  return tx('wifi.curSpeed', { up: f(up), down: f(down) });
}

function openSsidSpeed(ssidName) {
  if (!Api.ssoLoggedIn()) { toast(t('wifi.needSso')); return; }
  const cur = (S.ssidList || []).find(s => String(s.ssidName || '') === String(ssidName));
  const upCur = cur && cur.upRate !== undefined && cur.upRate !== null && cur.upRate !== ''
    ? Api.ssidUnitToMbps(cur.upRate) : '';
  const downCur = cur && cur.downRate !== undefined && cur.downRate !== null && cur.downRate !== ''
    ? Api.ssidUnitToMbps(cur.downRate) : '';
  const body = $('wifi-body');
  body.innerHTML = `
    <div class="card" style="padding:14px;max-width:420px">
    <h3 style="margin:0 0 10px">${esc(ssidName)}</h3>
    <p class="muted small" style="margin:0 0 12px">${esc(tx('wifi.curSpeed', { up: upCur === '' ? '—' : upCur, down: downCur === '' ? '—' : downCur }))}</p>
    <label class="fld"><span>${t('wifi.upRate')}</span>
      <input id="ss-up" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(String(upCur))}" placeholder="e.g. 5"></label>
    <label class="fld"><span>${t('wifi.downRate')}</span>
      <input id="ss-down" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(String(downCur))}" placeholder="e.g. 10"></label>
    <p class="muted small" style="margin:8px 0 0" id="ss-hint"></p>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" id="ss-ok">${t('wifi.save')}</button>
      <button class="btn" id="ss-cancel">${t('wifi.cancel')}</button>
    </div></div>`;
  const hint = () => {
    const u = parseFloat($('ss-up').value), d = parseFloat($('ss-down').value);
    $('ss-hint').textContent =
      (isFinite(u) && isFinite(d)) ? `= ${Api.ssidMbpsToUnit(u)} / ${Api.ssidMbpsToUnit(d)} ${Api.ssidRateUnit()}` : '';
  };
  $('ss-up').addEventListener('input', hint);
  $('ss-down').addEventListener('input', hint);
  hint();
  $('ss-cancel').addEventListener('click', loadSsids);
  $('ss-ok').addEventListener('click', async () => {
    const u = parseFloat($('ss-up').value), d = parseFloat($('ss-down').value);
    if (!(u >= 0 && d >= 0) || !isFinite(u) || !isFinite(d)) { toast(t('wifi.badSpeed'), true); return; }
    if (!(await iosConfirm(tx('wifi.confirmSpeed', { ssid: ssidName, up: u, down: d }), '', t('a.ok'), t('a.cancel'), false))) return;
    try {
      await Api.ssidSetRatesSso(S.projectId, ssidName, u, d);
      toast(t('wifi.speedSaved')); loadSsids();
    } catch (e) { toast(e.message || e, true); }
  });
}

/* ── Gateway Web Authentication editor · v1.5.96 (Fix13) ──
 * More → Web Auth. Verified 2026-10-01 from the user's DevTools captures:
 *   READ  (2-6.txt): cmdArr [devSta.get app_auth/app_auth_get_macc,
 *           acConfig.get apPortalMacc, devConfig.get appAuthParamFmt]
 *   WRITE (2-7.txt): devConfig.set module "app_auth_macc" with the FULL
 *           read object; reply {code:0, data:{rcode:"00000000",
 *           message:"success_set"}}
 * Editable: Authentication toggle, Auth Server URL, HTTPS Redirection
 * toggle, Idle Client Timeout (min), Wi-Fi List rows (VLAN name + IP
 * range, add/edit/delete). Save sends back the full object that was
 * read — never built from scratch, so untouched fields (paramFmt,
 * wxRedirect, authIpList, …) survive the round-trip.
 * Fix14: second section — Global Config (globalAuthConf). Verified
 * 2026-10-01: READ = cmdArr [devConfig.get globalAuthConf, devConfig.get
 * authCertUpload]; WRITE = devConfig.set module "globalAuthConf" with
 * exactly the 10 verified keys (proto, remind_days, remind_interval,
 * remind_content, charge_url, flow_detect_time, http_host_check,
 * remind_url, user_state_url, version) — the read's configTime/
 * currentTime/configId are NOT sent. Reply {code:0,
 * data:{rcode:"00000000", msg:"success"}}. */
async function moreWebAuth() {
  S.moreFn = moreWebAuth;
  moreShell(`${ic('lock', 'sm')} ${esc(t('wa.title'))}`, `
    ${GwApi.loggedIn() ? '' : `<p class="muted small">${t('wa.needGw')}</p>`}
    <div id="wa-body"><p class="muted">${t('wa.loading')}</p></div>
    <div id="wg-body"></div>
    <div id="al-body"></div>`);
  let cfg = null, glob = null, allow = null;
  try { [cfg, glob, allow] = await Promise.all([GwApi.webAuthGet(), GwApi.globalAuthGet(), GwApi.allowlistGet()]); }
  catch (e) { /* nulls below */ }
  if (!cfg) { $('wa-body').innerHTML = `<p class="err">${esc(t('wa.loadFail'))}</p>`; return; }
  S._waCfg = cfg;
  const swRow = (id, label, on) =>
    `<div class="switch-row"><span class="ug-lab">${esc(label)}</span>` +
    `<label class="switch"><input type="checkbox" id="${id}"${on ? ' checked' : ''}><span class="track"></span></label></div>`;
  // Push in-progress row edits back into S._waCfg before any re-render.
  const syncRows = () => {
    S._waCfg.setSsidIpList = (S._waCfg.setSsidIpList || []).map((r, i) => {
      const vlanEl = document.querySelector(`.wa-vlan[data-wai="${i}"]`);
      const iprEl = document.querySelector(`.wa-ipr[data-wai="${i}"]`);
      return {
        ssidName: vlanEl ? vlanEl.value.trim() : (r.ssidName || ''),
        ip: iprEl ? iprEl.value.split(',').map(s => s.trim()).filter(Boolean) : (r.ip || []),
      };
    });
  };
  const renderRows = () => {
    const rows = S._waCfg.setSsidIpList || [];
    // v1.5.99: stacked rows — VLAN name + delete on top, IP range full-width
    // below (one row squeezed the IP into "192.168.2…" on phones).
    $('wa-rows').innerHTML = rows.map((r, i) => `
      <div class="wa-row">
        <div class="wa-row-top">
          <input class="ug-input wa-vlan" data-wai="${i}" value="${esc(r.ssidName || '')}"
            placeholder="${esc(t('wa.vlan'))}" aria-label="${esc(t('wa.vlan'))}">
          <button class="btn danger-ghost wa-del" data-wai="${i}" aria-label="${esc(t('wa.del'))}">${ic('trash', 'sm')}</button>
        </div>
        <input class="ug-input wa-ipr" data-wai="${i}" value="${esc((r.ip || []).join(', '))}"
          placeholder="${esc(t('wa.ipRange'))}" aria-label="${esc(t('wa.ipRange'))}">
      </div>`).join('') || `<p class="muted small">—</p>`;
    document.querySelectorAll('.wa-del').forEach(b => b.addEventListener('click', () => {
      syncRows();
      S._waCfg.setSsidIpList.splice(Number(b.dataset.wai), 1);
      renderRows();
    }));
  };
  $('wa-body').innerHTML = `
    <div class="ug-card">
      ${swRow('wa-enable', t('wa.enable'), String(cfg.enable) === '1')}
      <div class="ug-row"><span class="ug-lab">${esc(t('wa.adUrl'))}</span></div>
      <input id="wa-adurl" class="ug-input" type="url" inputmode="url" value="${esc(cfg.ad_url || '')}" placeholder="https://…">
      ${swRow('wa-https', t('wa.https'), String(cfg.proxy_https) === '1')}
      <div class="ug-row"><span class="ug-lab">${esc(t('wa.idle'))}</span>
        <span><input id="wa-idle" class="ug-input" type="number" inputmode="numeric" min="1" max="1440"
          value="${esc(cfg.flowDetectTime || '15')}" style="width:90px;text-align:right" aria-label="${esc(t('wa.idle'))}">
          <span class="muted small">${esc(t('wa.min'))}</span></span></div>
      <div class="ug-row"><span class="ug-lab">${esc(t('wa.wifiList'))}</span>
        <button class="btn" id="wa-add">${ic('plus', 'sm')}<span>${t('wa.add')}</span></button></div>
      <div id="wa-rows"></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="wa-save">${t('wa.save')}</button></div>
    </div>`;
  renderRows();
  $('wa-add').addEventListener('click', () => {
    syncRows();
    (S._waCfg.setSsidIpList = S._waCfg.setSsidIpList || []).push({ ssidName: '', ip: [''] });
    renderRows();
  });
  $('wa-save').addEventListener('click', async () => {
    if (!(await iosConfirm(t('wa.confirm'), '', t('a.save'), t('a.cancel'), false))) return;
    syncRows();
    const c = S._waCfg;
    c.enable = $('wa-enable').checked ? '1' : '0';
    c.ad_url = $('wa-adurl').value.trim();
    c.proxy_https = $('wa-https').checked ? '1' : '0';
    const idle = Math.max(1, Math.min(1440, parseInt($('wa-idle').value, 10) || 15));
    c.flowDetectTime = String(idle);
    c.setSsidIpList = (c.setSsidIpList || []).filter(r => r.ssidName || (r.ip && r.ip.length));
    try {
      await GwApi.webAuthSet(c);
      toast(t('wa.saved'));
      moreWebAuth(); // re-read to show the gateway's own state
    } catch (e) { toast(e.message || e, true); }
  });

  // ── Global Config section (Fix14) ──────────────────────────────
  const gEl = $('wg-body');
  if (!gEl) return;
  if (!glob) { gEl.innerHTML = `<p class="err" style="margin-top:10px">${esc(t('wa.loadFail'))}</p>`; return; }
  S._waGlob = glob;
  const gOn = k => String(glob[k] || '') === '1';
  const gNum = (k, ph) => `<input id="wg-${k}" type="number" min="0" inputmode="numeric" class="ug-input" value="${esc(String(glob[k] ?? ''))}" placeholder="${esc(ph)}">`;
  gEl.innerHTML = `
  <div class="ug-card" style="margin-top:12px">
    <div class="ug-sect">${esc(t('wg.title'))}</div>
    <div class="segmented ug-seg" id="wg-proto">
      <button type="button" data-p="http" class="${String(glob.proto) === 'http' ? 'active' : ''}">http</button>
      <button type="button" data-p="https" class="${String(glob.proto) === 'https' ? 'active' : ''}">https</button>
    </div>
    <div class="ug-field"><span class="ug-lab">${esc(t('wg.stateUrl'))}</span>
      <input id="wg-user_state_url" type="text" class="ug-input" value="${esc(String(glob.user_state_url || ''))}"></div>
    <div class="ug-field"><span class="ug-lab">${esc(t('wg.remindDays'))}</span>
      <div class="ug-inline">${gNum('remind_days', '1')}<span class="ug-unit">${esc(t('wg.days'))}</span></div></div>
    <div class="ug-field"><span class="ug-lab">${esc(t('wg.remindInterval'))}</span>
      <div class="ug-inline">${gNum('remind_interval', '1')}<span class="ug-unit">${esc(t('wg.hours'))}</span></div></div>
    <div class="ug-field"><span class="ug-lab">${esc(t('wg.idle'))}</span>
      <div class="ug-inline">${gNum('flow_detect_time', '15')}<span class="ug-unit">${esc(t('wa.min'))}</span></div></div>
    <div class="ug-field"><span class="ug-lab">${esc(t('wg.httpCheck'))}</span>
      <label class="switch"><input id="wg-http_host_check" type="checkbox" ${gOn('http_host_check') ? 'checked' : ''}><span class="track"></span></label></div>
    <div class="row" style="margin-top:14px"><button class="btn primary" id="wg-save">${t('wa.save')}</button></div>
  </div>`;
  $('wg-proto').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('wg-proto').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
  });
  $('wg-save').addEventListener('click', async () => {
    if (!(await iosConfirm(t('wg.confirm'), '', t('a.save'), t('a.cancel'), false))) return;
    const g = S._waGlob;
    const act = $('wg-proto').querySelector('button.active');
    g.proto = act ? act.dataset.p : String(g.proto || 'http');
    g.user_state_url = $('wg-user_state_url').value.trim();
    g.remind_days = String($('wg-remind_days').value || '0');
    g.remind_interval = String($('wg-remind_interval').value || '0');
    g.flow_detect_time = String($('wg-flow_detect_time').value || '0');
    g.http_host_check = $('wg-http_host_check').checked ? '1' : '0';
    try {
      await GwApi.globalAuthSet(g);
      toast(t('wa.saved'));
      moreWebAuth(); // re-read to show the gateway's own state
    } catch (e) { toast(e.message || e, true); }
  });

  // ── Allowlist section (Fix15) ──────────────────────────────────
  const aEl = $('al-body');
  if (!aEl) return;
  if (!allow) { aEl.innerHTML = `<p class="err" style="margin-top:10px">${esc(t('wa.loadFail'))}</p>`; return; }
  const macOk = s => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(String(s).trim());
  const macNorm = s => String(s).trim().toUpperCase().replace(/-/g, ':');
  let macs = (Array.isArray(allow.mac) ? allow.mac : []).map(macNorm);
  const domains = Array.isArray(allow.url) ? allow.url : [];
  const renderMacs = () => {
    const box = $('al-macs');
    if (!box) return;
    box.innerHTML = macs.length ? macs.map((m, i) =>
      `<div class="ug-row"><span class="mono">${esc(m)}</span>` +
      `<button class="btn danger sm" data-del="${i}">✕</button></div>`).join('')
      : `<p class="muted small">${esc(t('al.empty'))}</p>`;
    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      macs.splice(Number(b.dataset.del), 1);
      renderMacs();
    }));
  };
  aEl.innerHTML = `
  <div class="ug-card" style="margin-top:12px">
    <div class="ug-sect">${esc(t('al.title'))}</div>
    <div class="ug-sect" style="padding-top:6px">${esc(t('al.mac'))}</div>
    <div id="al-macs"></div>
    <div class="ug-inline" style="margin-top:8px">
      <input id="al-newmac" type="text" class="ug-input mono" placeholder="${esc(t('al.macPh'))}" autocapitalize="characters">
      <button class="btn" id="al-add">${esc(t('al.add'))}</button>
    </div>
    <div class="row" style="margin-top:14px"><button class="btn primary" id="al-save">${t('wa.save')}</button></div>
    <div class="ug-sect" style="padding-top:14px">${esc(t('al.domain'))}
      <span class="muted small"> · ${esc(t('al.readonly'))}</span></div>
    ${domains.length ? domains.map(d =>
      `<div class="ug-row"><span class="mono">${esc(d)}</span></div>`).join('')
      : `<p class="muted small">${esc(t('al.empty'))}</p>`}
  </div>`;
  renderMacs();
  $('al-add').addEventListener('click', () => {
    const inp = $('al-newmac'), v = inp.value.trim();
    if (!macOk(v)) { toast(t('al.badMac'), true); return; }
    const n = macNorm(v);
    if (macs.includes(n)) { toast(t('al.dupMac'), true); return; }
    macs.push(n);
    inp.value = '';
    renderMacs();
  });
  $('al-save').addEventListener('click', async () => {
    if (!(await iosConfirm(t('al.confirm'), '', t('a.save'), t('a.cancel'), false))) return;
    try {
      await GwApi.allowlistMacSet(macs);
      toast(t('wa.saved'));
      moreWebAuth(); // re-read to show the gateway's own state
    } catch (e) { toast(e.message || e, true); }
  });
}

/* ── QoS management (More → QoS) · v1.5.150 ──
 * VERIFIED APIs from user's Gateway Capture 2026-10-03.
 * Smart QoS toggle + bandwidth, Application Priority Key Group,
 * App Identification toggle. */
async function moreQoS() {
  S.moreFn = moreQoS;
  moreShell(`${ic('signal', 'sm')} ${esc(t('q.title'))}`, `
    ${GwApi.loggedIn() ? '' : `<p class="muted small">${t('md.needGw')}</p>`}
    <div id="q-body"><p class="muted">${t('more.loading')}</p></div>`);
  if (GwApi.loggedIn()) loadQoS();
}

async function loadQoS() {
  const body = $('q-body');
  if (!body) return;
  body.innerHTML = `<p class="muted">${t('more.loading')}</p>`;
  try {
    // v1.5.164: load fast data first, app tree lazy in background
    const [qos, app, func, pol] = await Promise.all([
      GwApi.qosGet().catch(() => null),
      GwApi.qosAppGet().catch(() => null),
      GwApi.funcStatus().catch(() => null),
      GwApi.qosPolicyGet().catch(() => null),
    ]);
    let tree = null;
    // Bind fallback UI (manual entry + retry) — called when tree fails
    const bindTreeFallback = () => {
      // v1.5.165: show debug info
      try {
        const dbg = window._qosTreeDebug;
        const dbgEl = $('q-tree-debug');
        if (dbg && dbgEl) {
          dbgEl.textContent = 'Debug: ' + JSON.stringify(dbg);
        }
      } catch (_) {}
      const mi = $('q-app-manual');
      if (mi && !mi.dataset.bound) {
        mi.dataset.bound = '1';
        mi.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const v = (mi.value || '').trim();
            if (v && !curApps.includes(v)) { curApps.push(v); renderApps(); mi.value = ''; }
          }
        });
      }
      const retryBtn = $('q-tree-retry');
      if (retryBtn && !retryBtn.dataset.bound) {
        retryBtn.dataset.bound = '1';
        retryBtn.addEventListener('click', (e) => { e.preventDefault(); loadQoS(); });
      }
    };
    // Start tree load in background — don't block page render
    const treePromise = GwApi.qosAppTree().then(treeItems => {
      tree = treeItems;
      const sel = $('q-app-sel');
      const loading = $('q-tree-loading');
      const fallback = $('q-tree-fallback');
      if (treeItems && treeItems.length && sel) {
        const cur = sel.value;
        sel.innerHTML = `<option value="">${esc(t('q.selApp'))}</option>` +
          treeItems.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('');
        sel.value = cur;
        if (loading) loading.remove();
        if (fallback) fallback.remove();
      } else {
        // Tree failed — show fallback
        if (loading) loading.remove();
        if (fallback) fallback.style.display = '';
        bindTreeFallback();
      }
      return treeItems;
    }).catch(() => {
      const loading = $('q-tree-loading');
      const fallback = $('q-tree-fallback');
      if (loading) loading.remove();
      if (fallback) fallback.style.display = '';
      bindTreeFallback();
      return null;
    });
    const smartOn = qos && qos.tcSwitch === 'on';
    const up = (qos && qos.uploadBand) || '';
    const down = (qos && qos.downloadBand) || '';
    const apps = (app && app.appList) || [];
    const policies = (pol && pol.list) || [];
    // v1.5.171: keep last-read gateway state — the gateway is the source of
    // truth, so writes merge onto this (or a fresh re-read) instead of
    // hardcoded defaults, keeping both phones in sync.
    const qosRaw = (qos && qos.raw) || null;
    const appRaw = (app && app.raw) || null;
    const syncTime = new Date().toLocaleTimeString();
    // funcmgr status shape varies; try common paths
    let appIdOn = null;
    try {
      const f = func || {};
      const arr = f.list || f.data || f.funcList || [];
      if (Array.isArray(arr)) {
        const hit = arr.find(x => (x.funcName || x.name) === 'app_identify');
        if (hit) appIdOn = String(hit.switch || hit.status || hit.enable) === '1';
      } else if (typeof f === 'object') {
        for (const k of Object.keys(f)) {
          const v = f[k];
          if (k === 'app_identify' || (v && (v.funcName === 'app_identify'))) {
            appIdOn = String(v.switch ?? v.status ?? v) === '1';
            break;
          }
        }
      }
    } catch (_) {}

    body.innerHTML = `
      <p class="muted small" style="margin:0 0 8px">✓ ${esc(t('q.synced'))} · ${esc(syncTime)}</p>
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <b>${esc(t('q.smart'))}</b>
          <button class="btn ${smartOn ? 'btn-on' : ''}" id="q-smart-tgl" style="min-width:88px">${smartOn ? t('q.on') : t('q.off')}</button>
        </div>
        <div class="row" style="margin-top:10px">
          <label style="flex:1">${esc(t('q.up'))} (Mbps)<br><input type="number" id="q-up" value="${esc(up)}" min="1" max="1000" inputmode="numeric"></label>
          <label style="flex:1">${esc(t('q.down'))} (Mbps)<br><input type="number" id="q-down" value="${esc(down)}" min="1" max="1000" inputmode="numeric"></label>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn primary" id="q-save">${ic('check', 'sm')}<span>${t('q.save')}</span></button>
          <button class="btn" id="q-refresh">${ic('refresh', 'sm')}<span>${t('q.refresh')}</span></button>
        </div>
        <p class="muted small" style="margin-top:8px">${esc(t('q.smartHint'))}</p>
      </div>
      <div class="card" style="margin-top:12px">
        <b>${esc(t('q.keygrp'))}</b>
        <p class="muted small">${esc(t('q.keygrpHint'))}</p>
        <div id="q-apps" style="margin:8px 0"></div>
        <div class="row">
          <select id="q-app-sel" style="flex:1">
            <option value="">${esc(t('q.selApp'))}</option>
            ${(tree || []).map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}
          </select>
          <input type="text" id="q-app-manual" placeholder="${esc(t('q.manualApp'))}" style="flex:1" autocomplete="off">
        </div>
        <div id="q-app-suggest" style="display:none;max-height:180px;overflow-y:auto;border:1px solid var(--line);border-radius:10px;margin-top:4px;background:var(--card)"></div>
        <p class="muted small" style="margin-top:4px">${esc(t('q.nameHint'))}</p>
        ${tree ? '' : `
        <p class="muted small" id="q-tree-loading">${esc(t('q.treeLoading'))}</p>
        <div id="q-tree-fallback" style="display:none">

        <p class="muted small" style="margin-top:4px">${esc(t('q.nameHint'))}</p>
        <p class="muted small">${esc(t('q.noTree'))} <a href="#" id="q-tree-retry" style="color:var(--blue)">${esc(t('q.retry'))}</a>${appIdOn === false ? ' ' + esc(t('q.needAppId')) : ''}</p>
        <p class="muted small" id="q-tree-debug" style="font-size:11px;word-break:break-all"></p>
        </div>`}
        <div class="row" style="margin-top:10px">
          <button class="btn primary" id="q-app-save">${ic('check', 'sm')}<span>${t('q.save')}</span></button>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="row" style="justify-content:space-between;align-items:center">
          <b>${esc(t('q.pol'))}</b>
          <button class="btn" id="q-pol-add">${ic('plus', 'sm')}<span>${t('q.add')}</span></button>
        </div>
        <div id="q-pols" style="margin-top:8px"></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div><b>${esc(t('q.appid'))}</b><br><span class="muted small">${esc(t('q.appidHint'))}</span></div>
          <button class="btn ${appIdOn ? 'btn-on' : ''}" id="q-appid-tgl" style="min-width:88px">${appIdOn === null ? '—' : (appIdOn ? t('q.on') : t('q.off'))}</button>
        </div>
      </div>`;

    let curSmart = smartOn;
    let curApps = [...apps];
    let curAppId = appIdOn;
    let curPols = JSON.parse(JSON.stringify(policies));

    // v1.5.154: Kbps <-> Mbps conversion (gateway stores Kbps, UI shows Mbps)
    const k2m = (k) => {
      const n = Number(k);
      if (!Number.isFinite(n)) return '';
      const m = n / 1000;
      return String(Number(m.toFixed(3)));
    };
    const m2k = (m) => {
      const n = Number(m);
      return Number.isFinite(n) ? String(Math.round(n * 1000)) : '';
    };

    const renderApps = () => {
      const el = $('q-apps');
      if (!el) return;
      el.innerHTML = curApps.map((a, i) =>
        `<span class="chip" style="margin:2px">${esc(a)} <b data-ai="${i}" style="cursor:pointer">×</b></span>`
      ).join('') || `<span class="muted small">${t('q.noApps')}</span>`;
      el.querySelectorAll('[data-ai]').forEach(x => x.addEventListener('click', () => {
        curApps.splice(Number(x.dataset.ai), 1);
        renderApps();
      }));
    };
    renderApps();

    const renderPols = () => {
      const el = $('q-pols');
      if (!el) return;
      if (!curPols.length) {
        el.innerHTML = `<p class="muted small">${t('q.noPol')}</p>`;
        return;
      }
      el.innerHTML = curPols.map((p, i) => {
        const en = String(p.enable) === 'on';
        const nm = p.comment || p.policy_id || ('#' + i);
        const upL = k2m(p.upRate || p.allUpRate);
        const dnL = k2m(p.downRate || p.allDownRate);
        return `<div class="row" style="justify-content:space-between;align-items:center;border-bottom:.5px solid var(--hairline);padding:8px 0">
          <div style="flex:1"><b>${esc(nm)}</b><br>
            <span class="muted small">↑ ${esc(String(upL))} ↓ ${esc(String(dnL))} · ${esc(p.ipRange || '')}</span></div>
          <button class="btn ${en ? 'btn-on' : ''}" data-pt="${i}" style="min-width:64px">${en ? t('q.on') : t('q.off')}</button>
          <button class="btn" data-pe="${i}">${ic('pencil', 'sm')}</button>
          <button class="btn" data-pd="${i}">${ic('trash', 'sm')}</button>
        </div>`;
      }).join('');
      el.querySelectorAll('[data-pt]').forEach(b => b.addEventListener('click', async () => {
        const i = Number(b.dataset.pt);
        curPols[i].enable = String(curPols[i].enable) === 'on' ? 'off' : 'on';
        toast(t('q.saving'));
        try {
          const ok = await GwApi.qosPolicySet(curPols);
          toast(ok ? t('q.saved') : t('q.fail'));
          if (ok) renderPols();
        } catch (e) { toast(t('q.fail') + ': ' + e.message); }
      }));
      el.querySelectorAll('[data-pd]').forEach(b => b.addEventListener('click', async () => {
        const i = Number(b.dataset.pd);
        if (!confirm(t('q.confirmDel'))) return;
        curPols.splice(i, 1);
        toast(t('q.saving'));
        try {
          const ok = await GwApi.qosPolicySet(curPols);
          toast(ok ? t('q.saved') : t('q.fail'));
          if (ok) renderPols();
        } catch (e) { toast(t('q.fail') + ': ' + e.message); }
      }));
      el.querySelectorAll('[data-pe]').forEach(b => b.addEventListener('click', () => {
        openPolEditor(Number(b.dataset.pe));
      }));
    };
    renderPols();

    const openPolEditor = (idx) => {
      const isNew = idx === -1;
      const p = isNew ? {
        comment: '', ipRange: '', enable: 'on',
        upRate: '20000', allUpRate: '20000', downRate: '20000', allDownRate: '20000',
        mode: 'share', intf: 'br-wan', tcPri: '1',
      } : JSON.parse(JSON.stringify(curPols[idx]));
      const ov = document.createElement('div');
      ov.className = 'modal'; ov.style.display = 'flex';
      ov.innerHTML = `<div class="modal-box" style="max-width:440px">
        <b>${esc(isNew ? t('q.addPol') : t('q.editPol'))}</b>
        <label style="display:block;margin-top:10px">${esc(t('q.polName'))}<br>
          <input type="text" id="pe-name" value="${esc(p.comment || '')}" style="width:100%"></label>
        <label style="display:block;margin-top:8px">${esc(t('q.polIp'))}<br>
          <input type="text" id="pe-ip" value="${esc(p.ipRange || '')}" placeholder="192.168.30.1-192.168.30.254" style="width:100%"></label>
        <div class="row" style="margin-top:8px">
          <label style="flex:1">${esc(t('q.upLimit'))} (Mbps)<br>
            <input type="number" id="pe-up" value="${esc(k2m(p.upRate || p.allUpRate))}" step="0.1" min="0"></label>
          <label style="flex:1">${esc(t('q.dnLimit'))} (Mbps)<br>
            <input type="number" id="pe-dn" value="${esc(k2m(p.downRate || p.allDownRate))}" step="0.1" min="0"></label>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn primary" id="pe-save" style="flex:1">${t('q.save')}</button>
          <button class="btn" id="pe-cancel" style="flex:1">${t('q.cancel')}</button>
        </div>
      </div>`;
      document.body.appendChild(ov);
      ov.querySelector('#pe-cancel').addEventListener('click', () => ov.remove());
      ov.querySelector('#pe-save').addEventListener('click', async () => {
        const np = isNew ? {
          policy_id: '10', ip_group: 'fc_rule_' + Date.now(),
          type: 'macc_cst', mode: 'share', intf: 'br-wan', tcPri: '1',
          tr_effective: '1', tr_group: '所有时段', wholeWan: '0',
          idyc_version: 'V3', effective: '-1', appList: [],
          user_group_list: [], vlanList: [], tr_range: [], intfGrpList: [],
        } : p;
        np.comment = ov.querySelector('#pe-name').value.trim();
        np.ipRange = ov.querySelector('#pe-ip').value.trim();
        // v1.5.154: UI is Mbps, gateway stores Kbps — convert with m2k
        const uv = m2k(ov.querySelector('#pe-up').value.trim());
        const dv = m2k(ov.querySelector('#pe-dn').value.trim());
        if (uv) { np.upRate = uv; np.allUpRate = uv; np.upRateG = uv; np.allUpRateG = uv; }
        if (dv) { np.downRate = dv; np.allDownRate = dv; np.downRateG = dv; np.allDownRateG = dv; }
        if (isNew) curPols.push(np); else curPols[idx] = np;
        ov.remove();
        toast(t('q.saving'));
        try {
          const ok = await GwApi.qosPolicySet(curPols);
          toast(ok ? t('q.saved') : t('q.fail'));
          if (ok) renderPols();
        } catch (e) { toast(t('q.fail') + ': ' + e.message); }
      });
    };

    $('q-pol-add').addEventListener('click', () => openPolEditor(-1));

    $('q-smart-tgl').addEventListener('click', async () => {
      const to = !curSmart;
      if (!confirm(t('q.confirmSmart'))) return;
      toast(t('q.saving'));
      try {
        // v1.5.171: re-read live gateway state first so the other phone's
        // concurrent change isn't clobbered; user edits merge on top.
        const fresh = await GwApi.qosGet().catch(() => null);
        const raw = (fresh && fresh.raw) || qosRaw;
        const ok = await GwApi.qosSet(to, $('q-up').value || up || '15', $('q-down').value || down || '150', raw);
        if (ok) { curSmart = to; toast(t('q.saved')); loadQoS(); }
        else toast(t('q.fail'));
      } catch (e) { toast(t('q.fail') + ': ' + e.message); }
    });

    $('q-save').addEventListener('click', async () => {
      toast(t('q.saving'));
      try {
        // v1.5.171: re-read live gateway state first (see above).
        const fresh = await GwApi.qosGet().catch(() => null);
        const raw = (fresh && fresh.raw) || qosRaw;
        const ok = await GwApi.qosSet(curSmart, $('q-up').value || '15', $('q-down').value || '150', raw);
        toast(ok ? t('q.saved') : t('q.fail'));
        if (ok) loadQoS();
      } catch (e) { toast(t('q.fail') + ': ' + e.message); }
    });

    $('q-refresh').addEventListener('click', loadQoS);

    const qsel = $('q-app-sel');
    if (qsel) qsel.addEventListener('change', () => {
      const vi = qsel.value;
      if (vi === '' || !tree || !tree[Number(vi)]) return;
      const entry = tree[Number(vi)];
      const appId = entry.id || entry.name.split('/').pop().trim();
      if (appId && !curApps.includes(appId)) { curApps.push(appId); renderApps(); }
      qsel.value = '';
    });
    // Manual input: autocomplete suggestions from app tree + Enter to add
    const qmi = $('q-app-manual');
    const qsug = $('q-app-suggest');
    if (qmi && !qmi.dataset.bound) {
      qmi.dataset.bound = '1';
      const hideSug = () => { if (qsug) qsug.style.display = 'none'; };
      const showSug = () => {
        if (!qsug) return;
        const q = (qmi.value || '').trim().toLowerCase();
        if (q.length < 2 || !tree || !tree.length) { hideSug(); return; }
        const matches = tree.filter(x => x.name.toLowerCase().includes(q) && !curApps.includes(x.name)).slice(0, 8);
        if (!matches.length) { hideSug(); return; }
        qsug.innerHTML = matches.map((x, i) =>
          `<div data-idx="${tree.indexOf(x)}" style="padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer;font-size:14px">${esc(x.name)}</div>`
        ).join('');
        qsug.style.display = '';
        qsug.querySelectorAll('div[data-idx]').forEach(el => {
          el.addEventListener('click', () => {
            const idx = Number(el.dataset.idx);
            const entry = tree[idx];
            const appId = entry.id || entry.name;
            if (appId && !curApps.includes(appId)) { curApps.push(appId); renderApps(); }
            qmi.value = ''; hideSug();
          });
        });
      };
      qmi.addEventListener('input', showSug);
      qmi.addEventListener('focus', showSug);
      qmi.addEventListener('blur', () => setTimeout(hideSug, 200));
      qmi.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const v = (qmi.value || '').trim();
          if (v && !curApps.includes(v)) { curApps.push(v); renderApps(); qmi.value = ''; hideSug(); }
        } else if (e.key === 'Escape') { hideSug(); }
      });
    }
    // v1.5.164: fallback binding handled by bindTreeFallback() above

    $('q-app-save').addEventListener('click', async () => {
      if (!confirm(t('q.confirmApp'))) return;
      toast(t('q.saving'));
      try {
        // v1.5.171: read-modify-write the FULL app-group list. Writing only
        // the key group (old behavior) would wipe other groups and the other
        // phone's edits — the gateway stays the source of truth.
        const fresh = await GwApi.qosAppGet().catch(() => null);
        const rawList = (fresh && fresh.raw && Array.isArray(fresh.raw.list)) ? fresh.raw.list : null;
        let ok;
        if (rawList) {
          const groups = rawList.map(g => ({ ...g }));
          const ki = groups.findIndex(g => g.appGrp === 'key');
          if (ki >= 0) groups[ki] = { ...groups[ki], appList: [...curApps] };
          else groups.push({ appGrp: 'key', name: '关键通道', appList: [...curApps] });
          ok = await GwApi.qosAppSetAll(groups);
        } else {
          ok = await GwApi.qosAppSet(curApps); // fallback: legacy single-group write
        }
        toast(ok ? t('q.saved') : t('q.fail'));
        if (ok) loadQoS();
      } catch (e) { toast(t('q.fail') + ': ' + e.message); }
    });

    $('q-appid-tgl').addEventListener('click', async () => {
      const to = !(curAppId === true);
      if (!confirm(t('q.confirmAppId'))) return;
      toast(t('q.saving'));
      try {
        const ok = await GwApi.funcToggle('app_identify', to);
        if (ok) { curAppId = to; toast(t('q.saved')); loadQoS(); }
        else toast(t('q.fail'));
      } catch (e) { toast(t('q.fail') + ': ' + e.message); }
    });
  } catch (e) {
    body.innerHTML = `<p class="muted">⚠️ ${esc(e.message)}</p>`;
  }
}

async function moreTraffic() {
  S.moreFn = moreTraffic;
  moreShell(`${ic('chart', 'sm')} ${esc(t('mt.title'))}`, `
    ${GwApi.loggedIn() ? '' : `<p class="muted small">${t('md.needGw')}</p>`}
    <div><button class="btn" id="mt-refresh">${ic('refresh', 'sm')}<span>${t('mt.refresh')}</span></button>
    <span class="muted small" id="mt-meta"></span></div>
    <div id="mt-body" style="margin-top:10px"><p class="muted">${t('mt.hint')}</p></div>`);
  $('mt-refresh').addEventListener('click', loadTraffic);
  if (GwApi.loggedIn()) loadTraffic();
}

async function loadTraffic() {
  const body = $('mt-body'), meta = $('mt-meta');
  if (!body) return;
  body.innerHTML = `<p class="muted">${t('more.loading')}</p>`;
  try {
    const { count, flows } = await GwApi.flowTable();
    const now = Date.now();
    let rates = null;
    if (S.trafficPrev && Array.isArray(S.trafficPrev.flows) && now > S.trafficPrev.t) {
      rates = flowRates(S.trafficPrev.flows, flows, now - S.trafficPrev.t);
    }
    S.trafficPrev = { t: now, flows };
    renderTraffic(body, meta, aggFlowsByClient(flows), rates, count, now);
  } catch (e) {
    const m = String((e && e.message) || e);
    body.innerHTML = `<p class="err">${esc(m === 'GW_NOT_LOGGED_IN' ? t('md.needGw') : m === 'GW_PWD_ENC_PENDING' ? t('gw.encPending') : m)}</p>`;
  }
}

function renderTraffic(body, meta, agg, rates, count, now) {
  meta.textContent = tx('mt.flows', { n: count, time: fmtTime(now) });
  if (!agg.length) { body.innerHTML = `<p class="muted">${esc(t('mt.noData'))}</p>`; return; }
  const top = agg[0];
  const topTotal = top.upBytes + top.downBytes;
  const ADGUARD = '94.140.14.14';
  const rateCell = r => r == null ? '—' : esc(fmtRate(r * 8));
  body.innerHTML = `
    <div class="stat-grid"><div class="stat a"><div class="n">${esc(top.ip)}</div>
    <div class="l">${esc(t('mt.topTalker'))} · ${esc(fmtBytes(topTotal))}</div></div></div>
    <p class="muted small">${esc(t('mt.cumNote'))}</p>
    <div class="wrap-scroll"><table class="data">
      <tr><th>${t('mt.ip')}</th><th>${t('mt.conns')}</th><th>${t('mt.up')}</th><th>${t('mt.down')}</th>
      <th>${t('mt.upRate')} ${t('mt.est')}</th><th>${t('mt.downRate')} ${t('mt.est')}</th></tr>
      ${agg.map(c => {
        const r = rates ? rates.get(c.ip) : null;
        return `<tr><td>${esc(c.ip)}</td><td>${c.flows}</td><td>${esc(fmtBytes(c.upBytes))}</td>` +
          `<td>${esc(fmtBytes(c.downBytes))}</td><td>${rateCell(r && r.upRate)}</td><td>${rateCell(r && r.downRate)}</td></tr>`;
      }).join('')}
    </table></div>
    <div class="section-title">${esc(t('mt.dnsTitle'))}</div>
    <p class="muted small">${esc(t('mt.dnsNote'))}</p>
    <div class="wrap-scroll"><table class="data">
      <tr><th>${t('mt.ip')}</th><th>DNS</th></tr>
      ${agg.filter(c => c.dns.length).map(c =>
        `<tr><td>${esc(c.ip)}</td><td>${c.dns.map(d =>
          d === ADGUARD
            ? `<span class="chip ok">✓ ${esc(d)}</span>`
            : `<span class="chip">${esc(d)}</span>`).join(' ')}</td></tr>`).join('') || `<tr><td colspan="2" class="muted">${esc(t('mt.noData'))}</td></tr>`}
    </table></div>`;
}

/* ── Overview dashboard (More → Overview) ──
   Ruijie-Cloud-style dashboard: Traffic Ranking (flow-table per-client
   totals with bars) + Newly Connected Clients (voucher users only, with
   voucher codes). Tablet: two columns via .grid-2; phone: stacked.
   Traffic is manual-refresh only (one flow-table poll ≈ 166 kB). */
async function moreOverview() {
  S.moreFn = moreOverview;
  moreShell(`${ic('chart', 'sm')} ${esc(t('ov.title'))}`, `
    <div><button class="btn" id="ov-refresh">${ic('refresh', 'sm')}<span>${t('ov.refresh')}</span></button>
    <span class="muted small" id="ov-meta"></span></div>
    <div class="grid-2" style="margin-top:10px">
      <section class="ov-panel"><div class="section-title">${esc(t('ov.trafficRanking'))}</div><div id="ov-traffic"><p class="muted">${t('more.loading')}</p></div></section>
      <section class="ov-panel"><div class="section-title">${esc(t('ov.newClients'))}</div><div id="ov-new"><p class="muted">${t('more.loading')}</p></div></section>
    </div>`);
  $('ov-refresh').addEventListener('click', loadOverview);
  loadOverview();
}

async function loadOverview() {
  const tEl = $('ov-traffic'), nEl = $('ov-new'), meta = $('ov-meta');
  if (!tEl || !nEl) return;
  const loading = `<p class="muted">${t('more.loading')}</p>`;
  tEl.innerHTML = loading; nEl.innerHTML = loading;
  if (meta) meta.textContent = '';
  const pid = Number(S.projectId);
  const gwOk = typeof GwApi !== 'undefined' && GwApi.loggedIn();
  const ssoOk = typeof Api !== 'undefined' && Api.ssoLoggedIn();

  // Traffic: gateway flow table.
  let agg = [];
  if (gwOk) {
    try {
      const { flows } = await GwApi.flowTable();
      agg = aggFlowsByClient(flows);
    } catch (e) { /* section falls back to the no-data note */ }
  }

  // Clients: portal list for names + voucher attribution. Reuses the cached
  // voucher map (never forced) — same rule as Online Clients v1.5.132.
  let list = [], viaPortal = false, vmap = new Map();
  if (ssoOk) {
    try {
      let hasAuth = null;
      try { hasAuth = await Api.portalAuthStatus(pid); } catch (e) { hasAuth = null; }
      list = await Api.portalClients(pid, { pageSize: 1000, authCount: hasAuth !== false, connectType: '' }) || [];
      viaPortal = true;
    } catch (e) { list = []; }
    try { vmap = await apClientVoucherMap(pid, false); } catch (e) { /* voucher enrichment optional */ }
  }

  // IP → {name, voucher} for traffic-ranking labels.
  const ipInfo = new Map();
  list.forEach(c => {
    const f = mcFields(c, viaPortal, vmap);
    const ip = String(f.ip || '').trim();
    if (ip && ip !== '—' && !ipInfo.has(ip)) {
      ipInfo.set(ip, { name: f.name && f.name !== '—' ? f.name : ip, voucher: f.acct || '' });
    }
  });
  renderOvTraffic(tEl, agg, ipInfo, gwOk);

  // Newly connected: voucher users only, newest first.
  const voucherClients = list
    .map(c => ({ c, f: mcFields(c, viaPortal, vmap), ts: Number(c.onlineTime) || 0 }))
    .filter(x => x.f.acct)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8);
  renderOvNew(nEl, voucherClients, ssoOk);

  if (meta) meta.textContent = tx('ov.updated', { time: fmtTime(Date.now()) });
}

function renderOvTraffic(el, agg, ipInfo, gwOk) {
  if (!agg.length) { el.innerHTML = `<p class="muted">${esc(t(gwOk ? 'ov.noTraffic' : 'mt.hint'))}</p>`; return; }
  const topTotal = agg[0].upBytes + agg[0].downBytes;
  el.innerHTML = agg.slice(0, 10).map(c => {
    const total = c.upBytes + c.downBytes;
    const pct = topTotal > 0 ? Math.max(3, Math.round(total / topTotal * 100)) : 0;
    const info = ipInfo.get(c.ip) || {};
    const name = info.name || c.ip;
    const sub = [c.ip, info.voucher ? `${t('ov.voucher')}: ${info.voucher}` : ''].filter(Boolean).join(' · ');
    return `<div class="ov-rank">
      <div class="ov-rank-top"><span class="ov-rank-name">${esc(name)}</span><span class="ov-rank-bytes">${esc(fmtBytes(total))}</span></div>
      <div class="ov-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="ov-fill" style="width:${pct}%"></div></div>
      <div class="ov-rank-sub">${esc(sub)}</div>
    </div>`;
  }).join('') + `<p class="muted small">${esc(t('mt.cumNote'))}</p>`;
}

function renderOvNew(el, items, ssoOk) {
  if (!ssoOk) { el.innerHTML = `<p class="muted small">${esc(t('ov.needSso'))}</p>`; return; }
  if (!items.length) { el.innerHTML = `<p class="muted">${esc(t('ov.noNew'))}</p>`; return; }
  el.innerHTML = items.map(({ c, f }) => {
    const band = String(c.band || '').trim();
    const sub = [f.dev && f.dev !== '—' ? f.dev : '', f.since && f.since !== '—' ? f.since : ''].filter(Boolean).join(' · ');
    return `<div class="ov-new">
      <div class="ov-new-top"><span class="ov-new-name">${esc(f.name && f.name !== '—' ? f.name : f.mac)}</span><span class="chip ok">${esc(f.acct)}</span></div>
      ${sub ? `<div class="ov-new-sub">${esc(sub)}</div>` : ''}
      ${band ? `<div class="ov-new-band">${ic('signal', 'sm')}<span>${esc(band)}</span></div>` : ''}
    </div>`;
  }).join('');
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
  // v1.5.76: open-API fallback rows carry real traffic fields (flowUp/
  // flowDown, upRate/downRate) — surface them instead of '—'. Portal rows
  // keep their combined flowUpDown; gateway-merged rows stay '—'.
  const total = viaPortal ? fmtBytes(c.flowUpDown)
    : (() => {
        const parts = [];
        const d = fmtBytes(c.flowDown), u = fmtBytes(c.flowUp);
        if (d !== '—') parts.push('↓ ' + d);
        if (u !== '—') parts.push('↑ ' + u);
        return parts.length ? parts.join(' · ') : '—';
      })();
  const live = ((c.downRate == null || c.downRate === '') && (c.upRate == null || c.upRate === ''))
    ? '—' : [fmtRate(c.downRate), fmtRate(c.upRate)].join(' / ');
  return { mac, ip, name, acct, authType, ssid, ap, since, dur: fmtDur(durMs), sig, total, live, dev, conn,
    // v1.5.96: VLAN label derived from the client IP subnet (verified
    // gateway DHCP config) — '' when unknown, never guessed.
    vlan: String(c.vlan || vlanFromIp(c.userIp || c.ip || '') || '') };
};

/* v1.5.76: normalized line-quality signals for one Online-Clients record.
 * Pure and unit-testable. Field names verified against the open-API doc
 * (sta_users carries rssi, pktLoseRate, upRate, downRate, flowUp, flowDown)
 * and the portal GLOBAL_USERS capture (rssi, flowUpDown, upRate, downRate).
 * pktLoseRate is an integer with no documented unit — surfaced raw and
 * flagged only when unambiguously high. Missing → null, never fabricated. */
const mcQuality = (c, viaPortal) => {
  c = c || {};
  const num = v => (v === '' || v == null || !Number.isFinite(Number(v))) ? null : Number(v);
  const rssi = num(c.rssi);
  const down = num(c.downRate), up = num(c.upRate);
  let tDown = null, tUp = null, tComb = null;
  if (viaPortal) tComb = num(c.flowUpDown);
  else { tDown = num(c.flowDown); tUp = num(c.flowUp); }
  const loss = num(c.pktLoseRate); // open-API only; unit undocumented
  return { rssi, down, up, tDown, tUp, tComb, loss };
};
/* v1.5.76: per-row quality flags from normalized signals. Pure. A weak
 * (-80 dBm or worse) client drags its whole radio cell down to low PHY
 * rates, so it is worth a review/kick; packet loss is flagged only at
 * levels that are bad under any unit interpretation. */
const mcQualityFlags = q => {
  const fl = [];
  if (q.rssi != null && q.rssi <= -80) fl.push('weaksig');
  if (q.loss != null && q.loss >= 10) fl.push('highloss');
  return fl;
};
/* v1.5.76: indices of the heaviest transferrers in the list — rows carrying
 * at least half of the single heaviest total. Pure and unit-testable. */
const topTalkerIdx = (list, viaPortal) => {
  const bytes = (list || []).map(c => {
    const q = mcQuality(c, viaPortal);
    return (q.tDown || 0) + (q.tUp || 0) + (q.tComb || 0);
  });
  const mx = Math.max(0, ...bytes);
  if (mx <= 0) return new Set();
  const s = new Set();
  bytes.forEach((b, i) => { if (b >= mx * 0.5) s.add(i); });
  return s;
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

/* v1.5.66: hours fully spent — the hour-voucher twin of voucherQuotaGone.
 * Missing usedTime → not "gone" (never guess). */
function voucherHoursGone(v) {
  const p = Number(v && v.timePeriod) || 0, ut = Number(v && v.usedTime) || 0;
  return p > 0 && ut >= p;
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

/* ── Per-AP clients · v1.5.22 ── */
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

/* ═══════════ v1.5.61 · client kick (sticky clients) ═══════════
   Two UX forms ship now: (a) Settings auto-kick toggle, (b) per-client
   Disconnect button on sticky rows. The wire format is VERIFIED — captured
   from the live Ruijie portal's own Disconnect button (Chrome DevTools,
   2026-09-29): POST .../webproxy/common/api?/samTransfer/kick/user/offline
   with params {group_id, account, auth_type, mac (dotted), id}.
   requestKick() resolves the portal auth record (portalAuthUsers) for the
   exact account/mac/id triple the portal itself uses — never guessed.
   Disconnect only; the voucher is never deleted. Field test pending on the
   user's authorized test client. */
const KICK_VERIFIED = true;
/* v1.5.62: kicked-device marks — a manual or auto kick leaves a visible
 * "kicked" badge on the row, so the user can tell it was kicked even while
 * the portal's online list still shows it (portal cache lags 30-60s).
 * Marks persist with a timestamp and expire after 24h. The same timestamp
 * doubles as the auto-kick cooldown: a client kicked (manually or auto)
 * within KICK_AUTO_COOLDOWN is not auto-kicked again — this also prevents
 * a kick → refresh → still-sticky → kick loop. */
const KICK_MARK_TTL = 24 * 3600 * 1000;
const KICK_AUTO_COOLDOWN = 5 * 60 * 1000;
function kickedMarks() {
  let m = null;
  try { m = Store.load().kicked || {}; } catch (e) { m = {}; }
  return (m && typeof m === 'object') ? m : {};
}
function kickedAt(mac) {
  const k = normMac(mac || '');
  if (!k) return 0;
  const ts = Number(kickedMarks()[k] || 0);
  if (!ts || Date.now() - ts > KICK_MARK_TTL) return 0;
  return ts;
}
function markKicked(c) {
  const k = normMac((c && (c.mac || c.userMac)) || '');
  if (!k) return;
  const m = kickedMarks();
  m[k] = Date.now();
  try { Store.save({ kicked: m }); } catch (e) {}
}
/* v1.5.66: voucher-level kick marks. markKicked() tracks the client MAC
 * (Online-Clients badge + auto-kick cooldown); kickedVouchers tracks the
 * VOUCHER CODE so the voucher list moves a kicked voucher straight to
 * "Expired" — auto or manual, per user decision. Same 24h TTL. */
function kickedVoucherMarks() {
  let m = null;
  try { m = Store.load().kickedVouchers || {}; } catch (e) { m = {}; }
  return (m && typeof m === 'object') ? m : {};
}
function voucherKicked(v) {
  const code = String(vCode(v) || '').trim();
  if (!code) return false;
  const ts = Number(kickedVoucherMarks()[code] || 0);
  return !!ts && (Date.now() - ts <= KICK_MARK_TTL);
}
function markKickedVoucher(code) {
  code = String(code || '').trim();
  if (!code) return;
  const m = kickedVoucherMarks();
  m[code] = Date.now();
  try { Store.save({ kickedVouchers: m }); } catch (e) {}
}
/* v1.5.74: warn before Disconnect when the voucher still has quota or time
 * left. Only claims what is known: quota>0 and not fully spent, or
 * timePeriod>0 and not fully used. Unlimited/missing fields → no claim. */
function kickRemainWarning(v) {
  if (!v) return '';
  const parts = [];
  if ((Number(v.quota) || 0) > 0 && !voucherQuotaGone(v)) parts.push(t('kick.warnQuota'));
  if ((Number(v.timePeriod) || 0) > 0 && !voucherHoursGone(v)) parts.push(t('kick.warnTime'));
  if (!parts.length) return '';
  return tx('kick.warnRemain', { parts: parts.join('၊ ') });
}

/* ═══════════ v1.5.75 · Telemetry: app → proxy event inbox ═══════════
 * The app reports lifecycle/error events to the proxy's /telemetry endpoint
 * so a monitoring agent can poll them and alert the owner. Best-effort:
 * events queue in localStorage (max 120) and flush when the proxy is
 * reachable. NEVER log secrets — only event types, voucher codes, counts
 * and error messages. Toggle in Settings → စစ်ဆေးမှုများ (default ON). */
const Tele = {
  q: [],
  lastErrAt: 0,
  load() {
    try { this.q = JSON.parse(localStorage.getItem('rv-tele') || '[]'); }
    catch (e) { this.q = []; }
    if (!Array.isArray(this.q)) this.q = [];
  },
  save() { try { localStorage.setItem('rv-tele', JSON.stringify(this.q.slice(-120))); } catch (e) {} },
  on() { try { return Store.load().teleOn !== false; } catch (e) { return true; } },
  log(type, msg, data) {
    if (!this.on()) return;
    this.q.push({
      ts: Date.now(), app: APP_VERSION,
      type: String(type).slice(0, 48), msg: String(msg || '').slice(0, 300),
      data: data || undefined,
    });
    if (this.q.length > 120) this.q.splice(0, this.q.length - 120);
    this.save();
  },
  err(msg) { // js.error is rate-limited: max 1 per minute (no spam loops)
    const now = Date.now();
    if (now - this.lastErrAt < 60000) return;
    this.lastErrAt = now;
    this.log('js.error', msg);
  },
  proxyBase() {
    try { return (Store.load().proxy || '').replace(/\/+$/, '') || null; }
    catch (e) { return null; }
  },
  async flush() {
    if (!this.on() || !this.q.length) return;
    const base = this.proxyBase();
    if (!base || !window.fetch) return;
    const batch = this.q.slice(0, 40);
    try {
      const r = await fetch(base + '/telemetry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
      if (!r.ok) return;
      this.q.splice(0, batch.length);
      this.save();
    } catch (e) { /* offline — keep queued for next time */ }
  },
};

/* ═══════════ v1.5.75 · Learn: per-package usage averages (fee-free) ═══════════
 * The app remembers how long each package type actually lasts (running
 * averages in localStorage — no network, no AI service, no fee) and flags
 * vouchers burning far faster than their package average. A "completed"
 * voucher = quota fully spent OR time fully used; anything else (date
 * expiry, manual kick) teaches nothing and is skipped. */
const Learn = {
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem('rv-learn') || '{"pkg":{},"done":{}}'); }
    catch (e) { this.data = { pkg: {}, done: {} }; }
    if (!this.data || !this.data.pkg) this.data = { pkg: {}, done: {} };
    if (!this.data.done) this.data.done = {};
  },
  save() { try { localStorage.setItem('rv-learn', JSON.stringify(this.data)); } catch (e) {} },
  key(v) {
    const q = Number(v && v.quota) || 0, p = Number(v && v.timePeriod) || 0;
    return (q || p) ? q + 'MB/' + p + 'm' : '';
  },
  record(v) {
    if (!this.data) this.load();
    const code = vCode(v);
    if (!code || this.data.done[code]) return;
    if (!voucherQuotaGone(v) && !voucherHoursGone(v)) return; // not consumed — nothing to learn
    const k = this.key(v);
    if (!k) return;
    const hours = (Number(v.usedTime) || 0) / 60;
    const mb = Number(v.usedQuota) || 0;
    if (hours <= 0 && mb <= 0) return;
    this.data.done[code] = 1;
    const s = this.data.pkg[k] || (this.data.pkg[k] = { n: 0, hours: 0, mb: 0 });
    s.n++; s.hours += hours; s.mb += mb;
    const dk = Object.keys(this.data.done);
    if (dk.length > 500) for (const x of dk.slice(0, dk.length - 500)) delete this.data.done[x];
    this.save();
  },
  avg(v) {
    if (!this.data) this.load();
    const s = this.data.pkg[this.key(v)];
    if (!s || s.n < 2) return null;
    return { n: s.n, hours: s.hours / s.n, mb: s.mb / s.n };
  },
  fastBurn(v) {
    const a = this.avg(v);
    if (!a || a.hours <= 0) return false;
    const at = voucherActivatedTime(v);
    if (!at) return false;
    const elapsedH = (Date.now() - at) / 3600000;
    if (elapsedH < 0.5) return false; // too early to judge
    const mb = Number(v.usedQuota) || 0, q = Number(v.quota) || 0;
    if (q > 0 && mb < q * 0.1) return false; // under 10% used — not alarming
    if (elapsedH <= 0 || mb <= 0) return false;
    const avgRate = a.mb / a.hours; // MB per hour, typical
    return avgRate > 0 && (mb / elapsedH) > 2 * avgRate;
  },
};
function learnAvgTxt(v) {
  const a = Learn.avg(v);
  if (!a) return '—';
  const h = a.hours >= 1 ? (Math.round(a.hours * 10) / 10) + ' h' : Math.max(1, Math.round(a.hours * 60)) + ' min';
  return `${h} · ${fmtQuota(Math.round(a.mb))} (${a.n})`;
}
/* v1.5.66: effective status for filters, dashboard stats and row badges.
 * Cloud status lags reality: a voucher whose data quota is fully spent or
 * whose hours are used up can still report status 2 ("in use"), and a
 * freshly kicked voucher stays status 2 until Cloud catches up. Per user
 * decision such vouchers are effectively expired — never shown under
 * "In use", always under "Expired". Pure JS logic: identical on phone and
 * tablet, no layout dependency. */
function vEffStatus(v) {
  if (String(v && v.status) === '3' || voucherQuotaGone(v) || voucherHoursGone(v) || voucherKicked(v)) return '3';
  return String(v && v.status);
}
function autoKickDue(c) {
  const k = normMac((c && (c.mac || c.userMac)) || '');
  if (!k) return false;
  const last = Number(kickedMarks()[k] || 0);
  return !last || (Date.now() - last > KICK_AUTO_COOLDOWN);
}
/* Find the portal auth record for a client: prefer the voucher account
 * match, fall back to MAC. Returns the raw record or null. */
async function kickAuthRecord(c) {
  const pid = Number(S.projectId);
  let recs = [];
  try { recs = await Api.portalAuthUsers(pid); } catch (e) { return null; }
  const acct = String((c && (c.account || '')) || '').trim();
  const mac = normMac(c && (c.mac || c.userMac || ''));
  let rec = acct ? recs.find(r => String(r.account || '').trim() === acct) : null;
  if (!rec && mac) rec = recs.find(r => normMac(r.userMac) === mac);
  return rec || null;
}
async function requestKick(c, opts) {
  opts = opts || {};
  if (!KICK_VERIFIED) {
    if (!opts.auto) toast(t('kick.pending'), true);
    return false;
  }
  if (!Api.ssoLoggedIn()) {
    if (!opts.auto) toast(t('ac.needSso'), true);
    return false;
  }
  const rec = await kickAuthRecord(c);
  if (!rec || !rec.id || !rec.account) {
    if (!opts.auto) toast(t('kick.norecord'), true);
    return false;
  }
  try {
    await Api.clientKickSso(Number(S.projectId), {
      account: rec.account,
      authType: rec.authType,
      userMac: dottedMac(rec.userMac) || String(rec.userMac || '').toLowerCase(),
      id: rec.id,
    });
  } catch (e) {
    if (!opts.auto) toast(String((e && e.message) || e || ''), true);
    // v1.5.75: report kick failures for monitoring
    Tele.log('kick.failed', String((e && e.message) || e || '').slice(0, 200), { code: rec.account, auto: !!opts.auto });
    Tele.flush();
    return false;
  }
  if (!opts.auto) toast(t('kick.done'));
  // v1.5.62: mark the row and re-render locally — no list wipe, no white
  // flash. The portal list lags 30-60s anyway, so an immediate refetch
  // would just show the same stale rows.
  markKicked(c);
  // v1.5.66: move the voucher straight to "Expired" (auto or manual kick).
  // rec.account is the voucher code for voucher-auth clients; for other
  // auth types the mark simply never matches a voucher — harmless.
  markKickedVoucher(rec.account);
  // v1.5.75: report kicks for monitoring
  Tele.log('kick.done', '', { code: rec.account, auto: !!opts.auto });
  Tele.flush();
  try { if (mcCache) renderMcList(); } catch (e) { /* best-effort */ }
  return true;
}
async function kickStickyClient(c) {
  const mac = c && (c.mac || c.userMac);
  if (!mac) return;
  const v = (S.vouchers || []).find(x => vCode(x) === String((c && c.account) || '').trim());
  const w = kickRemainWarning(v);
  if (!(await iosConfirm(w || t('kick.confirm'), '', t('kick.kick'), t('a.cancel'), true))) return;
  requestKick(c, { auto: false });
}
/* ── Portal MAC block / unblock (manual, v1.5.95) ────────────────
 * v1.5.115: blocked state = LOCAL list (Store.blockedMacs) UNION the
 * portal's deny-list (S.portalBlockedMacs, fetched via SSO when online
 * clients load). So a MAC blocked from ANY phone shows as blocked here.
 * v1.5.117: the Blocked tab renders the DENY-LIST itself (getBlockedMacList),
 * not a filter over online clients — a blocked MAC is denied by the portal
 * MAC filter, so it never appears in the online list and the old filter
 * design showed "Blocked (0)" forever. The portal READ
 * (GET /homescene/mac_filter/{gid}) is portal-verified 2026-10-01;
 * clientBlocklistSso never throws and returns null on any failure, in
 * which case the local list stands alone. */
function isMacBlocked(mac) {
  const h = normMac(mac);
  if (!h) return false;
  const list = (Store.load() || {}).blockedMacs || [];
  if (Array.isArray(list) && list.includes(h)) return true;
  const pb = S.portalBlockedMacs;
  return !!(pb && pb.has(h));
}
/** The shared Blocked list: local list UNION portal deny-list, deduped,
 * normalized (bare uppercase hex), sorted. Pure-ish (reads Store + S). */
function getBlockedMacList() {
  const seen = new Set();
  const out = [];
  const push = m => {
    const h = normMac(m);
    if (h && h.length === 12 && !seen.has(h)) { seen.add(h); out.push(h); }
  };
  const st = Store.load() || {};
  (Array.isArray(st.blockedMacs) ? st.blockedMacs : []).forEach(push);
  const pb = S.portalBlockedMacs;
  if (pb && typeof pb.forEach === 'function') pb.forEach(push);
  out.sort();
  return out;
}
/** Where a blocked MAC came from: 'local', 'portal', or 'both'. */
function blockedMacSource(h) {
  const st = Store.load() || {};
  const local = Array.isArray(st.blockedMacs) && st.blockedMacs.map(normMac).includes(h);
  const pb = S.portalBlockedMacs;
  const portal = !!(pb && pb.has(h));
  if (local && portal) return 'both';
  if (portal) return 'portal';
  return 'local';
}
/** Refresh the portal deny-list (best-effort, silent). */
async function refreshPortalBlocklist() {
  try {
    if (!Api.ssoLoggedIn()) return;
    const macs = await Api.clientBlocklistSso(Number(S.projectId));
    if (Array.isArray(macs)) {
      S.portalBlockedMacs = new Set(
        macs.map(m => normMac(m)).filter(Boolean));
      try { if (mcCache) renderMcList(); } catch (e) { /* best-effort */ }
    }
  } catch (e) { /* silent: local list stands alone */ }
}
function setMacBlocked(mac, blocked) {
  const h = normMac(mac);
  if (!h) return;
  const st = Store.load() || {};
  const list = Array.isArray(st.blockedMacs) ? st.blockedMacs.slice() : [];
  const i = list.indexOf(h);
  if (blocked && i < 0) list.push(h);
  if (!blocked && i >= 0) list.splice(i, 1);
  Store.save({ blockedMacs: list });
}
async function blockClient(c) {
  const mac = c && (c.mac || c.userMac);
  const cm = colonMac(mac);
  if (!cm) { toast(t('kick.norecord'), true); return; }
  if (!Api.ssoLoggedIn()) { toast(t('ac.needSso'), true); return; }
  if (!(await iosConfirm(t('block.confirm'), '', t('block.block'), t('a.cancel'), true))) return;
  try {
    await Api.clientBlockSso(Number(S.projectId), cm);
  } catch (e) {
    toast(String((e && e.message) || e || ''), true);
    return;
  }
  setMacBlocked(mac, true);
  toast(t('block.done'));
  try { refreshPortalBlocklist(); } catch (e) { /* best-effort */ }
  closeIosPicker();
  openMcDetail(c);
}
async function unblockClient(c) {
  const mac = c && (c.mac || c.userMac);
  const dm = dottedMac(mac);
  if (!dm) { toast(t('kick.norecord'), true); return; }
  if (!Api.ssoLoggedIn()) { toast(t('ac.needSso'), true); return; }
  if (!(await iosConfirm(t('unblock.confirm'), '', t('block.unblock'), t('a.cancel'), false))) return;
  try {
    await Api.clientUnblockSso(Number(S.projectId), dm);
  } catch (e) {
    toast(String((e && e.message) || e || ''), true);
    return;
  }
  setMacBlocked(mac, false);
  toast(t('unblock.done'));
  try { refreshPortalBlocklist(); } catch (e) { /* best-effort */ }
  closeIosPicker();
  openMcDetail(c);
}
/* ── v1.5.117: unblock a bare MAC from the Blocked tab ──
 * The MAC may not be online (usually isn't), so this takes the MAC itself
 * rather than a client object. Mirrors unblockClient's SSO DELETE flow. */
async function unblockMac(mac) {
  const h = normMac(mac);
  if (!h || h.length !== 12) return;
  if (!Api.ssoLoggedIn()) { toast(t('ac.needSso'), true); return; }
  if (!(await iosConfirm(t('unblock.confirm'), '', t('block.unblock'), t('a.cancel'), false))) return;
  try {
    await Api.clientUnblockSso(Number(S.projectId), dottedMac(h));
  } catch (e) {
    toast(String((e && e.message) || e || ''), true);
    return;
  }
  setMacBlocked(h, false);
  toast(t('unblock.done'));
  try { await refreshPortalBlocklist(); } catch (e) { /* best-effort */ }
  try { renderMcList(); } catch (e) { /* best-effort */ }
}
/* ── Background auto-kick (Android APK only, v1.5.66) ─────────
 * The Settings auto-kick toggle enables BOTH the in-app scan (while the
 * app is open) and the native JobScheduler job (screen off / app closed).
 * Kick goes through the SSO portal session — the voucher is never deleted. */
function hasAutoKickBg() {
  return !!(window.RuijieBridge && window.RuijieBridge.autoKickInfo);
}
/** Push the current Cloud connection into the background auto-kick. */
function syncAutoKickConfig() {
  if (!hasAutoKickBg()) return;
  try {
    const cfg = Api.cfg || Api.loadCfg();
    if (!cfg) return;
    window.RuijieBridge.autoKickSync(JSON.stringify({
      cloud: cfg.cloud || '', appid: cfg.appid || '',
      secret: cfg.secret || '', groupId: Number(S.projectId) || 0,
    }));
  } catch (e) {}
}
function refreshKickStatus() {
  const st = $('kick-status');
  if (!st) return;
  if (!hasAutoKickBg()) { // web build: in-app scan only
    st.textContent = t(KICK_VERIFIED ? 'kick.active' : 'kick.standby');
    return;
  }
  let info = {};
  try { info = JSON.parse(window.RuijieBridge.autoKickInfo()); } catch (e) {}
  const on = !!Store.load().kickAuto;
  st.textContent = !on ? t('kick.bgOff')
    : (!info.hasConfig ? t('kick.bgNoConfig')
    : (info.enabled && info.scheduled) ? t('kick.bgOn') : t('kick.bgSoon'));
}
function onKickToggle() {
  const tg = $('kick-auto');
  const on = !!(tg && tg.checked);
  Store.save({ kickAuto: on });
  if (hasAutoKickBg()) {
    try {
      if (on) {
        syncAutoKickConfig();
        window.RuijieBridge.monitorRequestPermission(); // same notif permission
      }
      window.RuijieBridge.autoKickSetEnabled(on);
    } catch (e) {}
    setTimeout(refreshKickStatus, 400);
  } else {
    refreshKickStatus();
  }
}
function initKickSettings() {
  const tg = $('kick-auto');
  // v1.5.116: configurable auto-kick interval (native, min 15 min).
  const iv = $('kick-interval');
  if (iv) {
    let cur = 15;
    if (hasAutoKickBg()) {
      try { cur = JSON.parse(window.RuijieBridge.autoKickInfo()).intervalMin || 15; } catch (e) {}
    }
    iv.value = cur;
    iv.addEventListener('change', () => {
      let m = Math.max(1, parseInt(iv.value, 10) || 15);
      iv.value = m;
      if (hasAutoKickBg()) {
        try { window.RuijieBridge.autoKickSetInterval(m); } catch (e) {}
      }
      Store.save({ kickIntervalMin: m });
      refreshKickStatus();
    });
  }
  if (tg) {
    tg.checked = !!Store.load().kickAuto;
    tg.addEventListener('change', onKickToggle);
  }
  // voucher VLAN for scoping the "suspicious" flag — picked from the
  // Ruijie Cloud WLAN list; the captive-portal VLAN is auto-selected.
  const vs = $('kick-vlan');
  if (vs) {
    enhanceIosPicker(vs);
    vs.addEventListener('change', () => {
      Store.save({ voucherVlan: vs.value });
      renderMcList();
    });
    ensureVlanOptions();
  }
  refreshKickStatus();
}
/* Populate the Voucher VLAN picker from the Ruijie Cloud WLAN list.
 * Auto-selects the captive-portal VLAN when the user hasn't chosen one. */
async function ensureVlanOptions() {
  const sel = $('kick-vlan');
  if (!sel) return;
  let list = S.ssidList || [];
  if (!list.length && S.projectId && Api.ssoLoggedIn()) {
    try { list = (await Api.ssidListSso(S.projectId)).list || []; S.ssidList = list; }
    catch (e) { list = []; }
  }
  const seen = new Map();
  list.forEach(s => {
    const v = String(s && s.vlanId !== undefined && s.vlanId !== null ? s.vlanId : '').trim();
    if (!v || seen.has(v)) return;
    seen.set(v, s.ssidName || '');
  });
  const det = detectVoucherVlan(list);
  let cur = voucherVlan(Store.load());
  if (!cur) {
    // migrate: previously typed SSID -> its VLAN from the WLAN list
    const oldSsid = String(Store.load().voucherSsid || '').trim().toLowerCase();
    if (oldSsid) {
      const hit = list.find(s => String(s.ssidName || '').trim().toLowerCase() === oldSsid);
      const hv = hit ? String(hit.vlanId !== undefined && hit.vlanId !== null ? hit.vlanId : '').trim() : '';
      if (hv) cur = hv;
    }
  }
  if (!cur && det) { cur = det; }
  if (cur) { try { Store.save({ voucherVlan: cur }); } catch (e) {} }
  const opts = Array.from(seen.entries()).map(([v, nm]) =>
    `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>VLAN ${esc(v)}` +
    `${nm ? ' — ' + esc(nm) : ''}${v === det ? ' (captive portal)' : ''}</option>`).join('');
  sel.innerHTML = (cur && !seen.has(cur)
    ? `<option value="${esc(cur)}" selected>VLAN ${esc(cur)}</option>` : '') +
    (opts || `<option value="">—</option>`);
  try { syncIosPickerBtn(sel); } catch (e) {}
}
// v1.5.75: monitoring toggle (Settings → စစ်ဆေးမှုများ)
function initTeleSettings() {
  const tg = $('tele-on');
  if (tg) {
    tg.checked = Store.load().teleOn !== false;
    tg.addEventListener('change', () => {
      Store.save({ teleOn: tg.checked });
      if (tg.checked) { Tele.log('monitor.on', 'monitoring enabled'); Tele.flush(); }
    });
  }
}

/* ═══════════ IN-APP UPDATE (APK only) ═══════════
 * Version source: GitHub releases/latest for ruijie-voucher-app.
 * - "Check for updates" button: manual check -> confirm -> DownloadManager
 *   download -> prompt install.
 * - Auto-download toggle (updateAutoDl, synced): on startup, quietly check;
 *   a newer release downloads in the background and toasts "tap to install".
 * Web build never needs this (GitHub Pages serves the latest instantly). */
const UPD_REPO = 'praythein1994-cpu/ruijie-voucher-app';
function updBridge() {
  const B = window.RuijieBridge;
  return (B && B.appVersion) ? B : null;
}
function updCurVersion() {
  try {
    const v = JSON.parse(updBridge().appVersion() || '{}');
    return { name: String(v.versionName || ''), code: Number(v.versionCode) || 0 };
  } catch (e) { return { name: '', code: 0 }; }
}
function cmpVersions(a, b) {
  const pa = String(a || '').replace(/^[vV]/, '').split('.').map(x => Number(x) || 0);
  const pb = String(b || '').replace(/^[vV]/, '').split('.').map(x => Number(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
async function updLatestRelease() {
  const r = await fetch('https://api.github.com/repos/' + UPD_REPO + '/releases/latest', {
    headers: { 'Accept': 'application/vnd.github+json' },
  });
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  const tag = String(j.tag_name || '').trim();
  const apk = (j.assets || []).find(a => /\.apk$/i.test(String(a.name || '')));
  if (!tag || !apk || !apk.browser_download_url) throw new Error('no-apk');
  /* v1.5.137: capture the release notes too — the UPDATE Ready card shows
   * them in an expandable "what's new" section. */
  return { tag, name: String(apk.name || 'update.apk'), url: apk.browser_download_url,
           notes: String(j.body || '').trim() };
}
function updSetStatus(msg) {
  const el = $('upd-status');
  if (el) el.textContent = msg || '';
}
/* v1.5.133: persistent "ready to install" state. The downloaded APK's
 * DownloadManager id is kept in raw localStorage (device-local, never
 * synced) so the Install button survives dialog dismissal and app
 * restarts — previously the only install path was a one-time dialog. */
function updPendingLoad() {
  try { return JSON.parse(localStorage.getItem('updPending') || 'null'); } catch (e) { return null; }
}
function updPendingSave(p) {
  try { localStorage.setItem('updPending', JSON.stringify(p)); } catch (e) {}
}
function updPendingClear() {
  try { localStorage.removeItem('updPending'); } catch (e) {}
}
/* 'ready'   = APK on disk and newer than the current build
 * 'waiting' = download still in progress (e.g. survived an app restart)
 * 'gone'    = stale record (already installed / file missing / failed)
 * 'none'    = nothing pending */
function updPendingState() {
  const p = updPendingLoad();
  if (!p || !p.id) return 'none';
  const cur = updCurVersion();
  if (p.tag && cmpVersions(p.tag, cur.name) <= 0) return 'gone'; // already installed
  const B = updBridge();
  if (!B) return 'none';
  let q = null;
  try { q = JSON.parse(B.updateQuery(Number(p.id)) || '{}'); } catch (e) {}
  if (!q) return 'none';
  if (q.status === 'success') return 'ready';
  if (q.status === 'running' || q.status === 'paused' || q.status === 'pending') return 'waiting';
  return 'gone';
}
function updRefreshInstallUI() {
  const row = $('upd-install-row');
  if (!row) return;
  const st = updPendingState();
  if (st === 'gone') updPendingClear();
  if (st === 'waiting') {
    // Download survived an app restart — resume watching it to completion.
    const p = updPendingLoad();
    updDlShow(p && p.tag ? p.tag : ''); // v1.5.139: ring visible if user opens Settings mid-download
    if (p && p.tag) updPollDownload(Number(p.id), (ok, id) => updOnDownloadDone({ tag: p.tag, name: p.name, notes: p.notes }, ok, id));
  } else {
    updDlHide(); // v1.5.139: no download running — ring stays out of the way
  }
  if (st === 'ready') {
    row.hidden = false;
    /* v1.5.137: UPDATE Ready card — version line + collapsed-by-default
     * release notes (textContent only, never HTML). */
    const p = updPendingLoad();
    const ver = $('upd-ready-ver');
    if (ver) ver.textContent = (p && p.tag) ? p.tag : '';
    const notes = $('upd-ready-notes');
    if (notes) notes.textContent = (p && p.notes) ? p.notes : t('upd.noNotes');
  } else {
    row.hidden = true;
  }
}
/* Shared download-completion handler: persist, show the Install button,
 * post a system notification, and offer immediate install. */
function updOnDownloadDone(rel, ok, id) {
  if (ok) {
    updPendingSave({ id, tag: rel.tag, name: rel.name, notes: rel.notes || '' });
    updSetStatus(t('upd.downloaded'));
    updRefreshInstallUI();
    updBannerShow(rel.tag, true); // v1.5.138: banner upgrades to UPDATE Ready
    updDlDone(); // v1.5.139: ring celebrates, then the UPDATE Ready card takes over
    try {
      const B2 = updBridge();
      if (B2 && B2.updateNotify) B2.updateNotify(t('upd.notiTitle'), tx('upd.notiText', { v: rel.tag }));
    } catch (e) {}
    // v1.5.144: no immediate install prompt here — the UPDATE Ready card
    // (with its Update Now button + v1.5.140 pre-install guide) is the flow.
  } else {
    updPendingClear();
    updRefreshInstallUI();
    updDlHide(); // v1.5.139
    updSetStatus('');
    toast(t('upd.failed'), true);
  }
}
let updPollTimer = null;
function updPollDownload(id, onDone) {
  if (updPollTimer) clearInterval(updPollTimer);
  updPollTimer = setInterval(() => {
    let q = null;
    try { q = JSON.parse(updBridge().updateQuery(Number(id)) || '{}'); } catch (e) {}
    if (!q) return;
    if (q.status === 'success') {
      clearInterval(updPollTimer); updPollTimer = null;
      if (onDone) onDone(true, id);
    } else if (q.status === 'failed' || q.status === 'error' || q.status === 'unknown') {
      clearInterval(updPollTimer); updPollTimer = null;
      if (onDone) onDone(false, id);
    } else {
      const p = q.total > 0 ? Math.round(100 * q.soFar / q.total) : 0;
      updSetStatus(tx('upd.downloading', { p }));
      updDlProgress(p); // v1.5.139: premium ring follows the download
    }
  }, 1000);
}
async function updInstallApk(id) {
  const B = updBridge();
  if (!B) return;
  try {
    if (!B.updateCanInstall()) {
      toast(t('upd.needPerm'), true);
      try { B.updateOpenInstallSettings(); } catch (e) {}
      return;
    }
  } catch (e) {}
  let r = null;
  try { r = JSON.parse(B.updateInstall(Number(id)) || '{}'); } catch (e) {}
  if (r && r.ok === false && r.message) toast(r.message, true);
}
function updStartDownload(rel, silent) {
  const B = updBridge();
  if (!B) return;
  let r = null;
  try { r = JSON.parse(B.updateDownload(rel.url, rel.name) || '{}'); } catch (e) {}
  if (!r || !r.ok) { if (!silent) toast(t('upd.failed'), true); return; }
  updPendingSave({ id: r.id, tag: rel.tag, name: rel.name, notes: rel.notes || '' }); // v1.5.133: persist early so a restart can resume watching
  updDlShow(rel.tag); // v1.5.139: premium progress ring
  updSetStatus(tx('upd.downloading', { p: 0 }));
  updPollDownload(r.id, (ok, id) => updOnDownloadDone(rel, ok, id));
}
async function checkAppUpdate(manual) {
  const B = updBridge();
  if (!B) { if (manual) toast(t('upd.apkOnly'), true); return null; }
  updRefreshInstallUI();
  // v1.5.133: never re-download what is already downloaded — offer install.
  if (updPendingState() === 'ready') {
    updSetStatus(t('upd.downloaded'));
    if (manual) toast(t('upd.downloaded'));
    return { state: 'ready' };
  }
  if (manual) updSetStatus(t('upd.checking'));
  try {
    const rel = await updLatestRelease();
    const cur = updCurVersion();
    if (cmpVersions(rel.tag, cur.name) <= 0) {
      if (manual) { updSetStatus(t('upd.latest')); toast(t('upd.latest')); }
      return { state: 'latest' };
    }
    if (manual) {
      updSetStatus('');
      // v1.5.171: GlassVPN-style — show update card instead of dialog
      updShowAvail(rel);
      return { state: 'manual', tag: rel.tag };
    }
    // auto-download mode: fetch quietly in the background
    updStartDownload(rel, true);
    return { state: 'started', tag: rel.tag }; // v1.5.138: watcher shows the banner
  } catch (e) {
    if (manual) { updSetStatus(''); toast(t('upd.netErr'), true); }
    else updSetStatus(t('upd.checkFail')); // v1.5.133: auto mode no longer fully silent
    return null;
  }
}
/* v1.5.171: GlassVPN-style update available card */
function updShowAvail(rel) {
  const card = $('upd-avail');
  if (!card) return;
  const ver = $('upd-avail-ver');
  if (ver) ver.textContent = rel.tag || '';
  const notes = $('upd-avail-notes');
  if (notes) notes.textContent = (rel.notes || '').trim() || t('upd.noNotes');
  card.hidden = false;
  const btn = $('upd-dl-btn');
  if (btn) {
    btn.onclick = () => {
      card.hidden = true;
      updStartDownload(rel, false);
    };
  }
  // Hide the bar if it was showing from a previous download
  const bw = $('upd-bar-wrap');
  if (bw) bw.hidden = true;
}
/* ═══════════ v1.5.138: LIVE UPDATE BANNER + AUTO-DETECT ═══════════
 * The app watches GitHub releases while it runs — a quiet check shortly
 * after startup, every 30 min after that, and when the app returns to the
 * foreground after a while. When a newer release appears a slim banner
 * shows under the header; tapping it jumps to Settings → App Update.
 * With auto-download on, the download still starts by itself and the
 * banner upgrades to "UPDATE Ready" when it finishes. */
function updBannerShow(tag, ready) {
  const b = $('upd-banner');
  if (!b) return;
  // A dismissed "new version" stays hidden this session — but an update
  // that is READY to install is always worth surfacing.
  try {
    if (!ready && sessionStorage.getItem('updBannerOff') === '1') return;
  } catch (e) {}
  const tel = $('upd-banner-text');
  if (tel) tel.textContent = ready ? tx('upd.bannerReady', { v: tag }) : tx('upd.bannerNew', { v: tag });
  b.hidden = false;
}
function updBannerHide() {
  const b = $('upd-banner');
  if (b) b.hidden = true;
}
function updBannerDismiss() {
  try { sessionStorage.setItem('updBannerOff', '1'); } catch (e) {}
  updBannerHide();
}
function updBannerGo() {
  try { switchView('view-settings', false); } catch (e) { return; }
  setTimeout(() => {
    const card = $('upd-card');
    if (!card) return;
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    card.classList.remove('upd-flash');
    void card.offsetWidth; // restart the animation
    card.classList.add('upd-flash');
    setTimeout(() => card.classList.remove('upd-flash'), 1900);
  }, 150);
}
/* Banner-only detection (auto-download toggle OFF): no download, just
 * surface the new version. */
async function updCheckBanner() {
  if (!updBridge()) return;
  if (updPendingState() === 'ready') {
    const p = updPendingLoad();
    updBannerShow(p && p.tag ? p.tag : '', true);
    return;
  }
  const cur = updCurVersion();
  if (!cur.name) return;
  try {
    const rel = await updLatestRelease();
    if (cmpVersions(rel.tag, cur.name) > 0) updBannerShow(rel.tag, false);
    else updBannerHide();
  } catch (e) {}
}
let updWatchTimer = null;
let updLastWatch = 0;
const UPD_WATCH_MS = 60 * 60 * 1000; // v1.5.153: re-check every 1 hour while the app runs (user request)
async function updWatchTick() {
  updLastWatch = Date.now();
  if (!updBridge()) return;
  if (updPendingState() === 'ready') {
    const p = updPendingLoad();
    updBannerShow(p && p.tag ? p.tag : '', true);
    return;
  }
  let r = null;
  if (Store.load().updateAutoDl) {
    try { r = await checkAppUpdate(false); } catch (e) { r = null; }
  }
  if (r && r.state === 'latest') { updBannerHide(); return; }
  if (r && r.tag) { updBannerShow(r.tag, false); return; } // auto mode: downloading
  updCheckBanner(); // toggle off (or check failed): banner-only detection
}
function updWatchStart() {
  if (!updBridge()) return;
  if (updWatchTimer) { clearInterval(updWatchTimer); updWatchTimer = null; }
  setTimeout(() => { try { updWatchTick(); } catch (e) {} }, 8000);
  updWatchTimer = setInterval(() => { try { updWatchTick(); } catch (e) {} }, UPD_WATCH_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - updLastWatch > UPD_WATCH_MS) {
      try { updWatchTick(); } catch (e) {}
    }
  });
}
/* ═══════════ v1.5.139: PREMIUM DOWNLOAD RING ═══════════
 * Circular progress ring (video reference): fills as the APK downloads,
 * % pill below, green check on completion. Shown in Settings → App Update
 * while a download runs — manual or auto. */
const UPD_RING_C = 188.5; // 2πr, r = 30
function updDlShow(tag) {
  const w = $('upd-dl');
  if (!w) return;
  w.hidden = false;
  const fg = $('upd-ring-fg');
  if (fg) { fg.classList.remove('done'); fg.style.strokeDashoffset = UPD_RING_C; }
  const ic = $('upd-ring-icon');
  if (ic) {
    ic.classList.remove('done');
    ic.innerHTML = '<svg class="ic" style="transform:rotate(180deg)"><use href="#i-up"/></svg>';
  }
  const pct = $('upd-dl-pct');
  if (pct) { pct.classList.remove('done'); pct.textContent = '0%'; }
  const lb = $('upd-dl-label');
  if (lb) lb.textContent = tag || '';
}
function updDlProgress(p) {
  const pct = $('upd-dl-pct');
  if (pct) pct.textContent = Math.round(p) + '%';
  const fg = $('upd-ring-fg');
  if (fg) fg.style.strokeDashoffset = UPD_RING_C * (1 - Math.min(100, Math.max(0, p)) / 100);
  // v1.5.171: GlassVPN-style horizontal bar
  const bw = $('upd-bar-wrap');
  if (bw) bw.hidden = false;
  const bl = $('upd-bar-label');
  if (bl) bl.textContent = tx('upd.downloading', { p: Math.round(p) });
  const bf = $('upd-bar-fill');
  if (bf) bf.style.width = Math.min(100, Math.max(0, p)) + '%';
}
function updDlDone() {
  const w0 = $('upd-dl');
  if (w0) w0.hidden = false; // re-show for the celebration even if a refresh hid it
  updDlProgress(100);
  const fg = $('upd-ring-fg');
  if (fg) fg.classList.add('done');
  const ic = $('upd-ring-icon');
  if (ic) {
    ic.classList.add('done');
    ic.innerHTML = '<svg class="ic"><use href="#i-check"/></svg>';
  }
  const pct = $('upd-dl-pct');
  if (pct) pct.classList.add('done');
  setTimeout(() => updDlHide(), 1600); // celebrate, then the UPDATE Ready card takes over
}
function updDlHide() {
  const w = $('upd-dl');
  if (w) w.hidden = true;
}
/* ═══════════ v1.5.143: DEVICE INSTALL CONTROL ═══════════
 * The owner (Pray Thein) sees which devices installed the app, caps the
 * device count, can require approval for new installs, and blocks unknown
 * devices — More → App Devices (admin profile only).
 * Enforcement: a startup gate + a 30-min re-check while the app runs.
 * Offline: fail-open, except a cached 'blocked' status (fail-closed). */
const DEV_ADMIN = 'praythein';
function devProxyBase() {
  return ((Api.cfg && Api.cfg.proxy) || DEFAULT_PROXY).replace(/\/+$/, '');
}
function devGetInfo() {
  // Native bridge (APK): stable per-app ANDROID_ID + real model info.
  try {
    const B = window.RuijieBridge;
    if (B && B.deviceInfo) {
      const o = JSON.parse(B.deviceInfo() || '{}');
      if (o && o.id) return {
        id: String(o.id), model: String(o.model || ''),
        manufacturer: String(o.manufacturer || ''), android: String(o.android || ''),
        src: 'native',
      };
    }
  } catch (e) {}
  // Web / old APK fallback: persisted random UUID.
  let id = null;
  try { id = localStorage.getItem('devUuid'); } catch (e) {}
  if (!id) {
    id = 'web-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { localStorage.setItem('devUuid', id); } catch (e) {}
  }
  return { id, model: '', manufacturer: '', android: '', src: 'web' };
}
function devMyId() { return devGetInfo().id; }
function devIsAdmin() {
  try {
    return String(localStorage.getItem('rv_profile_name') || '').toLowerCase().replace(/\s+/g, '') === DEV_ADMIN;
  } catch (e) { return false; }
}
function devAdminProfile() {
  try { return localStorage.getItem('rv_profile_name') || ''; } catch (e) { return ''; }
}
function devLastProfile() {
  try { return localStorage.getItem('rv_profile_name') || ''; } catch (e) { return ''; }
}
async function devRegister() {
  const info = devGetInfo();
  const cur = updCurVersion();
  const r = await fetch(devProxyBase() + '/api/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      deviceId: info.id, model: info.model, manufacturer: info.manufacturer,
      android: info.android, appVersion: cur.name || '', profile: devLastProfile(), src: info.src,
    }),
  });
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  if (!j || !j.ok || !j.status) throw new Error('bad response');
  return j.status;
}
function devCacheGet() {
  try { return localStorage.getItem('devStatus') || ''; } catch (e) { return ''; }
}
function devCacheSet(s) {
  try { localStorage.setItem('devStatus', s); } catch (e) {}
}
/* Startup gate — returns true when the app may start. */
async function devStartupGate() {
  const info = devGetInfo();
  const cached = devCacheGet();
  if (cached === 'blocked') { devShowLock(info, 'blocked'); return false; }
  try {
    const st = await devRegister();
    devCacheSet(st);
    if (st === 'blocked') { devShowLock(info, 'blocked'); return false; }
    if (st === 'pending') { devShowLock(info, 'pending'); return false; }
    devHideLock();
    return true;
  } catch (e) {
    if (cached === 'pending') { devShowLock(info, 'pending'); return false; }
    return true; // offline / proxy down: fail open for unknown devices
  }
}
function devShowLock(info, kind) {
  const scr = $('view-devlock');
  if (!scr) return;
  const title = $('devlock-title'), msg = $('devlock-msg'), idEl = $('devlock-id');
  if (title) title.textContent = t(kind === 'blocked' ? 'dev.lockTitle' : 'dev.pendingTitle');
  if (msg) msg.textContent = t(kind === 'blocked' ? 'dev.lockMsg' : 'dev.pendingMsg');
  if (idEl) idEl.textContent = info.id;
  ['view-connect', 'view-profile', 'view-profile-new', 'app'].forEach(id => {
    const el = $(id); if (el) el.classList.add('hidden');
  });
  scr.classList.remove('hidden');
}
function devHideLock() {
  const scr = $('view-devlock');
  if (scr) scr.classList.add('hidden');
}
/* Re-check every 30 min while the app runs — a device blocked mid-session
 * gets locked out without needing a restart. */
let devCheckTimer = null;
function devWatchStart() {
  if (devCheckTimer) clearInterval(devCheckTimer);
  devCheckTimer = setInterval(async () => {
    try {
      const st = await devRegister();
      devCacheSet(st);
      if (st === 'blocked' || st === 'pending') devShowLock(devGetInfo(), st);
    } catch (e) {}
  }, 30 * 60 * 1000);
}
/* ── Admin: More → App Devices ── */
async function adApi(path, opts) {
  const r = await fetch(devProxyBase() + path, opts);
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.ok) throw new Error((j && j.msg) || ('http ' + r.status));
  return j;
}
function adFmtDate(ts) {
  try { return ts ? new Date(ts).toLocaleString() : '—'; } catch (e) { return '—'; }
}
async function moreAppDevices() {
  S.moreFn = moreAppDevices;
  moreShell(`${ic('lock', 'sm')} ${esc(t('m.appdevices'))}`,
    `<div class="set-group" id="ad-cfg"></div><div class="set-group" id="ad-list"><p class="muted" style="padding:12px 16px">${esc(t('more.loading'))}</p></div>`);
  await adRender();
}
async function adRender() {
  const listBox = $('ad-list'), cfgBox = $('ad-cfg');
  if (!listBox || !cfgBox) return;
  let j;
  try {
    j = await adApi('/api/devices/list?profile=' + encodeURIComponent(devAdminProfile()));
  } catch (e) {
    cfgBox.innerHTML = '';
    listBox.innerHTML = `<p class="err" style="padding:12px 16px">${esc(t('ad.loadFail'))}</p>`;
    return;
  }
  const cfg = j.config || { maxDevices: 10, requireApproval: false };
  const myId = devMyId();
  let maxN = cfg.maxDevices;
  cfgBox.innerHTML =
    `<div class="set-row"><div class="t"><div class="t-main">${esc(t('ad.maxDevices'))}</div>` +
    `<div class="sub">${esc(t('ad.maxDevicesSub'))}</div></div>` +
    `<div class="ad-stepper"><button type="button" id="ad-max-dec">−</button><b id="ad-max-n">${maxN}</b><button type="button" id="ad-max-inc">+</button></div></div>` +
    `<div class="set-row"><div class="t"><div class="t-main">${esc(t('ad.requireApproval'))}</div>` +
    `<div class="sub">${esc(t('ad.requireApprovalSub'))}</div></div>` +
    `<label class="switch"><input type="checkbox" id="ad-approval"${cfg.requireApproval ? ' checked' : ''}><span class="track"></span></label></div>`;
  const pushCfg = async () => {
    try {
      await adApi('/api/devices/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: devAdminProfile(), maxDevices: maxN, requireApproval: $('ad-approval').checked }),
      });
    } catch (e) { toast(t('ad.saveFail'), true); adRender(); }
  };
  const setMax = v => { maxN = Math.min(100, Math.max(1, v)); $('ad-max-n').textContent = maxN; };
  $('ad-max-dec').addEventListener('click', () => { setMax(maxN - 1); pushCfg(); });
  $('ad-max-inc').addEventListener('click', () => { setMax(maxN + 1); pushCfg(); });
  $('ad-approval').addEventListener('change', pushCfg);
  const rows = (j.devices || []).map(d => {
    const st = d.status || 'allowed';
    const chipKey = st === 'blocked' ? 'ad.blocked' : st === 'pending' ? 'ad.pending' : 'ad.allowed';
    const isMe = d.id === myId;
    const name = [d.manufacturer, d.model].filter(Boolean).join(' ') || t('ad.unknownDevice');
    const sub = [d.android ? 'Android ' + d.android : '', d.appVersion ? 'v' + d.appVersion : '', d.profile || '']
      .filter(Boolean).join(' · ');
    const actBtn = st === 'blocked'
      ? `<button type="button" class="btn small" data-ad="allow" data-id="${esc(d.id)}">${esc(t('ad.allow'))}</button>`
      : (st === 'pending'
        ? `<button type="button" class="btn small primary" data-ad="allow" data-id="${esc(d.id)}">${esc(t('ad.allow'))}</button>`
        : '') +
        (st !== 'blocked'
          ? `<button type="button" class="btn small danger-ghost" data-ad="block" data-id="${esc(d.id)}"${isMe ? ' disabled' : ''}>${esc(t('ad.block'))}</button>`
          : '');
    return `<div class="set-row"><div class="t"><div class="t-main">${esc(name)}${isMe ? ` <span class="ad-me">${esc(t('ad.thisDevice'))}</span>` : ''}</div>` +
      (sub ? `<div class="sub">${esc(sub)}</div>` : '') +
      `<div class="sub">${esc(t('ad.lastSeen'))}: ${esc(adFmtDate(d.lastSeen))}</div>` +
      `<div class="sub"><span class="ad-chip ${st}">${esc(t(chipKey))}</span> <code class="ad-id">${esc(String(d.id).slice(0, 14))}…</code></div></div>` +
      `<div class="ad-btns">${actBtn}</div></div>`;
  }).join('');
  listBox.innerHTML = rows || `<p class="muted" style="padding:12px 16px">${esc(t('ad.empty'))}</p>`;
  listBox.querySelectorAll('[data-ad]').forEach(b => b.addEventListener('click', async () => {
    const id = b.dataset.id, act = b.dataset.ad;
    if (act === 'block' && !(await iosConfirm(t('ad.confirmBlock'), '', t('ad.block'), t('a.cancel'), true))) return;
    b.disabled = true;
    try {
      await adApi('/api/devices/set', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: devAdminProfile(), deviceId: id, status: act === 'block' ? 'blocked' : 'allowed', by: myId }),
      });
      toast(t('ad.saved'));
    } catch (e) { toast(t('ad.saveFail'), true); }
    adRender();
  }));
}
function initUpdateSettings() {
  const B = updBridge();
  const card = $('upd-card');
  if (card && !B) card.style.display = 'none'; // web build: no updater needed
  // v1.5.171: show current version in GlassVPN-style header
  try {
    const cv = $('upd-cur-ver');
    if (cv && B) {
      const v = updCurVersion();
      if (v.name) cv.textContent = 'Version ' + v.name;
    }
  } catch (e) {}
  const tg = $('upd-auto');
  if (tg) {
    tg.checked = !!Store.load().updateAutoDl;
    tg.addEventListener('change', () => {
      Store.save({ updateAutoDl: tg.checked });
      if (tg.checked) {
        // v1.5.133: ask for the notification permission so the
        // "update downloaded" alert can actually appear.
        try { const B3 = updBridge(); if (B3 && B3.updateNotifRequest) B3.updateNotifRequest(); } catch (e) {}
        checkAppUpdate(false); // check right away when enabled
      }
    });
  }
  const btn = $('upd-check-btn');
  if (btn) btn.addEventListener('click', () => checkAppUpdate(true));
  const ibtn = $('upd-install-btn');
  if (ibtn) ibtn.addEventListener('click', async () => {
    const p = updPendingLoad();
    if (!(p && updPendingState() === 'ready')) {
      updPendingClear(); updRefreshInstallUI(); toast(t('upd.gone'), true); return;
    }
    // v1.5.140: pre-install guide — Play Protect / MIUI screens are explained
    // before the system installer opens (they cannot be bypassed by code).
    const go = await iosConfirm(t('upd.preTitle'), t('upd.preBody'), t('upd.install'), t('a.cancel'), false);
    if (go) updInstallApk(Number(p.id));
  });
  updRefreshInstallUI(); // v1.5.133: show Install if an update is already downloaded
  // v1.5.138: live update banner wiring
  const bb = $('upd-banner');
  if (bb) bb.addEventListener('click', () => updBannerGo());
  const bx = $('upd-banner-x');
  if (bx) bx.addEventListener('click', (e) => { e.stopPropagation(); updBannerDismiss(); });
  // v1.5.138: auto-detect new releases while the app runs (banner always,
  // background download only when the toggle is on)
  if (B) updWatchStart();
}
function autoKickScan(list) {
  if (!KICK_VERIFIED) return;
  if (!Store.load().kickAuto) return;
  (list || []).forEach(c => {
    const st = clientStatusOf(String(c.account || c.authAccount || '').trim(), mcCache && mcCache.vmap);
    // v1.5.62: skip clients kicked within the cooldown (manual or auto) —
    // prevents a kick → refresh → still-sticky → kick loop.
    if ((st === 'datalimit' || st === 'timeup') && autoKickDue(c)) requestKick(c, { auto: true });
  });
}

/* Online-Clients render cache: fetch once per visit, re-render locally on
 * filter/names-toggle so chips feel instant. */
let mcCache = null;
async function moreClients() {
  S.moreFn = moreClients;
  // v1.5.62: stale-while-revalidate — when a rendered list is already on
  // screen, keep it visible during refresh (no white flash); show only a
  // small spinner in the header. First visit still gets the loading text.
  const staleEl = $('mc-list');
  const keepStale = !!(staleEl && staleEl.querySelector('.mc-head'));
  if (!keepStale) {
    moreShell(`${ic('monitor', 'sm')} ${esc(t('mc.title'))}`, `<div id="mc-list"><p class="muted">${t('more.loading')}</p></div>`);
  } else {
    const head = staleEl.querySelector('.mc-head');
    if (head && !head.querySelector('.mc-sync')) head.insertAdjacentHTML('beforeend', '<span class="mc-sync" aria-hidden="true"></span>');
  }
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
    catch (e) {
      // v1.5.62: on refresh failure keep the old list, just toast the error.
      if (keepStale) { toast(String((e && e.message) || e || ''), true); const s2 = $('mc-list .mc-sync'); if (s2) s2.remove(); }
      else $('mc-list').innerHTML = `<p class="err">${esc(e.message)}</p>`;
      return;
    }
  }
  let vmap = new Map();
  // v1.5.132: never force a full voucher re-fetch here — reuse the cached
  // map (populated by the Voucher page or a previous client load). Forcing
  // made every Online Clients open as slow as loading all vouchers.
  try { vmap = await apClientVoucherMap(pid, false); } catch (e) { /* voucher enrichment optional */ }
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
      // v1.5.132: independent calls — run in parallel, not sequentially.
      const [stas, devs] = await Promise.all([
        GwApi.staList().catch(() => null),
        GwApi.deviceList().catch(() => null),
      ]);
      if (stas && stas.length) {
        const seen = new Set((list || []).map(c => normMac(c.mac || c.userMac || c.staMac)));
        let apNames = {};
        try {
          (devs || []).forEach(d => { if (d.serialNumber) apNames[String(d.serialNumber)] = d.name || d.deviceName || String(d.serialNumber); });
        } catch (e) { /* AP names best-effort */ }
        const vc = getVoucherCache();
        // Fix12b: gateway Authentication -> Online Clients (app_auth) carries
        // the voucher code (userName) per MAC — the gateway's own auth
        // record wins over the local portal cache for merged rows.
        let gwAuthByMac = new Map();
        try {
          const au = await GwApi.authOnlineUsers();
          if (au && au.byMac) gwAuthByMac = au.byMac;
        } catch (e) { /* best-effort: cache still applies */ }
        (stas || []).forEach(s => {
          const mac = normMac(s.mac);
          if (!mac || seen.has(mac)) return;
          seen.add(mac);
          const row = {
            mac: s.mac, ip: s.ip || '', userName: s.host || '',
            ssid: s.ssid || '',
            // v1.5.96: user_list reports deviceAliasName directly
            // (e.g. "WI-FI 7 RAP2271(MG)") — prefer it over the serial lookup.
            deviceName: s.apName || (s.apSn && apNames[String(s.apSn)]) || s.apSn || '',
            rssi: (s.rssi != null && s.rssi !== '') ? s.rssi : null,
            __gw: true,
          };
          const au = gwAuthByMac.get(mac);
          const cv = vc.byMac.get(mac) || (row.ip ? vc.byIp.get(String(row.ip).trim()) : null);
          if (au && au.voucher) row.account = au.voucher;
          else if (cv) row.account = cv;
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
    q: (mcCache && mcCache.q) || '', // v1.5.67: search text survives refresh
    showNames: Store.load().clientShowNames !== false,
  };
  S.clientsFetchedAt = Date.now(); // v1.5.54: last-fetched timestamp
  renderMcList(); // rebuilds #mc-list innerHTML — the .mc-sync spinner goes with it
  // v1.5.115: pull the portal deny-list so blocks from any phone show.
  try { refreshPortalBlocklist(); } catch (e) { /* best-effort */ }
  // v1.5.62: auto-kick was defined but never wired up — run the scan now that
  // the list is on screen. Kicks mark rows locally (no refetch per kick).
  try { autoKickScan(list); } catch (e) { /* best-effort */ }
}

/* ═══════════ v1.5.54: client auth history ═══════════
   Uses the verified /samTransfer/userauthlogs/bypage endpoint (portal SSO).
   Shows recent login/logout records: voucher account, MAC, login/logout time. */
/* ── v1.5.145: Client History grouped by voucher ──
 * One row per voucher code; tap for that voucher's full session list.
 * Sharing estimate per voucher from MAC + IP + time overlap:
 *   shared     — 2+ MACs with overlapping sessions (strong signal)
 *   suspicious — 2+ MACs, no overlap, different IPs (ambiguous)
 *   rotation   — 2+ MACs but same IP (likely one device, MAC randomized)
 *   none       — single MAC
 * Pure helpers (groupHistoryByVoucher, historyShareFlag, mapLogoutReason)
 * are unit-testable; mapLogoutReason matches keywords and NEVER hides
 * the raw portal value (unknown reasons fall back to raw). */
function groupHistoryByVoucher(records) {
  const map = new Map();
  for (const r of records || []) {
    const acct = String((r && r.account) || '—');
    if (!map.has(acct)) map.set(acct, { account: acct, sessions: [] });
    map.get(acct).sessions.push(r);
  }
  const groups = [...map.values()];
  for (const g of groups) {
    g.sessions.sort((a, b) => Number(b.loginTimes || 0) - Number(a.loginTimes || 0));
    g.macs = [...new Set(g.sessions.map(s => normMac(s.userMac)).filter(Boolean))];
    g.lastSeen = g.sessions.reduce((m, s) => Math.max(m, Number(s.loginTimes || 0)), 0);
    g.flag = historyShareFlag(g.sessions);
  }
  groups.sort((a, b) => b.lastSeen - a.lastSeen);
  return groups;
}
function historyShareFlag(sessions) {
  const macs = [...new Set(sessions.map(s => normMac(s.userMac)).filter(Boolean))];
  if (macs.length < 2) return 'none';
  const ivs = sessions.map(s => ({
    mac: normMac(s.userMac),
    start: Number(s.loginTimes || 0),
    end: Number(s.logoutTimes || 0) || Date.now(),
  })).filter(x => x.mac && x.start > 0);
  for (let i = 0; i < ivs.length; i++) {
    for (let j = i + 1; j < ivs.length; j++) {
      if (ivs[i].mac === ivs[j].mac) continue;
      if (ivs[i].start < ivs[j].end && ivs[j].start < ivs[i].end) return 'shared';
    }
  }
  const ips = [...new Set(sessions.map(s => String(s.userIp || '').trim()).filter(Boolean))];
  if (ips.length <= 1) return 'rotation';
  return 'suspicious';
}
/* Keyword map of portal logout reasons → Burmese/English.
 * The portal's exact vocabulary was never captured, so this matches
 * keywords case-insensitively; anything unknown returns the RAW value. */
function mapLogoutReason(raw) {
  const r = String(raw || '').trim();
  if (!r) return '—';
  const k = r.toLowerCase();
  const my = LANG !== 'en';
  if (/(kick|admin|manual|force)/.test(k)) return my ? 'ဖြုတ်ချခံရတာ' : 'Kicked by admin';
  if (/idle/.test(k)) return my ? 'မသုံးပဲကြာလို့ ပြုတ်သွားတာ' : 'Idle timeout';
  if (/(quota|flow|data|traffic|limit|usage)/.test(k)) return my ? 'Data ကုန်လို့ ပြုတ်သွားတာ' : 'Quota used up';
  if (/(timeout|expire|session|lease)/.test(k)) return my ? 'အချိန်ကုန်လို့ ပြုတ်သွားတာ' : 'Session timeout';
  if (/re-?auth/.test(k)) return my ? 'ပြန်ဝင်ခိုင်းလို့ ပြုတ်သွားတာ' : 'Re-authentication';
  if (/(nas|disconnect|network|ap |roam)/.test(k)) return my ? 'လိုင်းပြတ်သွားတာ' : 'Connection lost';
  return r;
}
async function moreHistory() {
  S.moreFn = moreHistory;
  moreShell(`${ic('clock', 'sm')} ${esc(t('mh.title'))}`, `<div id="mh-list"><p class="muted">${t('more.loading')}</p></div>`);
  if (!Api.ssoLoggedIn()) {
    $('mh-list').innerHTML = `<p class="err">${esc(t('mh.needSso'))}</p>`;
    return;
  }
  try {
    const list = await Api.portalAuthLogs(Number(S.projectId)) || [];
    S._histGroups = groupHistoryByVoucher(list);
    S._histTotal = list.length;
    renderHistoryGroups();
  } catch (e) {
    $('mh-list').innerHTML = `<p class="err">${esc(e.message || String(e))}</p>`;
  }
}
function renderHistoryGroups() {
  const groups = S._histGroups || [];
  if (!groups.length) {
    $('mh-list').innerHTML = `<p class="muted">${esc(t('mh.empty'))}</p>`;
    return;
  }
  $('mh-list').innerHTML =
    `<p class="muted small">${groups.length} vouchers · ${S._histTotal || ''} records</p>` +
    `<div class="list">` + groups.map((g, i) => {
      const flag = g.flag === 'shared'
        ? `<span class="mh-flag bad">🔴 ${esc(t('mh.shared'))}</span>`
        : g.flag === 'suspicious'
          ? `<span class="mh-flag warn">🟡 ${esc(t('mh.susp'))}</span>`
          : g.flag === 'rotation'
            ? `<span class="mh-flag ok">🟢 ${esc(t('mh.rotation'))}</span>` : '';
      return `<div class="voucher-row mh-group" data-mhg="${i}" role="button" tabindex="0">
        <span class="status-dot s2"></span>
        <div class="voucher-meta"><div class="voucher-code">${esc(g.account)}</div>
        <div class="pkg">${esc(tx('mh.grpSub', { n: g.sessions.length, m: g.macs.length }))} · ${esc(fmtDate(g.lastSeen))}</div></div>
        ${flag}<span class="chev">›</span></div>`;
    }).join('') + `</div>`;
  $('mh-list').querySelectorAll('[data-mhg]').forEach(el => {
    const open = () => openHistoryDetail(Number(el.dataset.mhg));
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}
/* Per-voucher session detail (drill-down; system back walks moreStack). */
function openHistoryDetail(idx) {
  const g = (S._histGroups || [])[idx];
  if (!g) return;
  S.moreFn = () => openHistoryDetail(idx);
  moreShell(`${ic('ticket', 'sm')} ${esc(g.account)}`,
    `<p class="muted small">${esc(tx('mh.grpSub', { n: g.sessions.length, m: g.macs.length }))}</p>` +
    `<div class="list">` + g.sessions.map(s => {
      const mac = esc(s.userMac || '—');
      const ip = esc(s.userIp || '—');
      const login = esc(fmtDate(s.loginTimes));
      const logout = s.logoutTimes ? esc(fmtDate(s.logoutTimes)) : esc(t('mh.online'));
      const mapped = mapLogoutReason(s.logoutReason);
      const reason = esc(mapped);
      const raw = (s.logoutReason && mapped !== String(s.logoutReason).trim())
        ? ` <small class="muted">(${esc(String(s.logoutReason))})</small>` : '';
      return `<div class="voucher-row"><span class="status-dot s2"></span>
        <div class="voucher-meta"><div class="voucher-code" style="font-size:14px">${mac}</div>
        <div class="pkg">${ip} · ${login} → ${logout}</div>
        <div class="pkg">${esc(t('mh.reason'))}: ${reason}${raw}</div></div></div>`;
    }).join('') + `</div>`);
}

/* v1.5.67: Online Clients search — voucher code, IP, or MAC. A MAC typed
   without separators still matches (normalized compare). */
function mcMatchQ(f, q) {
  q = String(q || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [f.acct || '', f.ip || '', f.mac || ''].map(s => String(s).toLowerCase());
  if (hay.some(h => h && h !== '—' && h.includes(q))) return true;
  const nq = normMac(q);
  return !!(nq && normMac(f.mac || '').includes(nq));
}
function renderMcList() {
  const { list, viaPortal, vmap, srcNote } = mcCache;
  const { filter, showNames } = mcCache;
  const sts = list.map(c => clientStatusOf(mcFields(c, viaPortal, vmap).acct, vmap));
  const counts = { all: list.length };
  CSTS.forEach(s => counts[s] = 0);
  sts.forEach(s => counts[s]++);
  // v1.5.105: Blocked chip — counts the deny-list itself (v1.5.117: local
  // UNION portal). NOT a filter over online clients: a blocked MAC is
  // denied by the portal filter, so it never appears in the online list.
  const blockedCount = getBlockedMacList().length;
  const srcLine = `📡 ${esc(viaPortal ? t('ac.srcPortal') : t('ac.srcApi'))}${srcNote ? ' · ' + esc(srcNote) : ''}${S.clientsFetchedAt ? ' · ' + esc(t('v.updated')) + ' ' + esc(fmtTime(S.clientsFetchedAt)) : ''}`; // v1.5.54: last-fetched
  const seg = (key, label, n) =>
    `<button type="button" class="${filter === key ? 'active' : ''}" data-mcf="${key}">${esc(label)} (${n})</button>`;
  const segHtml = `<div class="segmented seg-scroll" role="tablist">` +
    seg('all', t('mc.fAll'), counts.all) +
    CSTS.map(s => seg(s, t(CST_META[s].key), counts[s])).join('') +
    seg('blocked', t('mc.fBlocked'), blockedCount) + `</div>`;
  // v1.5.67: search box — typing re-renders only the cells, input keeps focus.
  const searchHtml = `<div class="mc-search">${ic('search', 'sm')}<input id="mc-q" type="search" value="${esc(mcCache.q || '')}" placeholder="${esc(t('mc.search'))}" autocomplete="off" aria-label="${esc(t('mc.search'))}"></div>`;
  $('mc-list').innerHTML =
    `<div class="mc-head"><p class="mc-sub">${esc(tx('mc.total', { n: list.length }))} · ${srcLine}</p>` +
    `<button type="button" id="mc-names" class="ios-text-btn${showNames ? ' on' : ''}">👤 ${esc(t('ac.names'))}</button></div>` +
    searchHtml +
    segHtml +
    `<div id="mc-cells"></div>`;
  renderMcCells();
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
  const qi = $('mc-q');
  if (qi) qi.addEventListener('input', () => { mcCache.q = qi.value; renderMcCells(); });
}
/* fix7: voucher-VLAN-scoped "suspicious" flag. Pure and unit-testable.
 * voucherVlan(store) — Settings "Voucher VLAN" -> '20' or '';
 * empty = not configured.
 * isVoucherVlan(vlan, cfg) — true when not configured (backwards
 * compatible: flag everywhere) or the client's VLAN matches.
 * shouldFlagSuspicious(...) — the full v1.5.53 condition plus the VLAN
 * scope: noauth + viaPortal + heavy usage + on the voucher SSID. */
/* ── Voucher-VLAN-scoped "suspicious" flag ──
 * The voucher network is identified by its captive-portal VLAN (Ruijie
 * Cloud WLAN list) — no WiFi name needed.
 * voucherVlan(store) — Settings "Voucher VLAN" -> '20' or ''; empty = not
 *   configured.
 * isVoucherVlan(vlan, cfg) — true when not configured (backwards
 *   compatible: flag everywhere) or the client's VLAN matches.
 * detectVoucherVlan(ssidList) — the VLAN of the SSID with captive portal
 *   (authEnable) from the Ruijie Cloud WLAN list; '' when none.
 * shouldFlagSuspicious(...) — the full v1.5.53 condition plus the VLAN
 *   scope: noauth + viaPortal + heavy usage + on the voucher VLAN. */
function voucherVlan(store) {
  return String((store && store.voucherVlan) || '').trim();
}
function isVoucherVlan(vlan, cfg) {
  if (!cfg) return true;
  const v = String(vlan || '').trim();
  return !!v && v === String(cfg).trim();
}
function detectVoucherVlan(ssidList) {
  for (const s of (ssidList || [])) {
    if (!s) continue;
    const ae = s.authEnable === true || String(s.authEnable).toLowerCase() === 'true';
    if (!ae) continue;
    const v = String(s.vlanId !== undefined && s.vlanId !== null ? s.vlanId : '').trim();
    if (v) return v;
  }
  return '';
}
function shouldFlagSuspicious(st, viaPortal, vlan, c, vVlan) {
  if (st !== 'noauth' || !viaPortal) return false;
  if (!isVoucherVlan(vlan, vVlan)) return false;
  c = c || {};
  const bytes = Number(c.flowUpDown) || 0;
  const durMs = Number(c.activeSec) > 0 ? Number(c.activeSec) * 1000
    : (Number(c.onlineTime) > 0 ? Date.now() - Number(c.onlineTime) : 0);
  return bytes > 50 * 1024 * 1024 || durMs > 2 * 3600 * 1000;
}
/* ── v1.5.117 · Blocked tab = the deny-list itself ──
 * One row per blocked MAC (local ∪ portal), each with an Unblock action.
 * A blocked MAC is denied by the portal MAC filter so it never shows in
 * the online list — filtering online clients by blocked state always
 * rendered "Blocked (0)". Search matches MAC hex substrings. */
function renderBlockedCells(q) {
  const nq = normMac(q || '');
  let cells = '';
  getBlockedMacList().forEach(h => {
    if (nq && !h.includes(nq)) return;
    const src = blockedMacSource(h);
    const srcLabel = src === 'both' ? t('mc.blockLocal') + ' + ' + t('mc.blockPortal')
      : src === 'portal' ? t('mc.blockPortal') : t('mc.blockLocal');
    cells += `<div class="set-row mc-row" role="button" tabindex="0">` +
      `<span class="set-ico mc-ico cst-blocked">${ic('lock', '')}</span>` +
      `<div class="t"><div class="mc-top"><span class="t-main">${esc(colonMac(h))}</span></div>` +
      `<div class="sub">${esc(srcLabel)}</div>` +
      `<div class="mc-foot"><span></span><button type="button" class="mc-kick" data-unblock="${esc(h)}">${esc(t('block.unblock'))}</button></div>` +
      `</div></div>`;
  });
  $('mc-cells').innerHTML =
    cells ? `<div class="set-group mc-list">${cells}</div>` : `<p class="muted">${esc(t('mc.blockEmpty'))}</p>`;
  document.querySelectorAll('#mc-cells [data-unblock]').forEach(b =>
    b.addEventListener('click', () => unblockMac(b.dataset.unblock)));
}
/* v1.5.67: cells-only render — called by renderMcList and by the search box
   on every keystroke (no focus loss, no list wipe). */
function renderMcCells() {
  const { list, viaPortal, vmap } = mcCache;
  const { filter, showNames, q } = mcCache;
  // v1.5.117: the Blocked tab renders the deny-list itself (blocked MACs
  // are never online), not a filter over online clients.
  if (filter === 'blocked') return renderBlockedCells(q);
  const sts = list.map(c => clientStatusOf(mcFields(c, viaPortal, vmap).acct, vmap));
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
  // v1.5.76: heaviest transferrers get a top-talker flag (read-only signal).
  const topSet = topTalkerIdx(list, viaPortal);
  list.forEach((c, i) => {
    // (v1.5.117: 'blocked' filter is rendered by renderBlockedCells, not here)
    if (filter !== 'all' && sts[i] !== filter) return;
    const f = mcFields(c, viaPortal, vmap);
    if (!mcMatchQ(f, q)) return;
    const st = sts[i];
    // v1.5.53: anomaly flags — neutral wording, never accusatory.
    // "suspicious": online with no voucher attribution but showing real
    //   usage (traffic or long session) — worth a review, not a verdict.
    // "sticky": voucher quota exhausted (datalimit/timeup) yet the client
    //   is still in the online list — the AP didn't disconnect it.
    // fix7: the suspicious flag only makes sense on the voucher VLAN.
    // Clients on other VLANs (Home/AMH — WPA password) are legitimate by
    // definition: they entered the WiFi password, no voucher needed.
    // The voucher VLAN comes from Settings (Ruijie Cloud captive-portal
    // VLAN); empty = flag everywhere (backwards compatible).
    const vVlan = voucherVlan(Store.load());
    const flags = [];
    if (shouldFlagSuspicious(st, viaPortal, f.vlan, c, vVlan)) flags.push('suspicious');
    if (st === 'datalimit' || st === 'timeup') flags.push('sticky');
    // v1.5.76: line-quality flags — weak signal / heavy talker / packet
    // loss. Read-only signals from verified fields; never accusatory.
    flags.push(...mcQualityFlags(mcQuality(c, viaPortal)));
    if (topSet.has(i)) flags.push('toptalker');
    // v1.5.62: kicked mark — a manual or auto kick leaves a visible badge
    // even while the portal list still shows the client online.
    const kts = kickedAt(f.mac);
    if (kts) flags.push('kicked');
    const title = (showNames && f.name) ? f.name : f.mac;
    const vLine = f.acct ? voucherInline(f.acct, vmap) : `<span class="muted">—</span>`;
    // v1.5.58: iOS-clean rows — title + voucher + one quiet IP·AP line only.
    // The old 10-field mega-line (SSID, signal, traffic, device…) moved to the
    // tap-to-open detail sheet (openMcDetail).
    // v1.5.96: VLAN label joins the quiet line when known (192.168.30.2 · VLAN 30 · AP).
    const netParts = [];
    if (f.ip !== '—') netParts.push(f.ip);
    if (f.vlan) netParts.push('VLAN ' + f.vlan);
    if (f.ap !== '—') netParts.push(f.ap);
    const net = netParts.join(' · ');
    // v1.5.55: per-client disconnect on sticky rows (quota spent, still online).
    // v1.5.76: also on weak-signal rows — a client at -80 dBm or worse
    // drags its whole radio cell to low PHY rates; one tap reuses the
    // verified kick (confirm dialog, voucher never deleted).
    // Execution gated by KICK_VERIFIED — the button explains until then.
    const kickBtn = (flags.includes('sticky') || flags.includes('weaksig'))
      ? `<button type="button" class="mc-kick" data-kick="${esc(f.mac)}">${esc(t('kick.btn'))}</button>` : '';
    const flagHtml = fl => fl === 'kicked'
      ? `<span class="mc-flag flag-kicked">✓ ${esc(t('mc.flag.kicked'))} · ${esc(fmtTime(kts))}</span>`
      : `<span class="mc-flag flag-${fl}">⚑ ${esc(t('mc.flag.' + fl))}</span>`;
    const foot = (flags.length || kickBtn)
      ? `<div class="mc-foot"><span>${flags.map(flagHtml).join('')}</span>${kickBtn}</div>` : '';
    cells += `<div class="set-row mc-row" data-mc="${i}" role="button" tabindex="0">` +
      `<span class="set-ico mc-ico cst-${st}">${ic(clientIcon(f), '')}</span>` +
      `<div class="t"><div class="mc-top"><span class="t-main">${esc(title)}</span>` +
      `<span class="mc-badge cst-${st}">${esc(t(CST_META[st].key))}</span></div>` +
      `<div class="sub">${vLine}</div>` +
      (net ? `<div class="sub mc-net">${esc(net)}</div>` : '') +
      foot + `</div></div>`;
  });
  $('mc-cells').innerHTML =
    cells ? `<div class="set-group mc-list">${cells}</div>` : `<p class="muted">${esc(q && String(q).trim() ? t('mc.noMatch') : t('mc.none'))}</p>`;
  document.querySelectorAll('#mc-cells [data-kick]').forEach(b => b.addEventListener('click', () => {
    const list = (mcCache && mcCache.list) || [];
    const c = list.find(x => normMac(x.mac || x.userMac) === normMac(b.dataset.kick));
    if (c) kickStickyClient(c);
  }));
  // v1.5.58: tap a row for the full detail sheet (Disconnect keeps its own tap)
  document.querySelectorAll('#mc-cells [data-mc]').forEach(row => {
    const open = () => openMcDetail(Number(row.dataset.mc));
    row.addEventListener('click', e => {
      if (e.target.closest('[data-kick]')) return;
      open();
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

/* ── v1.5.97 · voucher "last used" ──
   account → newest loginTimes from the portal auth history (AP-independent,
   keyed by groupId — covers Cloud + China-AP clients alike).
   The map is cached 15 min; a voucher with no history renders '—' (never guessed). */
let mcLastUsedCache = null;
/* Pure: newest loginTimes per voucher account (testable). */
const lastUsedMap = logs => {
  const map = new Map();
  for (const r of logs) {
    const k = String(r.account || '').trim();
    const lt = Number(r.loginTimes) || 0;
    if (k && lt > (map.get(k) || 0)) map.set(k, lt);
  }
  return map;
};
async function voucherLastUsedTs(acct) {
  const a = String(acct || '').trim();
  if (!a) return 0;
  const now = Date.now();
  if (!mcLastUsedCache || now - mcLastUsedCache.at > 15 * 60 * 1000) {
    // v1.5.128: ensure SSO login before fetching auth logs
    try {
      if (typeof Api !== 'undefined' && Api.ssoLoggedIn && !Api.ssoLoggedIn()) {
        if (window.RuijieBridge && window.RuijieBridge.ssoLoginSilent) {
          await new Promise((resolve) => {
            try { window.RuijieBridge.ssoLoginSilent(); } catch (e) {}
            setTimeout(resolve, 3000);
          });
        }
      }
    } catch (e) {}
    const logs = await Api.portalAuthLogs(Number(S.projectId));
    mcLastUsedCache = { at: now, map: lastUsedMap(logs) };
  }
  return mcLastUsedCache.map.get(a) || 0;
}
/* v1.5.97: compact relative day label — "0Days", "1Days", "11Days" (user request). */
const fmtDaysAgo = ts => {
  if (!ts) return '—';
  const days = Math.floor((Date.now() - Number(ts)) / 86400000);
  if (!(days >= 0)) return '—'; // future/clock-skew → never guess
  return tx('mc.dDaysAgo', { n: days });
};

/* ── v1.5.58 · Online Clients detail sheet ──
   Rows stay iOS-clean; every removed field lives here, grouped iOS-style.
   The sticky Disconnect action is offered here too (same KICK_VERIFIED gate). */
function openMcDetail(idx) {
  const { list, viaPortal, vmap } = mcCache;
  const c = list && list[idx];
  if (!c) return;
  const f = mcFields(c, viaPortal, vmap);
  const st = clientStatusOf(f.acct, vmap);
  const vm = f.acct && vmap ? vmap.get(f.acct) : null;
  const title = (mcCache.showNames && f.name) ? f.name : f.mac;
  const kv = (k, v) => (v != null && v !== '' && v !== '—')
    ? `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>` : '';
  // v1.5.99: raw-HTML value variant — for trusted markup only (e.g. the
  // #mc-lastused placeholder span); the key is still escaped.
  const kvRaw = (k, vHtml) => (vHtml != null && vHtml !== '')
    ? `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${vHtml}</span></div>` : '';
  const sec = s => `<div class="kv-sec">${esc(s)}</div>`;
  const grp = inner => inner ? `<div class="kv-group">${inner}</div>` : '';
  const flags = [];
  // fix7: suspicious flag only on the voucher VLAN (see list renderer above)
  if (shouldFlagSuspicious(st, viaPortal, f.vlan, c, voucherVlan(Store.load()))) flags.push('suspicious');
  if (st === 'datalimit' || st === 'timeup') flags.push('sticky');
  // v1.5.62: kicked mark in the detail sheet too.
  const kts2 = kickedAt(f.mac);
  if (kts2) flags.push('kicked');
  // v1.5.76: line-quality flags in the detail sheet (read-only signals).
  const mq = mcQuality(c, viaPortal);
  flags.push(...mcQualityFlags(mq));
  if (topTalkerIdx(list, viaPortal).has(idx)) flags.push('toptalker');
  let body = '';
  if (flags.length) body += `<div class="mc-sheet-flags">${flags.map(fl => fl === 'kicked'
    ? `<span class="mc-flag flag-kicked">✓ ${esc(t('mc.flag.kicked'))} · ${esc(fmtTime(kts2))}</span>`
    : `<span class="mc-flag flag-${fl}">⚑ ${esc(t('mc.flag.' + fl))}</span>`).join('')}</div>`;
  if (f.acct) {
    body += sec(t('mc.dVoucher')) + grp(
      kv(t('ac.voucher'), f.acct) +
      kvRaw(t('mc.dLastUsed'), '<span id="mc-lastused">…</span>') +
      (vm ? kv(t('mc.dProfile'), voucherPkgName(vm)) : '') +
      (vm ? kv(t('mc.dPrice'), fmtMoney(pkgPriceNum(vm))) : '') +
      kv(t('mc.dStatus'), t(CST_META[st].key)));
  } else {
    body += sec(t('mc.dVoucher')) + grp(kv(t('mc.dStatus'), t(CST_META[st].key)));
  }
  body += sec(t('mc.dNetwork')) + grp(
    kv(t('mc.dIp'), f.ip) + kv(t('mc.dMac'), f.mac) +
    kv(t('mc.dSsid'), f.ssid) + kv(t('mc.dAp'), f.ap) + kv(t('mc.dConn'), f.conn));
  body += sec(t('mc.dSession')) + grp(
    kv(t('mc.dSince'), f.since) + kv(t('mc.dDur'), f.dur) +
    kv(t('mc.dSig'), f.sig) + kv(t('mc.dTraffic'), f.total) +
    kv(t('mc.dLive'), f.live === '—' ? '' : '⇅ ' + f.live));
  // v1.5.76: dedicated line-quality section — normalized signals, raw
  // packet-loss value (unit undocumented in the Ruijie doc; shown as-is).
  const qTotal = viaPortal
    ? (mq.tComb != null ? fmtBytes(mq.tComb) : '')
    : (() => { const p = []; if (mq.tDown != null) p.push('↓ ' + fmtBytes(mq.tDown)); if (mq.tUp != null) p.push('↑ ' + fmtBytes(mq.tUp)); return p.join(' · '); })();
  const qRate = (mq.down != null || mq.up != null) ? '⇅ ' + [fmtRate(mq.down), fmtRate(mq.up)].join(' / ') : '';
  const qBody = grp(
    kv(t('mc.qSig'), mq.rssi != null ? mq.rssi + ' dBm' : '') +
    kv(t('mc.qRate'), qRate) + kv(t('mc.qTotal'), qTotal) +
    kv(t('mc.qLoss'), mq.loss != null ? String(mq.loss) : ''));
  if (qBody) body += sec(t('mc.dQuality')) + qBody;
  if (f.dev && f.dev !== '—') body += sec(t('mc.dDevice')) + grp(kv(t('mc.device'), f.dev));
  if (flags.includes('sticky') || flags.includes('weaksig')) {
    body += `<button type="button" class="ios-sheet-danger" id="mc-sheet-kick">${esc(t('kick.btn'))}</button>`;
  }
  // v1.5.95: manual MAC block / unblock (portal mac_filter, verified 2026-10-01)
  const _mcMac = c && (c.mac || c.userMac);
  if (_mcMac && normMac(_mcMac)) {
    body += isMacBlocked(_mcMac)
      ? `<button type="button" class="ios-sheet-btn" id="mc-sheet-unblock">${esc(t('unblock.btn'))}</button>`
      : `<button type="button" class="ios-sheet-danger" id="mc-sheet-block">${esc(t('block.btn'))}</button>`;
  }
  closeIosPicker();
  const ov = document.createElement('div');
  ov.className = 'ios-sheet-ov';
  const sheet = document.createElement('div');
  sheet.className = 'ios-sheet ios-sheet-full'; // Fix9: client detail is fullscreen
  sheet.setAttribute('role', 'dialog');
  sheet.innerHTML = `<div class="sheet-handle"></div><div class="ios-sheet-title">${esc(title)}</div><div class="ios-sheet-body">${body}</div>`;
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'ios-sheet-cancel';
  cancel.textContent = t('a.cancel');
  cancel.addEventListener('click', closeIosPicker);
  sheet.appendChild(cancel);
  const kb = sheet.querySelector('#mc-sheet-kick');
  if (kb) kb.addEventListener('click', () => { closeIosPicker(); kickStickyClient(c); });
  const bb = sheet.querySelector('#mc-sheet-block');
  if (bb) bb.addEventListener('click', () => blockClient(c));
  const ub = sheet.querySelector('#mc-sheet-unblock');
  if (ub) ub.addEventListener('click', () => unblockClient(c));
  ov.appendChild(sheet);
  ov.addEventListener('click', e => { if (e.target === ov) closeIosPicker(); });
  document.body.appendChild(ov);
  // v1.5.97: fill the "Last used" row async — keeps the sheet instant; the
  // placeholder node identity guards against a re-opened sheet being overwritten.
  if (f.acct) {
    const luNode = sheet.querySelector('#mc-lastused');
    voucherLastUsedTs(f.acct).then(ts => {
      const el = sheet.querySelector('#mc-lastused');
      if (el && el === luNode) el.textContent = fmtDaysAgo(ts);
    }).catch(() => {
      const el = sheet.querySelector('#mc-lastused');
      if (el && el === luNode) el.textContent = '—';
    });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
}

/* ── Per-AP clients · v1.5.22 ──
   One sta_users call (staType=currentUser) grouped by AP serial gives the
   per-AP client list: MAC/IP, voucher code (client username), connect time
   (onlineTime), duration (activeTime), signal. The voucher code is matched
   against the voucher list for package/price; unmatched codes are shown raw,
   never guessed. Tapping a client loads its onofflineUserHistory — consecutive
   records on different AP serials mean the client roamed between APs. */
let _acVMap = null, _acVMapPid = 0, _acVMapAt = 0;
/* v1.5.40: force=true refetches the voucher list from Cloud so voucher
 * statuses (expired/in-use) are realtime at view-open time. The old
 * session-long cache is what kept expired vouchers green. On fetch
 * failure the last-known map is returned instead of an empty one, so an
 * offline view still shows the previous enrichment instead of losing it.
 * PERF (v1.5.171): force=true now means "refresh if stale" (60s), not
 * "always refetch". Callers at app-init, Online Clients, and per-AP views
 * were each triggering a full paginated voucherListAll on every open —
 * even seconds after loadVouchers() had just fetched the same data. */
const ACVMAP_STALE_MS = 60000;
async function apClientVoucherMap(pid, force) {
  const fresh = _acVMap && _acVMapPid === pid && (Date.now() - _acVMapAt < ACVMAP_STALE_MS);
  if (fresh) return _acVMap;
  try {
    const vs = await Api.voucherListAll(Number(pid), null);
    const m = new Map();
    (vs || []).forEach(v => { const c = vCode(v); if (c && !m.has(c)) m.set(c, v); });
    _acVMap = m; _acVMapPid = pid; _acVMapAt = Date.now();
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
/* v1.5.61: dotted-lowercase MAC for the kick envelope (portal reports
 * 461a.f562.bb5b form). Returns '' when the input has no 12 hex digits. */
const dottedMac = s => {
  const h = normMac(s);
  return h.length === 12 ? (h.slice(0, 4) + '.' + h.slice(4, 8) + '.' + h.slice(8)).toLowerCase() : '';
};
/* v1.5.95: colon-separated lowercase MAC for the block envelope (portal
 * reports 62:22:3f:a9:9f:14 form). Returns '' when input has no 12 hex digits. */
const colonMac = s => {
  const h = normMac(s);
  return h.length === 12 ? (h.match(/../g) || []).join(':').toLowerCase() : '';
};
/* ── VLAN label from client IP · v1.5.96 ──
 * Pure. The portal/gateway user_list reports access_vlan "0" for wireless
 * clients, so the subnet is the honest signal. Mapping is derived from the
 * gateway's own DHCP Option config (verified 2026-09-30 eWeb capture):
 *   vlan 30  → 192.168.30.1   (AMH)
 *   vlan 20  → 192.168.20.1   (Nang Oo, voucher VLAN)
 *   vlan 233 → 192.168.110.1/23 (Home)
 * Returns '' for unknown subnets — never guessed.
 * Fix12b: the gateway's Web Authentication Wi-Fi List (user screenshot
 * 2026-10-01) shows VLAN20 = 192.168.20.1-192.168.21.254, so 192.168.21.x
 * is also VLAN 20 — this is where the app_auth voucher clients live. */
const vlanFromIp = ip => {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(String(ip || '').trim());
  if (!m) return '';
  const key = m[1] + '.' + m[2] + '.' + m[3];
  if (key === '192.168.30') return '30';
  if (key === '192.168.20' || key === '192.168.21') return '20';
  if (key === '192.168.110' || key === '192.168.111') return '233';
  return '';
};
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
  // Fix12b: the gateway's OWN Authentication -> Online Clients (app_auth)
  // carries the voucher code per MAC — the gateway's own auth record wins
  // over every portal source for gateway-enumerated clients.
  let vmap = new Map();
  try { vmap = await apClientVoucherMap(Number(S.projectId), true); } catch (e) {}
  let vByMac = new Map(), vByIp = new Map();
  let aByMac = new Map(), aByIp = new Map();
  let gwAuthByMac = new Map();
  try {
    if (typeof GwApi !== 'undefined' && GwApi.loggedIn()) {
      const au = await GwApi.authOnlineUsers();
      if (au && au.byMac) gwAuthByMac = au.byMac;
    }
  } catch (e) { /* app_auth best-effort — portal sources still apply */ }
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
      const vcode = (gwAuthByMac.get(normMac(c.mac)) || {}).voucher ||
        gwVoucherForSta(c, vByMac, vByIp) || gwVoucherForSta(c, aByMac, aByIp) || gwVoucherForSta(c, vcache.byMac, vcache.byIp);
      // v1.5.40: shared voucher cell (plan · period · price + status color).
      const vcell = voucherCellHtml(vcode, vmap);
      // v1.5.96: VLAN label under the SSID when the subnet is known.
      const vv = vlanFromIp(c.ip || '');
      const ssidCell = `<small>${esc(c.ssid || '—')}${vv ? '<br>VLAN ' + esc(vv) : ''}</small>`;
      return `<tr><td>${esc(mac)}${hostLine}</td>` +
        `<td>${vcell}</td>` +
        `<td>${ssidCell}</td>` +
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
/* v1.5.66: pure sales-report computation (extracted for testability).
 * Per package: made (created in period), sold (used/expired whose first use
 * falls in the period), price, revenue. Sold uses the EFFECTIVE status —
 * spent/kicked vouchers count as sold (expired), never as "in use". */
function salesReportData(vouchers, priceByPkg, rs, re) {
  const byPkg = {};
  const grp = v => {
    const nm = voucherPkgName(v) || t('sl.unknownPkg');
    if (!byPkg[nm]) byPkg[nm] = { made: 0, sold: 0 };
    return byPkg[nm];
  };
  // Quantity: vouchers created in the period (any status)
  (vouchers || []).forEach(v => {
    const ct = v.createTime || 0;
    if (ct >= rs && ct < re) grp(v).made++;
  });
  // Activated Accounts: used/expired vouchers whose FIRST USE falls in the period.
  // Sale day = day the voucher was FIRST USED (activation), whether it is
  // now used (2) or expired (3). Falls back to creation time when the
  // activation cannot be derived (disclosed in the note below the table).
  (vouchers || []).forEach(v => {
    const st = vEffStatus(v);
    if (st !== '2' && st !== '3') return;
    const stime = voucherActivatedTime(v) || (v.createTime || 0);
    if (stime >= rs && stime < re) grp(v).sold++;
  });
  let tm = 0, ts = 0, tr = 0;
  const rows = Object.keys(byPkg).sort().map(nm => {
    const g = byPkg[nm], price = (priceByPkg || {})[nm] || 0, rev = g.sold * price;
    tm += g.made; ts += g.sold; tr += rev;
    return { nm, made: g.made, sold: g.sold, price, rev };
  });
  return { rows, tm, ts, tr };
}
/* v1.5.106: portal network recorder — opens the Ruijie portal in a native
 * WebView with a fetch/XHR interceptor. The user does portal actions
 * normally, taps Stop, and the captured API calls are saved as a .txt file
 * + offered via the Android share sheet. Zero DevTools knowledge needed. */
function startNetworkRecorder() {
  if (window.RuijieBridge && window.RuijieBridge.startPortalRecorder) {
    window._recEvent = function(name, count) {
      if (name === 'done') toast(t('rec.done') + ' (' + count + ')');
    };
    window.RuijieBridge.startPortalRecorder();
  } else {
    toast('Recorder: native bridge မရှိ');
  }
}

/* v1.5.147: Gateway network recorder — opens the gateway eWeb in a WebView,
 * user logs in manually, performs actions, taps Stop. Captured API calls
 * are saved as a .txt file + share sheet.
 * v1.5.148: passes the gateway IP from Settings (phone may use a different
 * IP than the PC's 100.88.200.103). */
function startGatewayRecorder() {
  if (window.RuijieBridge && window.RuijieBridge.startGatewayRecorder) {
    window._gwRecEvent = function(name, count) {
      if (name === 'done') toast(t('rec.done') + ' (' + count + ')');
    };
    let gwUrl = 'https://100.88.200.103';
    try {
      const s = Store.load();
      const ip = String(s.gwIp || '100.88.200.103').trim() || '100.88.200.103';
      gwUrl = 'https://' + ip;
    } catch (_) {}
    window.RuijieBridge.startGatewayRecorder(gwUrl);
  } else {
    toast('Gateway Capture: native bridge မရှိ');
  }
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
  const render = () => {
    const [rs, re] = rangeBounds();
    const { rows, tm, ts, tr } = salesReportData(S.vouchers, priceByPkg, rs, re);
    // v1.5.171: phone compact sale ledger — drop No. + Quantity columns,
    // shorten headers (Profile, Price, active)
    const phone = document.documentElement.classList.contains('ph-compact');
    const body = rows.map((r, i) =>
      phone
        ? `<tr><td>${esc(r.nm)}</td>` +
          `<td class="num">${r.price ? esc(fmtMoney(r.price)) : '—'}</td>` +
          `<td class="num"><b>${r.sold.toLocaleString()}</b></td>` +
          `<td class="num"><b>${r.price ? esc(fmtMoney(r.rev)) : '—'}</b></td></tr>`
        : `<tr><td>${i + 1}</td><td>${esc(r.nm)}</td>` +
          `<td class="num">${r.price ? esc(fmtMoney(r.price)) : '—'}</td>` +
          `<td class="num">${r.made.toLocaleString()}</td>` +
          `<td class="num"><b>${r.sold.toLocaleString()}</b></td>` +
          `<td class="num"><b>${r.price ? esc(fmtMoney(r.rev)) : '—'}</b></td></tr>`
    ).join('');
    const head = phone
      ? `<tr><th>${t('sl.profileShort')}</th><th class="num">${t('sl.priceShort')}</th>` +
        `<th class="num">${t('sl.activatedShort')}</th><th class="num">${t('sl.totalPrice')}</th></tr>`
      : `<tr><th>${t('sl.no')}</th><th>${t('sl.profile')}</th><th class="num">${t('sl.price')}</th>` +
        `<th class="num">${t('sl.made')}</th><th class="num">${t('sl.activated')}</th><th class="num">${t('sl.totalPrice')}</th></tr>`;
    const totalRow = phone
      ? `<tr><td colspan="2"><b>${t('sl.total')}</b></td>` +
        `<td class="num"><b id="sl-ts"></b></td>` +
        `<td class="num"><b id="sl-tr"></b></td></tr>`
      : `<tr><td colspan="3"><b>${t('sl.total')}</b></td>` +
        `<td class="num"><b id="sl-tm"></b></td>` +
        `<td class="num"><b id="sl-ts"></b></td>` +
        `<td class="num"><b id="sl-tr"></b></td></tr>`;
    $('sl-list').innerHTML =
      `<div class="wrap-scroll"><table class="data">` +
      head + body + totalRow +
      `</table></div>`;
    // v1.5.56: iOS-style animated totals (tween from the previously shown values)
    const pt = prevTotals || { tm, ts, tr };
    if (!phone) animNum($('sl-tm'), tm, null, pt.tm);
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
  refreshDnsCard(); // v1.5.77: AdBlock DNS toggle
  refreshMonitorCard();
  refreshKickStatus(); // v1.5.66
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

/* v1.5.52: one-shot startup SSO auto-login. fix1: runs SILENT — the native
 * dialog stays hidden while the login completes in the background and the
 * app shows an iOS-style loading overlay instead. The dialog reveals itself
 * if the login needs the user (captcha / 2FA / error). Fires at most once
 * per app launch (window.__ssoAutoTried); an explicit logout sets the flag
 * so the dialog never reopens by itself afterwards. Never breaks startup. */
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
    // fix1: silent login — dialog hidden, iOS loading shown instead
    if (window.RuijieBridge.ssoLoginSilent) { showIosLoading(); window.RuijieBridge.ssoLoginSilent(); }
    else window.RuijieBridge.ssoLogin();
  } catch (e) { hideIosLoading(); /* never break startup */ }
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
  // v1.5.125: sync monitor setting to other phones
  try { if (typeof SettingsSync !== 'undefined') SettingsSync.onLocalChange({ _monEnabled: on }); } catch (e) {}
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

/* ═══════════ AdBlock DNS toggle (v1.5.77; VLAN configurable v1.5.84) ═══════════
 * Toggles the gateway's DHCP option-6 DNS for the user-chosen VLAN
 * (default 20) between AdGuard DNS (ON) and the exact previous value (OFF).
 * Write path verified from real eWeb saves (user DevTools 2026-09-30).
 * Android-APK only (needs the gateway bridge). OFF restores the backed-up
 * value — never an invented DNS. DNS filtering is DNS-level only; it is
 * not described as complete in-app/video ad blocking. */
const AD_DNS_KEYS = { on: 'adDnsOn', backups: 'adDnsBackups', vlan: 'adDnsVlan', legacyBackup: 'adDnsBackup' };
const AD_DNS_DEFAULT_VLAN = '20';
/** v1.5.84: user-configurable VLAN (was hardcoded 20). Digits only. */
function getAdDnsVlan() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  const v = s && s[AD_DNS_KEYS.vlan] != null ? String(s[AD_DNS_KEYS.vlan]).trim() : '';
  return /^\d+$/.test(v) ? v : AD_DNS_DEFAULT_VLAN;
}
/** Gateway vlan tag format, e.g. "lan_20". Pure. */
function adDnsVlanTag(vlan) { return 'lan_' + String(vlan || '').trim(); }
/** Per-VLAN backups: { "lan_20": "<dns>", ... }. Migrates the legacy single backup (always VLAN 20). */
function getAdDnsBackups() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  let b = s && s[AD_DNS_KEYS.backups];
  if (!b || typeof b !== 'object' || Array.isArray(b)) b = {};
  if (s && s[AD_DNS_KEYS.legacyBackup] != null && b['lan_20'] == null) {
    b = Object.assign({}, b, { 'lan_20': String(s[AD_DNS_KEYS.legacyBackup]) });
  }
  return b;
}
/** Pure: back up the current DNS before enabling, unless it is already the AdGuard DNS. */
function adDnsNeedsBackup(cur, adDns) { return String(cur || '').trim() !== String(adDns); }
function getAdDns() {
  let s = null;
  try { s = Store.load(); } catch (_) { s = null; }
  const vlan = getAdDnsVlan();
  const tag = adDnsVlanTag(vlan);
  const backups = getAdDnsBackups();
  return {
    on: !!(s && s[AD_DNS_KEYS.on]),
    backup: backups[tag] != null ? String(backups[tag]) : '',
    vlan,
    tag,
  };
}
/** Keep the card labels in sync with the chosen VLAN (i18n placeholders don't auto-fill). */
function updateDnsLabels() {
  const vlan = getAdDnsVlan();
  document.querySelectorAll('[data-i18n="dns.toggle"]').forEach(el => { el.textContent = tx('dns.toggle', { v: vlan }); });
  document.querySelectorAll('[data-i18n="dns.current"]').forEach(el => { el.textContent = tx('dns.current', { v: vlan }); });
  const inp = $('dns-vlan');
  if (inp && document.activeElement !== inp) inp.value = vlan;
}
async function refreshDnsCard() {
  const tg = $('dns-adblock');
  if (!tg) return;
  const st = getAdDns();
  tg.checked = st.on;
  updateDnsLabels();
  const curEl = $('dns-current');
  if (!curEl) return;
  if (!hasGw()) { curEl.textContent = t('dns.onlyAndroid'); return; }
  if (!GwApi.loggedIn()) { curEl.textContent = t('dns.needGw'); return; }
  curEl.textContent = '…';
  try {
    const data = await GwApi.dhcpOptionRead();
    const v = GwApi.dhcpOption6Of(GwApi.findDhcpVlanEntry(data, st.tag));
    curEl.textContent = v || t('dns.inherit');
  } catch (e) { curEl.textContent = '—'; }
}
async function onAdDnsToggle() {
  const tg = $('dns-adblock');
  const wantOn = !!(tg && tg.checked);
  if (!hasGw()) { toast(t('dns.onlyAndroid'), true); if (tg) tg.checked = !wantOn; return; }
  if (tg) tg.disabled = true;
  const st = getAdDns();
  try {
    if (!(await GwApi.ensureLogin())) throw new Error(t('dns.needGw'));
    if (wantOn) {
      // Backup the exact current value first (unless already on AdGuard —
      // then the true original is already backed up).
      const data = await GwApi.dhcpOptionRead();
      const cur = GwApi.dhcpOption6Of(GwApi.findDhcpVlanEntry(data, st.tag));
      if (adDnsNeedsBackup(cur, GwApi.AD_DNS)) {
        const backups = getAdDnsBackups();
        backups[st.tag] = cur;
        Store.save({ [AD_DNS_KEYS.backups]: backups });
      }
      await GwApi.dhcpOptionSetDns(st.tag, GwApi.AD_DNS);
      Store.save({ [AD_DNS_KEYS.on]: true });
      toast(t('dns.on'));
    } else {
      await GwApi.dhcpOptionSetDns(st.tag, st.backup);
      Store.save({ [AD_DNS_KEYS.on]: false });
      toast(t('dns.off'));
    }
  } catch (e) {
    if (tg) tg.checked = !wantOn; // revert the switch on failure
    toast(String((e && e.message) || e), true);
  } finally {
    if (tg) tg.disabled = false;
    refreshDnsCard();
  }
}
/** v1.5.84: VLAN changed. If AdBlock is ON, restore the old VLAN first so no VLAN is left stuck on AdGuard. */
async function onAdDnsVlanChange() {
  const inp = $('dns-vlan');
  const raw = inp ? String(inp.value).trim() : '';
  if (!/^\d+$/.test(raw)) {
    toast(t('dns.badVlan'), true);
    if (inp) inp.value = getAdDnsVlan();
    return;
  }
  const st = getAdDns();
  if (raw === st.vlan) return;
  if (st.on) {
    if (!hasGw()) { toast(t('dns.onlyAndroid'), true); if (inp) inp.value = st.vlan; return; }
    inp.disabled = true;
    try {
      if (!(await GwApi.ensureLogin())) throw new Error(t('dns.needGw'));
      await GwApi.dhcpOptionSetDns(st.tag, st.backup);
      Store.save({ [AD_DNS_KEYS.on]: false });
      toast(t('dns.vlanChanged'));
    } catch (e) {
      if (inp) inp.value = st.vlan;
      toast(String((e && e.message) || e), true);
      return;
    } finally {
      inp.disabled = false;
    }
  }
  Store.save({ [AD_DNS_KEYS.vlan]: raw });
  refreshDnsCard();
}

async function loadAccountInfo() {
  try {
    let info = null;
    try { info = S.account || await Api.getAccountInfo(); } catch (e) { /* open API may be empty on SSO-only login */ }
    info = info || {};
    S.account = info;
    let email = info.account || info.email || '';
    const name = info.userName || info.username || '';
    // v1.5.66 — No.5: fall back to the SSO saved email from the Android
    // bridge — the open-API org/account/info call can come back empty while
    // the portal session is active. Never leave the "Ruijie"/"မ" defaults
    // when a real account exists: show the Account Name only.
    if (!name && !email) {
      try {
        const bi = JSON.parse((window.RuijieBridge && window.RuijieBridge.ssoAccountInfo()) || '{}');
        if (bi && bi.has && bi.email) email = bi.email;
      } catch (e) {}
    }
    const shown = name || email;
    if (shown) {
      $('topbar-account').textContent = shown;
      const av = $('topbar-avatar');
      if (av) av.textContent = shown.trim().charAt(0).toUpperCase();
    }
    const tenant = info.tenantId || info.defaultTenantId || '';
    // fix5: drop the tenant row entirely when it can't be shown
    $('account-info').innerHTML = `<dl class="kv">
      <dt>${t('ai.name')}</dt><dd>${esc(name || '—')}</dd>
      <dt>Email</dt><dd>${esc(email || '—')}</dd>
      ${tenant ? `<dt>${t('ai.tenant')}</dt><dd>${esc(tenant)}</dd>` : ''}
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
async function init() {
  if (init._done) return; // guard against double script evaluation
  init._done = true;
  Tele.load(); Learn.load(); // v1.5.75: monitoring queue + usage learning
  // v1.5.75: report JS errors for monitoring (rate-limited inside Tele.err)
  window.addEventListener('error', e => {
    try { Tele.err(String((e && e.message) || 'unknown error').slice(0, 200)); Tele.flush(); } catch (x) {}
  });
  initTheme();
  initLayoutMode(); // v1.5.63: Auto/Phone/Tablet layout override
  initLang();
  initLiquidWobble();
  initPullToRefresh();
  // v1.5.92: Seed one history entry so WebView.canGoBack() is true from
  // launch — system Back then always reaches our popstate handler instead
  // of falling through to the native exit path.
  try { history.replaceState({ view: 'view-vouchers' }, ''); history.pushState({ view: 'view-vouchers' }, ''); } catch (e) {}
  initIosPickers();   // v1.5.55: bottom-sheet pickers for project/usergroup/package
  initKickSettings(); // v1.5.55: kick toggle + status
  initTeleSettings(); // v1.5.75: monitoring toggle
  initUpdateSettings(); // in-app update: check + auto-download toggle
  initTabbarDrag();   // v1.5.55: press-drag along the tabbar to switch pages

  // password peek toggles
  document.querySelectorAll('[data-peek]').forEach(b => b.addEventListener('click', () => {
    const i = $(b.dataset.peek);
    if (i) i.type = i.type === 'password' ? 'text' : 'password';
  }));

  $('btn-connect').addEventListener('click', doConnect);
  // v1.5.79: named profile login
  $('btn-profile-login').addEventListener('click', doProfileLogin);
  $('pf-name').addEventListener('keydown', e => { if (e.key === 'Enter') doProfileLogin(); });
  $('btn-profile-create').addEventListener('click', showProfileNew);
  $('btn-profile-update').addEventListener('click', e => { e.preventDefault(); showProfileUpdate(); });
  $('btn-profile-manual').addEventListener('click', () => {
    $('view-profile').classList.add('hidden');
    $('view-connect').classList.remove('hidden');
    playLoginMorph(document.querySelector('#view-connect .connect-card'), 'connect.btn'); // v1.5.142
  });
  // v1.5.79: manual connect screen → back to the profile login gate
  $('btn-connect-back').addEventListener('click', e => { e.preventDefault(); showProfileGate(); });
  $('btn-profile-new-save').addEventListener('click', doProfileCreate);
  $('btn-profile-new-back').addEventListener('click', profileFormBack);
  $('btn-profile-done-back').addEventListener('click', profileFormBack);
  // v1.5.144: owner PIN — reveal the PIN fields while typing the name (create)
  $('pfn-name').addEventListener('input', () => {
    if (profileFormMode !== 'create') return;
    $('pfn-pin-wrap').classList.toggle('hidden', Profiles.normName($('pfn-name').value) !== 'praythein');
  });
  // v1.5.144: PIN screen — digits drive the dots, auto-submit at 6
  $('pin-input').addEventListener('input', e => {
    const el = e.target;
    const d = String(el.value).replace(/\D/g, '').slice(0, 6);
    if (el.value !== d) el.value = d;
    pinPaint(d);
    if (d.length === 6) pinSubmit(d);
  });
  $('btn-pin-back').addEventListener('click', e => {
    e.preventDefault();
    pinState = null; pinHide(); showProfileGate();
  });
  const bmp = $('btn-my-profile');
  if (bmp) bmp.addEventListener('click', showProfileUpdateFromSettings);
  // v1.5.121: manual settings sync button
  const bss = $('btn-sync-settings');
  if (bss) bss.addEventListener('click', async () => {
    const st = $('sync-status');
    try {
      if (st) st.textContent = 'Syncing…';
      // v1.5.124: pull FIRST (get other phone's changes), then push (send our changes)
      const pullR = (typeof SettingsSync !== 'undefined') ? await SettingsSync.pull() : { ok: false };
      if (pullR.ok && pullR.applied && typeof refreshSyncedUI === 'function') {
        try { refreshSyncedUI(Store.load()); } catch (e) {}
      }
      const pushR = (typeof SettingsSync !== 'undefined') ? await SettingsSync.push() : { ok: false };
      if (st) {
        if (pushR.ok && pullR.ok) st.textContent = '✓ Synced ' + new Date().toLocaleTimeString();
        else st.textContent = '✗ ' + (pullR.reason || pushR.reason || 'failed');
      }
    } catch (e) { if (st) st.textContent = '✗ error'; }
  });
  document.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', () => switchView(tb.dataset.view, false)));
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
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers', false);
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
  $('btn-printer-top').addEventListener('click', () => switchView('view-printer', false));
  $('btn-refresh-vouchers').addEventListener('click', function () {
    if ($('view-vouchers').classList.contains('hidden')) switchView('view-vouchers', false);
    this.classList.add('spinning');
    loadVouchers().finally(() => this.classList.remove('spinning'));
  });
  // v1.5.54: bulk select
  $('btn-bulk-select').addEventListener('click', toggleBulkMode);
  $('btn-bulk-print').addEventListener('click', bulkPrint);
  $('btn-bulk-delete').addEventListener('click', bulkDelete);
  // v1.5.101: voucher More menu (Delete Expired Vouchers, Reset)
  $('btn-voucher-more').addEventListener('click', e => { e.stopPropagation(); toggleVoucherMore(); });
  document.addEventListener('click', e => {
    const m = $('voucher-more-menu');
    if (m && !m.classList.contains('hidden') && !e.target.closest('#voucher-more-menu') && !e.target.closest('#btn-voucher-more')) toggleVoucherMore(false);
  });
  $('btn-del-expired').addEventListener('click', () => { toggleVoucherMore(false); deleteExpiredVouchers(); });
  $('btn-reset-selected').addEventListener('click', () => { toggleVoucherMore(false); resetSelectedVouchers(); });

  document.querySelectorAll('#voucher-status-chips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#voucher-status-chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); S.vStatus = c.dataset.s; renderVouchers();
  }));
  $('modal-close').addEventListener('click', () => closeModal('modal'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal('modal'); });
  $('modal-print').addEventListener('click', () => { if (modalVoucher) doPrint([{ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }]); });
  // v1.5.67: Disconnect from the voucher detail sheet — same verified flow
  // as the sticky-row button (confirm → SSO kick → voucher marked Expired).
  // The voucher code is the portal auth account for voucher-auth clients;
  // no auth record (client offline) → honest "not found" toast, no-op.
  $('modal-disconnect').addEventListener('click', async () => {
    if (!modalVoucher) return;
    const w = kickRemainWarning(modalVoucher);
    if (!(await iosConfirm(w || t('kick.confirm'), '', t('kick.kick'), t('a.cancel'), true))) return;
    const ok = await requestKick({ account: vCode(modalVoucher) }, { auto: false });
    if (ok) { modalVoucher = null; closeModal('modal'); loadVouchers(); }
  });
  // v1.5.86: MAC unbind from voucher preview (user request)
  $('modal-unbind').addEventListener('click', async () => {
    if (!modalVoucher) return;
    const v = modalVoucher;
    const code = v.voucherCode || v.codeNo || v.code || '';
    try {
      toast(t('unbind.loading') || 'MAC စာရင်း ဖတ်နေပါတယ်…');
      // tenantName = Ruijie account email (portal URL path segment, e.g. cupidleo8387@gmail.com)
      let tenantName = (S.account && (S.account.account || S.account.email)) || '';
      if (!tenantName) {
        try {
          const bi = JSON.parse((window.RuijieBridge && window.RuijieBridge.ssoAccountInfo()) || '{}');
          if (bi && bi.email) tenantName = bi.email;
        } catch (e) {}
      }
      const list = await Api.voucherBindMacListSso(S.projectId, v, tenantName, '');
      if (!list || !list.length) { toast(t('unbind.none') || 'Bind ထားတဲ့ MAC မရှိပါ'); return; }
      const macs = list.map(x => x.mac).filter(Boolean).join(', ');
      if (!(await iosConfirm(t('unbind.confirm') || 'MAC unbind လုပ်မှာလား?', macs, t('unbind.unbind'), t('a.cancel'), true))) return;
      const recordList = list.map(x => x.recordUuid).filter(Boolean);
      const macList = list.map(x => x.mac).filter(Boolean);
      await Api.voucherUnbindMacSso(S.projectId, v, recordList, macList, '');
      toast(t('unbind.done') || 'MAC unbind ပြီးပါပြီ');
    } catch (e) {
      toast((t('unbind.fail') || 'Unbind မရပါ: ') + (e.message || e));
    }
  });
  // v1.5.129: Reset button in voucher detail (user request, like Ruijie Cloud)
  $('modal-reset').addEventListener('click', async () => {
    if (!modalVoucher) return;
    const v = modalVoucher;
    if (!(await iosConfirm(tx('v.resetConfirm', { n: 1 }), vCode(v), t('v.reset'), t('a.cancel'), true))) return;
    try {
      await Api.voucherReset(S.projectId, v);
      // v1.5.129: optimistically clear usage so status updates immediately
      try {
        v.usedTime = 0; v.usedQuota = 0;
        const sv = (S.vouchers || []).find(x => x.uuid === v.uuid);
        if (sv) { sv.usedTime = 0; sv.usedQuota = 0; }
      } catch (e) {}
      toast(t('v.resetDone', { ok: 1 }));
      modalVoucher = null; closeModal('modal'); loadVouchers();
    } catch (e) {
      toast(String((e && e.message) || e || ''), true);
    }
  });
  $('modal-queue').addEventListener('click', () => { if (modalVoucher) addToQueue({ code: vCode(modalVoucher), pkg: modalVoucher.packageName, period: modalVoucher.timePeriod, quota: modalVoucher.quota }); });

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

  // v1.5.84: theme/layout pickers (Settings → Appearance/Layout) — iOS
  // bottom-sheet style like Profile (Package)
  fillThemeLayoutSelects();
  const _st = $('set-theme');
  if (_st) { enhanceIosPicker(_st); _st.addEventListener('change', () => applyTheme(_st.value)); }
  const _sl = $('set-layout');
  if (_sl) { enhanceIosPicker(_sl); _sl.addEventListener('change', () => applyLayoutMode(_sl.value)); }

  // language (မြန်မာ / English)
  document.querySelectorAll('#lang-seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  $('btn-generate').addEventListener('click', doGenerate);
  $('btn-generate-print').addEventListener('click', doGeneratePrint);
  $('btn-gen-print-all').addEventListener('click', () => doPrint(genResultItems));
  $('btn-recent-print-all').addEventListener('click', () => doPrint(recentGenItems));
  $('btn-recent-queue-all').addEventListener('click', () => { recentGenItems.forEach(addToQueue); });
  $('btn-gen-queue-all').addEventListener('click', () => { genResultItems.forEach(addToQueue); });
  $('btn-queue-print').addEventListener('click', () => doPrint(S.queue));
  $('btn-queue-clear').addEventListener('click', () => { S.queue = []; renderQueue(); });

  // print layout & typography
  loadPrintStyle();
  wireGenerateView();
  wireLayoutModal();
  // bluetooth thermal printer (printer-v1 engine, APK only)
  initBtPrinter();
  btPollStart();
  // v1.5.135: V1-style auto-connect — one silent attempt to the default
  // (else last-used) printer at startup. No toggle, no retry, no backoff.
  // Native also retries on Bluetooth-on / discovery / ACL events.
  setTimeout(() => { try { btCall(B => B.btAutoConnect()); } catch (e) {} }, 2000);
  wireTypoModal();
  $('btn-print-layout').addEventListener('click', openLayoutModal);
  $('btn-print-typo').addEventListener('click', openTypoModal);

  document.querySelectorAll('#more-menu .menu-item').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.more;
    if (k === 'accounts') moreAccounts();
    else if (k === 'usergroups') moreUserGroups();
    else if (k === 'devices') moreDevices();
    else if (k === 'firmware') moreFirmware(); // v1.5.145: dedicated firmware screen
    else if (k === 'overview') moreOverview();
    else if (k === 'traffic') moreTraffic(); // v1.5.78: Flow Table traffic view
    else if (k === 'qos') moreQoS(); // v1.5.150: QoS management (verified APIs)
    else if (k === 'webauth') moreWebAuth(); // v1.5.96 Fix13: gateway Web Authentication editor
    else if (k === 'wifi') moreWifi(); // v1.5.87: SSID list / create / password change
    else if (k === 'clients') moreClients();
    else if (k === 'history') moreHistory(); // v1.5.54
    else if (k === 'networks') moreNetworks();
  else if (k === 'sales') moreSales();
  else if (k === 'recorder') startNetworkRecorder(); // v1.5.106: portal network recorder
  else if (k === 'gwrecorder') startGatewayRecorder(); // v1.5.147: gateway network recorder
  else if (k === 'appdevices') moreAppDevices(); // v1.5.143: app install device registry (admin)
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
  const _ad = $('dns-adblock'); if (_ad) _ad.addEventListener('change', onAdDnsToggle); // v1.5.77
  const _adv = $('dns-vlan'); if (_adv) _adv.addEventListener('change', onAdDnsVlanChange); // v1.5.84
  // SSO login/logout events from the native dialog
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
  $('btn-disconnect').addEventListener('click', async () => {
    if (!(await iosConfirm(t('confirm.signout'), '', t('confirm.signoutBtn'), t('a.cancel'), true))) return;
    Api.clearCfg();
    location.reload();
  });

  applyLang();

  Api.loadCfg();
  // v1.5.143: device install control — wire the lock screen buttons once.
  const dr = $('devlock-retry');
  if (dr) dr.addEventListener('click', async () => {
    dr.disabled = true;
    try {
      if (await devStartupGate()) {
        if (Api.cfg && Api.cfg.appid) enterApp();
        else showProfileGate(); // v1.5.79: named profile login (manual connect via link)
      }
    } finally { dr.disabled = false; }
  });
  const dc = $('devlock-copy');
  if (dc) dc.addEventListener('click', () => {
    const idtxt = ($('devlock-id') && $('devlock-id').textContent) || '';
    const done = () => toast(t('dev.copied'));
    const fail = () => toast(t('dev.copyFail'), true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(idtxt).then(done, fail);
    } else {
      const ta = document.createElement('textarea');
      ta.value = idtxt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
      ta.remove();
    }
  });
  // Login stays clean: proxy has a working default and is editable in Settings.
  // Show the login proxy field only on web when no proxy is saved yet (it is required there).
  const pf = $('cfg-proxy');
  const needProxyField = !hasBridge() && !(Api.cfg && Api.cfg.proxy);
  if (pf && pf.closest('label')) pf.closest('label').style.display = needProxyField ? '' : 'none';
  // v1.5.143: device gate runs before anything else; the 30-min watcher
  // re-checks while the app runs.
  devWatchStart();
  if (await devStartupGate()) {
    if (Api.cfg && Api.cfg.appid) enterApp();
    else showProfileGate(); // v1.5.79: named profile login (manual connect via link)
  }
}

document.addEventListener('DOMContentLoaded', init);
