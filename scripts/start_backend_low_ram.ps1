# Chay backend tiet kiem RAM: tat DevTools restart/watcher, gioi han JVM nho hon.
param(
    [int]$MaxHeapMb = 512
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

. (Join-Path $PSScriptRoot 'backend_env.ps1')

$env:SPRING_PROFILES_ACTIVE = 'dev'
$env:MAVEN_OPTS = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"
$jvmArgs = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"

Write-Host "=== Rexi Backend LOW RAM ===" -ForegroundColor Green
Write-Host "Profile: dev | Port: 8081 | JVM heap: $MaxHeapMb MB | DevTools restart: off" -ForegroundColor DarkGray
Write-Host "Khi sua code backend, dung Ctrl+C roi chay lai script nay." -ForegroundColor DarkGray
Write-Host ''

Set-Location (Join-Path $RepoRoot 'Backend')
& .\mvnw.cmd spring-boot:run `
    '-Dmaven.test.skip=true' `
    '-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication' `
    '-Dspring-boot.run.arguments=--spring.devtools.restart.enabled=false --spring.devtools.livereload.enabled=false' `
    "-Dspring-boot.run.jvmArguments=$jvmArgs"

exit $LASTEXITCODE
