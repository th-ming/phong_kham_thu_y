# CleanDiskC.ps1 - Don dep o C cho du an Rexi
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "--- DANG DON DEP RAC O C... ---" -ForegroundColor Yellow

$Paths = @(
    "C:\Windows\Temp\*",
    "$env:TEMP\*",
    "C:\Windows\SoftwareDistribution\Download\*"
)

foreach ($Path in $Paths) {
    try {
        Write-Host "Dang xoa: $Path" -ForegroundColor Gray
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
        # Bo qua neu file dang su dung
    }
}

try {
    Write-Host "Dang lam sach Thung rac..." -ForegroundColor Gray
    Clear-RecycleBin -DriveLetter C -Force -ErrorAction SilentlyContinue
} catch {}

$FreeSpace = (Get-WmiObject Win32_LogicalDisk | Where-Object { $_.Caption -eq "C:" }).FreeSpace / 1GB
$FreeSpace = [Math]::Round($FreeSpace, 2)

Write-Host "--- DA DON DEP XONG! ---" -ForegroundColor Green
Write-Host "Dung luong trong hien tai tren o C: $FreeSpace GB" -ForegroundColor Cyan
