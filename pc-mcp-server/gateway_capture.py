"""Gateway API capture via Playwright - DevTools replacement.
Opens Chrome, logs into gateway, captures all API calls."""
import json, time
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
OUTPUT_FILE = r"C:\pc-mcp-server\gateway_apis.json"

captured = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, args=["--ignore-certificate-errors"])
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()

    # Capture all requests
    def on_request(req):
        captured.append({
            "method": req.method,
            "url": req.url,
            "post_data": req.post_data,
        })
    page.on("request", on_request)

    print("Navigating to gateway...")
    page.goto(GATEWAY_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)

    # Take screenshot of login page
    page.screenshot(path=r"C:\pc-mcp-server\gateway_login.png")
    print("Login page screenshot saved")

    # Get page title and check if login form exists
    title = page.title()
    print(f"Page title: {title}")

    # Look for password field
    pwd_fields = page.query_selector_all('input[type="password"]')
    print(f"Password fields found: {len(pwd_fields)}")

    # Save captured requests
    with open(OUTPUT_FILE, "w") as f:
        json.dump(captured, f, indent=2)
    print(f"Captured {len(captured)} requests -> {OUTPUT_FILE}")

    # Print API-like requests
    print("\n=== API calls found ===")
    for r in captured:
        url = r["url"]
        if any(k in url for k in ["api", "cgi-bin", "cmd", "login", "auth"]):
            print(f"{r['method']} {url[:120]}")

    browser.close()
print("Done")
