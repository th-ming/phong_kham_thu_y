$env:JAVA_HOME = "C:\Users\84916\.antigravity\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Load .env file
if (Test-Path ".env") {
    Write-Host ">>> Loading environment variables from .env..."
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match "^([^=]+)=(.*)$") {
                $name = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                [System.Environment]::SetEnvironmentVariable($name, $value)
                Write-Host "    - Loaded: $name"
            }
        }
    }
}

Write-Host ">>> Starting Backend with environment variables..."
./mvnw spring-boot:run
