@echo off
title Push Codes to Mrtamilan46/Login-Module
color 0a
echo ========================================================
echo   Campus360 / Login Module - Upload to GitHub
echo   Repository: https://github.com/Mrtamilan46/Login-Module.git
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Ensuring remote is configured...
"C:\Program Files\Git\cmd\git.exe" remote set-url origin https://github.com/Mrtamilan46/Login-Module.git
echo.

echo [2/4] Staging and committing all files...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat(auth): complete enterprise login module with MySQL, Redis, Cron, Winston, and CI/CD"
echo.

echo [3/4] Preparing branches 'main' and 'sanjay'...
"C:\Program Files\Git\cmd\git.exe" branch -f main HEAD
"C:\Program Files\Git\cmd\git.exe" branch -f sanjay HEAD
echo.

echo [4/4] Pushing to GitHub (https://github.com/Mrtamilan46/Login-Module.git)...
echo If a GitHub popup opens in your browser, please approve the permission.
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main --force
"C:\Program Files\Git\cmd\git.exe" push -u origin sanjay --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All codes successfully uploaded to:
    echo   https://github.com/Mrtamilan46/Login-Module
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   PERMISSION REQUIRED:
    echo   If Git Credential Manager was unable to sign in:
    echo   Run "upload-with-token.bat" and paste your GitHub
    echo   Personal Access Token (PAT).
    echo ========================================================
)

echo.
pause
