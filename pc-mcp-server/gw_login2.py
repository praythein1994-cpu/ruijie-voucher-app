"""Full login via GibberishAES + page.request. Returns stok."""
import time, re, io, sys, json
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

def do_login(page):
    page.goto("https://100.88.200.103", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_selector('input[type="password"]', timeout=15000)
    time.sleep(2)
    # extract rotating key
    key = page.evaluate("""() => {
        const html = document.documentElement.innerHTML;
        const m = html.match(/GibberishAES\\.enc\\([^,]+,\\s*["']([a-fA-F0-9]{16,64})["']/);
        return m ? m[1] : null;
    }""")
    if not key:
        print("no key found", flush=True)
        return None
    print("key: %s..." % key[:12], flush=True)
    enc = page.evaluate("(pwd, k) => GibberishAES.enc(pwd, k).replace(/\\s+/g, '')", PASSWORD, key)
    print("enc len: %d, prefix: %s" % (len(enc), enc[:20]), flush=True)
    body = {"method": "login", "params": {
        "username": "admin", "time": str(int(time.time())),
        "encry": True, "pwd": enc, "isCheckReadAgreement": "true"}}
    resp = page.request.post("https://100.88.200.103/cgi-bin/luci/api/auth",
        data=json.dumps(body), headers={"Content-Type": "application/json"},
        timeout=25000)
    txt = resp.text()
    print("auth status: %s" % resp.status, flush=True)
    print("auth body: %s" % txt[:300], flush=True)
    try:
        d = json.loads(txt)
        stok = (d.get("data") or {}).get("stok", "")
        if stok:
            return stok
    except Exception:
        pass
    return None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()
    stok = do_login(page)
    print("STOK: %s" % ("YES " + stok[:16] + "..." if stok else "NO"), flush=True)
    if stok:
        # quick module probe
        api = "https://100.88.200.103/cgi-bin/luci/;stok=%s/api/cmd" % stok
        body = {"method": "devConfig.get", "params": {
            "module": "terminalManage", "noParse": False, "device": "pc"}}
        r = page.request.post(api, data=json.dumps(body),
            headers={"Content-Type": "application/json"}, timeout=20000)
        print("probe terminalManage: %s, %d chars" % (r.status, len(r.text())), flush=True)
    browser.close()
print("LOGINDONE", flush=True)
