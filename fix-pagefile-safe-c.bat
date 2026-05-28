@echo off
setlocal

net session >nul 2>&1
if not %errorlevel%==0 (
  echo This script must run as Administrator.
  echo Right click this file and choose "Run as administrator".
  pause
  exit /b 1
)

echo Configuring a reliable Windows pagefile on C:...
echo.

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v PagingFiles /t REG_MULTI_SZ /d "C:\pagefile.sys 8192 16384" /f
if not %errorlevel%==0 (
  echo Failed to update PagingFiles registry value.
  pause
  exit /b 1
)

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v ExistingPageFiles /t REG_MULTI_SZ /d "C:\pagefile.sys" /f

echo.
echo Done. Close all dialogs and restart Windows one more time.
echo.
pause
