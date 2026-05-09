# OptimizeRAM.ps1 - Vệ sĩ bảo vệ RAM cho Sếp (Phiên bản Tự Động)
$Threshold = 90  # Chế độ Sắt: 90% là dọn ngay
$SleepTime = 20 # Kiểm tra sau mỗi 20 giây
$LogFile = "d:\QLy Phòng Khám Thú Y\logs\ram_optimizer.log"

if (!(Test-Path "d:\QLy Phòng Khám Thú Y\logs")) { New-Item -ItemType Directory "d:\QLy Phòng Khám Thú Y\logs" }

Write-Host "🚀 Hệ thống giám sát RAM Rexi đã sẵn sàng! (Ngưỡng: $Threshold%)" -ForegroundColor Cyan

while($true) {
    $ComputerMemory = Get-WmiObject -Class win32_operatingsystem
    $MemoryUsage = [Math]::Round(((($ComputerMemory.TotalVisibleMemorySize - $ComputerMemory.FreePhysicalMemory) / $ComputerMemory.TotalVisibleMemorySize) * 100), 2)
    
    if ($MemoryUsage -gt $Threshold) {
        $msg = "[$(Get-Date -Format 'HH:mm:ss')] ⚠️ RAM: $MemoryUsage% - Đang tự động giải phóng..."
        Write-Host $msg -ForegroundColor Red
        $msg | Out-File -FilePath $LogFile -Append

        # Dọn dẹp Node.js (Vite/Frontend) nếu quá nặng
        Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 600MB } | Stop-Process -Force
        
        # Dọn dẹp các tiến trình Antigravity nếu nó đang bị treo hoặc quá nặng (> 800MB)
        Get-Process Antigravity -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 800MB } | Stop-Process -Force

        # Xóa các log file quá lớn (> 50MB) để tránh lag terminal
        Get-ChildItem "d:\QLy Phòng Khám Thú Y\BackendPKTY\logs\*.log" | Where-Object { $_.Length -gt 50MB } | Remove-Item -Force

        # Thông báo cho Sếp qua PowerShell (không làm treo cửa sổ)
        try {
            Add-Type -AssemblyName System.Speech
            $Speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $Speak.Speak("Đã tự động giải phóng RAM xong rồi sếp!")
        } catch { }
    }

    Start-Sleep -Seconds $SleepTime
}

