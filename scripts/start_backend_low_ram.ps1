# Chay backend tiet kiem RAM: tat DevTools restart/watcher, gioi han JVM nho hon.
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

function Stop-ExtraBackendPorts {
    $listeningLines = & cmd /c 'netstat -ano | findstr LISTENING' 2>$null
    foreach ($line in $listeningLines) {
        if ($line -match ':(808[2-9])\s+.*\s+(\d+)$') {
            $pidToStop = [int]$Matches[2]
            Write-Host "Tat process dang nghe cong phu $($Matches[1]): PID $pidToStop" -ForegroundColor Yellow
            Stop-Process -Id $pidToStop -Force -ErrorAction SilentlyContinue
        }
    }
}

function Stop-DuplicateRexiBackends {
    try {
        Get-CimInstance Win32_Process -Filter "name='java.exe'" |
            Where-Object {
                $_.CommandLine -match 'com\.rexi\.pkty\.PktyApplication|spring-boot:run' -and
                $_.CommandLine -match '--server\.port=' -and
                $_.CommandLine -notmatch '--server\.port=8081(\s|$)'
            } |
            ForEach-Object {
                Write-Host "Tat backend Rexi chay sai cong: PID $($_.ProcessId)" -ForegroundColor Yellow
                Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
            }
    }
    catch {
        Write-Host "Khong doc duoc danh sach Java process, bo qua buoc don backend trung." -ForegroundColor DarkYellow
    }
}

Stop-ExtraBackendPorts

if (Test-PortListening 8081) {
    Write-Host "Backend da chay tren cong 8081. Khong mo them ban moi." -ForegroundColor Green
    exit 0
}

Stop-DuplicateRexiBackends

$env:SPRING_PROFILES_ACTIVE = 'dev'
$env:MAVEN_OPTS = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"
$jvmArgs = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"

Write-Host "=== Rexi Backend LOW RAM ===" -ForegroundColor Green
Write-Host "Profile: dev | Port: 8081 | JVM heap: $MaxHeapMb MB | DevTools restart: off" -ForegroundColor DarkGray
Write-Host "Khi sua code backend, dung Ctrl+C roi chay lai script nay." -ForegroundColor DarkGray
Write-Host ''

Set-Location (Join-Path $RepoRoot 'Backend')
& .\mvnw.cmd clean spring-boot:run `
    '-Dmaven.test.skip=true' `
    '-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication' `
    '-Dspring-boot.run.arguments=--server.port=8081 --spring.devtools.restart.enabled=false --spring.devtools.livereload.enabled=false' `
    "-Dspring-boot.run.jvmArguments=$jvmArgs"

exit $LASTEXITCODE
