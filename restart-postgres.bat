@echo off
title SUPERSCIENCE - Restart PostgreSQL Service
echo ============================================================
echo   SUPERSCIENCE // POSTGRESQL SERVICE RELOAD ^& SYNC
echo ============================================================
echo.
echo Checking administrator privileges...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Prompting Windows User Account Control for Administrator permission...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [*] Restarting postgresql-x64-18 service...
net stop postgresql-x64-18
net start postgresql-x64-18

echo.
echo [OK] PostgreSQL service restarted with TRUST authentication (NO PASSWORD).
echo [*] Verifying connection to SUPERSCIENCE database...
cd /d "%~dp0"
node -e "const { testConnection } = require('./db'); testConnection().then(r => { console.log(r.connected ? '>>> POSTGRESQL STATUS: CONNECTED (' + r.database + ')' : '>>> POSTGRESQL STATUS: ' + r.error); process.exit(0); });"

echo.
echo ============================================================
echo   SETUP COMPLETE!
echo ============================================================
pause
