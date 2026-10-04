"""Navigate SPA, extract menu, find Terminal page, capture its APIs."""
import json, time
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
        if req.method == "POST" and "cgi-bin" in req.url:
            body = (req.post_data or "")
            if '"method":"login"' not in body and '"method":"getAuthority"' not in body:
                captured.append({"url": req.url.split("?")[0], "body": body[:2000]})
    page.on("request", on_req)

    # Login
    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(8)  # wait for SPA to load
    print(f"After login: {page.url}", flush=True)

    # Extract all visible menu text via JS
    menus = page.evaluate("""() => {
        const items = [];
        document.querySelectorAll('a, [class*="menu"], [class*="nav"], li').forEach(el => {
            const t = el.innerText ? el.innerText.trim().split('\\n')[0] : '';
            if (t && t.length < 50 && t.length > 1) items.push(t);
        });
        return [...new Set(items)];
    }""")
    print(f"\n=== Menu items ({len(menus)}) ===", flush=True)
    for m in menus[:60]:
        print(f"  {m}", flush=True)

    # Look for terminal-related and click it
    for m in menus:
        if any(k in m.lower() for k in ["terminal", "client list", "sta"]):
            print(f"\nTrying to click: {m}", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
