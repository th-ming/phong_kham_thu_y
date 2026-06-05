# Chạy Backend dev: Spring Boot DevTools + watcher tự compile khi sửa src.
# Mỗi lần chỉnh code trong Backend/src → compile → backend tự restart.
param(
    [switch]$Quiet
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
    if (-not $Quiet) {
        Write-Host 'Backend da chay tren cong 8081. Khong mo them ban moi.' -ForegroundColor Green
    }
    exit 0
}

Stop-DuplicateRexiBackends

$env:SPRING_PROFILES_ACTIVE = 'dev'

$runnerLog = Join-Path $RepoRoot 'Backend\logs\backend-dev-runner.log'
if ($Quiet) {
    $logDir = Split-Path $runnerLog -Parent
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backend dev starting..." | Out-File -FilePath $runnerLog -Append -Encoding utf8
} else {
    Write-Host '=== Rexi Backend DEV (auto restart on save) ===' -ForegroundColor Green
    Write-Host 'Watch: Backend/src | Profile: dev | Port: 8081 | Ctrl+C to stop' -ForegroundColor DarkGray
    Write-Host ''
}

$watchScript = Join-Path $PSScriptRoot 'watch_backend_sources.ps1'
$watchProc = $null
if (Test-Path $watchScript) {
    $watchProc = Start-Process -FilePath 'powershell.exe' -PassThru -WindowStyle Hidden -WorkingDirectory $RepoRoot -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $watchScript
    )
}

function Stop-WatchProcess {
    if ($watchProc -and -not $watchProc.HasExited) {
        Stop-Process -Id $watchProc.Id -Force -ErrorAction SilentlyContinue
    }
}

try {
    Set-Location (Join-Path $RepoRoot 'Backend')
    & .\mvnw.cmd spring-boot:run `
        '-Dmaven.test.skip=true' `
        '-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication' `
        '-Dspring-boot.run.arguments=--server.port=8081' `
        '-Dspring-boot.run.jvmArguments=-Xmx768m -XX:MaxMetaspaceSize=256m'
    $exitCode = $LASTEXITCODE
} finally {
    Stop-WatchProcess
    Set-Location $RepoRoot
}

exit $exitCode
