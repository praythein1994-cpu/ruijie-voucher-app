#!/usr/bin/env python3
"""
Server-side Auto-Kick for P Manager (GitHub Actions).
Runs on schedule, kicks quota-spent / time-expired voucher clients.

Env vars (GitHub Secrets):
  RUIJIE_EMAIL      - Ruijie Cloud account email (for SSO/CAS login)
  RUIJIE_PASSWORD   - Ruijie Cloud account password
  RUIJIE_APPID      - Cloud Open API App ID (for voucher fetch)
  RUIJIE_SECRET     - Cloud Open API App Secret
  RUIJIE_GROUP_ID   - Project/Group ID
  RUIJIE_CLOUD      - Cloud base URL (default: https://cloud-as.ruijienetworks.com)

Flow:
  1. Playwright: CAS login via https://cloud-as.ruijienetworks.com/webproxy/sso/back
     -> captures SSO session cookies
  2. Cloud Open API: fetch vouchers
  3. Find spent (status=="2" and (quota used up or time used up))
  4. Webproxy (with SSO cookies): find auth record per voucher, kick via
     /samTransfer/kick/user/offline
"""

import os
import sys
import time
import json
import requests
from datetime import datetime, timezone

CLOUD = os.environ.get("RUIJIE_CLOUD", "https://cloud-as.ruijienetworks.com")
EMAIL = os.environ["RUIJIE_EMAIL"]
PASSWORD = os.environ["RUIJIE_PASSWORD"]
APPID = os.environ["RUIJIE_APPID"]
SECRET = os.environ["RUIJIE_SECRET"]
GROUP_ID = os.environ["RUIJIE_GROUP_ID"]

WEBPROXY = f"{CLOUD}/webproxy/common/api"


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


# ── Step 1: CAS login via Playwright, capture cookies ──
def sso_login():
    from playwright.sync_api import sync_playwright

    log("Starting browser for CAS login...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"
        )
        page = ctx.new_page()
        page.goto(f"{CLOUD}/webproxy/sso/back", wait_until="networkidle", timeout=60000)
        log(f"Login page URL: {page.url[:80]}")

        # Fill the official CAS fields and click login
        page.fill("#username", EMAIL)
        # The cover approach: fill #originalPassword, let Ruijie's JS encrypt
        page.fill("#originalPassword", PASSWORD)
        page.click("#J_userLogin_btn")
        # Wait for redirect back to /webproxy/sso/back (ticket callback)
        try:
            page.wait_for_url("**/webproxy/sso/back**", timeout=30000)
        except Exception:
            log(f"WARNING: did not land on sso/back, URL now: {page.url[:100]}")

        # Verify session by checking a webproxy call
        cookies = ctx.cookies()
        browser.close()

    jar = requests.cookies.RequestsCookieJar()
    for c in cookies:
        jar.set(c["name"], c["value"], domain=c.get("domain", ""), path=c.get("path", "/"))
    log(f"Captured {len(cookies)} cookies")
    return jar


def webproxy(session, api_path, method="POST", params=None):
    """Call the portal webproxy with SSO session cookies."""
    env = {
        "api": api_path,
        "method": method,
        "module": "default",
        "authParams": {"api": api_path, "method": method},
        "querys": {"lang": "en", "cloudType": "smb"},
    }
    if params:
        env["params"] = params
    r = session.post(WEBPROXY, json=env, timeout=30)
    r.raise_for_status()
    return r.json()


def is_sso_alive(session):
    try:
        d = webproxy(session, "/samTransfer/authuserinfos/bypage?cloudType=smb",
                     "POST", {"group_id": int(GROUP_ID), "page": 1, "pageSize": 1})
        return d.get("code") == 0
    except Exception as e:
        log(f"SSO check failed: {e}")
        return False


# ── Step 2: fetch vouchers via Cloud Open API (same as CloudApiClient) ──
FIXED_TOKEN_PARAM = "d63dss0a81e4415a889ac5b78fsc904a"


def get_access_token():
    """Same as CloudApiClient.getToken()."""
    url = f"{CLOUD}/service/api/oauth20/client/access_token?token={FIXED_TOKEN_PARAM}"
    r = requests.post(url, json={"appid": APPID, "secret": SECRET}, timeout=30)
    r.raise_for_status()
    d = r.json()
    token = d.get("accessToken", "")
    if d.get("code", -1) != 0 or not token:
        raise Exception(f"Token request failed: {str(d)[:200]}")
    return token


