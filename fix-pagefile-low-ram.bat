@echo off
setlocal

net session >nul 2>&1
if not %errorlevel%==0 (
  echo This script must run as Administrator.
  echo Right click this file and choose "Run as administrator".
  pause
  exit /b 1
)

echo Configuring Windows pagefile for Rexi development...
echo.

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v PagingFiles /t REG_MULTI_SZ /d "D:\pagefile.sys 8192 16384" /f
if not %errorlevel%==0 (
  echo Failed to update PagingFiles registry value.
  pause
  exit /b 1
)

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v ExistingPageFiles /t REG_MULTI_SZ /d "D:\pagefile.sys" /f

echo.
echo Done. Restart Windows now so the new 8-16GB pagefile is applied.
echo After restart, run:
echo   npm run backend:lowram
echo   npm run frontend:lowram
echo.
pause
