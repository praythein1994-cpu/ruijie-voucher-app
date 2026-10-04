"""Debug login: check page state, try login, report URL."""
import time, re, io, sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()
print("pwd len: %d" % len(PASSWORD), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    print("title: %s" % page.title(), flush=True)
    print("url: %s" % page.url[:90], flush=True)
    pwd = page.query_selector('input[type="password"]')
    print("pwd found: %s" % (pwd is not None), flush=True)
    # list all submit buttons
    btns = page.evaluate("""() => [...document.querySelectorAll('button')].map(
        b => b.innerText.trim().slice(0,30) + '|' + b.type + '|' + (b.offsetParent!==null))""")
    print("buttons: %s" % btns, flush=True)
    if pwd:
        pwd.fill(PASSWORD)
        time.sleep(1)
        btn = page.query_selector('button[type="submit"], .login-btn')
        if btn:
            btn.click()
            print("clicked: %s" % btn.inner_text()[:30], flush=True)
        else:
            pwd.press("Enter")
            print("pressed Enter", flush=True)
        time.sleep(8)
        print("after url: %s" % page.url[:110], flush=True)
        print("stok: %s" % bool(re.search(r';stok=[a-f0-9]+', page.url)), flush=True)
    browser.close()
print("DBG DONE", flush=True)
