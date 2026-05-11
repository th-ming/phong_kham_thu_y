$url = "http://localhost:8081/api/dich-vu"
$totalRequests = 250
$successCount = 0
$rateLimitCount = 0
$otherCount = 0

Write-Host ">>> Starting DDoS Attack Simulation on PUBLIC endpoint: $url"
Write-Host ">>> Sending $totalRequests requests..."

for ($i = 1; $i -le $totalRequests; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -ErrorAction Stop -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $successCount++
        } else {
            $otherCount++
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitCount++
        } else {
            $otherCount++
        }
    }
    
    if ($i % 50 -eq 0) {
        Write-Host ">>> Progress: $i/$totalRequests requests sent..."
    }
}

Write-Host "------------------------------------"
Write-Host ">>> ATTACK RESULTS:"
Write-Host ">>> Total Requests: $totalRequests"
Write-Host ">>> Success (200 OK): $successCount"
Write-Host ">>> Blocked (429 Too Many Requests): $rateLimitCount"
Write-Host ">>> Other Responses: $otherCount"
Write-Host "------------------------------------"

if ($rateLimitCount -gt 0) {
    Write-Host ">>> SUCCESS: RateLimitFilter is WORKING! System blocked $rateLimitCount spam requests after threshold."
} elseif ($successCount -gt 200) {
    Write-Host ">>> FAILURE: System allowed more than 200 requests ($successCount). Filter is NOT working."
} else {
    Write-Host ">>> UNKNOWN: Check logs. All requests might have failed before reaching filter."
}
