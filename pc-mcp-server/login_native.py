"""Use Playwright native click."""
import time, json, re
from playwright.sync_api import sync_playwright

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()

    auth_done = []
    def on_resp(resp):
        if "api/auth" in resp.url:
            auth_done.append(resp.status)
    page.on("response", on_resp)

    page.goto("https://100.88.200.103", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    page.fill('input[type="password"]', PASSWORD)
    time.sleep(1)
    # Native Playwright click on Log In
    page.get_by_role("button", name="Log In").click()
    print("Native click done", flush=True)
    time.sleep(10)
    print(f"Auth calls: {auth_done}", flush=True)
    print(f"URL: {page.url[:100]}", flush=True)
    m = re.search(r';stok=([a-f0-9]+)', page.url)
    print(f"Stok: {'YES' if m else 'NO'}", flush=True)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
