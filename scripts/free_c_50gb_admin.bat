@echo off
title 🔥 DON O C TOI DA - 50GB
cd /d "D:\QLy Phòng Khám Thú Y\scripts"

echo ╔══════════════════════════════════════╗
echo ║   DON O C - GIAI PHONG 50GB+        ║
echo ╚══════════════════════════════════════╝
echo.

:: 1. TAT HIBERNATION
echo [1/8] Tat Hibernation...
powercfg -h off >nul 2>&1
echo   OK

:: 2. XOA WINDOWS TEMP + PREFETCH
echo [2/8] Xoa Windows Temp + Prefetch...
takeown /f "C:\Windows\Temp" /r /d y >nul 2>&1
icacls "C:\Windows\Temp" /grant "84916:(OI)(CI)F" /T >nul 2>&1
rd /s /q "C:\Windows\Temp" >nul 2>&1
md "C:\Windows\Temp" >nul 2>&1

rd /s /q "C:\Windows\Prefetch" >nul 2>&1
md "C:\Windows\Prefetch" >nul 2>&1
echo   OK

:: 3. XOA WINDOWS UPDATE CACHE
echo [3/8] Xoa Windows Update cache...
net stop wuauserv /y >nul 2>&1
net stop bits /y >nul 2>&1
net stop trustedinstaller /y >nul 2>&1
rd /s /q "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
md "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
echo   OK

:: 4. DISK CLEANUP (MANH)
echo [4/8] Disk Cleanup (cleanmgr /verylowdisk)...
cleanmgr /verylowdisk /d C: >nul 2>&1
echo   OK

:: 5. TONGS HOP DON
echo [5/8] Xoa CrashDumps + Recycle Bin...
rd /s /q "C:\Users\84916\AppData\Local\CrashDumps" >nul 2>&1
rd /s /q "C:\Windows\Minidump" >nul 2>&1
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1
echo   OK

:: 6. CHUYEN PAGEFILE SANG D:
echo [6/8] Chuyen Pagefile sang D:...
wmic computersystem where name="%computername%" set AutomaticManagedPagefile=False >nul 2>&1
wmic pagefileset where "name='C:\\pagefile.sys'" delete >nul 2>&1
if not exist "D:\pagefile.sys" (
    wmic pagefileset create name="D:\\pagefile.sys" >nul 2>&1
    wmic pagefileset where "name='D:\\pagefile.sys'" set InitialSize=2048,MaximumSize=4096 >nul 2>&1
)
echo   OK (can restart de pagefile co hieu luc)

:: 7. DISM CLEANUP (WinSxS)
echo [7/8] DISM Cleanup (WinSxS - co the lau 5-15 phut)...
dism /online /Cleanup-Image /StartComponentCleanup /ResetBase /Quiet >nul 2>&1
echo   OK

:: 8. XOA WINDOWS.OLD NEU CO
echo [8/8] Xoa Windows.old (neu co)...
if exist "C:\Windows.old" (
    takeown /f "C:\Windows.old" /r /d y >nul 2>&1
    cacls "C:\Windows.old" /T /grant 84916:F >nul 2>&1
    rd /s /q "C:\Windows.old" >nul 2>&1
    echo   Da xoa Windows.old
) else (
    echo   Khong co Windows.old
)

echo.
echo ========== HOAN TAT ==========
echo.
echo Kiem tra lai dung luong C:
powershell -NoProfile -Command "Get-PSDrive C | Select-Object @{N='FreeGB';E={[math]::Round($_.Free/1GB,1)}}"
echo.
pause
