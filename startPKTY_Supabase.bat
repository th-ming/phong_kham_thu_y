@echo off
title HE THONG QUAN LY PHONG KHAM THU Y REXI - KET NOI SUPABASE CLOUD
cls

echo ====================================================================
echo      REXI CLINIC - HE THONG QUAN LY PHONG KHAM THU Y REXI
echo               (KET NOI SUPABASE CLOUD - 1-CLICK)
echo ====================================================================
echo.

REM Buoc 1: Tien hanh Git Pull de dong bo ma nguon moi nhat
echo [*] Buoc 1: Dang tien hanh cap nhat ma nguon moi nhat (git pull)...
echo.
git pull
if %errorlevel% neq 0 (
    echo.
    echo [!] Canh bao: Khong the tu dong Git Pull.
    echo     He thong van se tiep tuc chay voi ma nguon hien tai cua sep.
) else (
    echo.
    echo [v] Cap nhat thanh cong! Ma nguon hien da la moi nhat.
)
echo.
echo --------------------------------------------------------------------
echo [*] Buoc 2: Khoi dong he thong ket noi Supabase Cloud (Low RAM)
echo --------------------------------------------------------------------
echo [+] Cua so Frontend se chay tren cong 3005 (Che do Tiet kiem RAM).
echo [+] Cua so Backend se chay tren cong 8081 va ket noi truc tiep Supabase.
echo.

REM Mo Backend Supabase o cua so moi
start "REXI BACKEND (Supabase Low RAM)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_backend_supabase_low_ram.ps1"

REM Mo Frontend o cua so moi
start "REXI FRONTEND (Low RAM)" cmd /k "scripts\start_frontend_low_ram.cmd"

echo.
echo [v] Khoi dong thanh cong! Toan bo he thong hien dang chay truc tiep tren database Supabase cua sep!
echo [i] Sep co he tat cua so chinh nay di, Frontend va Backend van se tiep tuc chay binh thuong.
echo ====================================================================
echo.
pause
