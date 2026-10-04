"""Aggressive: try direct URL + JS module discovery + brute force."""
import json, time, re
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"

with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    # Collect ALL JS file URLs
    js_urls = []
    page.on("response", lambda r: js_urls.append(r.url)
            if r.url.endswith(".js") and "luci" in r.url else None)

    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.query_selector('input[type="password"]').fill(PASSWORD)
    time.sleep(1)
    btn = page.query_selector('button[type="submit"], .login-btn, button.el-button')
    if btn: btn.click()
    else: page.query_selector('input[type="password"]').press("Enter")
    time.sleep(8)

    stok_base = page.url.split("/admin")[0] + "/admin/"
    print(f"Stok base: {stok_base[:80]}", flush=True)

    # Try direct Terminal URLs
    for term_path in ["alone/behavior/Terminal", "alone/behavior/TerminalConfig",
                       "alone/behavior/terminal", "clients/terminal"]:
        try:
            captured = []
            def on_req(req, cap=captured):
                if req.method == "POST" and "/api/cmd" in req.url:
                    b = req.post_data or ""
                    if "login" not in b and "getAuthority" not in b:
                        cap.append(b)
            page.on("request", on_req)
            page.goto(stok_base + term_path, wait_until="domcontentloaded", timeout=15000)
            time.sleep(5)
            # Check if page has terminal config content
            has_config = page.evaluate("""() => {
                const t = document.body ? document.body.innerText : '';
                return t.includes('Client Detection') || t.includes('SADP') || t.includes('Terminal');
            }""")
            print(f"{term_path}: has_config={has_config}, apis={len(captured)}", flush=True)
            if has_config:
                results["working_path"] = term_path
                # Extract modules
                mods = set()
                for b in captured:
                    m = re.search(r'"module":"([^"]+)"', b)
                    if m: mods.add(m.group(1))
                results["modules"] = sorted(mods)
                print(f"Modules: {sorted(mods)}", flush=True)
                break
            page.remove_listener("request", on_req)
        except Exception as e:
            print(f"{term_path}: {e}", flush=True)

    # Search JS files for terminal module names
    print(f"\nJS files loaded: {len(js_urls)}", flush=True)
    terminal_mods = set()
    for js_url in js_urls[:20]:
        try:
            resp = page.request.get(js_url, timeout=10000)
            if resp.ok:
                text = resp.text()
                # Find module names near "terminal" or "Terminal"
                for m in re.finditer(r'module["\']?\s*:\s*["\']([^"\']*terminal[^"\']*)["\']', text, re.I):
                    terminal_mods.add(m.group(1))
                for m in re.finditer(r'"(sta_[a-z_]+|terminal[a-z_]*)"', text, re.I):
                    if "terminal" in m.group(1).lower():
                        terminal_mods.add(m.group(1))
        except: pass
    if terminal_mods:
        print(f"Terminal modules in JS: {terminal_mods}", flush=True)
        results["js_modules"] = sorted(terminal_mods)

    with open(r"C:\pc-mcp-server\terminal_discovery.json", "w") as f:
        json.dump(results, f, indent=2)
    browser.close()

import os
try: os.remove(PWD_FILE)
except: pass
print("DONE", flush=True)
