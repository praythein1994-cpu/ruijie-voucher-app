"""V3 login method + terminalManage query."""
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
    pwd = page.query_selector('input[type="password"]')
    pwd.fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn')
    if btn: btn.click()
    else: pwd.press("Enter")
    print("Login submitted", flush=True)
    time.sleep(8)
    print(f"Title: {page.title()}", flush=True)

    m = re.search(r';stok=([a-f0-9]+)', page.url)
    stok = m.group(1) if m else ""
    if stok:
        api_url = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd"
        for module in ["terminalManage", "terminalManageAlone"]:
            for method in ["devConfig.get", "devSta.get"]:
                body = {"method": method, "params": {
                    "module": module, "noParse": False, "device": "pc"}}
                try:
                    resp = page.request.post(api_url, data=json.dumps(body),
                        headers={"Content-Type": "application/json"}, timeout=15000)
                    txt = resp.text()
                    print(f"\n{method}:{module} -> HTTP {resp.status}", flush=True)
                    try:
                        d = json.loads(txt)
                        print(json.dumps(d)[:1200], flush=True)
                    except:
                        print(txt[:500], flush=True)
                    with open(f"C:\\pc-mcp-server\\{module}_{method}.json", "w") as f:
                        f.write(txt)
                except Exception as e:
                    print(f"{method}:{module} -> {e}", flush=True)
    else:
        print("NO STOK", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
