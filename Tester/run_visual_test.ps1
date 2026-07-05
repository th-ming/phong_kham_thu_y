Set-Location -Path $PSScriptRoot
npx playwright test test_schedule_gate_visual.spec.ts --headed --timeout=180000 | Out-File -FilePath "$PSScriptRoot\test_output.log" -Encoding utf8
"Done" | Out-File -FilePath "$PSScriptRoot\test_status.txt" -Encoding utf8