def fetch_vouchers():
    """Same as CloudApiClient.getVouchers(): paginated GET."""
    token = get_access_token()
    out = []
    start, page_size, total = 0, 200, float("inf")
    while start < total:
        url = (f"{CLOUD}/service/api/open/auth/voucher/getList/{GROUP_ID}"
               f"?start={start}&pageSize={page_size}&access_token={token}")
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        d = r.json()
        if d.get("code", -1) != 0:
            raise Exception(f"Voucher list failed: {d.get('msg', d.get('code'))}")
        vd = d.get("voucherData") or {}
        total = vd.get("count", 0)
        lst = vd.get("list") or []
        out.extend(lst)
        start += len(lst)
        if not lst:
            break
    log(f"Fetched {len(out)} vouchers")
    return out


def is_spent(v):
    if str(v.get("status", "")) != "2":
        return False
    q = float(v.get("quota") or 0)
    uq = float(v.get("usedQuota") or 0)
    if q > 0 and uq >= q:
        return True
    per = float(v.get("timePeriod") or 0)
    ut = float(v.get("usedTime") or 0)
    return per > 0 and ut >= per


# ── Step 3+4: find auth record & kick ──
def find_auth_record(session, code):
    """Same as AutoKickJob.findAuthRecord(): match rec.account == code."""
    page = 1
    fetched = 0
    while page <= 20:
        d = webproxy(session, "/samTransfer/authuserinfos/bypage?cloudType=smb",
                     "POST", {"group_id": int(GROUP_ID), "page": page, "size": 100})
        if d.get("code", -1) != 0:
            return None
        data = d.get("data") or {}
        res = data.get("result") or {}
        lst = res.get("list") or []
        if not lst:
            return None
        for rec in lst:
            if not isinstance(rec, dict):
                continue
            acct = str(rec.get("account", "")).strip()
            if code == acct and rec.get("id", 0) != 0 and acct:
                return rec
        fetched += len(lst)
        total = res.get("total", fetched)
        if fetched >= total:
            break
        page += 1
    return None


def kick(session, rec):
    auth_type = rec.get("authType") or rec.get("auth_type") or ""
    mac = (rec.get("userMac") or rec.get("mac") or "").lower()
    params = {
        "group_id": int(GROUP_ID),
        "account": rec.get("account", ""),
        "auth_type": auth_type,
        "mac": mac,
        "id": rec.get("id", 0),
    }
    d = webproxy(session, "/samTransfer/kick/user/offline", "POST", params)
    return d.get("code") == 0


def main():
    log("=== Server Auto-Kick starting ===")

    # 1. SSO login
    jar = sso_login()
    session = requests.Session()
    session.cookies.update(jar)
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36")

    if not is_sso_alive(session):
        log("FATAL: SSO login failed - session not alive")
        sys.exit(1)
    log("SSO session alive")

    # 2. vouchers
    try:
        vouchers = fetch_vouchers()
    except Exception as e:
        log(f"FATAL: voucher fetch failed: {e}")
        sys.exit(1)

    spent = [v for v in vouchers
             if v.get("voucherCode", "").strip() and is_spent(v)]
    log(f"Spent vouchers: {len(spent)}")
    if not spent:
        log("Nothing to kick")
        return

    # 3+4. kick each
    kicked = 0
    for v in spent:
        code = v["voucherCode"].strip()
        try:
            rec = find_auth_record(session, code)
            if not rec:
                log(f"  {code}: no portal record, skip")
                continue
            if kick(session, rec):
                kicked += 1
                log(f"  {code}: KICKED")
            else:
                log(f"  {code}: kick rejected")
        except Exception as e:
            log(f"  {code}: error {e}")
    log(f"=== Done: {kicked}/{len(spent)} kicked ===")
    # v1.6.49: write summary for app display
    summary = {
        "time": datetime.now(timezone.utc).isoformat(),
        "vouchers": len(vouchers),
        "spent": len(spent),
        "kicked": kicked,
        "errors": errors[:10],
    }
    with open("autokick-server/last-run.json", "w") as f:
        json.dump(summary, f)
    log("Summary written to last-run.json")


if __name__ == "__main__":
    for k in ("RUIJIE_EMAIL", "RUIJIE_PASSWORD", "RUIJIE_APPID",
              "RUIJIE_SECRET", "RUIJIE_GROUP_ID"):
        if k not in os.environ:
            print(f"Missing env: {k}", file=sys.stderr)
            sys.exit(2)
    main()
