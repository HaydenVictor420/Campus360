@echo off
title Push Branch sanjay to GitHub - Campus360
color 0b
echo ========================================================
echo   Campus360 - Push Branch "sanjay" to GitHub
echo   Repository: https://github.com/HaydenVictor420/Campus360.git
echo   Active Branch: sanjay
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking current Git branch status...
"C:\Program Files\Git\cmd\git.exe" status
echo.

echo [2/3] Staging all files and committing...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat(auth): complete enterprise login module with MySQL, Redis, Cron, Winston, CI/CD, and external manager"
echo.

echo [3/3] Pushing branch "sanjay" to origin...
"C:\Program Files\Git\cmd\git.exe" push -u origin sanjay

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: Branch "sanjay" successfully pushed to GitHub!
    echo   URL: https://github.com/HaydenVictor420/Campus360/tree/sanjay
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   NOTE: If GitHub asked for authentication:
    echo   1. Use your GitHub Personal Access Token (PAT) as password
    echo   2. Or log in via Git Credential Manager browser prompt
    echo ========================================================
)

echo.
pause
