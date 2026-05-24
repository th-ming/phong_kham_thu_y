# Khởi động backend dev (watcher + DevTools) nền nếu chưa chạy — gọi từ Cursor hook / session.
$ErrorActionPreference = 'SilentlyContinue'
$RepoRoot = if ($PSScriptRoot -match 'scripts$') { Split-Path $PSScriptRoot -Parent } else { $PSScriptRoot }

$pidFile = Join-Path $RepoRoot '.cursor\backend-dev-runner.pid'
$logDir = Join-Path $RepoRoot 'Backend\logs'
$logFile = Join-Path $logDir 'backend-dev-runner.log'
$startScript = Join-Path $RepoRoot 'scripts\start_backend_dev.ps1'

$cursorDir = Join-Path $RepoRoot '.cursor'
if (-not (Test-Path $cursorDir)) {
    New-Item -ItemType Directory -Path $cursorDir -Force | Out-Null
}
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Test-BackendListening {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect('127.0.0.1', 8081, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(400, $false)
        if (-not $ok) { return $false }
        $client.EndConnect($iar)
        return $client.Connected
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Test-RunnerAlive([string]$processId) {
    if (-not $processId) { return $false }
    $proc = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
    return [bool]$proc
}

if (Test-BackendListening) { exit 0 }

if (Test-Path $pidFile) {
    $savedPid = (Get-Content $pidFile -Raw).Trim()
    if (Test-RunnerAlive $savedPid) { exit 0 }
}

if (Test-BackendListening) { exit 0 }

$proc = Start-Process -FilePath 'powershell.exe' -PassThru -WindowStyle Hidden -WorkingDirectory $RepoRoot -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $startScript,
    '-Quiet'
)

if ($proc) {
    Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
}
