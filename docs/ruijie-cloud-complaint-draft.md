# Ruijie Cloud complaint draft — unknown voucher codes accepted (2026-10-06)

Prepared 2026-10-06 ~15:10 +0630. Reason: Time Code Manager's Facebook page
posted this morning (~10:30) that voucher codes they never created are being
accepted by Ruijie Cloud, and asked the community to file complaints/reports
with Ruijie. Our own P Manager "သူစိမ်း code" scan (shipped v1.5.198 today)
detects exactly this class of problem client-side, but the cloud-side
acceptance can only be fixed by Ruijie.

## Where to file (pick one)
- Case Portal: https://caseportal.ruijienetworks.com (needs a Ruijie account)
- Community: https://community.ruijie.com
- Email: techsupport@ireyee.com (Reyee support)

## Account caveat
The Ruijie Cloud account in daily use is myint2moe2025@gmail.com, which is
HNSL's account, not Pray Thein's own. The report should ideally be filed by
the account owner, or with the owner's knowledge. Fill in the real account /
project / group before sending.

## Draft (English)

Subject: Captive portal accepts voucher codes that were never generated —
server-side voucher validation bypass

Body:

Hello Ruijie support,

We operate a voucher-based WiFi hotspot business on Ruijie Cloud (account:
[ACCOUNT EMAIL], project: [PROJECT NAME], group ID: [GROUP ID], gateway:
RG-EG105G-V3).

On 2026-10-06 we observed clients authenticating through the captive portal
(authType "15" = Voucher) using voucher codes that were NEVER generated in
our account. The codes do not exist in our voucher list (checked in Ruijie
Cloud portal and via API), yet the clients obtained internet access.

Example unknown codes seen in auth records: [CODE 1], [CODE 2]
(record timestamps: [TIME]).

Expected behavior: the portal / cloud auth server must reject voucher codes
that do not exist in the account. Actual behavior: unknown codes are
accepted, granting unauthorized internet access. This causes direct revenue
loss for voucher-based operators, and other operators in the community
(Time Code Manager page, 2026-10-06) report the same issue.

Request:
1. Investigate server-side voucher validation for portal voucher
   authentication on our project.
2. Confirm whether unknown/never-generated voucher codes are currently
   accepted, and under what conditions.
3. Provide a fix or mitigation, and advise how to prevent recurrence.

Evidence we can attach: screenshots of auth records (authuserinfos) showing
the unknown account codes vs. our voucher list export.

Thank you,
[NAME]
[CONTACT]

## Notes
- Do NOT file from memory-invented codes: pull 2–3 real examples from the
  P Manager More → "သူစိမ်း code" scan (online clients only) before sending.
- Filing is the user's decision; this draft is ready to copy-paste.
