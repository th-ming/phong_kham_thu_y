Write-Host "=== DON DEP O C: TOI DA ===" -ForegroundColor Cyan
$startFree = (Get-PSDrive C).Free
Write-Host ("Trong luc bat dau: {0:N2} GB" -f ($startFree/1GB)) -ForegroundColor Yellow

# 1. User Temp
Write-Host "[1] Dang xoa User Temp..." -NoNewline
Remove-Item "$env:LOCALAPPDATA\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 2. Browser caches
Write-Host "[2] Dang xoa browser caches..."

# Chrome
$chromePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\CacheStorage",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Media Cache"
)
foreach ($p in $chromePaths) {
    if (Test-Path $p) { Remove-Item "$p\*" -Recurse -Force -ErrorAction SilentlyContinue }
}
Write-Host "   Chrome: OK"

# Edge
$edgePaths = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache"
)
foreach ($p in $edgePaths) {
    if (Test-Path $p) { Remove-Item "$p\*" -Recurse -Force -ErrorAction SilentlyContinue }
}
Write-Host "   Edge: OK"

# Opera
$operaPath = "$env:LOCALAPPDATA\Opera Software\Opera Stable\Cache"
if (Test-Path $operaPath) { Remove-Item "$operaPath\*" -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "   Opera: OK"

# CocCoc
$coccocPaths = @(
    "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Cache",
    "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Code Cache"
)
foreach ($p in $coccocPaths) {
    if (Test-Path $p) { Remove-Item "$p\*" -Recurse -Force -ErrorAction SilentlyContinue }
}
Write-Host "   CocCoc: OK"

# 3. npm cache
Write-Host "[3] Dang xoa npm/yarn/pip caches..." -NoNewline
Remove-Item "$env:LOCALAPPDATA\npm-cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.npm\_cacache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 4. Crash dumps
Write-Host "[4] Dang xoa crash dumps..." -NoNewline
Remove-Item "$env:LOCALAPPDATA\CrashDumps\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Windows\Minidump\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 5. Recycle Bin
Write-Host "[5] Dang empty Recycle Bin..." -NoNewline
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 6. Windows Temp (try - may need admin)
Write-Host "[6] Dang xoa Windows Temp..." -NoNewline
try {
    Takeown /f "C:\Windows\Temp" /r /d y 2>$null | Out-Null
    Icacls "C:\Windows\Temp" /grant "$env:USERNAME:(OI)(CI)F" /T 2>$null | Out-Null
    Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " CAN (can Admin)" -ForegroundColor Yellow
}

# 7. .NET NuGet cache
Write-Host "[7] Dang xoa NuGet cache..." -NoNewline
Remove-Item "$env:USERPROFILE\.nuget\packages\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\NuGet\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 8. Java/Maven/Gradle caches
Write-Host "[8] Dang xoa Java caches..." -NoNewline
Remove-Item "$env:USERPROFILE\.m2\repository\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.gradle\caches\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 9. pip/conda caches
Write-Host "[9] Dang xoa Python caches..." -NoNewline
Remove-Item "$env:LOCALAPPDATA\pip\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.conda\pkgs\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " OK" -ForegroundColor Green

# 10. Redirect caches to D:
Write-Host "[10] Dang redirect caches sang D:..."
if (-not (Test-Path "D:\npm-cache")) { New-Item -ItemType Directory -Path "D:\npm-cache" -Force | Out-Null }
if (-not (Test-Path "D:\pip-cache")) { New-Item -ItemType Directory -Path "D:\pip-cache" -Force | Out-Null }
if (-not (Test-Path "D:\Temp")) { New-Item -ItemType Directory -Path "D:\Temp" -Force | Out-Null }

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm config set cache "D:\npm-cache" --global 2>$null
    Write-Host "   npm -> D:\npm-cache"
}
# pip
if (Get-Command pip -ErrorAction SilentlyContinue) {
    pip config set global.cache-dir "D:\pip-cache" 2>$null
    Write-Host "   pip -> D:\pip-cache"
}
# TEMP
Set-ItemProperty -Path "HKCU:\Environment" -Name "TEMP" -Value "D:\Temp" -Type ExpandString -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Environment" -Name "TMP" -Value "D:\Temp" -Type ExpandString -Force -ErrorAction SilentlyContinue
Write-Host "   TEMP -> D:\Temp"

$endFree = (Get-PSDrive C).Free
$freed = ($endFree - $startFree) / 1GB
$totalFree = $endFree / 1GB
Write-Host ""
Write-Host ("=== KET QUA ===") -ForegroundColor Cyan
Write-Host ("Da giai phong: {0:N2} GB" -f $freed) -ForegroundColor Green
Write-Host ("Con trong: {0:N2} GB" -f $totalFree) -ForegroundColor Yellow
Write-Host ""
Write-Host "MUON GIAI PHONG 50GB, PHAI CHAY Relocate_To_D.bat VOI QUYEN ADMIN!" -ForegroundColor Red
Write-Host "Dung chay: D:\QLy Phòng Khám Thú Y\scripts\Relocate_To_D.bat" -ForegroundColor Yellow
Write-Host "-> Right-click -> Run as administrator" -ForegroundColor Yellow
