"""Find Terminal Information Config API."""
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
            body = (req.post_data or "")[:3000]
            # Skip login noise
            if '"method":"login"' not in body:
                captured.append({"url": req.url.split("?")[0], "body": body})
    page.on("request", on_req)

    # Login
    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    pwd = page.query_selector('input[type="password"]')
    pwd.fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn')
    if btn: btn.click()
    else: pwd.press("Enter")
    time.sleep(5)
    print(f"Logged in: {page.title()}", flush=True)

    # Try to find Terminal-related menu items
    # Common paths for terminal/client info
    test_paths = [
        "/admin/terminal",
        "/admin/sta_info",
        "/admin/client",
        "/admin/home_online",
        "/admin/dev_control",
    ]

    # Also try clicking menu items with "terminal" text
    for path in test_paths:
        captured.clear()
        try:
            page.goto(GATEWAY_URL + path, wait_until="domcontentloaded", timeout=15000)
            time.sleep(5)
            if captured:
                print(f"\n=== {path} -> {len(captured)} API calls ===", flush=True)
                seen = set()
                for r in captured:
                    key = r["url"] + r["body"][:100]
                    if key not in seen:
                        seen.add(key)
                        print(f"  POST {r['url']}", flush=True)
                        print(f"    {r['body'][:400]}", flush=True)
        except Exception as e:
            print(f"{path}: {e}", flush=True)

    # Search page for terminal-related text
    try:
        page.goto(GATEWAY_URL + "/admin/home", wait_until="domcontentloaded", timeout=15000)
        time.sleep(4)
        # Get all menu text
        menus = page.query_selector_all("a, .menu-item, .el-menu-item")
        print(f"\n=== Menu items found: {len(menus)} ===", flush=True)
        for m in menus[:40]:
            try:
                t = m.inner_text().strip()
                if t and any(k in t.lower() for k in ["terminal", "client", "sta", "device"]):
                    print(f"  Menu: {t}", flush=True)
            except: pass
    except Exception as e:
        print(f"Menu scan: {e}", flush=True)

    with open(r"C:\pc-mcp-server\terminal_apis.json", "w") as f:
        json.dump(captured, f, indent=2)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
