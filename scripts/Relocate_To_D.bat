@echo off
title 🚀 RELOCATE TO D: - GIẢI PHÓNG Ổ C
cd /d "D:\QLy Phòng Khám Thú Y\scripts"

:: ============================================
:: KIEM TRA ADMIN
:: ============================================
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ╔══════════════════════════════════════════════╗
    echo ║   CANH BAO: THIEU QUYEN ADMINISTRATOR        ║
    echo ║  Right-click file nay -^> Run as administrator ║
    echo ╚══════════════════════════════════════════════╝
    pause
    exit /b 1
)

setlocal enabledelayedexpansion
set "USERNAME=84916"
set "USERPROFILE=C:\Users\%USERNAME%"
set "LOCAL=%USERPROFILE%\AppData\Local"

:: ============================================
:: THONG TIN
:: ============================================
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     RELOCATE TO D:  -  GIAI PHONG O C               ║
echo ║     Muc tieu: O C trong it nhat 50GB                ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo  Quy trinh nay se tu dong:
echo   1. Tat Hibernation (free ~6-8GB)
echo   2. Xoa Temp + Prefetch (free ~10-20GB)
echo   3. Disk Cleanup + Windows Update cache (free ~5-15GB)
echo   4. Don Windows.old + WinSxS (free ~10-20GB)
echo   5. Chuyen Pagefile sang D: (free ~8-16GB)
echo   6. Xoa cache 4 trinh duyet (free ~5-15GB)
echo   7. Chuyen User Folders + copy du lieu sang D:
echo   8. Chuyen TEMP user sang D:
echo   9. Chuyen npm/pip cache sang D:
echo  10. Xu ly OneDrive
echo  11. Xoa crash dumps
echo  12. Empty Recycle Bin
echo.
echo TONG: Giai phong ~50-90GB tren O C
echo.

set /p confirm=" Tiep tuc? (Y/N, mac dinh Y): "
if /i "%confirm%"=="N" exit /b
if /i "%confirm%"=="n" exit /b

echo.
echo ========== BAT DAU ==========
echo.

:: ==============================
:: 1. TAT HIBERNATION (free 6-8GB)
:: ==============================
echo [1/12] Tat Hibernation...
powercfg -h off >nul 2>&1
if %errorLevel% equ 0 (
    echo   Da tat Hibernation - free ~6-8GB
) else (
    echo   Co the da tat roi
)
echo.

:: ==============================
:: 2. XOA TEMP + PREFETCH (free 10-20GB)
:: ==============================
echo [2/12] Xoa Temp + Prefetch...
takeown /f "C:\Windows\Temp" /r /d y >nul 2>&1
icacls "C:\Windows\Temp" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
rd /s /q "C:\Windows\Temp" >nul 2>&1
md "C:\Windows\Temp" >nul 2>&1

rd /s /q "%USERPROFILE%\AppData\Local\Temp" >nul 2>&1
md "%USERPROFILE%\AppData\Local\Temp" >nul 2>&1

rd /s /q "C:\Windows\Prefetch" >nul 2>&1
md "C:\Windows\Prefetch" >nul 2>&1
echo   Da xoa Temp + Prefetch
echo.

:: ==============================
:: 3. DISK CLEANUP + WINDOWS UPDATE CACHE (free 5-15GB)
:: ==============================
echo [3/12] Disk Cleanup + Windows Update cache...
start /b /wait cleanmgr /verylowdisk /d C: >nul 2>&1

net stop wuauserv /y >nul 2>&1
net stop trustedinstaller /y >nul 2>&1
net stop bits /y >nul 2>&1
rd /s /q "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
md "C:\Windows\SoftwareDistribution\Download" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1

echo   Da chay Disk Cleanup + xoa Windows Update cache
echo.

:: ==============================
:: 4. DON WINDOWS.OLD + WinSxS (free 10-20GB)
:: ==============================
echo [4/12] Don Windows.old + WinSxS...
if exist "C:\Windows.old" (
    echo   Dang xoa Windows.old (co the lau)...
    takeown /f "C:\Windows.old" /r /d y >nul 2>&1
    icacls "C:\Windows.old" /T /grant %USERNAME%:F >nul 2>&1
    rd /s /q "C:\Windows.old" >nul 2>&1
    if exist "C:\Windows.old" (
        echo   Can xoa C:\Windows.old bang tay (dang duoc su dung)
    ) else (
        echo   Da xoa Windows.old
    )
)

echo   Dang toi uu WinSxS (5-15 phut, vui long cho...)
dism /online /Cleanup-Image /StartComponentCleanup /ResetBase /Quiet >nul 2>&1
echo   Da toi uu WinSxS
echo.

