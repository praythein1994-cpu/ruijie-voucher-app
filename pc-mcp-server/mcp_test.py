import subprocess, json, sys
proc = subprocess.Popen(
    [r"C:\Program Files\nodejs\node.exe", r"C:\pc-mcp-server\server.js"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)
req = json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}) + "\n"
try:
    out, err = proc.communicate(input=req, timeout=15)
    line = out.strip().split("\n")[0]
    d = json.loads(line)
    tools = d["result"]["tools"]
    print(f"MCP-OK: {len(tools)} tools")
    for t in tools:
        print(" -", t["name"])
except Exception as e:
    print(f"FAIL: {e}")
    print("STDERR:", err[:500] if 'err' in dir() else "n/a")
