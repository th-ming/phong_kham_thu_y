# Watch Backend/src -> mvn compile -> DevTools restarts spring-boot:run
param(
    [int]$QuietPeriodMs = 1200
)

$ErrorActionPreference = 'Continue'
$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\Backend')).Path
$WatchRoot = Join-Path $BackendRoot 'src'

if (-not (Test-Path $WatchRoot)) {
    Write-Error "Missing folder: $WatchRoot"
    exit 1
}

$sourcePattern = '\.(java|properties|yml|yaml|xml)$'

function Test-ShouldCompile([string]$fullPath) {
    if ([string]::IsNullOrWhiteSpace($fullPath)) { return $false }
    if ($fullPath -match '\\target\\') { return $false }
    return $fullPath -match $sourcePattern
}

function Invoke-BackendCompile {
    Write-Host '[backend-watch] Compiling...' -ForegroundColor Cyan
    Push-Location $BackendRoot
    try {
        & .\mvnw.cmd compile '-Dmaven.test.skip=true' -q
        if ($LASTEXITCODE -eq 0) {
            Write-Host '[backend-watch] Compile OK (DevTools restart).' -ForegroundColor Green
        } else {
            Write-Host "[backend-watch] Compile failed (exit $LASTEXITCODE)." -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

Write-Host "[backend-watch] Watching: $WatchRoot" -ForegroundColor DarkGray

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $WatchRoot
$watcher.IncludeSubdirectories = $true
$watcher.Filter = '*.*'
$watcher.EnableRaisingEvents = $true

$changeTypes = [System.IO.WatcherChangeTypes]::LastWrite -bor
    [System.IO.WatcherChangeTypes]::FileName -bor
    [System.IO.WatcherChangeTypes]::CreationTime

try {
    while ($true) {
        $change = $watcher.WaitForChanged($changeTypes, $QuietPeriodMs)
        if ($change.TimedOut) { continue }
        if (-not (Test-ShouldCompile $change.FullPath)) { continue }

        do {
            $extra = $watcher.WaitForChanged($changeTypes, 300)
        } while (-not $extra.TimedOut)

        Invoke-BackendCompile
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
}
