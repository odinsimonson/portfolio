@echo off
rem Publish the portfolio: rebuild the page copies, save a snapshot, and send it to GitHub.
rem Double-click this file. odinsimonson.com updates about a minute after it says "Published!".
cd /d "%~dp0"
echo Building pages...
python tools\build.py || goto :fail
git add -A
git diff --cached --quiet && (echo. & echo Nothing has changed since the last publish. & pause & exit /b 0)
set "msg=Update site"
set /p "msg=Describe this update (or press Enter for "Update site"): "
git commit -q -m "%msg%" || goto :fail
echo Sending to GitHub...
git pull -q --rebase origin main || goto :fail
git push -q origin main || goto :fail
echo.
echo Published! odinsimonson.com updates in about a minute.
pause
exit /b 0
:fail
echo.
echo Something went wrong, so nothing was published. Copy the message above and ask Claude about it.
pause
exit /b 1
