# PC Relay Agent (v1.5.118)
# ------------------------
# Lets the owner's assistant run shell commands on this Windows PC.
# It polls the Render proxy over HTTPS every 5 seconds, runs any queued
# command locally, and posts the output back. Nothing listens locally —
# safe behind NAT/firewall.
#
# SETUP (one time):
#   1. Replace REPLACE_WITH_KEY below with the relay key (given separately).
#   2. Open PowerShell and run:  powershell -ExecutionPolicy Bypass -File pc-relay-agent.ps1
#   3. Leave the window open while remote control is needed.
#      (Optional: Task Scheduler -> run at logon for persistence.)
#
# SECURITY: anyone with the key can queue commands on this PC. Keep the key
# private, and close this window when you no longer want remote access.

$Base = "https://ruijie-voucher-proxy.onrender.com"
$Key  = "REPLACE_WITH_KEY"

function ApiGet($path) {
    try { return Invoke-RestMethod -Uri "$Base$path" -Method Get -TimeoutSec 25 }
    catch { return $null }
}
function ApiPost($path, $body) {
    try {
        $json = $body | ConvertTo-Json -Compress -Depth 4
        return Invoke-RestMethod -Uri "$Base$path" -Method Post -Body $json -ContentType 'application/json' -TimeoutSec 25
    } catch { return $null }
}

if ($Key -eq "REPLACE_WITH_KEY") {
    Write-Host "ERROR: set `$Key to the relay key first." -ForegroundColor Red
    pause; exit 1
}

Write-Host "PC relay agent running — polling every 5s. Leave this window open." -ForegroundColor Green
while ($true) {
    try {
        $r = ApiGet "/api/pc/queue?key=$Key"
        if ($r -and $r.ok -and $r.commands -and $r.commands.Count -gt 0) {
            foreach ($c in $r.commands) {
                Write-Host ">> $($c.cmd)" -ForegroundColor Cyan
                $LASTEXITCODE = 0
                $txt = try {
                    (Invoke-Expression $c.cmd 2>&1 | Out-String)
                } catch { $_.ToString() }
                if ([string]::IsNullOrEmpty($txt)) { $txt = "(no output)" }
                if ($txt.Length -gt 18000) { $txt = $txt.Substring(0, 18000) + "`n...[truncated]" }
                $code = if ($LASTEXITCODE -ne 0) { $LASTEXITCODE } else { 0 }
                ApiPost "/api/pc/result" @{ key = $Key; id = $c.id; output = [string]$txt; exit = $code } | Out-Null
                Write-Host "   done (exit $code)" -ForegroundColor DarkGray
            }
        }
    } catch { Write-Host "poll error: $($_.ToString())" -ForegroundColor Yellow }
    Start-Sleep -Seconds 5
}
