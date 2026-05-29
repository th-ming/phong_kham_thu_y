# Script tự động chạy và theo dõi (watch) thay đổi mã nguồn Backend để tự động compile + reload qua DevTools.
# Cách dùng: Mở PowerShell và chạy: .\run_backend_dev.ps1

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "🚀 KHỞI ĐỘNG HỆ THỐNG WATCHER & AUTO-RELOAD BACKEND CHO SẾP" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan

# Kiểm tra thư mục Backend
if (-not (Test-Path "Backend")) {
    Write-Host "❌ Không tìm thấy thư mục Backend ở thư mục gốc!" -ForegroundColor Red
    exit
}

# Di chuyển tạm vào Backend để chuẩn bị
Push-Location Backend

# Chạy Spring Boot ở tiến trình riêng
Write-Host "1. Đang khởi chạy Spring Boot Backend..." -ForegroundColor Yellow
$backendProcess = Start-Process mvn -ArgumentList "spring-boot:run" -PassThru -NoNewWindow

# Hàm dọn dẹp khi thoát
function Cleanup {
    Write-Host "`n🧹 Đang dừng Backend..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
    }
    Pop-Location
    Write-Host "✅ Đã dọn dẹp sạch sẽ. Tạm biệt sếp!" -ForegroundColor Green
    exit
}

# Bẫy sự kiện Ctrl+C để tắt backend sạch sẽ
trap { Cleanup }

Write-Host "2. Đang kích hoạt chế độ tự động biên dịch (Watch & Auto-Compile)..." -ForegroundColor Yellow
Write-Host "   -> Hệ thống sẽ tự động quét thư mục src/ mỗi khi sếp bấm Ctrl + S" -ForegroundColor Green
Write-Host "   -> Spring Boot DevTools sẽ tự động reload ngay lập tức!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "💡 Nhấn Ctrl + C để dừng toàn bộ hệ thống." -ForegroundColor Magenta

# Thiết lập Watcher theo dõi file trong src/
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = (Get-Item "src").FullName
$watcher.IncludeSubdirectories = $true
$watcher.Filter = "*.*"
$watcher.EnableRaisingEvents = $true

# Trạng thái để tránh compile trùng lặp quá nhanh (debounce)
$lastCompileTime = [DateTime]::MinValue

while ($true) {
    if ($backendProcess.HasExited) {
        Write-Host "⚠️ Tiến trình Backend đã dừng!" -ForegroundColor Red
        break
    }

    # Chờ sự kiện thay đổi file
    $change = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::All, 1000)

    if ($change.TimedOut) {
        continue
    }

    # Chỉ compile khi các file Java hoặc cấu hình thay đổi và thỏa mãn debounce (1.5 giây)
    $extension = [System.IO.Path]::GetExtension($change.Name)
    if ($extension -match '\.(java|properties|xml|yml)$') {
        $now = [DateTime]::Now
        if ($now.Subtract($lastCompileTime).TotalMilliseconds -gt 1500) {
            Write-Host "`n⚡ Phát hiện thay đổi tại: $($change.Name)" -ForegroundColor Cyan
            Write-Host "🔨 Đang tự động biên dịch nhanh..." -ForegroundColor Yellow
            
            # Chạy maven compile bất đồng bộ hoặc đồng bộ nhanh
            Start-Process mvn -ArgumentList "compile -DskipTests --quiet" -NoNewWindow -Wait
            
            $lastCompileTime = $now
            Write-Host "✅ Biên dịch hoàn tất! DevTools sẽ tự động reload backend trong giây lát..." -ForegroundColor Green
        }
    }
}

Cleanup
