param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path $PSScriptRoot -Parent
$BackendRoot = Join-Path $RepoRoot 'Backend'
$ToolRoot = Join-Path $PSScriptRoot 'db-sync'
$SourceFile = Join-Path $ToolRoot 'MigrateSqlServerToSupabase.java'
$ClassFile = Join-Path $ToolRoot 'MigrateSqlServerToSupabase.class'
$ClasspathFile = Join-Path $BackendRoot 'target\classpath.txt'

. (Join-Path $PSScriptRoot 'backend_env.ps1')

$supabasePassword = [Environment]::GetEnvironmentVariable('SUPABASE_DB_PASSWORD', 'User')
if ([string]::IsNullOrWhiteSpace($supabasePassword)) {
    $supabasePassword = $env:SUPABASE_DB_PASSWORD
}
if ([string]::IsNullOrWhiteSpace($supabasePassword)) {
    throw 'Missing SUPABASE_DB_PASSWORD. Set it in Windows User Environment Variables first.'
}

$env:MSSQL_URL = 'jdbc:sqlserver://127.0.0.1:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true'
$env:MSSQL_USER = 'sa'
$env:MSSQL_PASSWORD = '123456'
$env:PG_URL = '***REMOVED***-DB_URL'
$env:PG_USER = 'postgres.fepjkvmneejfqijqffzv'
$env:PG_PASSWORD = $supabasePassword

if (!(Test-Path $ClasspathFile)) {
    Push-Location $BackendRoot
    try {
        & .\mvnw.cmd 'dependency:build-classpath' '-Dmdep.outputFile=target\classpath.txt' '-q'
    }
    finally {
        Pop-Location
    }
}

$classpath = Get-Content -Raw -Path $ClasspathFile
if (!(Test-Path $ClassFile) -or ((Get-Item $SourceFile).LastWriteTimeUtc -gt (Get-Item $ClassFile).LastWriteTimeUtc)) {
    & javac -encoding UTF-8 -proc:none -cp $classpath $SourceFile
}

if (!$Quiet) {
    Write-Host "Sync SQL Server local -> Supabase started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
}

& java -cp "$ToolRoot;$classpath" MigrateSqlServerToSupabase

if (!$Quiet) {
    Write-Host "Sync SQL Server local -> Supabase finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
}
