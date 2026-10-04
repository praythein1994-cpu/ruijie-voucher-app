"""Get full menu list, save to file."""
import time
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"

with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()
    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(8)

    menus = page.evaluate("""() => {
        const items = [];
        document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0) {
                const t = el.innerText ? el.innerText.trim() : '';
                if (t && t.length < 60 && t.length > 1 && !t.includes('\\n'))
                    items.push(t);
            }
        });
        return [...new Set(items)].sort();
    }""")

    with open(r"C:\pc-mcp-server\menu_list.txt", "w", encoding="utf-8") as f:
        for m in menus:
            f.write(m + "\n")
    print(f"Saved {len(menus)} items", flush=True)
    # Print terminal-related immediately
    for m in menus:
        if any(k in m.lower() for k in ["terminal", "sta info", "client"]):
            print(f"FOUND: {m}", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
