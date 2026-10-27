@echo off
title CareLoop AI - Closed-Loop Care Coordination Platform
color 0A

:: Ensure the script runs in its current folder
cd /d "%~dp0"

echo ======================================================================
echo          CareLoop AI - Closed-Loop Care Coordination Platform         
echo ======================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found on your system!
    echo.
    echo Please download and install Node.js (version 18 or higher) from:
    echo   https://nodejs.org/
    echo.
    echo After installing Node.js, run this .bat file again.
    echo ======================================================================
    pause
    exit /b 1
)

:: Check if node_modules exists, install automatically if missing
if not exist "node_modules\" (
    echo [INFO] First-time setup detected.
    echo [INFO] Installing required libraries automatically...
    echo [INFO] Please wait a moment (this only happens once)...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Please ensure you have an active internet connection.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Libraries installed successfully!
    echo.
)

:: Set port to 3000
set PORT=3000

echo [INFO] Starting CareLoop AI full-stack server on http://localhost:3000 ...
echo [INFO] Your browser will open automatically in a few seconds.
echo.
echo ======================================================================
echo Press Ctrl + C in this window anytime to stop the server.
echo ======================================================================
echo.

:: Launch browser in background after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the application server
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] Attempting fallback start...
    call npx tsx server.ts
)

echo.
echo [INFO] CareLoop AI has stopped.
pause
