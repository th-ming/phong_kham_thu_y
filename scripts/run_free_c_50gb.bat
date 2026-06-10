@echo off
title 🔥 FREE 50GB+ ON C: - AUTO CLEANUP
cd /d "%~dp0"

:: ============================================
:: AUTO-ELEVATE TO ADMIN
:: ============================================
fltmc >nul 2>&1 || (
    echo ╔══════════════════════════════════════════╗
    echo ║   DANG NANG QUYEN ADMIN...               ║
    echo ║   Vui long click YES vao UAC             ║
    echo ╚══════════════════════════════════════════╝
    echo.
    echo CreateObject^("Shell.Application"^).ShellExecute "%~s0", "", "", "runas", 1 > "%temp%\getadmin.vbs"
    cscript "%temp%\getadmin.vbs" //nologo
    del "%temp%\getadmin.vbs"
    exit /b
)

:: ============================================
:: DA CO ADMIN - CHAY SCRIPT
:: ============================================
cd /d "%~dp0"
echo ╔══════════════════════════════════════════╗
echo ║   DA NANG QUYEN ADMIN!                   ║
echo ║   Dang chay script don o C...             ║
echo ╚══════════════════════════════════════════╝
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "free_c_50gb_auto.ps1"

echo.
echo ========== HOAN TAT ==========
echo.
echo Nhan phim bat ky de dong...
pause >nul
