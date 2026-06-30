@echo off
title Rexi Vet Clinic System Launcher
chcp 65001 >nul

echo ====================================================
echo   REXI VET CLINIC SYSTEM LAUNCHER
echo ====================================================
echo.

:: Check if the compiled JAR exists
if not exist "%~dp0Backend\target\pkty-0.0.1-SNAPSHOT.jar" (
    echo [INFO] JAR file not found. Compiling Backend first (this may take 1-2 minutes)...
    cd /d "%~dp0Backend"
    set "MAVEN_OPTS=-Xmx384m -Xms128m -XX:MaxMetaspaceSize=128m"
    call .\mvnw.cmd package -Dmaven.test.skip=true
    if errorlevel 1 (
        echo [ERROR] Backend compilation failed! Please check RAM resources.
        pause
        exit /b 1
    )
)

echo [1/2] Starting Rexi Backend (BE) on port 8081...
:: Run compiled jar directly with low RAM optimization to save 200MB+ memory
:: Connects directly to 127.0.0.1:1433 to bypass SQL Server Browser timeout issue
start "Rexi Backend" cmd /c "cd /d %~dp0Backend && set DB_URL=jdbc:sqlserver://127.0.0.1:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true&& set DB_USERNAME=sa&& set DB_PASSWORD=123456&& set JWT_SECRET=your_super_secret_key_change_this_in_production_immediately&& set SPRING_PROFILES_ACTIVE=dev&& java -Xmx320m -Xms64m -XX:MaxMetaspaceSize=128m -jar target/pkty-0.0.1-SNAPSHOT.jar --server.port=8081 --spring.devtools.restart.enabled=false || (echo Backend failed to start! && pause)"

echo [2/2] Starting Rexi Frontend (FE) on port 3005...
start "Rexi Frontend" cmd /c "cd /d %~dp0Frontend && set NODE_OPTIONS=--max-old-space-size=384&& npm run dev -- --host 127.0.0.1 --port 3005 --strictPort true"

echo.
echo ====================================================
echo   SERVICES ARE STARTING!
echo   - Frontend: http://127.0.0.1:3005
echo   - Backend:  http://localhost:8081
echo ====================================================
echo.
timeout /t 5
