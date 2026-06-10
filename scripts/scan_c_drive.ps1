Write-Host "=== QUET CAC THU MUC LON TREN C: ===" -ForegroundColor Cyan
$driveC = Get-PSDrive C
Write-Host ("Tong dung luong C: {0:N2} GB" -f ($driveC.Used/1GB)) -ForegroundColor Yellow
Write-Host ""

# Check specific large folders individually
$targets = @(
    "C:\Users\84916\AppData\Local",
    "C:\Users\84916\AppData\Roaming",
    "C:\Users\84916\AppData\LocalLow",
    "C:\ProgramData",
    "C:\Program Files",
    "C:\Program Files (x86)",
    "C:\Windows\Temp",
    "C:\Windows\SoftwareDistribution\Download",
    "C:\Windows\WinSxS"
)

foreach ($t in $targets) {
    if (Test-Path $t) {
        Write-Host ("Dang kiem tra: {0} ... " -f $t) -NoNewline
        try {
            $size = 0
            $count = 0
            $items = Get-ChildItem $t -Recurse -File -ErrorAction SilentlyContinue
            foreach ($item in $items) {
                $size += $item.Length
                $count++
                if ($count -gt 50000) { break }  # limit to avoid timeout
            }
            if ($size -gt 0) {
                Write-Host ("{0:N2} GB ({1} files)" -f ($size/1GB), $count) -ForegroundColor Green
            } else {
                Write-Host "0 GB" -ForegroundColor Gray
            }
        } catch {
            Write-Host "LOI" -ForegroundColor Red
        }
    }
}