:: ==============================
:: 5. CHUYEN PAGEFILE SANG D: (free 8-16GB)
:: ==============================
echo [5/12] Chuyen Pagefile sang D:...
fsutil volume diskfree D: >nul 2>&1
if %errorLevel% equ 0 (
    wmic computersystem where name="%computername%" set AutomaticManagedPagefile=False >nul 2>&1
    wmic pagefileset where name="C:\\pagefile.sys" delete >nul 2>&1
    wmic pagefileset create name="D:\\pagefile.sys" >nul 2>&1
    wmic pagefileset where name="D:\\pagefile.sys" set InitialSize=0,MaximumSize=0 >nul 2>&1
    echo   Da chuyen Pagefile sang D: (can restart)
) else (
    echo   O D khong kha dung
)
echo.

:: ==============================
:: 6. XOA CACHE TRINH DUYET (free 5-15GB)
:: ==============================
echo [6/12] Xoa cache 4 trinh duyet...
echo   (Dang dong cac trinh duyet de don cache...)

if exist "!LOCAL!\Google\Chrome\User Data\Default" (
    taskkill /f /im chrome.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    rd /s /q "!LOCAL!\Google\Chrome\User Data\Default\Cache" >nul 2>&1
    rd /s /q "!LOCAL!\Google\Chrome\User Data\Default\Code Cache" >nul 2>&1
    rd /s /q "!LOCAL!\Google\Chrome\User Data\Default\Service Worker\CacheStorage" >nul 2>&1
    echo   Chrome
)

if exist "!LOCAL!\Microsoft\Edge\User Data\Default" (
    taskkill /f /im msedge.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    rd /s /q "!LOCAL!\Microsoft\Edge\User Data\Default\Cache" >nul 2>&1
    rd /s /q "!LOCAL!\Microsoft\Edge\User Data\Default\Code Cache" >nul 2>&1
    echo   Edge
)

if exist "!LOCAL!\Opera Software\Opera Stable" (
    taskkill /f /im opera.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    rd /s /q "!LOCAL!\Opera Software\Opera Stable\Cache" >nul 2>&1
    echo   Opera
)

if exist "!LOCAL!\CocCoc\Browser\User Data\Default" (
    taskkill /f /im coccoc.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    rd /s /q "!LOCAL!\CocCoc\Browser\User Data\Default\Cache" >nul 2>&1
    rd /s /q "!LOCAL!\CocCoc\Browser\User Data\Default\Code Cache" >nul 2>&1
    echo   CocCoc
)
echo.

:: ==============================
:: 7. CHUYEN USER FOLDERS + COPY DU LIEU SANG D:
:: ==============================
echo [7/12] Chuyen User folders + copy du lieu sang D:...

for %%f in (Downloads Documents Desktop Pictures Videos Music) do (
    if not exist "D:\Users\%USERNAME%\%%f" md "D:\Users\%USERNAME%\%%f"
)

echo   Dang copy du lieu tu C: sang D: (co the lau neu co nhieu file)...
robocopy "C:\Users\%USERNAME%\Downloads"  "D:\Users\%USERNAME%\Downloads"  /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul
robocopy "C:\Users\%USERNAME%\Documents"  "D:\Users\%USERNAME%\Documents"  /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul
robocopy "C:\Users\%USERNAME%\Desktop"    "D:\Users\%USERNAME%\Desktop"    /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul
robocopy "C:\Users\%USERNAME%\Pictures"   "D:\Users\%USERNAME%\Pictures"   /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul
robocopy "C:\Users\%USERNAME%\Videos"     "D:\Users\%USERNAME%\Videos"     /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul
robocopy "C:\Users\%USERNAME%\Music"      "D:\Users\%USERNAME%\Music"      /E /COPY:DAT /R:1 /W:1 /NP /NFL /NDL >nul

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "{374DE290-123F-4565-9164-39C4925E467B}" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Downloads" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "{FDD39AD0-238F-46AF-ADB4-6C85480369C7}" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Documents" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "Desktop" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Desktop" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "{B4BFCC3A-DB2C-424C-B029-7FE99A87C641}" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Pictures" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "{35286A68-3C57-41A1-BBB1-0EAE73AA76B5}" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Videos" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v "{A0C69A99-21C8-4671-8703-7934162FCF1D}" /t REG_EXPAND_SZ /d "D:\Users\%USERNAME%\Music" /f >nul 2>&1

