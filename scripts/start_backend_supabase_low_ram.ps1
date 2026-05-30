# Chay backend tiet kiem RAM kết nối với Supabase (Production)
param(
    [int]$MaxHeapMb = 512
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent

. (Join-Path $PSScriptRoot 'backend_env.ps1')

# Kích hoạt profile 'prod' để kết nối trực tiếp đến Supabase PostgreSQL
$env:SPRING_PROFILES_ACTIVE = 'prod'
$env:MAVEN_OPTS = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"
$jvmArgs = "-Xmx$($MaxHeapMb)m -Xms128m -XX:MaxMetaspaceSize=192m"

Write-Host "=== Rexi Backend LOW RAM - SUPABASE CLOUD ===" -ForegroundColor Green
Write-Host "Profile: prod (Supabase) | Port: 8081 | JVM heap: $MaxHeapMb MB | DevTools restart: off" -ForegroundColor DarkGray
Write-Host "Hệ thống đang kết nối trực tiếp đến PostgreSQL Supabase của sếp!" -ForegroundColor Cyan
Write-Host ''

Set-Location (Join-Path $RepoRoot 'Backend')
& .\mvnw.cmd spring-boot:run `
    '-Dmaven.test.skip=true' `
    '-Dspring-boot.run.main-class=com.rexi.pkty.PktyApplication' `
    '-Dspring-boot.run.arguments=--spring.devtools.restart.enabled=false --spring.devtools.livereload.enabled=false' `
    "-Dspring-boot.run.jvmArguments=$jvmArgs"

exit $LASTEXITCODE
