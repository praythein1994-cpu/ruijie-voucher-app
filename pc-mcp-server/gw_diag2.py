"""Diagnose login page state with screenshot."""
import time, re, io, sys
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

    # capture auth responses
    auth = []
    page.on("response", lambda r: auth.append(
        (r.status, r.url[-40:])) if "api/auth" in r.url else None)

    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    try:
        page.wait_for_selector('input[type="password"]', timeout=15000)
        print("pwd selector OK", flush=True)
    except Exception as e:
        print("pwd selector TIMEOUT: %s" % e, flush=True)
        page.screenshot(path=r"C:\pc-mcp-server\login_state.png")
        print("screenshot saved", flush=True)
        browser.close()
        sys.exit(0)

    time.sleep(2)
    # dump visible text
    txt = page.evaluate("() => document.body ? document.body.innerText.slice(0,600) : 'NO BODY'")
    print("body text: %s" % txt.replace("\n", " | "), flush=True)

    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    clicked = page.evaluate("""() => {
        for (const b of document.querySelectorAll('button[type="submit"]')) {
            if (b.offsetParent !== null && b.innerText.trim() === 'Log In') {
                b.click(); return 'login-btn';
            }
        }
        return 'none';
    }""")
    print("clicked: %s" % clicked, flush=True)
    time.sleep(10)
    print("auth calls: %d" % len([a for a in auth if a]), flush=True)
    for a in auth:
        if a:
            print("  auth resp: %s %s" % (a[0], a[1]), flush=True)
    print("url: %s" % page.url[:110], flush=True)
    # check for error toast/message
    err = page.evaluate("""() => {
        const t = document.body.innerText;
        const m = t.match(/(incorrect|wrong|error|failed|locked|\\.\\u9519.{0,20})/i);
        return m ? m[0] : 'no-error-text';
    }""")
    print("err hint: %s" % err, flush=True)
    page.screenshot(path=r"C:\pc-mcp-server\login_state.png")
    print("screenshot saved", flush=True)
    browser.close()
print("DIAG DONE", flush=True)
