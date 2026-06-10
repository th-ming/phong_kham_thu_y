$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== OC C: - KIEM TRA DUNG LUONG ===" -ForegroundColor Cyan

$cDrive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$totalC = [math]::Round($cDrive.Size/1GB, 1)
$freeC = [math]::Round($cDrive.FreeSpace/1GB, 1)
$usedC = [math]::Round(($cDrive.Size - $cDrive.FreeSpace)/1GB, 1)
Write-Host "Tong: ${totalC}GB | Da dung: ${usedC}GB | Trong: ${freeC}GB" -ForegroundColor Yellow

Write-Host "`n=== C:\\Users\\84916 ===" -ForegroundColor Cyan
Get-ChildItem "C:\Users\84916" -Directory | ForEach-Object {
    $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum
    if ($s -gt 100MB) { Write-Host ("  " + $_.Name + " = " + [math]::Round($s/1GB,2) + " GB") }
}

Write-Host "`n=== C:\\ProgramData ===" -ForegroundColor Cyan
Get-ChildItem "C:\ProgramData" -Directory | ForEach-Object {
    $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum
    if ($s -gt 200MB) { Write-Host ("  " + $_.Name + " = " + [math]::Round($s/1GB,2) + " GB") }
}

Write-Host "`n=== C:\\Program Files ===" -ForegroundColor Cyan
Get-ChildItem "C:\Program Files" -Directory | ForEach-Object {
    $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum
    if ($s -gt 500MB) { Write-Host ("  " + $_.Name + " = " + [math]::Round($s/1GB,2) + " GB") }
}

Write-Host "`n=== C:\\Program Files (x86) ===" -ForegroundColor Cyan
Get-ChildItem "C:\Program Files (x86)" -Directory | ForEach-Object {
    $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum
    if ($s -gt 500MB) { Write-Host ("  " + $_.Name + " = " + [math]::Round($s/1GB,2) + " GB") }
}
