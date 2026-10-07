# Reset auto-kick spec — P Manager next update

User request (2026-10-06, live chat): the voucher-detail **Reset** button must
**kick/disconnect the client first, then reset** — no separate manual
Disconnect press. Reason: reset only refills quota/time on the portal; the
client's active gateway session survives, so the phone keeps internet access.
(2026-09-29 lesson: reset/delete is not enforcement — disconnect/deauth is.)

Second part of the same request: after reset, the voucher must NOT sit in
**Expired** — the kick's 24h Expired mark must be cleared so the voucher shows
**Unused** (fresh). ("Active" = the app's "Unused" status.)

## What exists today (v153 source)

- `modal-reset` click handler — `js/app.js:9581-9598` (v1.5.129):
  calls `Api.voucherReset(S.projectId, v)` (SSO portal envelope
  `/intlSamVoucher/voucher/reset`, `js/api.js:1535-1572`), optimistically zeroes
  `usedTime`/`usedQuota`, toasts, closes modal, `loadVouchers()`. **No kick.**
- Kick flow — `requestKick(c, opts)` `js/app.js:6663`:
  resolves the portal auth record via `kickAuthRecord` (`js/app.js:6653`,
  account match then MAC fallback — never guessed), then
  `Api.clientKickSso` (`js/api.js:1931`, verified envelope `/samTransfer/kick/user/offline`,
  `js/api.js:1914-1929`). On success it calls `markKickedVoucher(rec.account)`
  (`js/app.js:6501`, 24h TTL in `Store.kickedVouchers`).
- Expired display — effective status at `js/app.js:6642`:
  `status==='3' || voucherQuotaGone || voucherHoursGone || voucherKicked(v)` → '3'.
  So the kick mark is what parks the voucher in Expired.
- No `clearKickedVoucher()` exists — it must be added.

## Change (minimal, detail Reset button only)

1. **Add `clearKickedVoucher(code)`** next to `markKickedVoucher` (`js/app.js`
   after line ~6507): mirror implementation — `delete kickedVoucherMarks()[code]`,
   `Store.save({ kickedVouchers: m })`.

2. **Rewrite the `modal-reset` handler** (`js/app.js:9582-9598`) to:
   ```
   confirm (existing v.resetConfirm)                     // keep one confirm only
   rec = await kickAuthRecord({ account: vCode(v) })     // may return null
   if (rec):
       ok = await requestKick({ account: vCode(v) }, { auto: false })
       if (!ok) return                                   // kick failed — error already toasted; do NOT reset
   // no rec → client offline; reset alone is correct, skip kick silently
   await Api.voucherReset(S.projectId, v)                // throws on portal error
   clearKickedVoucher(vCode(v))                          // NEW — undo the kick's Expired mark
   v.usedTime = 0; v.usedQuota = 0 (+ S.vouchers copy)    // existing optimistic clear
   toast v.resetDone; close modal; loadVouchers()
   ```
   Notes:
   - `requestKick` with `{auto:false}` reuses the verified path and its toasts
     (`kick.norecord` / portal error). Do NOT add a second confirm — the reset
     confirm already gates the action. Consider appending "client will be
     disconnected first" to the `v.resetConfirm` Burmese text
     (`js/app.js:161`).
   - `kickAuthRecord` swallows `portalAuthUsers` fetch failures (returns null),
     which would silently skip the kick. Decide: treat fetch-failure as abort
     (safer for the enforcement intent) or accept the skip. Recommended: abort
     with a toast — resetting while unsure the client is offline reproduces
     the exact bug the user reported.
   - Do NOT clear the MAC-level mark (`markKicked`, `js/app.js:6479`) — it drives
     the client-row badge and the 5-min auto-kick cooldown; leave it to expire.
   - After `clearKickedVoucher` + zeroed usage, the status function at `:6642`
     returns to the natural status → **Unused**. No other status surgery needed;
     the existing `loadVouchers()` refresh confirms against the portal.

3. **Bulk reset (`resetSelectedVouchers`, `js/app.js:2741`)** — out of scope for
   now. Open question for the user/main agent: apply the same kick-first
   behavior per selected voucher there, or keep bulk reset as reset-only?
   (One kick per voucher = one portal round-trip each; fine at this scale, but
   it is a behavior change the user didn't ask for.)

## Must be field-tested before release (standing rule)

On a live client: Reset → client drops offline within ~60s (portal cache lag) →
voucher shows **Unused** (not Expired) → client reconnects and must log in with
the code again. Also test the offline-client case (no auth record → reset
proceeds, no kick attempted) and the kick-failure case (reset aborted, honest
error toast).
