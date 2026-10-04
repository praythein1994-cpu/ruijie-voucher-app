"""Login with agreement handling, then query terminalManage."""
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
    time.sleep(4)

    # Click "I have read and agreed" if present
    agreed = page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            if (b.innerText.includes('read and agreed')) { b.click(); return true; }
        }
        return false;
    }""")
    print(f"Agreement clicked: {agreed}", flush=True)
    time.sleep(2)

    # Fill password
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)

    # Click "Log In" specifically
    logged = page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            if (b.innerText.trim() === 'Log In') { b.click(); return true; }
        }
        return false;
    }""")
    print(f"Login clicked: {logged}", flush=True)
    time.sleep(10)

    url = page.url
    print(f"URL: {url[:100]}", flush=True)
    m = re.search(r';stok=([a-f0-9]+)', url)
    stok = m.group(1) if m else ""
    print(f"Stok: {stok[:20] if stok else 'NONE'}", flush=True)

    if stok:
        api_url = f"{GATEWAY_URL}/cgi-bin/luci/;stok={stok}/api/cmd"
        for module in ["terminalManage", "terminalManageAlone"]:
            body = {"method": "devConfig.get", "params": {
                "module": module, "noParse": False, "device": "pc"}}
            try:
                resp = page.request.post(api_url, data=json.dumps(body),
                    headers={"Content-Type": "application/json"}, timeout=15000)
                txt = resp.text()
                print(f"\n{module}: HTTP {resp.status}", flush=True)
                # Try to parse and show key fields
                try:
                    d = json.loads(txt)
                    dd = json.dumps(d)
                    print(f"  {dd[:1000]}", flush=True)
                except:
                    print(f"  {txt[:500]}", flush=True)
                with open(f"C:\\pc-mcp-server\\{module}.json", "w") as f:
                    f.write(txt)
            except Exception as e:
                print(f"{module} -> {e}", flush=True)

    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
