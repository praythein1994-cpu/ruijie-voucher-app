"""Capture Terminal Information Config page APIs."""
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
            if '"method":"login"' not in body and "getAuthority" not in body:
                captured.append({
                    "url": req.url.split("?")[0].split(";")[0],
                    "body": body[:3000]
                })
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

    # Get stok from URL
    stok_url = page.url
    print(f"Stok URL: {stok_url[:80]}", flush=True)

    # Navigate to Terminal config page
    captured.clear()
    page.goto(stok_url.split("?")[0] + "admin/alone/behavior/Terminal",
              wait_until="domcontentloaded", timeout=20000)
    time.sleep(6)
    print(f"Terminal page: {page.url[:100]}", flush=True)

    # Deduplicate and print
    seen = {}
    for r in captured:
        # Extract method from body
        import re
        m = re.search(r'"method":"([^"]+)"', r["body"])
        method = m.group(1) if m else "?"
        m2 = re.search(r'"module":"([^"]+)"', r["body"])
        module = m2.group(1) if m2 else "?"
        key = f"{method}:{module}"
        if key not in seen:
            seen[key] = r

    print(f"\n=== Terminal Config APIs ({len(seen)}) ===", flush=True)
    for key, r in seen.items():
        print(f"\n{key}", flush=True)
        print(f"  URL: {r['url']}", flush=True)
        print(f"  Body: {r['body'][:500]}", flush=True)

    with open(r"C:\pc-mcp-server\terminal_config_apis.json", "w") as f:
        json.dump(list(seen.values()), f, indent=2)
    print("\nSaved to terminal_config_apis.json", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
