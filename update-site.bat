@echo off
cd /d "%~dp0"

echo ==============================
echo Maharex Website Update Start
echo ==============================

git status

git add .

set /p msg=Commit message input: 

git commit -m "%msg%"

git push origin main

echo ==============================
echo Update complete.
echo Check Vercel deployment status.
echo ==============================

pause