Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("D:\QLy Phòng Khám Thú Y\Báo cáo thực tập\baocao 2206 v43_fixed.docx")
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Extract text between w:t tags, grouped by paragraphs
$paragraphs = $xml -split '<w:p[ >]'
foreach ($para in $paragraphs) {
    $texts = [regex]::Matches($para, '<w:t[^>]*>([^<]*)</w:t>')
    $line = ($texts | ForEach-Object { $_.Groups[1].Value }) -join ''
    $line = $line.Trim()
    if ($line -match '^4\.\d' -or $line -match '^Chương\s') {
        Write-Output $line.Substring(0, [Math]::Min($line.Length, 300))
    }
}
