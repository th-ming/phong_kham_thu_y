@echo off
setlocal
cd /d "%~dp0..\Frontend"
set NODE_OPTIONS=--max-old-space-size=384
set CHOKIDAR_USEPOLLING=false
set VITE_FORCE_POLLING=false
echo === Rexi Frontend LOW RAM ===
echo Port: 3005 ^| Node heap: 384 MB
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try { $a=$c.BeginConnect('127.0.0.1',3005,$null,$null); if ($a.AsyncWaitHandle.WaitOne(400,$false)) { $c.EndConnect($a); exit 0 }; exit 1 } catch { exit 1 } finally { $c.Close() }"
if %errorlevel%==0 (
  echo Frontend da chay tren cong 3005. Khong mo them ban moi.
  exit /b 0
)
npm.cmd run dev -- --host 127.0.0.1 --port 3005 --strictPort true
