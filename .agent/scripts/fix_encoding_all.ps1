$basePath = "Backend\src\main\java\com\rexi\pkty"
$folders = @("controller", "repository", "entity", "security", "service")
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)

foreach ($folder in $folders) {
    $fullPath = Join-Path $basePath $folder
    if (Test-Path $fullPath) {
        Write-Host ">>> Đang xử lý thư mục: $folder"
        Get-ChildItem -Path $fullPath -Filter "*.java" | ForEach-Object {
            $filePath = $_.FullName
            $content = Get-Content $filePath -Raw
            [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBOM)
            Write-Host "    - Đã chuẩn hóa: $($_.Name)"
        }
    }
}
