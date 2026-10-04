"""Extract GibberishAES key from page, encrypt password, login via page.request."""
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

    html = page.content()
    with open(r"C:\pc-mcp-server\login_page.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("html saved: %d chars" % len(html), flush=True)

    # search for hex key patterns near GibberishAES usage
    for pat in [r'GibberishAES\.enc\([^,]+,\s*["\']([a-fA-F0-9]{16,64})["\']',
                r'["\']key["\']\s*:\s*["\']([a-fA-F0-9]{16,64})["\']',
                r'var\s+\w*[Kk]ey\w*\s*=\s*["\']([a-fA-F0-9]{16,64})["\']']:
        m = re.search(pat, html)
        if m:
            print("key pattern %s -> %s" % (pat[:30], m.group(1)[:24]), flush=True)

    # try encrypting with candidate: check page JS for the actual call
    call = page.evaluate("""() => {
        const html = document.documentElement.innerHTML;
        const i = html.indexOf('GibberishAES.enc(');
        return i >= 0 ? html.slice(i, i + 200) : 'not-found-inline';
    }""")
    print("enc call: %s" % call[:200], flush=True)
    browser.close()
print("KEYDONE", flush=True)
