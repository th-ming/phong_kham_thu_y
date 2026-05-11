$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:DB_URL = 'jdbc:sqlserver://localhost;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true'
$env:DB_USERNAME = 'sa'
$env:DB_PASSWORD = '123456'
$env:JWT_SECRET = 'your_super_secret_key_change_this_in_production_immediately'
Set-Location Backend
.\mvnw.cmd spring-boot:run
