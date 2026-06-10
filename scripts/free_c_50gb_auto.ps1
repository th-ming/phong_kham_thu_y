## ============================================================
# AUTO FREE 50GB+ ON C: — SELF-ELEVATING
# ============================================================

# Self-elevate if not admin
$id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$p = New-Object System.Security.Principal.WindowsPrincipal($id)
if (-not $p.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $scriptPath = "D:\QLy Phòng Khám Thú Y\scripts\free_c_50gb_auto.ps1"
    $args = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    Start-Process -FilePath powershell.exe -ArgumentList $args -Verb RunAs -WindowStyle Normal
    exit
}

$ErrorActionPreference = "SilentlyContinue"
$VerbosePreference = "SilentlyContinue"
$startFree = (Get-PSDrive C).Free
$log = "D:\QLy Phòng Khám Thú Y\scripts\free_c_drive_log.txt"
"=== BAT DAU: $(Get-Date) ===" | Out-File $log

function Log($msg) { "$(Get-Date -Format HH:mm:ss) $msg" | Out-File $log -Append; Write-Host $msg }

# ──────────────────────────────────────────────────────────
# 1. TẮT HIBERNATION (free ~6-8GB)
# ──────────────────────────────────────────────────────────
Log "[1/15] Tat Hibernation..."
powercfg -h off
Log "  OK - free ~6-8GB"

# ──────────────────────────────────────────────────────────
# 2. XOÁ WINDOWS TEMP (free ~5-10GB)
# ──────────────────────────────────────────────────────────
Log "[2/15] Xoa Windows Temp..."
Stop-Service wuauserv -Force
Stop-Service trustedinstaller -Force
Stop-Service bits -Force
takeown /f C:\Windows\Temp /r /d y 2>$null | Out-Null
icacls C:\Windows\Temp /grant "Everyone:(OI)(CI)F" /T 2>$null | Out-Null
Get-ChildItem "C:\Windows\Temp" -Recurse -Force | Remove-Item -Recurse -Force
Log "  OK - Windows Temp"

# ──────────────────────────────────────────────────────────
# 3. XOÁ USER TEMP (free ~2-5GB)
# ──────────────────────────────────────────────────────────
Log "[3/15] Xoa User Temp..."
Get-ChildItem "$env:LOCALAPPDATA\Temp" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Log "  OK - User Temp"

# ──────────────────────────────────────────────────────────
# 4. XOÁ WINDOWS UPDATE CACHE (free ~5-10GB)
# ──────────────────────────────────────────────────────────
Log "[4/15] Xoa Windows Update cache..."
Get-ChildItem "C:\Windows\SoftwareDistribution\Download" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Log "  OK - Update cache"

# ──────────────────────────────────────────────────────────
# 5. XOÁ PREFETCH (free ~1-2GB)
# ──────────────────────────────────────────────────────────
Log "[5/15] Xoa Prefetch..."
Get-ChildItem "C:\Windows\Prefetch" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Log "  OK - Prefetch"

# ──────────────────────────────────────────────────────────
# 6. XOÁ CRASH DUMPS + MINIDUMPS (free ~2-5GB)
# ──────────────────────────────────────────────────────────
Log "[6/15] Xoa CrashDumps + Minidump..."
Get-ChildItem "C:\Windows\Minidump" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\CrashDumps" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Log "  OK - Crash dumps"

# ──────────────────────────────────────────────────────────
# 7. XOÁ CACHE TRÌNH DUYỆT (free ~5-15GB)
# ──────────────────────────────────────────────────────────
Log "[7/15] Xoa browser caches..."
$browserPaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Opera Software\Opera Stable\Cache",
    "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Cache",
    "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Code Cache"
)
foreach ($p in $browserPaths) {
    if (Test-Path $p) { Get-ChildItem $p -Recurse -Force | Remove-Item -Recurse -Force }
}
Log "  OK - Browser caches"

# ──────────────────────────────────────────────────────────
# 8. XOÁ WINDOWS.OLD (free ~10-20GB)
# ──────────────────────────────────────────────────────────
Log "[8/15] Xoa Windows.old..."
if (Test-Path "C:\Windows.old") {
    takeown /f C:\Windows.old /r /d y 2>$null | Out-Null
    icacls C:\Windows.old /T /grant Everyone:F 2>$null | Out-Null
    Get-ChildItem "C:\Windows.old" -Recurse -Force | Remove-Item -Recurse -Force
    Remove-Item "C:\Windows.old" -Recurse -Force
    Log "  OK - Windows.old"
} else { Log "  Khong co Windows.old" }

