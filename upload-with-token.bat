@echo off
title GitHub Token Gateway - Upload to Mrtamilan46/Login-Module
color 0b
echo ========================================================
echo   Campus360 / Login Module - Secure Token Gateway
echo   Target: https://github.com/Mrtamilan46/Login-Module.git
echo ========================================================
echo.

cd /d "%~dp0"

set "TOKEN=%~1"
if "%TOKEN%"=="" (
    echo To grant upload permission to your GitHub repository:
    echo 1. Go to: https://github.com/settings/tokens
    echo 2. Generate a token (Classic) with "repo" permission checked
    echo 3. Copy the token (starts with ghp_...)
    echo.
    set /p "TOKEN=Enter your GitHub Personal Access Token (PAT): "
)

if "%TOKEN%"=="" (
    echo [ERROR] Token cannot be empty. Aborting.
    pause
    exit /b 1
)

echo.
echo [1/3] Staging and committing all files...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat(auth): complete enterprise login module with MySQL, Redis, Cron, Winston, and CI/CD"
echo.

echo [2/3] Configuring remote gateway with token...
"C:\Program Files\Git\cmd\git.exe" branch -f main HEAD
"C:\Program Files\Git\cmd\git.exe" branch -f sanjay HEAD
echo.

echo [3/3] Uploading code to https://github.com/Mrtamilan46/Login-Module.git ...
"C:\Program Files\Git\cmd\git.exe" push https://%TOKEN%@github.com/Mrtamilan46/Login-Module.git main --force
"C:\Program Files\Git\cmd\git.exe" push https://%TOKEN%@github.com/Mrtamilan46/Login-Module.git sanjay --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   UPLOAD COMPLETED SUCCESSFULLY!
    echo   Repository URL: https://github.com/Mrtamilan46/Login-Module
    echo   Branches updated: 'main' and 'sanjay'
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ERROR] Upload failed. Please verify that your token
    echo   has 'repo' write permissions for Mrtamilan46/Login-Module.
    echo ========================================================
)

echo.
pause

