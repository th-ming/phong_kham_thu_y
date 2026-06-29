<#
.SYNOPSIS
    Cai dat Download Guardian - tu dong khoi dong khi Windows login
.DESCRIPTION
    Tao Scheduled Task de Download Guardian tu dong chay khi ban dang nhap Windows.
    Chi can chay 1 lan duy nhat.
#>

$scriptPath = Join-Path $PSScriptRoot "DownloadGuardian.ps1"
$taskName   = "DownloadGuardian"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    CAI DAT DOWNLOAD GUARDIAN - AUTO START" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# Kiem tra script ton tai
if (-not (Test-Path $scriptPath)) {
    Write-Host "  [LOI] Khong tim thay DownloadGuardian.ps1" -ForegroundColor Red
    Write-Host "  Duong dan: $scriptPath" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Kiem tra da co task chua
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  [INFO] Da co task '$taskName'. Dang cap nhat..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Tao action: chay PowerShell voi script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Tao trigger: khi user login
$trigger = New-ScheduledTaskTrigger -AtLogon

# Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Dang nhap hien tai (khong can password)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Dang ky task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Download Guardian - Quet ma doc real-time khi tai file ve Downloads" `
    -Force | Out-Null

Write-Host "  [OK] Da cai dat thanh cong!" -ForegroundColor Green
Write-Host ""
Write-Host "  Mo ta:" -ForegroundColor White
Write-Host "    - Download Guardian se tu dong chay khi ban dang nhap Windows" -ForegroundColor Gray
Write-Host "    - Giu phim Shift + click must phai vao file de mo file da quet" -ForegroundColor Gray
Write-Host "    - De go bo: chay script nay lai va chon 'Go bo'" -ForegroundColor Gray
Write-Host ""
Write-Host "  De go bo cai dat, chay:" -ForegroundColor Yellow
Write-Host "    Unregister-ScheduledTask -TaskName "$taskName" -Confirm:$false" -ForegroundColor Gray
Write-Host ""
pause
