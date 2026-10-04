"""Crawl all gateway eWeb sections, capture unique method:module pairs."""
import json, time, re, io, sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
OUT_FILE = r"C:\pc-mcp-server\gw_all_modules.json"

with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

# method:module -> sample body
all_mods = {}

def click_by_text(page, text, exact=False):
    """Click element whose leaf text matches. Returns found text or None."""
    return page.evaluate("""(txt, exact) => {
        for (const el of document.querySelectorAll('*')) {
            if (el.children.length === 0 && el.innerText) {
                const t = el.innerText.trim();
                if (exact ? t === txt : t.startsWith(txt)) {
                    if (el.offsetParent !== null) { el.click(); return t; }
                }
            }
        }
        return null;
    }""", text, exact)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    captured = []
    def on_req(req):
        if req.method == "POST" and "/api/cmd" in req.url:
            b = req.post_data or ""
            if '"method":"login"' not in b and "getAuthority" not in b:
                captured.append(b)
    page.on("request", on_req)

    def login():
        page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
        try:
            page.wait_for_selector('input[type="password"]', timeout=15000)
        except Exception:
            return False
        time.sleep(2)
        pwd = page.query_selector('input[type="password"]')
        if not pwd:
            return False
        pwd.fill(PASSWORD)
        time.sleep(1)
        # Robust click: use evaluate to click the VISIBLE "Log In" button
        clicked = page.evaluate("""() => {
            for (const b of document.querySelectorAll('button[type="submit"]')) {
                if (b.offsetParent !== null && b.innerText.trim() === 'Log In') {
                    b.click(); return true;
                }
            }
            // fallback: first visible submit button
            for (const b of document.querySelectorAll('button[type="submit"]')) {
                if (b.offsetParent !== null) { b.click(); return true; }
            }
            return false;
        }""")
        print("login clicked: %s" % clicked, flush=True)
        time.sleep(8)
        return bool(re.search(r';stok=[a-f0-9]+', page.url))

    ok = login()
    if not ok:
        print("Login attempt 1 failed, waiting 30s and retrying...", flush=True)
        time.sleep(30)
        ok = login()
    if not ok:
        print("LOGIN FAILED after retry", flush=True)
        browser.close()
        sys.exit(1)
    print("LOGGED IN", flush=True)

    def harvest(tag):
        """Deduplicate captured bodies into all_mods."""
        n = 0
        for b in captured:
            m = re.search(r'"method":"([^"]+)"', b)
            m2 = re.search(r'"module":"([^"]+)"', b)
            key = f"{m.group(1) if m else '?'}:{m2.group(1) if m2 else '?'}"
            if key not in all_mods:
                all_mods[key] = b[:800]
                n += 1
        captured.clear()
        print(f"[{tag}] total unique so far: {len(all_mods)} (+{n} new)", flush=True)

    # Top-level menus
    top_menus = ["Clients", "Devices", "Network-Wide", "Workspace", "System"]
    # Submenus under Clients (from known menu list)
    client_subs = ["Website Management", "QoS", "Internet Plan", "Access Control",
                   "User Management", "Terminal Information", "Time Management",
                   "Application Library"]
    # Other expandable sections
    other_sections = ["VPN", "Authentication", "Advanced"]

    for tm in top_menus:
        try:
            r = click_by_text(page, tm, exact=True)
            print(f"Top menu '{tm}': {r}", flush=True)
            time.sleep(5)
            harvest(tm)
        except Exception as e:
            print(f"Top menu '{tm}' error: {e}", flush=True)

    # Expand Clients and click submenus
    try:
        click_by_text(page, "Clients", exact=True)
        time.sleep(3)
        for sm in client_subs:
            try:
                r = click_by_text(page, sm)
                print(f"Client sub '{sm}': {r}", flush=True)
                time.sleep(5)
                harvest(f"Clients/{sm}")
                # Also click Config tab if present on the page
                rc = click_by_text(page, "Config", exact=True)
                if rc:
                    time.sleep(5)
                    harvest(f"Clients/{sm}/Config")
            except Exception as e:
                print(f"Client sub '{sm}' error: {e}", flush=True)
    except Exception as e:
        print(f"Clients section error: {e}", flush=True)

    # Other expandable sections
    for sec in other_sections:
        try:
            r = click_by_text(page, sec)
            print(f"Section '{sec}': {r}", flush=True)
            time.sleep(4)
            # click visible submenu items under it (up to 8)
            subs = page.evaluate("""() => {
                const out = [];
                for (const el of document.querySelectorAll('*')) {
                    if (el.children.length === 0 && el.innerText) {
                        const t = el.innerText.trim();
                        if (t && t.length < 40 && t.length > 2 && el.offsetParent !== null) out.push(t);
                    }
                }
                return [...new Set(out)].slice(0, 40);
            }""")
            for s in subs:
                try:
                    rr = click_by_text(page, s, exact=True)
                    if rr:
                        time.sleep(4)
                        harvest(f"{sec}/{s}")
                        if len(all_mods) > 200:
                            break
                except Exception:
                    pass
            harvest(sec)
        except Exception as e:
            print(f"Section '{sec}' error: {e}", flush=True)

    # Save
    data = [{"key": k, "sample_body": v} for k, v in sorted(all_mods.items())]
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"SAVED {len(data)} unique modules to {OUT_FILE}", flush=True)
    browser.close()

import os
try:
    os.remove(PWD_FILE)
    print("pwd file removed", flush=True)
except Exception as e:
    print(f"pwd remove: {e}", flush=True)
print("DONE", flush=True)
