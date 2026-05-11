$env:JAVA_HOME = "C:\Users\84916\.antigravity\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host ">>> Starting Backend (No clean/compile)..."
./mvnw spring-boot:run
