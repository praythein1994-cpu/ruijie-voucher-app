"""Capture login POST response to see error."""
import time, json
from playwright.sync_api import sync_playwright

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

responses = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()

    def on_resp(resp):
        if "/api/auth" in resp.url and resp.request.method == "POST":
            try:
                responses.append({"url": resp.url, "status": resp.status,
                                  "body": resp.text()[:1000]})
            except Exception as e:
                responses.append({"url": resp.url, "error": str(e)})
    page.on("response", on_resp)

    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)
    pwd = page.query_selector('input[type="password"]')
    pwd.fill(PASSWORD)
    time.sleep(1)
    pwd.press("Enter")
    time.sleep(8)

    print(f"Responses captured: {len(responses)}", flush=True)
    for r in responses:
        print(json.dumps(r, indent=2), flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
