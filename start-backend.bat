@echo off
REM UTF-8 ENCODING - dam bao tieng Viet hien thi dung
chcp 65001 >nul 2>&1
set "PYTHONIOENCODING=utf-8"
title Rexi Backend - Phong Kham Thu Y

echo ============================================
echo   REXI BACKEND STARTUP
echo   Phong Kham Thu Y
echo ============================================
echo.

REM --- Auto-detect JAVA_HOME ---
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        echo [OK] JAVA_HOME: %JAVA_HOME%
        goto :env_ready
    )
)

REM Try common JDK paths
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
        echo [OK] JAVA_HOME auto-detected: %%~P
        goto :env_ready
    )
)

echo [ERROR] JAVA_HOME not found! Install JDK 21+ and set JAVA_HOME.
echo         Download: https://adoptium.net/
pause
exit /b 1

:env_ready

REM --- Set environment variables ---
set "DB_URL=jdbc:sqlserver://127.0.0.1:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true"
set "DB_USERNAME=sa"
set "DB_PASSWORD=123456"
set "JWT_SECRET=your_super_secret_key_change_this_in_production_immediately"
set "MAVEN_OPTS=-Xmx768m -Xms256m -XX:MaxMetaspaceSize=256m"
set "SPRING_PROFILES_ACTIVE=dev"

REM --- Check if port 8081 is already in use ---
netstat -ano | findstr :8081 | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo [OK] Backend is already running on port 8081!
    echo      Open browser: http://localhost:8081
    echo.
    pause
    exit /b 0
)

echo.
echo [INFO] Starting backend on port 8081...
echo [INFO] Profile: dev (auto-restart on code change)
echo [INFO] Press Ctrl+C to stop
echo.

cd /d "%~dp0Backend"
call mvnw.cmd spring-boot:run -Dmaven.test.skip=true "-Dspring-boot.run.arguments=--server.port=8081"

pause
