@echo off
cd /d "%~dp0"

echo ==============================
echo Maharex Website Update Start
echo ==============================

echo.
git status

echo.
git add .

git diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo No changes to commit.
  pause
  exit /b 0
)

set /p msg=Commit message input: 

if "%msg%"=="" (
  echo Commit message is required.
  pause
  exit /b 1
)

git commit -m "%msg%"
if errorlevel 1 (
  echo Commit failed. Push was skipped.
  pause
  exit /b 1
)

git push origin main
if errorlevel 1 (
  echo Push failed.
  pause
  exit /b 1
)

echo ==============================
echo Update complete.
echo Check Vercel deployment status.
echo ==============================

pause
