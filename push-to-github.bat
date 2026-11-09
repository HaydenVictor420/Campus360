@echo off
title Push Codes to Mrtamilan46/Login-Module & Campus360
color 0b
echo ========================================================
echo   Campus360 - Push Codes to GitHub
echo   Target: https://github.com/Mrtamilan46/Login-Module.git
echo   Active Branches: main, sanjay
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking current Git status...
"C:\Program Files\Git\cmd\git.exe" status
echo.

echo [2/4] Staging all files and committing...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat(auth): complete enterprise login module with MySQL, Redis, Cron, Winston, and CI/CD"
echo.

echo [3/4] Aligning branches 'main' and 'sanjay'...
"C:\Program Files\Git\cmd\git.exe" branch -f main HEAD
"C:\Program Files\Git\cmd\git.exe" branch -f sanjay HEAD
echo.

echo [4/4] Pushing to https://github.com/Mrtamilan46/Login-Module.git ...
"C:\Program Files\Git\cmd\git.exe" push mrtamilan main --force
"C:\Program Files\Git\cmd\git.exe" push mrtamilan sanjay --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: Successfully pushed to your GitHub profile!
    echo   URL: https://github.com/Mrtamilan46/Login-Module
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   PERMISSION REQUIRED:
    echo   To grant GitHub upload permissions, run either:
    echo   1. upload-with-token.bat (Paste your GitHub PAT)
    echo   2. github-login-device.bat (Sign in via GitHub CLI)
    echo ========================================================
)

echo.
pause
