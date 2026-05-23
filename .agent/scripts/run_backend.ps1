$repoPath = "d:\QLy Phòng Khám Thú Y\Backend"
Set-Location $repoPath

Write-Host ">>> Compiling Backend..." -ForegroundColor Yellow
.\mvnw.cmd clean compile -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host ">>> Compile FAILED! Please check the code." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ">>> Starting Spring Boot Application..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run

