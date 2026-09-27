# Ruijie Voucher App

Ruijie Cloud ပေါ်က voucher တွေကို စီမံဖို့ app — လူအများ (ဥပမာ ၁၀၀) က
ကိုယ့် Ruijie Cloud App ID/Secret နဲ့ ဝင်သုံးနိုင်ပါတယ်။ **Web App** နဲ့ **Android APK**
၂ မျိုးလုံး ပါဝင်ပါတယ်။

## ရွေးချယ်စရာ ၂ မျိုး

| | 🌐 Web App | 📱 Android APK |
|---|---|---|
| သုံးပုံ | Browser မှာ link ဖွင့်သုံး | ဖုန်းမှာ install လုပ်သုံး |
| Proxy server | လိုအပ် (CORS ကြောင့်) | **မလို** (native HTTPS) |
| Print | Browser print dialog | Android system print |
| ဖြန့်ပုံ | Link တစ်ခု share ရုံ | APK file ပို့ပေးရ |

## 📱 Android APK

`android/` ထဲမှာ native project ပါတယ် — WebView + `RuijieBridge`
(native HTTPS, token cache/refresh, thermal print)။

Build နည်း (portable JDK 17 + Android SDK build-tools/platform လိုအပ်):
```bash
cd android
./build-apk.sh   # app/build/apk/ruijie-voucher-1.0.0.apk
```
Gradle မလိုပါ — `aapt2`/`d8`/`apksigner` နဲ့ တိုက်ရိုက် build ပါတယ်။
Keystore အတွက် `~/.gradle/gradle.properties` မှာ ထည့်ပါ:
```properties
rvkStoreFile=/path/to/ruijie-voucher.keystore
rvkStorePassword=...
rvkKeyAlias=ruijie-voucher
rvkKeyPassword=...
```

APK ကို ဖုန်းမှာ install လုပ်ပြီးတာနဲ့ App ID/Secret ထည့်၊ တိုက်ရိုက်သုံးနိုင်ပါတယ် —
proxy server လုံးဝမလိုပါ။

## 🌐 Web App + Proxy

### ဘာလို့ Proxy လိုတာလဲ?

Ruijie Cloud API က browser ကနေ တိုက်ရိုက်ခေါ်လို့မရအောင် CORS header မပေးပါဘူး။
ဒါကြောင့် `proxy/` ထဲက Node.js server သေးသေးလေးက ကြားခံအဖြစ် API ကို ခေါ်ပေးပြီး
browser ကို CORS header နဲ့ ပြန်ပေးပါတယ်။

## အစိတ်အပိုင်းများ

| အပိုင်း | ဖော်ပြချက် | Host |
|---|---|---|
| `index.html` + `css/` + `js/` | Web app (static, build မလို) | GitHub Pages |
| `proxy/server.js` | CORS proxy (Node.js, dependency မလို) | Render / Railway / Fly.io / VPS |

## Proxy Deploy လုပ်နည်း (Render.com — အခမဲ့)

1. https://render.com မှာ အကောင့်ဖွင့်ပါ
2. **New → Web Service →** ဒီ repo ကို ရွေးပါ
3. Settings:
   - **Root Directory:** `proxy`
   - **Build Command:** *(ချန်ထားပါ — dependency မလို)*
   - **Start Command:** `node server.js`
4. Deploy ပြီးရင် ရလာတဲ့ URL (ဥပမာ `https://ruijie-proxy.onrender.com`) ကို
   app ရဲ့ **ဆက်တင် → Proxy URL** မှာ ထည့်ပါ

> Railway / Fly.io / ကိုယ့် VPS မှာလည်း `node proxy/server.js` (port `3001`) run ရုံနဲ့ရပါတယ်။
> Docker သုံးချင်ရင် `proxy/Dockerfile` ပါပြီးသား။

## App သုံးနည်း

1. GitHub Pages link ကို ဖွင့်ပါ
2. ပထမဆုံး screen မှာ ထည့်ပါ —
   - **Cloud URL:** `https://cloud-as.ruijienetworks.com` (ပုံမှန်အတိုင်းထားနိုင်)
   - **App ID / App Secret:** Ruijie Cloud Open Platform (cloud.ruijienetworks.com → Open Platform) က ထုတ်ထားတာ
   - **Proxy URL:** အပေါ်က deploy လုပ်ထားတဲ့ proxy လိပ်စာ
3. **ချိတ်ဆက်မယ်** နှိပ်ပါ — Ruijie Cloud account အချက်အလက် ပေါ်လာရင် အောင်မြင်ပါပြီ

> 👥 လူ ၁၀၀ သုံးမယ်ဆိုရင် တစ်ယောက်ချင်းစီက ကိုယ့် App ID/Secret ကို
> ကိုယ့်စက်ပေါ်မှာ ထည့်သုံးရပါမယ် (အချက်အလက်က browser localStorage မှာသာ သိမ်းထားတာပါ)။

## လုပ်ဆောင်ချက်များ

- 🎟️ **ဗောက်ချာ** — project အလိုက် list၊ ရှာဖွေမှု၊ status filter၊ အသေးစိတ်ကြည့်မှု၊ ပရင့်ထုတ်မှု
- ➕ **ထုတ်မယ်** — package ရွေး၊ အရေအတွက် (၁–၅၀၀) ထုတ်; စိတ်ကြိုက်ကုဒ် (xxxx-xxxx) ထုတ်
- 🖨️ **ပရင်တာ** — 58/80mm thermal စာရွက်၊ ခေါင်းစဉ်/အောက်ခြေစာသား၊ print queue
- ⋯ **More** — Auth Accounts (CRUD), User Groups, Devices, Online Clients, Networks
- ⚙️ **ဆက်တင်** — ချိတ်ဆက်မှုပြင်ဆင်မှု၊ အကောင့်အချက်အလက်

## API မှတ်ချက်

- Ruijie Cloud API Reference Manual V2.0.3 အတိုင်း ရေးထားပါတယ်
- Cloud က ပြန်ပေးတဲ့ data အတိုင်းပဲ ပြပါတယ် — data အတုမထည့်ထားပါ
- ⚠️ Voucher **ဖျက်တဲ့** endpoint က public API manual မှာ မပါဝင်သေးပါဘူး —
  Ruijie က တရားဝင်ထုတ်ပြန်မှ ထည့်သွင်းပါမယ်

## Local စမ်းသပ်နည်း

```bash
# proxy run
node proxy/server.js   # http://localhost:3001

# web app serve (python)
cd /path/to/repo && python3 -m http.server 8080
# browser မှာ http://localhost:8080 ဖွင့်၊ Proxy URL = http://localhost:3001
```
