$repoPath = "Backend\src\main\java\com\rexi\pkty\repository"
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)

Get-ChildItem -Path $repoPath -Filter "*Repository.java" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    # Đảm bảo nội dung là UTF-8 sạch
    [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBOM)
    Write-Host ">>> Đã chuẩn hóa Encoding file: $($_.Name)"
}
