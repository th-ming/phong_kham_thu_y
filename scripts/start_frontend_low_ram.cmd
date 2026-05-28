@echo off
setlocal
cd /d "%~dp0..\Frontend"
set NODE_OPTIONS=--max-old-space-size=384
set CHOKIDAR_USEPOLLING=false
set VITE_FORCE_POLLING=false
echo === Rexi Frontend LOW RAM ===
echo Port: 3005 ^| Node heap: 384 MB
npm.cmd run dev -- --host 127.0.0.1 --port 3005 --strictPort false
