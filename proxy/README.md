# Ruijie Cloud API Proxy

Ruijie Cloud open API က browser ကနေ တိုက်ရိုက်ခေါ်လို့မရအောင် CORS header မပေးပါဘူး။
ဒီ proxy က server-side ကနေ API ကို ခေါ်ပေးပြီး browser ကို CORS header နဲ့ပြန်ပေးပါတယ်။
**Dependency လုံးဝမလိုပါ** — Node.js သက်သက်နဲ့ run နိုင်ပါတယ်။

## Run

```bash
node server.js
# PORT=3001 (default), env: PORT, ALLOWED_ORIGINS, RATE_PER_MIN
```

## API

- `GET /health` → `{ ok: true, ... }`
- `POST /api/ruijie`

```json
{
  "cloud": "https://cloud-as.ruijienetworks.com",
  "appid": "YOUR_APP_ID",
  "secret": "YOUR_APP_SECRET",
  "method": "GET",
  "path": "open/auth/voucher/getList/6752877",
  "query": { "start": 0, "pageSize": 50 },
  "body": {}
}
```

Response = Ruijie Cloud က ပြန်ပေးတဲ့ JSON အတိုင်း။

## Token စီမံခန့်ခွဲမှု

- `appid`+`secret` တစ်စုံချင်းစီအတွက် access token ကို memory ထဲမှာ cache လုပ်ထားပါတယ်
- Token သက်တမ်း ၃၀ ရက် (doc အရ) — ၂၅ ရက်ပြည့်ရင် ကြိုပြီး refresh လုပ်ပါတယ်
- Ruijie က `code: 4` (token မမှန်) ပြန်ရင် refresh တစ်ခါလုပ်ပြီး ပြန်ခေါ်ပါတယ်

## လုံခြုံရေး

- App secret တွေကို disk မှာ **ဘယ်တော့မှ မသိမ်းပါ** — token တွေက RAM ထဲမှာသာ ရှိပါတယ်
- Request body 1MB limit, per-IP rate limit (default 120 req/min)
- `path` ကို whitelist pattern (`[A-Za-z0-9_\-/.]`) နဲ့ စစ်ပါတယ်
- Production မှာ `ALLOWED_ORIGINS` ကို ကိုယ့် web app domain တည်းသာ ထားသင့်ပါတယ်

## Deploy

**Render.com (အခမဲ့):** Root Directory = `proxy`, Start Command = `node server.js`

**Docker:**
```bash
docker build -t ruijie-proxy ./proxy
docker run -p 3001:3001 ruijie-proxy
```

**VPS:** `node server.js` ကို systemd/pm2 နဲ့ run ပါ။
