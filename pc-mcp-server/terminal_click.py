"""Click Terminal Information Config menu, capture its APIs."""
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

    # Login
    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(8)
    print("Logged in", flush=True)

    # Find and click "Terminal Information" menu item
    clicked = page.evaluate("""() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
            if (el.children.length === 0 && el.innerText) {
                const t = el.innerText.trim();
                if (t.startsWith('Terminal Information')) {
                    el.click();
                    return t;
                }
            }
        }
        return null;
    }""")
    print(f"Clicked: {clicked}", flush=True)
    time.sleep(6)

    # Also try clicking "Config" tab if present
    config_clicked = page.evaluate("""() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
            if (el.children.length === 0 && el.innerText) {
                const t = el.innerText.trim();
                if (t === 'Config') { el.click(); return true; }
            }
        }
        return false;
    }""")
    print(f"Config tab clicked: {config_clicked}", flush=True)
    time.sleep(6)

    print(f"URL: {page.url[:120]}", flush=True)
    print(f"\n=== Captured {len(captured)} API bodies ===", flush=True)

    # Deduplicate by method+module
    seen = {}
    for body in captured:
        m = re.search(r'"method":"([^"]+)"', body)
        m2 = re.search(r'"module":"([^"]+)"', body)
        key = f"{m.group(1) if m else '?'}:{m2.group(1) if m2 else '?'}"
        if key not in seen:
            seen[key] = body

    for key, body in seen.items():
        print(f"\n{key}", flush=True)
        # Pretty print data portion
        try:
            d = json.loads(body)
            params = d.get("params", {})
            data = params.get("data", "")
            print(f"  data: {json.dumps(data)[:400]}", flush=True)
        except:
            print(f"  {body[:300]}", flush=True)

    with open(r"C:\pc-mcp-server\terminal_click_apis.json", "w") as f:
        json.dump([{"key": k, "body": v[:2000]} for k, v in seen.items()], f, indent=2)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
