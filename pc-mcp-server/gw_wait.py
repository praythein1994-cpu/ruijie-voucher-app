"""Wait longer for auth response (30s)."""
import time, re, io, sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

auth_resps = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()

    def on_resp(resp):
        if "api/auth" in resp.url and resp.request.method == "POST":
            try:
                auth_resps.append((resp.status, resp.text()[:600]))
            except Exception as e:
                auth_resps.append(("err", str(e)[:100]))
    page.on("response", on_resp)

    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_selector('input[type="password"]', timeout=15000)
    time.sleep(2)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    page.evaluate("""() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
            if (el.children.length <= 1 && el.innerText) {
                if (el.innerText.trim().indexOf('I have read and agreed') === 0) { el.click(); break; }
            }
        }
    }""")
    time.sleep(1)
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            const t = (b.innerText || '').trim();
            if (t.indexOf('Log In') >= 0 && b.offsetParent !== null) { b.click(); break; }
        }
    }""")
    print("clicked, waiting 35s for auth response...", flush=True)
    for i in range(7):
        time.sleep(5)
        if auth_resps:
            break
        print("  waited %ds, resps=%d" % ((i + 1) * 5, len(auth_resps)), flush=True)
    print("auth resps: %d" % len(auth_resps), flush=True)
    for s, b in auth_resps:
        print("RESP %s: %s" % (s, b), flush=True)
    print("url: %s" % page.url[:110], flush=True)
    print("STOK: %s" % bool(re.search(r';stok=[a-f0-9]+', page.url)), flush=True)
    browser.close()
print("WAITDONE", flush=True)
