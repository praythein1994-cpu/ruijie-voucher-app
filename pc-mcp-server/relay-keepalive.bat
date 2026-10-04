@echo off
REM PC Relay Agent - Auto-restart wrapper
REM Double-click this file. It will keep the relay running forever.
REM If the relay crashes, this restarts it automatically.

:loop
echo [%date% %time%] Starting relay agent...
powershell -ExecutionPolicy Bypass -File "C:\Users\cupid\AppData\Roaming\PCRelay\pc-relay-agent.ps1"
echo [%date% %time%] Relay stopped (exit code %errorlevel%). Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
