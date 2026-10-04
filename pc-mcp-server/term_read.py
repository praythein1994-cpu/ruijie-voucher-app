"""Set detection intervals to 60 min via terminalManage."""
import json, time, re
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
    btn = page.query_selector('button[type="submit"], .login-btn')
    if btn: btn.click()
    time.sleep(8)

    m = re.search(r';stok=([a-f0-9]+)', page.url)
    stok = m.group(1) if m else ""
    print(f"Stok: {'YES' if stok else 'NO'}", flush=True)

    if stok:
        api_url = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd"

        # Step 1: Read current config
        body = {"method": "devConfig.get", "params": {
            "module": "terminalManage", "noParse": False, "device": "pc"}}
        resp = page.request.post(api_url, data=json.dumps(body),
            headers={"Content-Type": "application/json"}, timeout=15000)
        txt = resp.text()
        print(f"Read: HTTP {resp.status}, {len(txt)} chars", flush=True)
        with open(r"C:\pc-mcp-server\term_before.json", "w", encoding="utf-8") as f:
            f.write(txt)

        # Step 2: Try to parse and update intervals
        try:
            d = json.loads(txt)
            print(f"Data keys: {list(d.get('data', {}).keys()) if isinstance(d.get('data'), dict) else type(d.get('data'))}", flush=True)
        except Exception as e:
            print(f"Parse: {e}", flush=True)
            print(f"Raw: {txt[:500]}", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
