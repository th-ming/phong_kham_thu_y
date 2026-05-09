$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\RexiRAMOptimizer.lnk"
$targetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$scriptPath = "d:\QLy Phòng Khám Thú Y\UltimateOptimizer.ps1"
$arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut($startupPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $arguments
$shortcut.WindowStyle = 7 
$shortcut.Save()

Write-Host "--- SUCCESS ---"
Write-Host "Added RAM Optimizer to Startup folder."
