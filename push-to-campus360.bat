@echo off
title Push Branch sanjay to HaydenVictor420/Campus360
color 0b
echo ========================================================
echo   Campus360 - Upload Branch "sanjay" to Campus360 Repo
echo   Repository: https://github.com/HaydenVictor420/Campus360.git
echo   Active Branch: sanjay
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Ensuring active branch is 'sanjay'...
"C:\Program Files\Git\cmd\git.exe" checkout sanjay
"C:\Program Files\Git\cmd\git.exe" branch -f sanjay HEAD
echo.

echo [2/3] Checking Git status and staging...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat(auth): add login module to branch sanjay" 2>nul
echo.

echo [3/3] Attempting to push branch 'sanjay' to Campus360...
"C:\Program Files\Git\cmd\git.exe" push -u campus360 sanjay

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Branch "sanjay" uploaded successfully!
    echo   URL: https://github.com/HaydenVictor420/Campus360/tree/sanjay
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   PERMISSION ERROR (HTTP 403 Forbidden):
    echo   Your GitHub account (Mrtamilan46) needs Write access
    echo   to HaydenVictor420/Campus360.
    echo.
    echo   If you have a collaborator token or HaydenVictor's token:
    echo ========================================================
    set /p "PAT=Enter Collaborator Token (or press Enter to exit): "
    if not "%PAT%"=="" (
        "C:\Program Files\Git\cmd\git.exe" push https://%PAT%@github.com/HaydenVictor420/Campus360.git sanjay
    )
)

echo.
pause

