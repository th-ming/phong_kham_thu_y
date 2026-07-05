#!/usr/bin/env pwsh
# ╔════════════════════════════════════════════════════════════════════════════╗
# ║     LAUNCHER: Khởi động hệ thống giám sát Backend ở chế độ nền              ║
# ║          Start Backend Health Monitor in Background Mode                    ║
# ╚════════════════════════════════════════════════════════════════════════════╝

$MonitorScript = "d:\QLy Phòng Khám Thú Y\scripts\BackendHealthMonitor.ps1"
$LogDir = "d:\QLy Phòng Khám Thú Y\logs\backend-monitor"

# Tạo thư mục log nếu không tồn tại
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Cấu hình nền
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n╔════════════════════════════════════════════════════════════════════╗"
Write-Host "║  🚀 KHỞI ĐỘNG HỆ THỐNG GIÁM SÁT & TỰ ĐỘNG PHỤC HỒI BACKEND          ║"
Write-Host "╚════════════════════════════════════════════════════════════════════╝`n"

Write-Host "📝 Log file: $LogDir\"
Write-Host "🔍 Kiểm tra mỗi 30 giây"
Write-Host "⚡ Tự động restart nếu Backend không phản hồi"
Write-Host ""

# Khởi động monitor ở background
if (Test-Path $MonitorScript) {
    Write-Host "✅ Khởi động monitor..." -ForegroundColor Green
    & $MonitorScript -CheckIntervalSeconds 30 -BackendPort 8080 | Tee-Object -FilePath "$LogDir\latest.log" -Append
} else {
    Write-Host "❌ Không tìm thấy script: $MonitorScript" -ForegroundColor Red
}
