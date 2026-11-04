@echo off
title Campus360 Academic Platform Server
color 0b
echo =======================================================
echo    Campus360 Attendance, Syllabus ^& GPA Platform
echo =======================================================
echo.
echo Starting server on http://localhost:3000 ...
echo Press Ctrl+C at any time to stop the server.
echo.
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
