"""Fix stok extraction, query terminalManage."""
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
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(10)

    url = page.url
    print(f"URL: {url}", flush=True)
    # Try multiple stok patterns
    stok = ""
    for pat in [r';stok=([a-f0-9]+)', r'stok=([a-f0-9]+)', r'/luci/;stok=([^/]+)/']:
        m = re.search(pat, url)
        if m:
            stok = m.group(1)
            print(f"Stok via {pat}: {stok[:20]}", flush=True)
            break
    if not stok:
        print("NO STOK FOUND", flush=True)

    if stok:
        api_url = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd?auth={stok}"
        print(f"API: {api_url[:80]}", flush=True)
        for module in ["terminalManage", "terminalManageAlone"]:
            body = {"method": "devConfig.get", "params": {
                "module": module, "noParse": False,
                "device": "pc", "data": {}}}
            try:
                resp = page.request.post(api_url, data=json.dumps(body),
                    headers={"Content-Type": "application/json"}, timeout=15000)
                txt = resp.text()
                print(f"\n{module}: HTTP {resp.status}, {len(txt)} chars", flush=True)
                print(f"  {txt[:800]}", flush=True)
                with open(f"C:\\pc-mcp-server\\{module}_config.json", "w") as f:
                    f.write(txt)
            except Exception as e:
                print(f"{module} -> {e}", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
