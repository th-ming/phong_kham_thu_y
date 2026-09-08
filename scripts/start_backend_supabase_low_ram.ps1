# Chay backend tiet kiem RAM kết nối với Supabase (Production)
param(
    [int]$MaxHeapMb = 512
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

. (Join-Path $PSScriptRoot 'backend_env.ps1')

function Test-PortListening {
    param([int]$Port)

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $connect.AsyncWaitHandle.WaitOne(400, $false)) { return $false }
        $client.EndConnect($connect)
        return $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

$listeningLines = & cmd /c 'netstat -ano | findstr LISTENING' 2>$null
foreach ($line in $listeningLines) {
    if ($line -match ':(808[2-9])\s+.*\s+(\d+)$') {
        $pidToStop = [int]$Matches[2]
        Write-Host "Tat process dang nghe cong phu $($Matches[1]): PID $pidToStop" -ForegroundColor Yellow
        Stop-Process -Id $pidToStop -Force -ErrorAction SilentlyContinue
    }
}

if (Test-PortListening 8081) {
    Write-Host "Backend da chay tren cong 8081. Khong mo them ban moi." -ForegroundColor Green
    exit 0
}

# Kích hoạt profile 'prod' để kết nối trực tiếp đến Supabase PostgreSQL
$env:SPRING_PROFILES_ACTIVE = 'prod'
$env:DB_URL = '***REMOVED***-DB_URL'
$env:DB_USERNAME = 'postgres.fepjkvmneejfqijqffzv'
if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_PASSWORD)) {
    $securePassword = Read-Host 'Nhap mat khau database Supabase' -AsSecureString
    $passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
    }
}
else {
    $env:DB_PASSWORD = $env:SUPABASE_DB_PASSWORD
}
$env:MAVEN_OPTS = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"
$jvmArgs = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"

Write-Host "=== Rexi Backend LOW RAM - SUPABASE CLOUD ===" -ForegroundColor Green
Write-Host "Profile: prod (Supabase) | Port: 8081 | JVM heap: $MaxHeapMb MB | DevTools restart: off" -ForegroundColor DarkGray
Write-Host "Database: Supabase session pooler | User: $env:DB_USERNAME" -ForegroundColor DarkGray
Write-Host "Hệ thống đang kết nối trực tiếp đến PostgreSQL Supabase của sếp!" -ForegroundColor Cyan
Write-Host ''

Set-Location (Join-Path $RepoRoot 'Backend')
& .\mvnw.cmd spring-boot:run `
    '-Dmaven.test.skip=true' `
    '-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication' `
    '-Dspring-boot.run.arguments=--server.port=8081 --spring.devtools.restart.enabled=false --spring.devtools.livereload.enabled=false' `
    "-Dspring-boot.run.jvmArguments=$jvmArgs"

exit $LASTEXITCODE