echo   Da chuyen User folders + copy du lieu sang D:
echo.
echo   SAU KHI RESTART: mo C:\Users\%USERNAME%\Downloads
echo   -> Properties -> Location -> Move
echo   Windows se tu xoa du lieu cu tren C:
echo.

:: ==============================
:: 8. CHUYEN TEMP USER SANG D:
:: ==============================
echo [8/12] Chuyen TEMP user sang D:...
md D:\Temp >nul 2>&1

icacls D:\Temp /inheritance:r >nul 2>&1
icacls D:\Temp /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
icacls D:\Temp /grant "SYSTEM:(OI)(CI)F" /T >nul 2>&1
icacls D:\Temp /grant "Administrators:(OI)(CI)F" /T >nul 2>&1

reg add "HKCU\Environment" /v "TEMP" /t REG_EXPAND_SZ /d "D:\Temp" /f >nul 2>&1
reg add "HKCU\Environment" /v "TMP" /t REG_EXPAND_SZ /d "D:\Temp" /f >nul 2>&1

echo   Da chuyen TEMP user sang D:\Temp (khong dong toi System)
echo.

:: ==============================
:: 9. CHUYEN npm/pip CACHE SANG D:
:: ==============================
echo [9/12] Chuyen npm/pip cache sang D:...
md D:\npm-cache >nul 2>&1
md D:\pip-cache >nul 2>&1

where npm >nul 2>&1
if %errorLevel% equ 0 (
    call npm config set cache D:\npm-cache --global >nul 2>&1
    echo   npm cache -> D:\npm-cache
)

where yarn >nul 2>&1
if %errorLevel% equ 0 (
    call yarn config set cache-folder D:\yarn-cache --global >nul 2>&1
    echo   yarn cache -> D:\yarn-cache
)

where pip >nul 2>&1
if %errorLevel% equ 0 (
    call pip config set global.cache-dir D:\pip-cache >nul 2>&1
    echo   pip cache -> D:\pip-cache
)
echo.

:: ==============================
:: 10. XU LY ONEDRIVE
:: ==============================
echo [10/12] Xu ly OneDrive...
if exist "%USERPROFILE%\OneDrive" (
    for /f %%i in ('dir "%USERPROFILE%\OneDrive" /s /a /-c 2^>nul ^| findstr "File(s)"') do set ONEDRIVE_SIZE=%%i
    echo   Phat hien OneDrive, file dang sync nam tren C:
    echo   KHONG xoa OneDrive de tranh mat du lieu!
    echo.
    echo   -> Muon chuyen OneDrive sang D:, lam thu cong:
    echo      1. Right-click OneDrive icon (khe systray) -> Settings
    echo      2. Account tab -> Unlink this PC
    echo      3. Cai lai OneDrive, chon D:\OneDrive lam thu muc dich
) else (
    echo   OneDrive khong phat hien
)
echo.

:: ==============================
:: 11. XOA CRASH DUMPS
:: ==============================
echo [11/12] Xoa crash dumps...
rd /s /q "%USERPROFILE%\AppData\Local\CrashDumps" >nul 2>&1
rd /s /q "C:\Windows\Minidump" >nul 2>&1
echo   Da xoa crash dumps
echo.

:: ==============================
:: 12. EMPTY RECYCLE BIN
:: ==============================
echo [12/12] Empty Recycle Bin...
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1
echo   Da empty Recycle Bin
echo.

:: ============================================
:: HOAN TAT
:: ============================================
echo ============================================
echo   HOAN TAT! DA GIAI PHONG O C
echo ============================================
echo.
echo CAN KHOI DONG LAI MAY DE:
echo   - Pagefile tren D: co hieu luc
echo   - User folders moi duoc ap dung
echo   - TEMP moi duoc ap dung
echo.
echo SAU KHI RESTART, lam tiep:
echo   1. Mo C:\Users\%USERNAME%\Downloads
echo      -> Properties -> Location -> thay bang D:\Users\%USERNAME%\Downloads
echo      -> Click Move -> Yes
echo   2. Lam tuong tu voi Documents, Desktop, Pictures, Videos, Music
echo   3. Neu con thieu: chay lai script nay 1 lan nua de don not
echo.
echo Kiem tra lai dung luong C: sau restart:
echo   powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C'\" | Select-Object @{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,1)}}"
echo.

set /p restart=" Khoi dong lai ngay? (Y/N): "
if /i "%restart%"=="Y" (
    echo Dang khoi dong lai trong 10 giay...
    shutdown /r /t 10 /c "Relocate to D: - dang apply thay doi"
)

pause
exit /b 0