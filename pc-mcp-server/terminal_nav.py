"""Direct navigation to Terminal page via Clients menu."""
import json, time, re
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
captured = []

with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    def on_req(req):
        if req.method == "POST" and "/api/cmd" in req.url:
            body = req.post_data or ""
            if '"method":"login"' not in body and "getAuthority" not in body:
                captured.append(body)
    page.on("request", on_req)

    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(8)

    # Step 1: Click "Clients" in left sidebar
    r1 = page.evaluate("""() => {
        for (const el of document.querySelectorAll('*')) {
            if (el.children.length === 0 && el.innerText) {
                const t = el.innerText.trim();
                if (t === 'Clients') { el.click(); return t; }
            }
        }
        return null;
    }""")
    print(f"Step1 Clients: {r1}", flush=True)
    time.sleep(4)

    # Step 2: Click "Terminal Information" submenu
    captured.clear()
    r2 = page.evaluate("""() => {
        for (const el of document.querySelectorAll('*')) {
            if (el.children.length === 0 && el.innerText) {
                const t = el.innerText.trim();
                if (t.includes('Terminal Information')) { el.click(); return t; }
            }
        }
        return null;
    }""")
    print(f"Step2 Terminal: {r2}", flush=True)
    time.sleep(6)

    # Step 3: Click "Config" tab
    r3 = page.evaluate("""() => {
        for (const el of document.querySelectorAll('*')) {
            if (el.children.length === 0 && el.innerText) {
                if (el.innerText.trim() === 'Config') { el.click(); return true; }
            }
        }
        return false;
    }""")
    print(f"Step3 Config: {r3}", flush=True)
    time.sleep(6)

    print(f"Final URL: {page.url[:130]}", flush=True)

    # Deduplicate
    seen = {}
    for body in captured:
        m = re.search(r'"method":"([^"]+)"', body)
        m2 = re.search(r'"module":"([^"]+)"', body)
        key = f"{m.group(1) if m else '?'}:{m2.group(1) if m2 else '?'}"
        if key not in seen:
            seen[key] = body

    print(f"\n=== APIs ({len(seen)}) ===", flush=True)
    for key, body in sorted(seen.items()):
        # Show data portion only
        try:
            d = json.loads(body)
            data = d.get("params", {}).get("data", "")
            ds = json.dumps(data) if data else "(no data)"
            print(f"{key} -> {ds[:200]}", flush=True)
        except:
            print(f"{key}", flush=True)

    with open(r"C:\pc-mcp-server\terminal_final.json", "w") as f:
        json.dump([{"key": k, "body": v[:1500]} for k, v in seen.items()], f, indent=2)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
