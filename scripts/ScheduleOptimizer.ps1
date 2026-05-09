# Thiết lập cho Vệ sĩ RAM chạy tự động khi bật máy
$Action = New-ScheduledTaskAction -Execute 'PowerShell.exe' `
    -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\QLy Phòng Khám Thú Y\UltimateOptimizer.ps1"'

# Trigger: Chạy ngay khi người dùng đăng nhập (Logon)
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Cài đặt: Chạy với quyền cao nhất, không dừng khi dùng pin
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Priority 1

# Đăng ký Task
Register-ScheduledTask -TaskName "Rexi_RAM_Optimizer" -Action $Action -Trigger $Trigger -Settings $Settings -Force

Write-Host "--- VỆ SĨ RAM ĐÃ ĐƯỢC CÀI ĐẶT TỰ ĐỘNG ---" -ForegroundColor Magenta
Write-Host "Từ giờ, cứ mỗi khi sếp bật máy, hệ thống dọn RAM sẽ tự động chạy ngầm để bảo vệ máy sếp! 😎"
