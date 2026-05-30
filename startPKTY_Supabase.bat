@echo off
title HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI - KẾT NỐI SUPABASE CLOUD
chcp 65001 > nul
cls

:: Thiết lập màu sắc và giao diện chuyên nghiệp
echo ====================================================================
echo      REXI CLINIC - HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI
echo               (KẾT NỐI SUPABASE CLOUD - 1-CLICK)
echo ====================================================================
echo.

:: Bước 1: Tiến hành Git Pull để đồng bộ mã nguồn mới nhất
echo [*] Bước 1: Đang tiến hành cập nhật mã nguồn mới nhất (git pull)...
echo.
git pull
if %errorlevel% neq 0 (
    echo.
    echo [!] Cảnh báo: Không thể tự động Git Pull (có thể do mất kết nối hoặc xung đột code).
    echo     Hệ thống vẫn sẽ tiếp tục chạy với mã nguồn hiện tại của sếp.
) else (
    echo.
    echo [✓] Cập nhật thành công! Mã nguồn hiện đã là mới nhất.
)
echo.
echo --------------------------------------------------------------------
echo [*] Bước 2: Khởi động hệ thống kết nối Supabase Cloud (Low RAM)
echo --------------------------------------------------------------------
echo [+] Cửa sổ Frontend sẽ chạy trên cổng 3005 (Chế độ Tiết kiệm RAM).
echo [+] Cửa sổ Backend sẽ chạy trên cổng 8081 và kết nối trực tiếp Supabase.
echo.

:: Mở Backend Supabase ở cửa sổ mới
start "REXI BACKEND (Supabase Low RAM)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_backend_supabase_low_ram.ps1"

:: Mở Frontend ở cửa sổ mới
start "REXI FRONTEND (Low RAM)" cmd /k "scripts\start_frontend_low_ram.cmd"

echo.
echo [✓] Khởi động thành công! Toàn bộ hệ thống hiện đang chạy trực tiếp trên database Supabase của sếp!
echo [i] Sếp có thể tắt cửa sổ chính này đi, Frontend và Backend vẫn sẽ tiếp tục chạy bình thường.
echo ====================================================================
echo.
pause
