$env:JAVA_HOME = "C:\Users\84916\.antigravity\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host ">>> Compiling Backend..."
./mvnw clean compile -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Compile SUCCESS! Starting Backend..."
    ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8080"
} else {
    Write-Host ">>> Compile FAILED! Please check the code."
}
