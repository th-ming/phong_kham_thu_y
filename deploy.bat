@echo off
chcp 65001 >nul
title Rexi Deploy 🚀

:: Kiểm tra tham số commit message
if "%1"=="" (
    echo ❌ Thieu commit message!
    echo.
    echo Cach dung: deploy "noi dung commit"
    echo Vi du: deploy "sua chatbot AI"
    pause
    exit /b 1
)

set COMMIT_MSG=%*

echo.
echo 🚀 Rexi Auto-Deploy starting...
echo.
echo 📦 Commit: %COMMIT_MSG%
echo.

:: Git add
echo [1/3] 📂 Git add...
call git add .
if %errorlevel% neq 0 (
    echo ❌ Loi git add
    pause
    exit /b 1
)
echo ✅ Done
echo.

:: Git commit
echo [2/3] ✍️ Git commit...
call git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo ❌ Loi git commit (co the khong co gi moi)
    pause
    exit /b 1
)
echo ✅ Done
echo.

:: Git push
echo [3/3] ☁️ Git push to master (deploy len Render...)
call git push origin master
if %errorlevel% neq 0 (
    echo ❌ Loi git push
    pause
    exit /b 1
)
echo.
echo ✅✅✅ THANH CONG! Code da duoc deploy! 🚀🚀🚀
echo.
pause
