"""Capture auth POST request/response during login."""
import time, re, io, sys, json
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

auth_reqs = []
auth_resps = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()

    def on_req(req):
        if "api/auth" in req.url and req.method == "POST":
            auth_reqs.append(req.post_data[:300] if req.post_data else "")
    def on_resp(resp):
        if "api/auth" in resp.url and resp.request.method == "POST":
            try:
                auth_resps.append((resp.status, resp.text()[:500]))
            except Exception as e:
                auth_resps.append(("err", str(e)[:100]))
    page.on("request", on_req)
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
                const t = el.innerText.trim();
                if (t.indexOf('I have read and agreed') === 0) { el.click(); break; }
            }
        }
        const cb = document.querySelector('input[type="checkbox"]');
        if (cb && !cb.checked) cb.click();
    }""")
    time.sleep(1)
    page.evaluate("""() => {
        for (const b of document.querySelectorAll('button')) {
            const t = (b.innerText || '').trim();
            if (t.indexOf('Log In') >= 0 && b.offsetParent !== null) { b.click(); break; }
        }
    }""")
    time.sleep(10)
    print("auth reqs: %d" % len(auth_reqs), flush=True)
    for r in auth_reqs:
        # mask the pwd value
        safe = re.sub(r'"pwd":"[^"]+"', '"pwd":"<masked>"', r)
        print("REQ: %s" % safe, flush=True)
    print("auth resps: %d" % len(auth_resps), flush=True)
    for s, b in auth_resps:
        print("RESP %s: %s" % (s, b), flush=True)
    print("url: %s" % page.url[:110], flush=True)
    # check agreement state
    agr = page.evaluate("""() => {
        const cb = document.querySelector('input[type="checkbox"]');
        return cb ? ('checked=' + cb.checked) : 'no-checkbox';
    }""")
    print("agreement: %s" % agr, flush=True)
    browser.close()
print("AUTHDBG DONE", flush=True)
