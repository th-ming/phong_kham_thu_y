@echo off
title === REXI VET CLINIC - HE THONG ===
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BE_DIR=%ROOT%Backend"
set "FE_DIR=%ROOT%Frontend"

echo.
echo  ======================================================
echo    REXI VET CLINIC - KHOI DONG HE THONG
echo  ======================================================
echo.

:: ─── STEP 0: Tu dong dong bo Database len Supabase ────────
echo  [0/5] Dang tu dong dong bo Database local len Supabase Cloud...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%ROOT%scripts\sync_local_sqlserver_to_supabase.ps1' -Quiet"
if !errorlevel! equ 0 (
    echo        Dong bo Database: HOAN THANH [^> OK]
) else (
    echo        [CANH BAO] Dong bo Database that bai.
)
echo.


:: ─── STEP 1: Kiem tra Java ────────────────────────────────
echo  [2/6] Kiem tra Java...
set "JAVA_FOUND=0"

if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set "JAVA_FOUND=1"
        echo        Java: %JAVA_HOME%
    )
)

if "!JAVA_FOUND!"=="0" (
    for %%P in (
        "C:\Program Files\Java\jdk-22"
        "C:\Program Files\Java\jdk-21"
        "C:\Program Files\Java\jdk-17"
        "C:\Program Files\Microsoft\jdk-22"
        "C:\Program Files\Microsoft\jdk-21"
        "C:\Program Files\Microsoft\jdk-17"
    ) do (
        if exist "%%~P\bin\java.exe" (
            set "JAVA_HOME=%%~P"
            set "JAVA_FOUND=1"
            echo        Java (auto-detected): %%~P
            goto :java_ok
        )
    )
    where java >nul 2>&1
    if !errorlevel! equ 0 (
        set "JAVA_FOUND=1"
        echo        Java: found in PATH
    )
)

:java_ok
if "!JAVA_FOUND!"=="0" (
    echo        [LOI] Khong tim thay Java! Hay cai dat JDK 21+ va set JAVA_HOME.
    echo.
    pause
    exit /b 1
)

:: ─── STEP 2: Kiem tra SQL Server ──────────────────────────
echo  [3/6] Kiem tra SQL Server (port 1433)...
netstat -an | findstr ":1433 " | findstr "LISTENING" >nul 2>&1
if !errorlevel! neq 0 (
    echo        [CANH BAO] SQL Server chua nghe tren port 1433.
    echo        Backend co the khong ket noi duoc database.
    echo        Tien hanh khoi dong...
) else (
    echo        SQL Server: OK
)

:: ─── STEP 3: Khoi dong Backend ─────────────────────────────
echo  [4/6] Khoi dong Backend (port 8081)...

:: Kiem tra da co backend chua
netstat -an | findstr ":8081 " | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo        Backend da dang chay tren port 8081. Bo qua.
    goto :backend_running
)

:: Khoi dong backend qua PowerShell script (auto-detect JAVA, set env, DevTools + watcher)
echo        Dang khoi dong qua PowerShell (auto-restart khi save code)...
start "Rexi Backend [DEV]" powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "cd '%ROOT%'; & '%ROOT%scripts\start_backend_dev.ps1'"

:: Cho Backend len (toi da 90 giay)
set "BE_READY=0"
set /a "BE_WAIT=0"
:wait_backend
timeout /t 3 /nobreak >nul
set /a "BE_WAIT+=3"
netstat -an | findstr ":8081 " | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    set "BE_READY=1"
    goto :backend_running
)
if !BE_WAIT! lss 90 (
    echo        Dang cho Backend khoi dong... (!BE_WAIT!s)
    goto :wait_backend
)
echo        [CANH BAO] Backend chua nghe sau 90s. Kiem tra log.
:backend_running

:: ─── STEP 4: Khoi dong Frontend ────────────────────────────
echo  [5/6] Khoi dong Frontend (port 3005)...

:: Kiem tra da co frontend chua
netstat -an | findstr ":3005 " | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo        Frontend da dang chay tren port 3005. Bo qua.
    goto :frontend_running
)

:: Kiem tra node_modules
if not exist "%FE_DIR%\node_modules" (
    echo        Chua co node_modules. Dang npm install...
    cd /d "%FE_DIR%"
    call npm install
)

echo        Dang khoi dong Vite dev server...
start "Rexi Frontend [DEV]" cmd /c "cd /d %FE_DIR% && set NODE_OPTIONS=--max-old-space-size=512&& npm run dev"

:: Cho Frontend len (toi da 30 giay)
set "FE_READY=0"
set /a "FE_WAIT=0"
:wait_frontend
timeout /t 2 /nobreak >nul
set /a "FE_WAIT+=2"
netstat -an | findstr ":3005 " | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    set "FE_READY=1"
    goto :frontend_running
)
if !FE_WAIT! lss 30 (
    echo        Dang cho Frontend khoi dong... (!FE_WAIT!s)
    goto :wait_frontend
)
echo        [CANH BAO] Frontend chua nghe sau 30s.
:frontend_running

:: ─── STEP 5: Tong ket ──────────────────────────────────────
echo  [6/6] Hoan tat!
echo.
echo  ======================================================
if "!BE_READY!"=="1" (
    echo    Backend:  http://localhost:8081      [^> OK]
) else (
    echo    Backend:  http://localhost:8081      [~ CHUA XAC NHAN]
)
if "!FE_READY!"=="1" (
    echo    Frontend: http://127.0.0.1:3005      [^> OK]
) else (
    echo    Frontend: http://127.0.0.1:3005      [~ CHUA XAC NHAN]
)
echo.
echo    Dang mo trinh duyet...
echo  ======================================================
echo.

:: Mo trinh duyet
if "!FE_READY!"=="1" (
    start "" "http://127.0.0.1:3005"
) else (
    timeout /t 8 /nobreak >nul
    start "" "http://127.0.0.1:3005"
)

echo  Nhan phim bat ky de dong trang nay...
echo  (Backend va Frontend van chay trong cua so rieng)
pause >nul
