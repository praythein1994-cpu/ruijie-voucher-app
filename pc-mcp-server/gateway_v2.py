"""Gateway API capture v2 - with proper timeouts, won't hang."""
import json, time, sys
from playwright.sync_api import sync_playwright

GATEWAY_URL = "https://100.88.200.103"
OUTPUT = r"C:\pc-mcp-server\gateway_apis.json"
captured = []

print("Starting browser...", flush=True)
with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,  # headless to avoid display issues
        args=["--ignore-certificate-errors", "--no-sandbox"],
        timeout=30000,
    )
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()
    page.on("request", lambda r: captured.append({
        "method": r.method, "url": r.url,
    }))

    print(f"Going to {GATEWAY_URL}...", flush=True)
    try:
        page.goto(GATEWAY_URL, wait_until="domcontentloaded", timeout=20000)
    except Exception as e:
        print(f"Goto warning: {e}", flush=True)

    time.sleep(5)
    title = page.title()
    print(f"Title: {title}", flush=True)

    pwd_count = len(page.query_selector_all('input[type="password"]'))
    print(f"Password fields: {pwd_count}", flush=True)

    page.screenshot(path=r"C:\pc-mcp-server\gateway_login.png")
    print("Screenshot saved", flush=True)

    # Filter interesting URLs
    print(f"\nTotal requests: {len(captured)}", flush=True)
    apis = [r for r in captured if any(
        k in r["url"].lower()
        for k in ["api", "cgi-bin", "login", "auth", ".js"]
    )]
    print(f"Interesting: {len(apis)}", flush=True)
    for r in apis[:30]:
        print(f"  {r['method']} {r['url'][:100]}", flush=True)

    with open(OUTPUT, "w") as f:
        json.dump(captured, f, indent=2)

    browser.close()
print("DONE", flush=True)
