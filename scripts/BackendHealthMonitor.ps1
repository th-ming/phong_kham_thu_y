# ╔════════════════════════════════════════════════════════════════════════════╗
# ║              BACKEND HEALTH MONITORING & AUTO-RECOVERY SYSTEM               ║
# ║         Giám sát liên tục & tự động phục hồi Backend nếu có vấn đề          ║
# ╚════════════════════════════════════════════════════════════════════════════╝

param(
    [int]$CheckIntervalSeconds = 30,
    [string]$BackendPort = 8080,
    [string]$BackendUrl = "http://localhost:$BackendPort",
    [string]$HealthCheckEndpoint = "/api/v1/health",
    [int]$MaxRetries = 3
)

# Cấu hình logging
$LogDir = "d:\QLy Phòng Khám Thú Y\logs\backend-monitor"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$LogFile = "$LogDir\monitor-$(Get-Date -Format 'yyyy-MM-dd').log"
$AlertFile = "$LogDir\alerts-$(Get-Date -Format 'yyyy-MM-dd').log"

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SUCCESS')]
        [string]$Level = 'INFO'
    )
    
    $Timestamp = Get-Date -Format 'HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Add-Content -Path $LogFile -Value $LogEntry
    
    $Colors = @{
        'INFO' = 'Cyan'
        'WARN' = 'Yellow'
        'ERROR' = 'Red'
        'SUCCESS' = 'Green'
    }
    
    Write-Host $LogEntry -ForegroundColor $Colors[$Level]
}

function Write-Alert {
    param([string]$Message)
    
    $Timestamp = Get-Date -Format 'HH:mm:ss'
    $AlertEntry = "[$Timestamp] ⚠️  ALERT: $Message"
    
    Add-Content -Path $AlertFile -Value $AlertEntry
    Write-Host $AlertEntry -ForegroundColor Red -BackgroundColor Black
}

