# Chạy Backend dev: Spring Boot DevTools + watcher tự compile khi sửa src.
# Mỗi lần chỉnh code trong Backend/src → compile → backend tự restart.
param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

. (Join-Path $PSScriptRoot 'backend_env.ps1')

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
        '-Dspring-boot.run.jvmArguments=-Xmx768m -XX:MaxMetaspaceSize=256m'
    $exitCode = $LASTEXITCODE
} finally {
    Stop-WatchProcess
    Set-Location $RepoRoot
}

exit $exitCode
