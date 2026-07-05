# Cursor sessionStart: tự bật backend dev nền (ko cần user chạy lệnh).
$ErrorActionPreference = 'SilentlyContinue'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ensure = Join-Path $RepoRoot 'scripts\ensure_backend_dev_running.ps1'
if (Test-Path $ensure) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ensure
}
exit 0
