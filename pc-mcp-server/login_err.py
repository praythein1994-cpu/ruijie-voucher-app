"""Check login error message."""
import time
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
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            if (b.innerText.includes('read and agreed')) b.click();
        }
    }""")
    time.sleep(2)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            if (b.innerText.trim() === 'Log In') b.click();
        }
    }""")
    time.sleep(5)
    # Get all visible text for errors
    text = page.evaluate("() => document.body.innerText")
    print(f"Body text: {text[:800]}", flush=True)
    page.screenshot(path=r"C:\pc-mcp-server\login_err.png")
    browser.close()
print("DONE", flush=True)
