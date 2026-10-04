"""Find terminalManage API data format from JS."""
import re, time
from playwright.sync_api import sync_playwright

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    js_urls = []
    page.on("response", lambda r: js_urls.append(r.url)
            if r.url.endswith(".js") else None)

    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn')
    if btn: btn.click()
    time.sleep(8)

    # Find JS with terminalManage
    found = []
    for js_url in js_urls:
        if "chunk" in js_url or "app" in js_url:
            try:
                resp = page.request.get(js_url, timeout=10000)
                if resp.ok:
                    text = resp.text()
                    if "terminalManage" in text:
                        # Find surrounding context
                        for m in re.finditer(r'.{0,200}terminalManage.{0,300}', text):
                            s = m.group(0)
                            if "module" in s or "method" in s or "data" in s:
                                found.append(s[:500])
                                if len(found) >= 5:
                                    break
                    if len(found) >= 5:
                        break
            except: pass

    with open(r"C:\pc-mcp-server\terminal_js.txt", "w", encoding="utf-8") as f:
        for s in found[:10]:
            f.write(s + "\n---\n")
    print(f"Found {len(found)} snippets", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
