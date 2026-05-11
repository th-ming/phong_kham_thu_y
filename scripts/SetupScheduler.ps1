# Di chuyen vao thu muc du an
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location "d:\QLy Phòng Khám Thú Y"

Write-Host "--- THIET LAP DAY CODE TU DONG (SCHEDULED TASK) ---" -ForegroundColor Cyan

# Dinh nghia hanh dong: Chay PowerShell va thuc thi file AutoPush.ps1
$Action = New-ScheduledTaskAction -Execute 'PowerShell.exe' `
    -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\QLy Phòng Khám Thú Y\scripts\DongBoTuDong.ps1"'

# Dinh nghia thoi gian: Chay hang ngay (Daily) vao luc 03:30 sang
$Trigger = New-ScheduledTaskTrigger -Daily -At "03:30"

# Cau hinh cai dat: Chay ke ca khi dung pin, tu chay lai neu lo nhip
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Dang ky Task voi Windows
Register-ScheduledTask -TaskName "Rexi_AutoPush_Daily" -Action $Action -Trigger $Trigger -Settings $Settings -Force

Write-Host "`nChuc mung sep! Da thiet lap thanh cong. 🎉" -ForegroundColor Green
Write-Host "Tu gio, dung 03:30 sang hang ngay he thong se tu dong Backup CSDL va Push code len cho sep."
Write-Host "Sep co the yen tam nghi ngoi, moi thu da co 'de' lo! 😎"
