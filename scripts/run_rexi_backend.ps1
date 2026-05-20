$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:DB_URL = 'jdbc:sqlserver://127.0.0.1:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true'
$env:DB_USERNAME = 'sa'
$env:DB_PASSWORD = '123456'
$env:JWT_SECRET = 'your_super_secret_key_change_this_in_production_immediately'
$env:MAVEN_OPTS = '-Xmx768m -Xms256m -XX:MaxMetaspaceSize=256m'
Set-Location Backend
.\mvnw.cmd spring-boot:run "-Dmaven.test.skip=true" "-Dspring-boot.run.excludeDevtools=true" "-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication" "-Dspring-boot.run.jvmArguments=-Xmx768m -XX:MaxMetaspaceSize=256m"
