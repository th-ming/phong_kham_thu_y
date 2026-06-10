#requires -RunAsAdministrator
Write-Host "=== GIAI PHONG O C TOI DA ===" -ForegroundColor Cyan
$startFree = (Get-PSDrive C).Free
Write-Host ("Dung luong truoc: {0:N2} GB" -f ($startFree/1GB)) -ForegroundColor Yellow

# 1. TAT HIBERNATION
Write-Host "[1/6] Tat Hibernation..." -NoNewline
powercfg -h off
Write-Host " OK (~6-8GB)" -ForegroundColor Green

# 2. XOA WINDOWS TEMP
Write-Host "[2/6] Xoa Windows Temp..." -NoNewline
Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
Stop-Service trustedinstaller -Force -ErrorAction SilentlyContinue
Stop-Service bits -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK (~5-10GB)" -ForegroundColor Green

# 3. XOA WINDOWS UPDATE CACHE
Write-Host "[3/6] Xoa Windows Update cache..." -NoNewline
Remove-Item "C:\Windows\SoftwareDistribution\Download\*" -Recurse -Force -ErrorAction SilentlyContinue
Start-Service wuauserv -ErrorAction SilentlyContinue
Start-Service bits -ErrorAction SilentlyContinue
Write-Host " OK (~5-10GB)" -ForegroundColor Green

# 4. CHUYEN PAGEFILE SANG D:
Write-Host "[4/6] Chuyen Pagefile sang D:..." -NoNewline
$computer = Get-WmiObject Win32_ComputerSystem -EnableAllPrivileges
$computer.AutomaticManagedPagefile = $false
$computer.Put() | Out-Null
# Xoa pagefile cu tren C:
$oldPf = Get-WmiObject Win32_PageFileSetting -EnableAllPrivileges | Where-Object { $_.Name -like "C:*" }
if ($oldPf) { $oldPf.Delete() | Out-Null }
# Tao pagefile moi tren D:
$newPf = Get-WmiObject Win32_PageFileSetting -EnableAllPrivileges | Where-Object { $_.Name -like "D:*" }
if (-not $newPf) {
    Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{ Name = "D:\pagefile.sys" } | Out-Null
}
Write-Host " OK (~8-16GB, can restart)" -ForegroundColor Green

# 5. XOA PREFETCH
Write-Host "[5/6] Xoa Prefetch + CrashDumps..." -NoNewline
Remove-Item "C:\Windows\Prefetch\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Windows\Minidump\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 6. CLEAN RECYCLE BIN
Write-Host "[6/6] Empty Recycle Bin..." -NoNewline
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

$endFree = (Get-PSDrive C).Free
$freed = ($endFree - $startFree) / 1GB
$totalFree = $endFree / 1GB
Write-Host ""
Write-Host ("=== KET QUA ===") -ForegroundColor Cyan
Write-Host ("Da giai phong: {0:N2} GB" -f $freed) -ForegroundColor Green
Write-Host ("Con trong: {0:N2} GB" -f $totalFree) -ForegroundColor Green
pause
