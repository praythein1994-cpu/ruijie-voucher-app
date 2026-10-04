"""Quick login test with agreement-first logic."""
import time, re, io, sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_selector('input[type="password"]', timeout=15000)
    time.sleep(2)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    page.evaluate("""() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
            if (el.children.length <= 1 && el.innerText) {
                const t = el.innerText.trim();
                if (t.indexOf('I have read and agreed') === 0) { el.click(); break; }
            }
        }
        const cb = document.querySelector('input[type="checkbox"]');
        if (cb && !cb.checked) cb.click();
    }""")
    time.sleep(1)
    clicked = page.evaluate("""() => {
        const btns = [...document.querySelectorAll('button')];
        for (const b of btns) {
            const t = (b.innerText || '').trim();
            if (t.indexOf('Log In') >= 0 && b.offsetParent !== null) { b.click(); return t; }
        }
        return 'none';
    }""")
    print("clicked: %s" % clicked, flush=True)
    time.sleep(8)
    print("url: %s" % page.url[:110], flush=True)
    print("STOK: %s" % bool(re.search(r';stok=[a-f0-9]+', page.url)), flush=True)
    browser.close()
print("TEST DONE", flush=True)
