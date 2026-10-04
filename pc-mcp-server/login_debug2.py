"""Screenshot login page to debug."""
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)
    page.screenshot(path=r"C:\pc-mcp-server\login_debug.png")
    # List all buttons
    btns = page.evaluate("""() => {
        return [...document.querySelectorAll('button')].map(b => ({
            text: b.innerText.trim().slice(0,30),
            cls: b.className.toString().slice(0,60),
            type: b.type
        }));
    }""")
    print(f"Buttons: {btns}", flush=True)
    # List inputs
    inputs = page.evaluate("""() => {
        return [...document.querySelectorAll('input')].map(i => i.type);
    }""")
    print(f"Inputs: {inputs}", flush=True)
    browser.close()
print("DONE", flush=True)
