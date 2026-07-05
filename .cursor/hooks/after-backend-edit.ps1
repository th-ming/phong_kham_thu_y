# Cursor afterFileEdit / afterTabFileEdit: sửa Backend → compile → DevTools restart.
$ErrorActionPreference = 'SilentlyContinue'

$stdin = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($stdin)) { exit 0 }

$filePath = $null
try {
    $payload = $stdin | ConvertFrom-Json
    $filePath = $payload.file_path
} catch {
    if ($stdin -match '"file_path"\s*:\s*"([^"]+)"') {
        $filePath = $Matches[1]
    }
}

if ([string]::IsNullOrWhiteSpace($filePath)) { exit 0 }

$normalized = $filePath -replace '/', '\'
if ($normalized -notmatch '\\Backend\\src\\') { exit 0 }
if ($normalized -notmatch '\.(java|properties|yml|yaml|xml)$') { exit 0 }

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ensure = Join-Path $RepoRoot 'scripts\ensure_backend_dev_running.ps1'
$compile = Join-Path $RepoRoot 'scripts\trigger_backend_compile.ps1'

if (Test-Path $ensure) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ensure
}
if (Test-Path $compile) {
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $compile
    ) -WorkingDirectory $RepoRoot | Out-Null
}

exit 0
