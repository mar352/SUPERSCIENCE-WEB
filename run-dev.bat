@echo off
title SUPERSCIENCE Web - Local Dev Server
cd /d "%~dp0"

echo ======================================================
echo    SUPERSCIENCE // DEVELOPMENT ENVIRONMENT
echo ======================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, install if missing
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
    echo.
)

echo [INFO] Launching SUPERSCIENCE Node.js server...
echo [INFO] Local Store:     http://localhost:3000
echo [INFO] Database Admin:  http://localhost:3000/admin.html
echo [INFO] Press Ctrl+C in this window anytime to stop the server.
echo.

:: Open browser automatically after a brief delay
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start Node.js dev server with native file watch (Node 18+)
node --watch server.js

pause
