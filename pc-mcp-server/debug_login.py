"""Debug: dump page HTML after login to understand structure."""
import time
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"

with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()
print(f"PWD len: {len(PASSWORD)}", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    print(f"Before login title: '{page.title()}'", flush=True)
    print(f"URL: {page.url}", flush=True)

    pwd = page.query_selector('input[type="password"]')
    print(f"Pwd field: {pwd is not None}", flush=True)
    if pwd:
        pwd.fill(PASSWORD)
        time.sleep(1)
        # Try all button selectors
        for sel in ['button[type="submit"]', '.login-btn', 'button.el-button',
                     '.login-button', 'button:has-text("Login")']:
            btn = page.query_selector(sel)
            if btn:
                print(f"Found button: {sel}", flush=True)
                btn.click()
                break
        else:
            print("No button found, pressing Enter", flush=True)
            pwd.press("Enter")

        time.sleep(6)
        print(f"After login title: '{page.title()}'", flush=True)
        print(f"URL: {page.url}", flush=True)

        # Dump body text preview
        try:
            body_text = page.query_selector("body").inner_text()[:500]
            print(f"Body preview: {body_text}", flush=True)
        except Exception as e:
            print(f"Body read fail: {e}", flush=True)

        # Save full HTML
        html = page.content()
        with open(r"C:\pc-mcp-server\gateway_debug.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"HTML saved ({len(html)} chars)", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
