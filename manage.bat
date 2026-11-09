@echo off
title Campus360 - External Module Manager & Diagnostics
color 0e
echo ========================================================
echo   Campus360 External Module Manager
echo ========================================================
echo.
cd /d "%~dp0"

if "%~1"=="" (
    node external-manager.js diagnostics
    echo.
    echo ----------------------------------------------------
    echo Run "manage.bat users" to list all users
    echo Run "manage.bat health" to check database & cache
    echo Run "manage.bat unlock <email>" to unlock an account
    echo Run "manage.bat reset-password <email> <newPassword>"
    echo ----------------------------------------------------
) else (
    node external-manager.js %*
)

echo.
pause

