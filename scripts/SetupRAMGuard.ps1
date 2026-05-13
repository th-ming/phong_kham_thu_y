# SetupRAMGuard.ps1 - Register RAM Guard as a Windows Scheduled Task
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$TaskName = "Rexi_RAM_Guard"
$ScriptPath = "d:\QLy Phòng Khám Thú Y\scripts\UltimateOptimizer.ps1"

Write-Host "--- DANG THIET LAP TU DONG HOA VE SI RAM REXI ---" -ForegroundColor Magenta

# 1. Định nghĩa hành động: Chạy PowerShell ẩn để thực thi Optimizer
$Action = New-ScheduledTaskAction -Execute 'PowerShell.exe' `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""

# 2. Định nghĩa Trigger: Chạy khi người dùng đăng nhập (Logon)
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# 3. Cấu hình cài đặt: Chạy bền bỉ, không dừng khi dùng pin, tự chạy lại nếu lỗi
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# 4. Đăng ký Task với Windows
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force

# 5. Chạy task ngay lập tức để kích hoạt luôn
Start-ScheduledTask -TaskName $TaskName

Write-Host "`nDA THIET LAP XONG! 🎉" -ForegroundColor Green
Write-Host "Từ giờ, Vệ sĩ RAM sẽ tự động khởi động cùng Windows và bảo vệ máy 24/7." -ForegroundColor Cyan
Write-Host "Bạn không bao giờ cần phải nhắc hay chạy lệnh thủ công nữa." -ForegroundColor Cyan
