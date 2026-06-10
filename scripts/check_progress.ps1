Write-Host "=== CHECK PROGRESS ===" -ForegroundColor Cyan

# Check disk space
$c = Get-PSDrive C
Write-Host ("C: Free: {0:N2} GB / {1:N2} GB" -f ($c.Free/1GB), (($c.Used+$c.Free)/1GB))

# Check log
$logPath = "D:\QLy Phòng Khám Thú Y\scripts\free_c_drive_log.txt"
if (Test-Path $logPath) {
    Write-Host "`n=== LOG FILE ===" -ForegroundColor Yellow
    Get-Content $logPath
} else {
    Write-Host "`nLog file not found yet" -ForegroundColor Yellow
}

# Check if hibernation is off
$hiberFile = "C:\hiberfil.sys"
if (Test-Path $hiberFile) {
    $size = (Get-Item $hiberFile).Length / 1GB
    Write-Host ("`nHibernation: ON (hiberfil.sys = {0:N2} GB)" -f $size) -ForegroundColor Red
} else {
    Write-Host "`nHibernation: OFF" -ForegroundColor Green
}

# Check for any elevated PowerShell running our script
$procs = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like "*free_c_50gb*" }
if ($procs) {
    Write-Host "`nCleanup script IS RUNNING! (PID: $($procs.ProcessId))" -ForegroundColor Green
} else {
    Write-Host "`nCleanup script NOT running" -ForegroundColor Yellow
}
