"""Hybrid: browser loads page (gets cookies/key), then page.request.post for auth."""
import time, re, io, sys, json
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_selector('input[type="password"]', timeout=15000)
    time.sleep(2)

    cookies = ctx.cookies()
    print("cookies: %d" % len(cookies), flush=True)
    for c in cookies:
        print("  %s=%s..." % (c["name"], c["value"][:20]), flush=True)

    # Get the AES key / auth key from page JS context
    keyinfo = page.evaluate("""() => {
        const out = {};
        // look for common key variables
        try {
            const html = document.documentElement.innerHTML;
            const m = html.match(/(key|token|stok)[\"']?\\s*[:=]\\s*[\"']([a-f0-9]{16,64})[\"']/i);
            out.htmlKey = m ? m[2].slice(0,20) : null;
        } catch(e) { out.htmlKey = 'err'; }
        out.localKeys = Object.keys(localStorage).slice(0,10);
        return out;
    }""")
    print("keyinfo: %s" % keyinfo, flush=True)

    # Try page.request.post (shares cookies) with encry=false
    body = {"method": "login", "params": {
        "username": "admin", "time": str(int(time.time())),
        "encry": False, "pwd": PASSWORD, "isCheckReadAgreement": "true"}}
    try:
        resp = page.request.post("https://100.88.200.103/cgi-bin/luci/api/auth",
            data=json.dumps(body),
            headers={"Content-Type": "application/json"}, timeout=25000)
        print("page.request status: %s" % resp.status, flush=True)
        print("page.request body: %s" % resp.text()[:400], flush=True)
    except Exception as e:
        print("page.request err: %s" % str(e)[:200], flush=True)

    browser.close()
print("HYBRID DONE", flush=True)
