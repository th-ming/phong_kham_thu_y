# Thiet lap cho Ve si RAM chay tu dong khi bat may
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Action = New-ScheduledTaskAction -Execute 'PowerShell.exe' `
    -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "d:\QLy Phòng Khám Thú Y\scripts\UltimateOptimizer.ps1"'

# Trigger: Chay ngay khi nguoi dung dang nhap (Logon)
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Cai dat: Chay voi quyen cao nhat, khong dung khi dung pin
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Priority 1

# Dang ky Task
Register-ScheduledTask -TaskName "Rexi_RAM_Optimizer" -Action $Action -Trigger $Trigger -Settings $Settings -Force

Write-Host "--- VE SI RAM DA DUOC CAI DAT TU DONG ---" -ForegroundColor Magenta
Write-Host "Tu gio, moi khi sep bat may, he thong se tu dong chay ngam de bao ve may sep! sep cu yen tam lam viec nhe! 😎"
