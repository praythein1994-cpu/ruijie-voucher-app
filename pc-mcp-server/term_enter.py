"""Login via Enter key only (v3 method that worked)."""
import json, time, re
from playwright.sync_api import sync_playwright

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)

    pwd = page.query_selector('input[type="password"]')
    pwd.fill(PASSWORD)
    time.sleep(1)
    pwd.press("Enter")
    print("Enter pressed", flush=True)
    time.sleep(10)

    url = page.url
    print(f"URL: {url[:100]}", flush=True)
    m = re.search(r';stok=([a-f0-9]+)', url)
    if m:
        stok = m.group(1)
        print(f"STOK: {stok[:20]}...", flush=True)
        # Query terminalManage
        api_url = f"https://100.88.200.103/cgi-bin/luci/;stok={stok}/api/cmd"
        for module in ["terminalManage", "terminalManageAlone"]:
            body = {"method": "devConfig.get", "params": {
                "module": module, "noParse": False, "device": "pc"}}
            try:
                resp = page.request.post(api_url, data=json.dumps(body),
                    headers={"Content-Type": "application/json"}, timeout=15000)
                txt = resp.text()
                print(f"\n{module}: HTTP {resp.status}, {len(txt)} chars", flush=True)
                print(f"  {txt[:800]}", flush=True)
                with open(f"C:\\pc-mcp-server\\{module}.json", "w") as f:
                    f.write(txt)
            except Exception as e:
                print(f"{module}: {e}", flush=True)
    else:
        print("NO STOK - login failed", flush=True)
        # Screenshot for debug
        page.screenshot(path=r"C:\pc-mcp-server\login_fail.png")
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
