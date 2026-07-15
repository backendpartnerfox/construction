@echo off
echo ========================================
echo Restarting Test Environment
echo ========================================
echo.

echo Killing any running Node processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002"') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Waiting for port to be free...
timeout /t 2 /nobreak > nul

echo.
echo Starting fresh test server...
start cmd /k "node test-server-improved.js"

echo.
echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo.
echo Opening dashboard...
start http://localhost:3002

echo.
echo ========================================
echo Test server restarted!
echo Dashboard should open in your browser.
echo ========================================
echo.
echo If tests still fail, run:
echo   node test-fresh.js
echo.
echo To see the actual error messages.
echo.
pause
