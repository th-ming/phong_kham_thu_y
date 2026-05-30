@echo off
title HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI - KHỞI ĐỘNG
chcp 65001 > nul
cls

:: Thiết lập màu sắc và giao diện chuyên nghiệp
echo ====================================================================
echo      REXI CLINIC - HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI
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
echo [*] Bước 2: Chọn chế độ khởi động (Tự động chọn [1] sau 5 giây)
echo --------------------------------------------------------------------
echo   [1] Khởi động cả FE và BE (Chế độ Tiết kiệm RAM - Khuyên dùng)
echo   [2] Khởi động cả FE và BE (Chế độ Dev đầy đủ - Tự động load khi sửa code)
echo   [3] Chỉ khởi động Frontend (Chế độ Tiết kiệm RAM)
echo   [4] Chỉ khởi động Backend (Chế độ Tiết kiệm RAM)
echo.

:: Sử dụng lệnh choice với thời gian chờ 5 giây, mặc định chọn 1
choice /c 1234 /t 5 /d 1 /m "Vui lòng nhập lựa chọn của sếp (1-4): "
set opt=%errorlevel%

cls
echo ====================================================================
echo      REXI CLINIC - ĐANG KÍCH HOẠT CÁC DỊCH VỤ
echo ====================================================================
echo.

if "%opt%"=="1" (
    echo [*] Đang khởi chạy Frontend và Backend ở chế độ Tiết kiệm RAM (Low RAM)...
    echo [+] Cửa sổ Frontend sẽ chạy trên cổng 3005.
    echo [+] Cửa sổ Backend sẽ chạy trên cổng 8081.
    
    :: Mở Backend ở cửa sổ mới
    start "REXI BACKEND (Low RAM)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_backend_low_ram.ps1"
    
    :: Mở Frontend ở cửa sổ mới
    start "REXI FRONTEND (Low RAM)" cmd /k "scripts\start_frontend_low_ram.cmd"
)

if "%opt%"=="2" (
    echo [*] Đang khởi chạy Frontend và Backend ở chế độ Dev đầy đủ...
    echo [+] Cửa sổ Frontend sẽ chạy ở chế độ tiêu chuẩn.
    echo [+] Cửa sổ Backend sẽ chạy ở chế độ Dev (Tự động biên dịch khi lưu file).
    
    :: Mở Backend ở cửa sổ mới
    start "REXI BACKEND (Dev Mode)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_backend_dev.ps1"
    
    :: Mở Frontend ở cửa sổ mới
    start "REXI FRONTEND (Dev Mode)" cmd /k "cd Frontend && npm run dev"
)

if "%opt%"=="3" (
    echo [*] Đang chỉ khởi chạy Frontend (Chế độ Tiết kiệm RAM)...
    start "REXI FRONTEND (Low RAM)" cmd /k "scripts\start_frontend_low_ram.cmd"
)

if "%opt%"=="4" (
    echo [*] Đang chỉ khởi chạy Backend (Chế độ Tiết kiệm RAM)...
    start "REXI BACKEND (Low RAM)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_backend_low_ram.ps1"
)

echo.
echo [✓] Cửa sổ dịch vụ đã được mở thành công!
echo [i] Sếp có thể tắt cửa sổ chính này đi, Frontend và Backend vẫn sẽ tiếp tục chạy bình thường.
echo ====================================================================
echo.
pause
