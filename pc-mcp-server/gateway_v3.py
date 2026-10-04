"""Gateway login + API capture v3. Reads password from secure file on PC."""
import json, time
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
captured = []

# Read password (written by relay command, not in script)
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

print("Starting browser...", flush=True)
with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"],
        timeout=30000,
    )
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()

    # Capture API calls (POST with JSON bodies are the interesting ones)
    def on_req(req):
        if req.method == "POST":
            captured.append({
                "method": req.method,
                "url": req.url,
                "body": (req.post_data or "")[:2000],
            })
    page.on("request", on_req)

    page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)

    # Fill password and login
    pwd = page.query_selector('input[type="password"]')
    if pwd:
        pwd.fill(PASSWORD)
        time.sleep(1)
        # Find and click login button
        btn = page.query_selector('button[type="submit"], .login-btn, button:has-text("Login"), button:has-text("登录")')
        if btn:
            btn.click()
        else:
            pwd.press("Enter")
        print("Login submitted", flush=True)
        time.sleep(5)

    # Check if logged in
    print(f"Title after login: {page.title()}", flush=True)
    page.screenshot(path=r"C:\pc-mcp-server\gateway_after_login.png")

    # Navigate to a few key pages to capture their APIs
    for path in ["/admin/home_online", "/admin/device"]:
        try:
            page.goto(GATEWAY_URL + path, wait_until="domcontentloaded", timeout=15000)
            time.sleep(4)
            print(f"Visited {path}", flush=True)
        except Exception as e:
            print(f"Visit {path} failed: {e}", flush=True)

    print(f"\n=== Captured {len(captured)} POST requests ===", flush=True)
    # Deduplicate by URL
    seen = {}
    for r in captured:
        key = r["url"].split("?")[0]
        if key not in seen:
            seen[key] = r

    for url, r in list(seen.items())[:20]:
        print(f"\n{r['method']} {url[:100]}", flush=True)
        if r["body"]:
            print(f"  Body: {r['body'][:300]}", flush=True)

    with open(r"C:\pc-mcp-server\gateway_post_apis.json", "w") as f:
        json.dump(captured, f, indent=2)

    browser.close()

# Clean up password file
import os
try:
    os.remove(PWD_FILE)
    print("Password file cleaned", flush=True)
except: pass
print("DONE", flush=True)
