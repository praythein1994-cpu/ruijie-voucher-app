# One-click installer for PC Control MCP Server v2.0
# Run: powershell -ExecutionPolicy Bypass -File install-mcp.ps1
# Does: download → extract → npm install → playwright install → Claude Desktop config

$ErrorActionPreference = "Stop"
$MCP_DIR = "C:\pc-mcp-server"
$ZIP_URL = "https://ruijie-voucher-proxy.onrender.com/files/pc-mcp-server-v2.0.zip"
$ZIP_PATH = "$env:TEMP\pc-mcp-server-v2.0.zip"

Write-Host "=== PC Control MCP Server v2.0 Installer ===" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVer = node --version
    Write-Host "✓ Node.js $nodeVer found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Install from https://nodejs.org then re-run." -ForegroundColor Red
    exit 1
}

# 2. Download
Write-Host "Downloading MCP server..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $ZIP_URL -OutFile $ZIP_PATH -UseBasicParsing
Write-Host "✓ Downloaded" -ForegroundColor Green

# 3. Extract
Write-Host "Extracting to $MCP_DIR..." -ForegroundColor Yellow
if (Test-Path $MCP_DIR) { Remove-Item -Recurse -Force $MCP_DIR }
Expand-Archive -Path $ZIP_PATH -DestinationPath "C:\" -Force
Write-Host "✓ Extracted" -ForegroundColor Green

# 4. npm install
Write-Host "Installing dependencies (this takes a few minutes)..." -ForegroundColor Yellow
Set-Location $MCP_DIR
npm install --silent
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# 5. Playwright browsers
Write-Host "Installing Playwright browser..." -ForegroundColor Yellow
npx playwright install chromium --only-shell 2>$null
if ($LASTEXITCODE -ne 0) { npx playwright install chromium }
Write-Host "✓ Playwright ready" -ForegroundColor Green

# 6. Test server
Write-Host "Testing server..." -ForegroundColor Yellow
$testJson = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
$testResult = $testJson | node server.js 2>$null | ConvertFrom-Json
$toolCount = $testResult.result.tools.Count
Write-Host "✓ Server OK - $toolCount tools available" -ForegroundColor Green

# 7. Claude Desktop config
$claudeConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
$serverPath = "$MCP_DIR\server.js".Replace('\', '\\')
$mcpEntry = @{
    mcpServers = @{
        "pc-control" = @{
            command = "node"
            args = @($MCP_DIR + "\server.js")
        }
    }
}

if (Test-Path $claudeConfig) {
    $existing = Get-Content $claudeConfig -Raw | ConvertFrom-Json
    if (-not $existing.mcpServers) {
        $existing | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{} -Force
    }
    $existing.mcpServers | Add-Member -NotePropertyName "pc-control" -NotePropertyValue @{
        command = "node"
        args = @("$MCP_DIR\server.js")
    } -Force
    $existing | ConvertTo-Json -Depth 10 | Set-Content $claudeConfig
    Write-Host "✓ Claude Desktop config updated" -ForegroundColor Green
} else {
    $claudeDir = Split-Path $claudeConfig
    if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null }
    $mcpEntry | ConvertTo-Json -Depth 10 | Set-Content $claudeConfig
    Write-Host "✓ Claude Desktop config created" -ForegroundColor Green
}

# 8. Cursor config
$cursorConfig = "$env:USERPROFILE\.cursor\mcp.json"
$cursorDir = Split-Path $cursorConfig
if (-not (Test-Path $cursorDir)) { New-Item -ItemType Directory -Path $cursorDir -Force | Out-Null }
$mcpEntry | ConvertTo-Json -Depth 10 | Set-Content $cursorConfig
Write-Host "✓ Cursor config created" -ForegroundColor Green

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Cyan
Write-Host "MCP Server: $MCP_DIR" -ForegroundColor White
Write-Host "Tools: $toolCount (6 PC + 4 Browser)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Claude Desktop or Cursor" -ForegroundColor White
Write-Host "  2. Look for 'pc-control' in MCP settings" -ForegroundColor White
Write-Host "  3. Try: 'Use pc-control to get my system info'" -ForegroundColor White
