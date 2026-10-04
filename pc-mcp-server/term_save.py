"""Query terminalManage, save files first, ASCII-safe print."""
import json, time, re, io, sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

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
    pwd = page.query_selector('input[type="password"]')
    pwd.fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn')
    if btn: btn.click()
    else: pwd.press("Enter")
    time.sleep(8)

    m = re.search(r';stok=([a-f0-9]+)', page.url)
    stok = m.group(1) if m else ""
    print(f"Stok: {'YES' if stok else 'NO'}", flush=True)

    if stok:
        api_url = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd"
        for module in ["terminalManage", "terminalManageAlone"]:
            body = {"method": "devConfig.get", "params": {
                "module": module, "noParse": False, "device": "pc"}}
            resp = page.request.post(api_url, data=json.dumps(body),
                headers={"Content-Type": "application/json"}, timeout=15000)
            txt = resp.text()
            # Save FIRST before any print
            fname = f"C:\\pc-mcp-server\\{module}_config.json"
            with open(fname, "w", encoding="utf-8") as f:
                f.write(txt)
            print(f"{module}: HTTP {resp.status}, saved {len(txt)} chars", flush=True)
            # ASCII-safe preview
            safe = txt.encode('ascii', errors='replace').decode('ascii')
            print(f"  Preview: {safe[:400]}", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
