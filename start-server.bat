@echo off
title Campus360 - Authentication & User Management Service
color 0a
echo ========================================================
echo   Campus360 - Authentication & User Management Portal
echo   DevOps Stack: Node.js, MySQL, Redis, Winston, Cron
echo ========================================================
echo.

cd /d "%~dp0"

echo Starting server on http://localhost:3000 ...
echo Press Ctrl+C at any time to stop the server.
echo.

node src/server.js
pause
