[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    $resDichVu = Invoke-RestMethod -Uri "http://localhost:8081/api/dich-vu" -Method Get
    $resBacSi = Invoke-RestMethod -Uri "http://localhost:8081/api/bac-si" -Method Get
    
    Write-Host "--- DICH VU (Services) ---"
    $resDichVu | Select-Object tenDichVu, giaTien | Format-Table -AutoSize
    
    Write-Host "--- BAC SI (Doctors) ---"
    $resBacSi | Select-Object hoTen, chuyenMon | Format-Table -AutoSize
    
    Write-Host "SUCCESS: Data retrieved correctly."
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
