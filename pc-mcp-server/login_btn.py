"""Click agreement, then Log In button, capture auth response."""
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
        if "api/auth" in resp.url:
            try:
                responses.append({"status": resp.status, "body": resp.text()[:800]})
            except: pass
    page.on("response", on_resp)

    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)

    # Step 1: agreement
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button'))
            if (b.innerText.includes('read and agreed')) b.click();
    }""")
    time.sleep(2)

    # Step 2: fill password
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)

    # Step 3: click Log In (exact text match)
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button'))
            if (b.innerText.trim() === 'Log In') b.click();
    }""")
    time.sleep(8)

    print(f"Auth responses: {len(responses)}", flush=True)
    for r in responses:
        print(json.dumps(r)[:900], flush=True)
    print(f"URL: {page.url[:100]}", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
