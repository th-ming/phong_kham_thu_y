# Compile nhanh Backend (debounce) — DevTools restart app nếu spring-boot:run đang chạy.
param(
    [int]$DebounceMs = 900
)

$ErrorActionPreference = 'SilentlyContinue'
$RepoRoot = Split-Path $PSScriptRoot -Parent
$BackendRoot = Join-Path $RepoRoot 'Backend'
$mutexName = 'Local\RexiBackendCompileDebounce'

$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0)) { exit 0 }

try {
    Start-Sleep -Milliseconds $DebounceMs
    Push-Location $BackendRoot
    & .\mvnw.cmd compile '-Dmaven.test.skip=true' -q 2>&1 | Out-Null
} finally {
    Pop-Location
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
