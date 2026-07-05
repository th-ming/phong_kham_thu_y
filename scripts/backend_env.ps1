# Bien moi truong dung chung khi chay Backend (prod-like va dev watch)
# Auto-detect JAVA_HOME: first check system env, then try common paths

# UTF-8 ENCODING - dam bao tieng Viet hien thi dung trong terminal va log
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

function Find-JavaHome {
    # 1. Check system JAVA_HOME first
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        return $env:JAVA_HOME
    }
    # 2. Check common JDK install paths
    $candidates = @(
        'C:\Program Files\Java\jdk-22',
        'C:\Program Files\Java\jdk-21',
        'C:\Program Files\Java\jdk-17',
        'C:\Program Files\Microsoft\jdk-22',
        'C:\Program Files\Microsoft\jdk-21',
        'C:\Program Files\Microsoft\jdk-17',
        'C:\Program Files\Eclipse Adoptium\jdk-22',
        'C:\Program Files\Eclipse Adoptium\jdk-21'
    )
    foreach ($p in $candidates) {
        if (Test-Path "$p\bin\java.exe") { return $p }
    }
    # 3. Try where.exe to find java and derive JAVA_HOME
    $javaPath = (Get-Command java -ErrorAction SilentlyContinue).Source
    if ($javaPath) {
        # java.exe is typically in <JDK>\bin\java.exe or <JRE>\bin\java.exe
        $derived = Split-Path (Split-Path $javaPath)
        if (Test-Path "$derived\bin\javac.exe") { return $derived }
    }
    Write-Warning "JAVA_HOME not found! Backend may fail to start. Install JDK 21+ and set JAVA_HOME."
    return $null
}

$detectedJavaHome = Find-JavaHome
if ($detectedJavaHome) {
    $env:JAVA_HOME = $detectedJavaHome
}

$env:DB_URL = 'jdbc:sqlserver://127.0.0.1:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true'
$env:DB_USERNAME = 'sa'
$env:DB_PASSWORD = '123456'
$env:JWT_SECRET = 'your_super_secret_key_change_this_in_production_immediately'
$env:MAVEN_OPTS = '-Xmx768m -Xms256m -XX:MaxMetaspaceSize=256m'
