# Quick Backend Health Check - No dependencies, no fuss
# Usage: powershell -ExecutionPolicy Bypass -File QuickHealthCheck.ps1

param(
    [string]$BackendPort = 8081,
    [string]$BackendUrl = "http://localhost:$BackendPort"
)

$Results = @{
    Connectivity = $false
    HttpStatus = $null
    Health = $false
    JavaProcess = $false
    ResponseTime = 0
}

Write-Host "`n[CHECK] Backend Health Status"
Write-Host "========================================"

# Check HTTP connectivity (use /api/system/health — root URL returns 403 from Spring Security)
Write-Host "  [1/4] HTTP connectivity...", -NoNewline
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $Response = Invoke-WebRequest -Uri "$BackendUrl/api/system/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $Stopwatch.Stop()
    $Results.Connectivity = $true
    $Results.HttpStatus = $Response.StatusCode
    $Results.ResponseTime = $Stopwatch.ElapsedMilliseconds
    Write-Host " OK [HTTP $($Response.StatusCode)]" -ForegroundColor Green
}
catch {
    $Stopwatch.Stop()
    Write-Host " FAIL [$($_.Exception.Message)]" -ForegroundColor Red
    $Results.Connectivity = $false
}

# Check Java Process
Write-Host "  [2/4] Java process status...", -NoNewline
$JavaProcess = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*PktyApplication*" -or $_.CommandLine -like "*spring-boot*" -or $_.CommandLine -like "*pkty*.jar" -or $_.CommandLine -like "*target*jar*"
}
if ($JavaProcess) {
    Write-Host " OK [PID $($JavaProcess.Id)]" -ForegroundColor Green
    $Results.JavaProcess = $true
} else {
    Write-Host " FAIL [No Java process found]" -ForegroundColor Red
}

# Check Health Endpoint
Write-Host "  [3/4] Health endpoint...", -NoNewline
try {
    $HealthResponse = Invoke-RestMethod -Uri "$BackendUrl/api/system/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $Results.Health = $true
}
catch {
    Write-Host " WARN [No response]" -ForegroundColor Yellow
}

# Summary
Write-Host "  [4/4] Summary"
$OverallStatus = if ($Results.Connectivity -and $Results.JavaProcess) { "HEALTHY" } else { "PROBLEM" }
$OverallColor = if ($Results.Connectivity) { "Green" } else { "Red" }
Write-Host "        Status: $OverallStatus" -ForegroundColor $OverallColor
Write-Host "        HTTP:   $(if ($Results.Connectivity) { 'OK' } else { 'FAIL' })"
Write-Host "        Java:   $(if ($Results.JavaProcess) { 'OK' } else { 'FAIL' })"
Write-Host "        Health: $(if ($Results.Health) { 'OK' } else { 'WARN' })"
Write-Host "        Time:   $($Results.ResponseTime)ms"

if ($Results.Connectivity -and -not $Results.JavaProcess) {
    Write-Host "`n[WARNING] Port $BackendPort open but Java process missing!" -ForegroundColor Red
}

Write-Host ""
exit $(if ($Results.Connectivity -and $Results.JavaProcess) { 0 } else { 1 })
