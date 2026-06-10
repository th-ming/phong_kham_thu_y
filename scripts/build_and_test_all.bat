@echo off
setlocal enabledelayedexpansion

echo ===== BUILD AND TEST ALL =====
echo %date% %time%
echo.

:: Set JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-22
set PATH=%JAVA_HOME%\bin;%PATH%

:: Step 1: Compile backend with minimal memory
echo [1/5] Compiling backend...
cd /d "D:\QLy Phòng Khám Thú Y\Backend"
set MAVEN_OPTS=-Xmx512m -Xms256m -XX:+UseSerialGC
call mvnw.cmd compile -q
if %ERRORLEVEL% NEQ 0 (
    echo COMPILE FAILED with error %ERRORLEVEL%
    echo Trying alternate approach...
    goto :fallback
)
echo Compile OK.
goto :step2

:fallback
echo [FALLBACK] Trying direct javac...
dir /s /b src\main\java\com\rexi\pkty\service\ReActAgentService.java > sources.txt 2>nul
if exist sources.txt (
    javac -d target\classes -cp "target\*;lib\*" @sources.txt 2>&1 | head -5
    echo Fallback compile attempted.
) else (
    echo Cannot compile. Will test with existing built backend.
)
goto :step2

:step2
:: Step 2: Kill existing backend
echo.
echo [2/5] Restarting backend...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq java.exe" /fo list 2^>nul ^| findstr /i "PID"') do (
    echo Killing PID %%a
    taskkill /f /pid %%a 2>nul
)
timeout /t 5 /nobreak >nul

:: Step 3: Start backend
echo [3/5] Starting backend...
start /b "RexiBackend" cmd /c "cd /d D:\QLy Phòng Khám Thú Y\Backend && java -jar target\rexi-backend-*.jar --server.port=8081 2>&1"

:: Wait for backend to start
echo Waiting for backend to start...
set MAX_WAIT=60
set WAIT_COUNT=0
:waitloop
timeout /t 2 /nobreak >nul
set /a WAIT_COUNT+=1
if %WAIT_COUNT% gtr %MAX_WAIT% (
    echo Backend did not start in time, continuing anyway...
    goto :step4
)
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8081/api/system/health 2>nul | findstr "200" >nul
if errorlevel 1 (
    goto :waitloop
)
echo Backend is UP!

:step4
:: Step 4: Run test suite
echo.
echo [4/5] Running comprehensive test suite...
cd /d "D:\QLy Phòng Khám Thú Y"
echo node Tester/comprehensive_230_test.mjs 2>&1
node Tester/comprehensive_230_test.mjs 2>&1
set TEST_RESULT=%ERRORLEVEL%

:: Step 5: Show report
echo.
echo [5/5] Test completed with code %TEST_RESULT%
echo.
echo ===== RESULTS =====
if exist "Frontend\output\test-results-230\230_test_baseline.json" (
    node -e "const d=require('./Frontend/output/test-results-230/230_test_baseline.json'); console.log('Passed: '+d.stats.passed+'/'+d.stats.total+' ('+(d.stats.passed/d.stats.total*100).toFixed(1)+'%)'); Object.entries(d.stats.categories).sort().forEach(([k,v])=>console.log('  '+k+': '+v.passed+'/'+v.total+' ('+(v.passed/v.total*100).toFixed(1)+'%)'))"
)
echo.
echo ===== DONE =====
echo %date% %time%
endlocal
