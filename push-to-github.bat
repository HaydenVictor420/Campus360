@echo off
title Push Branch shiffana to GitHub
color 0a
echo ========================================================
echo   Campus360 - Push Branch "shiffana" to GitHub
echo   Repository: https://github.com/HaydenVictor420/Campus360.git
echo ========================================================
echo.
cd /d "%~dp0"
echo Verifying current branch...
git status
echo.
echo Pushing branch shiffana to origin...
git push -u origin shiffana
echo.
echo ========================================================
echo   Push process completed!
echo ========================================================
pause
