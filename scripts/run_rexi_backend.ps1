# Tự bật backend dev nền (auto restart khi sửa code). Không cần lệnh riêng.
$RepoRoot = Split-Path $PSScriptRoot -Parent
& (Join-Path $PSScriptRoot 'ensure_backend_dev_running.ps1')
Write-Host 'Backend dev dang chay nen (port 8081). Log: Backend/logs/backend-dev-runner.log' -ForegroundColor Green
Write-Host 'Sua file trong Backend/src -> tu compile + restart.' -ForegroundColor DarkGray
