# Di chuyển vào thư mục dự án
Set-Location "d:\QLy Phòng Khám Thú Y"

Write-Host "--- THIẾT LẬP ĐẨY CODE TỰ ĐỘNG (SCHEDULED TASK) ---" -ForegroundColor Cyan

# Định nghĩa hành động: Chạy PowerShell và thực thi file AutoPush.ps1
$Action = New-ScheduledTaskAction -Execute 'PowerShell.exe' `
    -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\QLy Phòng Khám Thú Y\AutoPush.ps1"'

# Định nghĩa thời gian: Chạy hàng ngày (Daily) vào lúc 03:30 sáng
$Trigger = New-ScheduledTaskTrigger -Daily -At "03:30"

# Cấu hình cài đặt: Chạy kể cả khi dùng pin, tự chạy lại nếu lỡ nhịp
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Đăng ký Task với Windows
Register-ScheduledTask -TaskName "Rexi_AutoPush_Daily" -Action $Action -Trigger $Trigger -Settings $Settings -Force

Write-Host "`nChúc mừng sếp! Đã thiết lập thành công. 🎉" -ForegroundColor Green
Write-Host "Từ giờ, đúng 03:30 sáng hàng ngày hệ thống sẽ tự động Backup CSDL và Push code lên cho sếp."
Write-Host "Sếp có thể yên tâm nghỉ ngơi, mọi thứ đã có 'đệ' lo! 😎"
