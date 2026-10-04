"""Login via browser, then query terminalManage API directly."""
import json, time
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

    # Get stok from URL
    url = page.url
    import re
    m = re.search(r';stok=([a-f0-9]+)', url)
    stok = m.group(1) if m else ""
    print(f"Stok: {stok[:16]}...", flush=True)

    # Query terminalManage modules
    api_base = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd"
    for module in ["terminalManage", "terminalManageAlone"]:
        for method in ["devConfig.get", "devSta.get"]:
            body = {"method": method, "params": {
                "module": module, "noParse": False, "device": "pc"}}
            try:
                resp = page.request.post(api_base, data=json.dumps(body),
                    headers={"Content-Type": "application/json"}, timeout=15000)
                data = resp.json()
                print(f"\n{method}:{module}", flush=True)
                print(f"  Status: {resp.status}", flush=True)
                # Print data summary
                d = json.dumps(data)
                print(f"  Response ({len(d)} chars): {d[:600]}", flush=True)
            except Exception as e:
                print(f"{method}:{module} -> {e}", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
