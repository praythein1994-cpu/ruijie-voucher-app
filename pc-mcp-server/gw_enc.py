"""Use page's own AES encrypt function, then login via page.request."""
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
    time.sleep(3)

    # Find encrypt function in page
    enc_info = page.evaluate("""() => {
        const out = {globals: []};
        for (const k of Object.keys(window)) {
            const kl = k.toLowerCase();
            if (kl.includes('encrypt') || kl.includes('aes') || kl.includes(' Gibberish'.trim())) {
                out.globals.push(k);
            }
        }
        // check common lib names
        out.hasGibberishAES = typeof GibberishAES !== 'undefined';
        out.hasCryptoJS = typeof CryptoJS !== 'undefined';
        return out;
    }""")
    print("enc: %s" % enc_info, flush=True)

    # Try GibberishAES (Ruijie uses this per parent notes: "GibberishAES hex key")
    enc_pwd = page.evaluate("""(pwd) => {
        try {
            if (typeof GibberishAES !== 'undefined') {
                // find the key - often in a hidden field or JS var
                const keyEl = document.querySelector('input[name="key"], #key');
                const key = keyEl ? keyEl.value : null;
                return 'key:' + key;
            }
            return 'no-gibberish';
        } catch(e) { return 'err:' + e.message.slice(0,80); }
    }""", PASSWORD)
    print("gibberish: %s" % str(enc_pwd)[:100], flush=True)

    # Look at how the login form encrypts - find the submit handler
    handler = page.evaluate("""() => {
        const scripts = [...document.querySelectorAll('script')].map(s => s.src).filter(s => s);
        return scripts.slice(0, 15);
    }""")
    print("scripts: %s" % handler, flush=True)
    browser.close()
print("ENCDONE", flush=True)
