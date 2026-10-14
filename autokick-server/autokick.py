#!/usr/bin/env python3
"""
Server-side Auto-Kick for P Manager (GitHub Actions).
Runs on schedule, kicks quota-spent / time-expired voucher clients.

Env vars (GitHub Secrets):
  RUIJIE_ACCOUNTS   - JSON list of accounts: [{"email","password","appid","secret","group_id","name"}]
                      (preferred for multi-account)
  RUIJIE_EMAIL      - Single account email (fallback if RUIJIE_ACCOUNTS not set)
  RUIJIE_PASSWORD   - Single account password
  RUIJIE_APPID      - Single account App ID
  RUIJIE_SECRET     - Single account App Secret
  RUIJIE_GROUP_ID   - Single account Group ID
  RUIJIE_CLOUD      - Cloud base URL (default: https://cloud-as.ruijienetworks.com)

Flow (per account):
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
WEBPROXY = f"{CLOUD}/webproxy/common/api"
ACCT = {}  # current account being processed


def get_accounts():
    """Load accounts from RUIJIE_ACCOUNTS JSON, or fallback to single-account secrets."""
    multi = os.environ.get("RUIJIE_ACCOUNTS", "").strip()
    if multi:
        try:
            accounts = json.loads(multi)
            if isinstance(accounts, list) and accounts:
                return accounts
        except Exception as e:
            print(f"RUIJIE_ACCOUNTS parse failed: {e}", flush=True)
    # fallback: single account from individual secrets
    return [{
        "name": "default",
        "email": os.environ["RUIJIE_EMAIL"],
        "password": os.environ["RUIJIE_PASSWORD"],
        "appid": os.environ["RUIJIE_APPID"],
        "secret": os.environ["RUIJIE_SECRET"],
        "group_id": os.environ["RUIJIE_GROUP_ID"],
    }]


def check_enabled():
    """Check autokick-server/config.json for enabled flag."""
    try:
        with open("autokick-server/config.json") as f:
            cfg = json.load(f)
            return cfg.get("enabled", True)
    except Exception:
        return True  # default enabled if no config


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
        page.fill("#username", ACCT["email"])
        # The cover approach: fill #originalPassword, let Ruijie's JS encrypt
        page.fill("#originalPassword", ACCT["password"])
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
                     "POST", {"group_id": int(ACCT["group_id"]), "page": 1, "pageSize": 1})
        return d.get("code") == 0
    except Exception as e:
        log(f"SSO check failed: {e}")
        return False


# ── Step 2: fetch vouchers via Cloud Open API (same as CloudApiClient) ──
FIXED_TOKEN_PARAM = "d63dss0a81e4415a889ac5b78fsc904a"


def get_access_token():
    """Same as CloudApiClient.getToken()."""
    url = f"{CLOUD}/service/api/oauth20/client/access_token?token={FIXED_TOKEN_PARAM}"
    r = requests.post(url, json={"appid": ACCT["appid"], "secret": ACCT["secret"]}, timeout=30)
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
        gid = ACCT['group_id']
        url = (f"{CLOUD}/service/api/open/auth/voucher/getList/{gid}"
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
                     "POST", {"group_id": int(ACCT["group_id"]), "page": page, "size": 100})
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
        "group_id": int(ACCT["group_id"]),
        "account": rec.get("account", ""),
        "auth_type": auth_type,
        "mac": mac,
        "id": rec.get("id", 0),
    }
    d = webproxy(session, "/samTransfer/kick/user/offline", "POST", params)
    return d.get("code") == 0


def process_account(acct):
    """Run auto-kick for one account. Returns (vouchers, spent, kicked, errors)."""
    global ACCT
    ACCT = acct
    name = acct.get("name", "default")
    log(f"--- Account: {name} ---")
    errors = []

    # 1. SSO login
    try:
        jar = sso_login()
    except Exception as e:
        log(f"FATAL: SSO login failed: {e}")
        return 0, 0, 0, [f"login: {e}"]
    session = requests.Session()
    session.cookies.update(jar)
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36")

    if not is_sso_alive(session):
        log("FATAL: SSO login failed - session not alive")
        return 0, 0, 0, ["SSO session not alive"]
    log("SSO session alive")

    # 2. vouchers
    try:
        vouchers = fetch_vouchers()
    except Exception as e:
        log(f"FATAL: voucher fetch failed: {e}")
        return 0, 0, 0, [f"voucher fetch: {e}"]

    spent = [v for v in vouchers
             if v.get("voucherCode", "").strip() and is_spent(v)]
    log(f"Spent vouchers: {len(spent)}")
    if not spent:
        return len(vouchers), 0, 0, []

    # 3+4. kick each
    kicked = 0
    for v in spent:
        code = v["voucherCode"].strip()
        try:
            rec = find_auth_record(session, code)
            if not rec:
                continue
            if kick(session, rec):
                kicked += 1
                log(f"  {code}: KICKED")
        except Exception as e:
            errors.append(f"{code}: {e}")
    log(f"--- {name}: {kicked}/{len(spent)} kicked ---")
    return len(vouchers), len(spent), kicked, errors


def main():
    log("=== Server Auto-Kick starting ===")

    if not check_enabled():
        log("Disabled via config.json - skipping")
        return

    accounts = get_accounts()
    log(f"Accounts: {len(accounts)}")

    results = []
    for acct in accounts:
        try:
            v, s, k, e = process_account(acct)
            results.append({
                "name": acct.get("name", "default"),
                "vouchers": v, "spent": s, "kicked": k,
                "errors": e[:5],
            })
        except Exception as e:
            log(f"Account {acct.get('name')} failed: {e}")
            results.append({
                "name": acct.get("name", "default"),
                "vouchers": 0, "spent": 0, "kicked": 0,
                "errors": [str(e)[:200]],
            })

    total_kicked = sum(r["kicked"] for r in results)
    total_spent = sum(r["spent"] for r in results)
    log(f"=== Done: {total_kicked}/{total_spent} kicked across {len(accounts)} accounts ===")

    # write summary for app display
    summary = {
        "time": datetime.now(timezone.utc).isoformat(),
        "accounts": results,
        "total_kicked": total_kicked,
        "total_spent": total_spent,
    }
    with open("autokick-server/last-run.json", "w") as f:
        json.dump(summary, f)
    log("Summary written to last-run.json")


if __name__ == "__main__":
    # Need either RUIJIE_ACCOUNTS or the 5 single-account secrets
    if not os.environ.get("RUIJIE_ACCOUNTS"):
        for k in ("RUIJIE_EMAIL", "RUIJIE_PASSWORD", "RUIJIE_APPID",
                  "RUIJIE_SECRET", "RUIJIE_GROUP_ID"):
            if k not in os.environ:
                print(f"Missing env: {k}", file=sys.stderr)
                sys.exit(2)
    main()