function Test-BackendConnectivity {
    try {
        $Response = Invoke-WebRequest -Uri $BackendUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        return @{ Success = $true; StatusCode = $Response.StatusCode }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Test-BackendHealth {
    try {
        $Response = Invoke-RestMethod -Uri "$BackendUrl$HealthCheckEndpoint" -Method GET -TimeoutSec 5 -ErrorAction Stop
        return @{ Success = $true; Status = $Response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Get-BackendProcess {
    $processes = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*PktyApplication*" -or $_.CommandLine -like "*spring-boot*"
    }
    return $processes
}

function Restart-Backend {
    Write-Log "🔄 Đang khởi động lại Backend..." -Level WARN
    Write-Alert "Khởi động lại Backend"
    
    try {
        # Dừng process Java nếu còn chạy
        $processes = Get-BackendProcess
        if ($processes) {
            Write-Log "Kết thúc các process Java..." -Level WARN
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        
        # Khởi động lại Backend
        $BackendPath = "d:\QLy Phòng Khám Thú Y\Backend"
        Write-Log "Chạy: cd '$BackendPath' && .\mvnw.cmd spring-boot:run"
        
        Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; .\mvnw.cmd spring-boot:run" `
            -WindowStyle Minimized `
            -ErrorAction SilentlyContinue
        
        Write-Log "✅ Lệnh khởi động Backend đã được gửi" -Level SUCCESS
        Start-Sleep -Seconds 8
        
        # Kiểm tra xem Backend đã lên chưa
        $retryCount = 0
        while ($retryCount -lt 5) {
            Start-Sleep -Seconds 3
            $health = Test-BackendConnectivity
            if ($health.Success) {
                Write-Log "✅ Backend đã khôi phục thành công!" -Level SUCCESS
                return $true
            }
            $retryCount++
            Write-Log "Chờ Backend khởi động... (lần $retryCount/5)" -Level WARN
        }
        
        Write-Alert "Backend không phục hồi sau 5 lần thử"
        return $false
    }
    catch {
        Write-Alert "Lỗi khi khôi phục Backend: $_"
        return $false
    }
}

function Get-RecentErrors {
    $LogPath = "d:\QLy Phòng Khám Thú Y\Backend\logs"
    if (-not (Test-Path $LogPath)) {
        return @()
    }
    
    $recentLogs = Get-ChildItem -Path $LogPath -Filter "*.log" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 3
    
    $errors = @()
    foreach ($log in $recentLogs) {
        $content = Get-Content -Path $log.FullName -Tail 100 -ErrorAction SilentlyContinue
        $errors += $content | Select-String -Pattern "ERROR|Exception|Failed" -ErrorAction SilentlyContinue
    }
    
    return $errors
}

function Check-DatabaseConnectivity {
    # Kiểm tra xem Backend có thể kết nối DB không
    try {
        $Response = Invoke-RestMethod -Uri "$BackendUrl/api/v1/health/db" -TimeoutSec 5 -ErrorAction Stop
        return @{ Success = $true }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#                           VÒNG LẶP GIÁM SÁT CHÍNH
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════════════╗"
Write-Host "║   🔍 BẮT ĐẦU GIÁM SÁT BACKEND (Mỗi $CheckIntervalSeconds giây)         ║"
Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Log "🚀 Bắt đầu hệ thống giám sát Backend"
Write-Log "Kiểm tra mỗi: $CheckIntervalSeconds giây"
Write-Log "Backend URL: $BackendUrl"

$consecutiveFailures = 0
$monitoringStartTime = Get-Date

while ($true) {
    try {
        $currentTime = Get-Date -Format 'HH:mm:ss'
        Write-Host "`n[$currentTime] 🔍 Kiểm tra Backend..." -ForegroundColor Cyan
        
        # 1️⃣ KIỂM TRA KẾT NỐI CƠ BẢN
        $connectivity = Test-BackendConnectivity
        if (-not $connectivity.Success) {
            $consecutiveFailures++
            Write-Log "❌ Backend không phản hồi: $($connectivity.Error)" -Level ERROR
            Write-Host "   ❌ Không thể kết nối (lỗi $consecutiveFailures/$MaxRetries)" -ForegroundColor Red
            
            if ($consecutiveFailures -ge $MaxRetries) {
                Write-Alert "Backend không phản hồi $MaxRetries lần liên tiếp!"
                Restart-Backend
                $consecutiveFailures = 0
                Start-Sleep -Seconds 10
                continue
            }
        }
        else {
            Write-Log "✅ Kết nối Backend OK (HTTP $($connectivity.StatusCode))" -Level SUCCESS
            Write-Host "   ✅ Kết nối OK (HTTP $($connectivity.StatusCode))" -ForegroundColor Green
            $consecutiveFailures = 0
            
            # 2️⃣ KIỂM TRA HEALTH ENDPOINT
            $health = Test-BackendHealth
            if ($health.Success) {
                Write-Log "✅ Health check OK" -Level SUCCESS
                Write-Host "   ✅ Health check OK" -ForegroundColor Green
            }
            else {
                Write-Log "⚠️  Health endpoint không phản hồi: $($health.Error)" -Level WARN
                Write-Host "   ⚠️  Health endpoint lỗi" -ForegroundColor Yellow
            }
            
            # 3️⃣ KIỂM TRA PROCESS JAVA
            $processes = Get-BackendProcess
            if ($processes) {
                Write-Log "✅ Process Java đang chạy (PID: $($processes.Id -join ', '))" -Level SUCCESS
                Write-Host "   ✅ Process Java: PID $($processes.Id -join ', ')" -ForegroundColor Green
            }
            else {
                Write-Alert "Process Java không tìm thấy!"
                Write-Host "   ❌ Process Java không tìm thấy" -ForegroundColor Red
                Restart-Backend
                $consecutiveFailures = 0
                Start-Sleep -Seconds 10
                continue
            }
            
            # 4️⃣ KIỂM TRA LỖI TRONG LOG (OPTIONAL)
            $errors = Get-RecentErrors
            if ($errors.Count -gt 0) {
                Write-Log "⚠️  Phát hiện lỗi trong log gần đây: $($errors.Count) entries" -Level WARN
                Write-Host "   ⚠️  Lỗi gần đây: $($errors.Count) entries" -ForegroundColor Yellow
            }
        }
        
        # Thống kê thời gian chạy
        $uptime = New-TimeSpan -Start $monitoringStartTime -End (Get-Date)
        Write-Host "   ⏱️  Giám sát đã chạy: $($uptime.Hours)h $($uptime.Minutes)m $($uptime.Seconds)s" -ForegroundColor DarkCyan
        
    }
    catch {
        Write-Log "❌ Lỗi trong vòng lặp giám sát: $_" -Level ERROR
        Write-Host "   ❌ Lỗi: $_" -ForegroundColor Red
    }
    
    Write-Host "   ⏳ Chờ $CheckIntervalSeconds giây đến kiểm tra tiếp theo..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $CheckIntervalSeconds
}
