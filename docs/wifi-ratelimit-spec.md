# Per-client speed-limit write path — VERIFIED spec (2026-09-30 ~02:00 +0630)

Source: portal's own public JS chunks (read-only inspection, no login needed for the chunks;
login used only to find the WiFi settings page). Nothing was changed in the portal.

## Transport (identical envelope to the verified kick)
- Outer: `POST https://cloud-as.ruijienetworks.com/webproxy/common/api?<api-path>`
- Body: `{ api: "<api-path>", method: "<GET|PUT|POST|DELETE>", querys: {...}, params: {...}, module: "default" }`
- `querys` and `params` travel in the POST body, NOT the URL. `{placeholders}` in the
  api path are substituted before sending.
- Chunk evidence: `macc5/assets/httpRequest-zwku8t7L.js` builds
  `` `${n}/webproxy/${r}/api?${t.api.split("?")[0]}` `` then `axios.post(p, t, l)`.

## Endpoints (literal strings from macc5/assets/vue2Compat-C0IKy1jx.js)
| const | path | method |
|---|---|---|
| CONF_GROUPAP_TPL_GET_API | /conf/group/{group_id}/templates | GET |
| SSID_WIFI_GRP_WIFI | /conf/wifi_grp/wifi | GET |
| CONF_TPL_SSID_UPDATA_API | /conf/template/{id}/ssid/{ssid_id} | PUT |
| CONF_TPL_SSID_ADD_API | /conf/template/{id}/ssid | POST |
| CONF_TPL_SSID_DEL_API | /conf/template/{id}/ssid/{ssid_id} | DELETE |

## Load flow (from macc5/assets/wirelessSsid-BQgFCAUs.js, SSIDPage.initData)
1. `{api: "/conf/group/{group_id}/templates", method: "GET"}` →
   response fields: `code, msg, tempList[]`, `tempList[0].id` = template id, `networkName`.
2. `{api: "/conf/wifi_grp/wifi", method: "GET", querys: {group_id, conf_template_id: tempList[0].id}}` →
   response: `{code, msg, data: {ssidList[], deviceSsidList[], grpList[] (each gid), radioList[], userIsolation, scene, radio3Mode}}`.
3. SSID identity: `id` (= ssidId; substituted as `{ssid_id}` on save), `wlanId`, `ssidName`.
   Rate fields per SSID: `upRate`, `downRate` (per-client; required-field validators in the
   edit form), `wlanUpRate`, `wlanDownRate` (per-SSID caps). Also present: password,
   ishidden, ssidEncode, fowardType, vlanType, vlanId, encryptionMode, relatedRadio,
   isApartment, bandSelectEnable, axMode, qosEnable, wlanQosEnable, authEnable,
   ppskEnable, authEntity.

## Save flow (from macc5/assets/SeniorIndex-D70dfrR8.js, SSID table component)
- `{api: "/conf/template/{id}/ssid/{ssid_id}", method: "PUT", params: {wirelessConfEntity: {...}}}`
  where `{id}` = template id, `{ssid_id}` = SSID id, and the object is a **cloneDeep of the
  ENTIRE SSID form object** (relatedRadio joined to comma string, authEntity defaulted
  to `{}`). The portal sends the FULL config, never a partial delta.
- ⚠️ App implementations MUST do the same: GET the full SSID object, change ONLY the
  rate fields, PUT the full object back. A partial `wirelessConfEntity` risks wiping the
  SSID password/encryption.

## Safe test procedure (NOT yet run — needs user go-ahead, morning)
1. Read-only: run steps 1–2 of the load flow against the live project; confirm the
   target SSID appears with its current upRate/downRate.
2. No-op write: PUT the UNCHANGED full object back; expect `{code: 0}`. This verifies
   the whole round trip without altering the shop WiFi.
3. Only then: PUT with modified rate fields on a TEST/non-critical SSID first, run a
   client speed test to calibrate units (doc gives no units; Ruijie CLI uses 8 Kbps
   units = 1 KB/s — cloud API unit unverified).
4. Never test the PUT directly on the production shop SSID without the user watching.

## Status
- Wire format: VERIFIED (portal's own code). Operational test: PENDING user approval.
- v1.5.76 does NOT contain the write path (no-speculation rule) — read-only quality
  flags only. Write path is v1.5.77 material after the safe test above passes.
