# PC Control MCP Server v2.0

Ei Maung ရဲ့ earthquake-mcp pattern ကို လိုက်ပြီး ဆောက်ထားတဲ့ Windows PC control MCP server။

## Tools (10 ခု)

### PC Control
| Tool | လုပ်ဆောင်ချက် |
|------|--------------|
| `execute_command` | Whitelist ထဲက PowerShell/CMD command တွေ run |
| `read_file` | File ဖတ် |
| `write_file` | File ရေး |
| `list_directory` | Folder အတွင်း စာရင်း |
| `get_system_info` | PC သတင်းအချက်အလက် |
| `open_application` | App ဖွင့် |

### 🌐 Browser Automation (DevTools Replacement) — NEW in v2.0
| Tool | လုပ်ဆောင်ချက် |
|------|--------------|
| `browser_capture` | URL သွား → network request **အကုန်** auto-capture (DevTools Network tab အစား) |
| `browser_click` | Page ပေါ်က element ကို click |
| `browser_type` | Input ထဲ စာရိုက် (+ Enter) |
| `browser_screenshot` | Screenshot ရိုက် |

**v2.0 ရဲ့ အဓိက:** နင် DevTools ဖွင့်ပြီး manual ဖမ်းနေစရာမလိုတော့ဘူး —
AI က `browser_capture` နဲ့ API call တွေ အလိုအလျောက် ဖမ်းနိုင်ပြီ။

## Safety

- Command whitelist: `dir`, `echo`, `ipconfig`, `ping`, `systeminfo`, `tasklist`, `Get-*`, `adb`, `python`, `node`, `npm`, `git` စသည်
- Whitelist ပြင်ပ command များ BLOCKED
- Timeout: max 90 စက္ကန့်

## Install (Windows PC)

```powershell
# 1. Node.js install လုပ်ပါ (https://nodejs.org)
# 2. ဒီ folder ကို PC ပေါ် ကူးပါ
cd C:\pc-mcp-server
npm install

# 3. Test
node server.js
# "PC Control MCP Server running on stdio" ဆိုရင် OK
```

## Client Config

### Claude Desktop
`%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "pc-control": {
      "command": "node",
      "args": ["C:\\pc-mcp-server\\server.js"]
    }
  }
}
```

### Cursor
Settings → MCP → Add Server (ဒါမှမဟုတ် `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "pc-control": {
      "command": "node",
      "args": ["C:\\pc-mcp-server\\server.js"]
    }
  }
}
```

## Architecture

```
┌─────────────┐     stdio      ┌──────────────┐
│  MCP Client │ ◄────────────► │  pc-control  │
│ (Cursor/    │                │  MCP Server  │
│  Claude)    │                │  (Node.js)   │
└─────────────┘                └──────┬───────┘
                                     │ PowerShell
                                     ▼
                              ┌──────────────┐
                              │  Windows PC  │
                              └──────────────┘
```

Ei Maung ရဲ့ concept: **MCP = Behavior** (executable capabilities),
**SKILL = Knowledge** (how to use). ဒီ server က Behavior layer —
policy enforcement (whitelist) ကို server မှာပဲ လုပ်ထားတယ်။
