@echo off
chcp 65001 >nul 2>&1
title Download Guardian - Quet Ma Doc Real-time
color 0A

echo.
echo  ==========================================
echo      DOWNLOAD GUARDIAN - Quet Ma Doc
echo      Tu dong quet file tai ve Downloads
echo  ==========================================
echo.
echo  [+] Dang khoi dong...
echo.

:: Chay PowerShell voi ExecutionPolicy Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DownloadGuardian.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [!] Co loi xay ra. Kiem tra lai Windows Defender.
    echo.
    pause
)
