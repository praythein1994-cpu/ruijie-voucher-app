"""Direct API login attempt (no browser JS): try encry=false."""
import json, time, io, sys, urllib.request, ssl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PWD_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\gateway.pwd"
with open(PWD_FILE) as f:
    PASSWORD = f.read().strip()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def post(path, data, timeout=20):
    url = "https://100.88.200.103" + path
    req = urllib.request.Request(url, data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
            return ("OK", r.status, r.read()[:400])
    except Exception as e:
        return ("ERR", str(e)[:200], "")

# Try 1: plain password, encry=false
for encry, pwd in [(False, PASSWORD), (True, PASSWORD)]:
    body = {"method": "login", "params": {
        "username": "admin", "time": str(int(time.time())),
        "encry": encry, "pwd": pwd, "isCheckReadAgreement": "true"}}
    print("Trying encry=%s ..." % encry, flush=True)
    st, info, data = post("/cgi-bin/luci/api/auth", body, timeout=25)
    print("  %s %s" % (st, info), flush=True)
    if data:
        print("  data: %s" % data, flush=True)
    time.sleep(2)

print("APIDONE", flush=True)
