# Di chuyen vao thu muc du an
Set-Location 'd:\QLy Phòng Khám Thú Y'

Write-Host 'Dang chuan bi cap nhat toan bo he thong... [BACKUP MODE]'

# Don dep tan du
if (Test-Path 'IntegrationServices') {
    Remove-Item -Path 'IntegrationServices' -Recurse -Force -ErrorAction SilentlyContinue
}

# Xuat CSDL ra file tam de tranh loi tieng Viet cua mssql-scripter
$tempSql = 'd:\PKTY_Temp.sql'
Write-Host 'Dang xuat CSDL...'
try {
    mssql-scripter -S 'localhost\SQLEXPRESS' -d 'PhongKhamThuY' --schema-and-data -f $tempSql
    if (Test-Path $tempSql) {
        Move-Item -Path $tempSql -Destination 'PhongKhamThuY.sql' -Force
        Write-Host 'Da cap nhat file PhongKhamThuY.sql'
    }
} catch {
    Write-Host 'Canh bao: mssql-scripter gap loi!'
}

# Cap nhat cau truc thu mục vao README.md tu dong
Write-Host 'Dang cap nhat cau truc vao README.md...'
$folders = Get-ChildItem -Directory | Where-Object { $_.Name -notmatch 'node_modules|\.git|\.idea|\.agent|\.mvn|logs|target|brain|scratch' }
$files = Get-ChildItem -File | Where-Object { $_.Name -match '\.sql$|\.yml$|\.conf$' }
$structure = '```text' + [char]10 + '.' + [char]10
foreach ($f in $folders) { $structure += '+-- [Folder] ' + $f.Name + '/' + [char]10 }
foreach ($f in $files) { $structure += '+-- [File] ' + $f.Name + [char]10 }
$structure += '```'

$readmePath = 'README.md'
$readmeContent = [System.IO.File]::ReadAllText($readmePath)
$newReadmeContent = $readmeContent -replace '(?s)```text\.\n.*?```', $structure
[System.IO.File]::WriteAllText($readmePath, $newReadmeContent)

# Tao thong tin phien ban theo ngay gio
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$commitMsg = 'REXI SYSTEM BACKUP [' + $timestamp + '] - AUTO SYNC'

# Git Push
Write-Host 'Dang day code len Git'
git add .
git commit -m $commitMsg
git push

if ($?) {
    Write-Host '--- THANH CONG! ---'
} else {
    Write-Host '--- LOI: Khong the push len Git ---'
}
