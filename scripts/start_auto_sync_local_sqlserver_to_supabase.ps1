param(
    [int]$IntervalSeconds = 300
)

$ErrorActionPreference = 'Continue'
$SyncScript = Join-Path $PSScriptRoot 'sync_local_sqlserver_to_supabase.ps1'
$LogDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'logs'
$LogFile = Join-Path $LogDir 'supabase-auto-sync.log'

if ($IntervalSeconds -lt 30) {
    throw 'IntervalSeconds must be at least 30 to avoid hammering the databases.'
}

if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

Write-Host "=== Rexi Auto Sync: SQL Server local -> Supabase ===" -ForegroundColor Green
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor DarkGray
Write-Host "Log: $LogFile" -ForegroundColor DarkGray
Write-Host "Close this window to stop auto sync." -ForegroundColor Yellow
Write-Host ''

while ($true) {
    $startedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    try {
        "[$startedAt] sync started" | Tee-Object -FilePath $LogFile -Append | Out-Host
        & powershell -NoProfile -ExecutionPolicy Bypass -File $SyncScript -Quiet 2>&1 |
            Tee-Object -FilePath $LogFile -Append | Out-Host
        $finishedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        "[$finishedAt] sync finished" | Tee-Object -FilePath $LogFile -Append | Out-Host
    }
    catch {
        $failedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        "[$failedAt] sync failed: $($_.Exception.Message)" | Tee-Object -FilePath $LogFile -Append | Out-Host
    }

    Start-Sleep -Seconds $IntervalSeconds
}