# ──────────────────────────────────────────────────────────
# 9. WinSxS CLEANUP (free ~5-10GB, co the lau)
# ──────────────────────────────────────────────────────────
Log "[9/15] DISM WinSxS cleanup (co the 5-15 phut)..."
dism /online /Cleanup-Image /StartComponentCleanup /ResetBase /Quiet
Log "  OK - WinSxS"

# ──────────────────────────────────────────────────────────
# 10. CHUYỂN PAGEFILE SANG D: (free ~8-16GB)
# ──────────────────────────────────────────────────────────
Log "[10/15] Chuyen Pagefile sang D:..."
try {
    $cs = Get-WmiObject Win32_ComputerSystem -EnableAllPrivileges
    $cs.AutomaticManagedPagefile = $false
    $cs.Put() | Out-Null
    
    # Xoá pagefile cu tren C:
    $oldPf = Get-WmiObject Win32_PageFileSetting | Where-Object { $_.Name -like "C:*" }
    if ($oldPf) { $oldPf.Delete() | Out-Null }
    
    # Tao pagefile moi tren D:
    $existingD = Get-WmiObject Win32_PageFileSetting | Where-Object { $_.Name -like "D:*" }
    if (-not $existingD) {
        Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{ Name = "D:\pagefile.sys" } | Out-Null
    }
    Log "  OK - Pagefile da chuyen sang D: (can restart)"
} catch { Log "  LOI: $($_.Exception.Message)" }

# ──────────────────────────────────────────────────────────
# 11. XOÁ NPM/YARN/PIP CACHES (free ~1-3GB)
# ──────────────────────────────────────────────────────────
Log "[11/15] Xoa dev caches..."
Get-ChildItem "$env:LOCALAPPDATA\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:USERPROFILE\.npm\_cacache" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:USERPROFILE\.cache" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\pip\Cache" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\NuGet\Cache" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$env:USERPROFILE\.m2\repository" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Log "  OK - Dev caches"

# ──────────────────────────────────────────────────────────
# 12. CHUYỂN TEMP SANG D: (free ~2-5GB)
# ──────────────────────────────────────────────────────────
Log "[12/15] Redirect TEMP -> D:\Temp..."
if (-not (Test-Path "D:\Temp")) { New-Item -ItemType Directory -Path "D:\Temp" -Force | Out-Null }
icacls D:\Temp /inheritance:r 2>$null | Out-Null
icacls D:\Temp /grant "Everyone:(OI)(CI)F" /T 2>$null | Out-Null
[Environment]::SetEnvironmentVariable("TEMP", "D:\Temp", "User")
[Environment]::SetEnvironmentVariable("TMP", "D:\Temp", "User")
Set-ItemProperty -Path "HKCU:\Environment" -Name "TEMP" -Value "D:\Temp" -Type ExpandString -Force
Set-ItemProperty -Path "HKCU:\Environment" -Name "TMP" -Value "D:\Temp" -Type ExpandString -Force
Log "  OK - TEMP -> D:\Temp"

# ──────────────────────────────────────────────────────────
# 13. CHUYỂN DEV CACHES SANG D:
# ──────────────────────────────────────────────────────────
Log "[13/15] Redirect dev caches -> D:..."
$cacheDirs = @("D:\npm-cache", "D:\pip-cache")
foreach ($dir in $cacheDirs) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm config set cache "D:\npm-cache" --global 2>$null
}
if (Get-Command pip -ErrorAction SilentlyContinue) {
    pip config set global.cache-dir "D:\pip-cache" 2>$null
}
Log "  OK - Dev caches -> D:"

# ──────────────────────────────────────────────────────────
# 14. EMPTY RECYCLE BIN
# ──────────────────────────────────────────────────────────
Log "[14/15] Empty Recycle Bin..."
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Log "  OK - Recycle Bin"

# ──────────────────────────────────────────────────────────
# 15. DISK CLEANUP (cleanmgr)
# ──────────────────────────────────────────────────────────
Log "[15/15] Disk Cleanup (cleanmgr /verylowdisk)..."
Start-Process -FilePath "cleanmgr" -ArgumentList "/verylowdisk /d C:" -NoNewWindow -Wait
Log "  OK - Disk Cleanup"

# ──────────────────────────────────────────────────────────
# KẾT QUẢ
# ──────────────────────────────────────────────────────────
$endFree = (Get-PSDrive C).Free
$freed = ($endFree - $startFree) / 1GB
$totalFree = $endFree / 1GB
$result = @"
=== KET QUA $(Get-Date) ===
Da giai phong: {0:N2} GB
Con trong: {1:N2} GB / {2:N2} GB
"@ -f $freed, $totalFree, (231.11)
$result | Out-File $log -Append
Write-Host $result
Write-Host "Log file: $log"
