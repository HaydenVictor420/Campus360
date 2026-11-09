@echo off
title GitHub Authorization Gateway (Device Flow)
color 0b
echo ========================================================
echo   Campus360 / Login Module - GitHub Permission Gateway
echo   Target: https://github.com/Mrtamilan46/Login-Module.git
echo ========================================================
echo.
echo Launching GitHub authorization...
echo.

"C:\Program Files\GitHub CLI\gh.exe" auth login -h github.com -p https -w

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   Authentication Successful! Pushing codes now...
    echo ========================================================
    echo.
    "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
    "C:\Program Files\Git\cmd\git.exe" push https://github.com/Mrtamilan46/Login-Module.git main --force
    "C:\Program Files\Git\cmd\git.exe" push https://github.com/Mrtamilan46/Login-Module.git sanjay --force
    echo.
    echo All codes successfully uploaded!
) else (
    echo.
    echo GitHub login was not completed.
)

echo.
pause

