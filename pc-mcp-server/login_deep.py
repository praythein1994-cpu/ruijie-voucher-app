"""Deep debug login page state."""
import time, json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        args=["--ignore-certificate-errors", "--no-sandbox"], timeout=30000)
    page = browser.new_context(ignore_https_errors=True).new_page()

    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    page.on("console", lambda m: errors.append(f"console-{m.type}: {m.text[:100]}")
            if m.type == "error" else None)

    page.goto("https://100.88.200.103", wait_until="networkidle", timeout=30000)
    time.sleep(5)

    state = page.evaluate("""() => {
        const btns = [...document.querySelectorAll('button')].map(b => ({
            text: b.innerText.trim().slice(0,25),
            disabled: b.disabled,
            visible: b.offsetParent !== null
        }));
        const pwd = document.querySelector('input[type="password"]');
        return {
            buttons: btns,
            pwdExists: !!pwd,
            pwdVisible: pwd ? pwd.offsetParent !== null : false,
            url: location.href,
            title: document.title,
            bodyLen: document.body ? document.body.innerHTML.length : 0
        };
    }""")
    print(json.dumps(state, indent=2), flush=True)
    print(f"JS errors: {errors[:5]}", flush=True)
    browser.close()
print("DONE", flush=True)
