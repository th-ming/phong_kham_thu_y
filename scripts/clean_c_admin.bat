@echo off
title Dọn Ổ C - Tự Động
cd /d "%~dp0"

echo === GIAI PHONG O C TOI DA ===
echo.

echo [1] Tat Hibernation...
powercfg -h off
if %errorlevel% equ 0 (echo   OK) else (echo   THAT BAI)

echo [2] Xoa Windows Temp...
takeown /f "C:\Windows\Temp" /r /d y >nul 2>&1
icacls "C:\Windows\Temp" /grant "84916:(OI)(CI)F" /T >nul 2>&1
rd /s /q "C:\Windows\Temp" >nul 2>&1
md "C:\Windows\Temp" >nul 2>&1
echo   OK

echo [3] Xoa Windows Update cache...
net stop wuauserv /y >nul 2>&1
net stop bits /y >nul 2>&1
rd /s /q "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
md "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
echo   OK

echo [4] Xoa Prefetch...
rd /s /q "C:\Windows\Prefetch" >nul 2>&1
md "C:\Windows\Prefetch" >nul 2>&1
echo   OK

echo [5] Chay Disk Cleanup...
cleanmgr /verylowdisk /d C:
echo   OK

echo [6] Xoa CrashDumps...
rd /s /q "C:\Users\84916\AppData\Local\CrashDumps" >nul 2>&1
rd /s /q "C:\Windows\Minidump" >nul 2>&1
echo   OK

echo [7] Empty Recycle Bin...
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"
echo   OK

echo.
echo === HOAN TAT! ===
pause
