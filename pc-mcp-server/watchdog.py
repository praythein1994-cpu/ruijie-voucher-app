"""
PC Relay Watchdog - Monitors relay health and auto-restarts if hung.
Runs independently from the relay. Checks every 30 seconds.
If relay doesn't process a test command within 60s, kills and restarts it.

Install: Run as Administrator
  python watchdog.py install    - Install as Windows Task Scheduler task
  python watchdog.py run        - Run watchdog loop (called by Task Scheduler)
  python watchdog.py uninstall - Remove scheduled task
"""
import subprocess, time, sys, os, json, urllib.request, urllib.parse

PROXY = "https://ruijie-voucher-proxy.onrender.com"
KEY = "0524eb92f9e15ffea75188b41bea7756b4fcda28e6fcad086b556398e0a7454a"
RELAY_BAT = r"C:\Users\cupid\AppData\Roaming\PCRelay\relay-keepalive.bat"
LOG_FILE = r"C:\Users\cupid\AppData\Roaming\PCRelay\watchdog.log"
TASK_NAME = "PCRelayWatchdog"

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except: pass

def api(method, path, data=None):
    url = f"{PROXY}{path}"
    headers = {}
    body = None
    if data:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"ok": False, "error": str(e)}

def is_relay_alive():
    """Send test command, check if relay processes it within 30s."""
    q = api("POST", "/api/pc/queue", {"key": KEY, "cmd": "echo WATCHDOG-PING"})
    if not q.get("ok"):
        log(f"Queue failed: {q}")
        return False
    cid = q["id"]
    deadline = time.time() + 30
    while time.time() < deadline:
        time.sleep(5)
        r = api("GET", f"/api/pc/result/{cid}?key={KEY}")
        if r.get("done"):
            return True
    log(f"Relay did not respond to ping within 30s (cmd {cid})")
    return False

def kill_relay():
    """Kill all relay-related processes."""
    log("Killing hung relay processes...")
    for proc in ["powershell.exe"]:
        try:
            # Only kill powershell running the relay (check commandline)
            out = subprocess.run(
                ["wmic", "process", "where", "name='powershell.exe'",
                 "get", "ProcessId,CommandLine", "/format:csv"],
                capture_output=True, text=True, timeout=10
            ).stdout
            for line in out.strip().split("\n")[1:]:
                if "pc-relay-agent" in line or "relay-keepalive" in line:
                    parts = line.split(",")
                    # CSV format: Node,CommandLine,ProcessId
                    pid = parts[-1].strip().strip('"')
                    if pid.isdigit():
                        subprocess.run(["taskkill", "/F", "/PID", pid],
                                       capture_output=True, timeout=10)
                        log(f"Killed PID {pid}")
        except Exception as e:
            log(f"Kill error: {e}")

def start_relay():
    """Start the relay via keepalive batch."""
    log("Starting relay via keepalive...")
    try:
        subprocess.Popen(
            ["cmd", "/c", RELAY_BAT],
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        log("Relay start command issued")
    except Exception as e:
        log(f"Start error: {e}")

def watchdog_loop():
    log("=== Watchdog started ===")
    failures = 0
    while True:
        try:
            if is_relay_alive():
                if failures > 0:
                    log("Relay recovered")
                failures = 0
            else:
                failures += 1
                log(f"Relay check failed ({failures}x)")
                if failures >= 2:
                    kill_relay()
                    time.sleep(5)
                    start_relay()
                    failures = 0
                    time.sleep(30)  # give it time to start
        except Exception as e:
            log(f"Watchdog error: {e}")
        time.sleep(30)

def install():
    """Install as Windows Task Scheduler task (runs at startup, restarts on failure)."""
    py = sys.executable
    script = os.path.abspath(__file__)
    # Create task that runs at startup and repeats
    cmd = [
        "schtasks", "/create", "/tn", TASK_NAME,
        "/tr", f'"{py}" "{script}" run',
        "/sc", "onstart",
        "/ru", "SYSTEM",
        "/rl", "highest",
        "/f",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout)
    print(r.stderr)
    # Also set to restart on failure every 1 minute
    subprocess.run([
        "schtasks", "/change", "/tn", TASK_NAME,
        "/ri", "1", "/du", "9999:00", "/k",
    ], capture_output=True)
    log("Watchdog installed as scheduled task")

def uninstall():
    subprocess.run(["schtasks", "/delete", "/tn", TASK_NAME, "/f"],
                   capture_output=True)
    log("Watchdog uninstalled")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: watchdog.py [install|run|uninstall]")
        sys.exit(1)
    action = sys.argv[1]
    if action == "install":
        install()
    elif action == "run":
        watchdog_loop()
    elif action == "uninstall":
        uninstall()
    else:
        print(f"Unknown: {action}")
