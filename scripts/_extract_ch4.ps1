$ErrorActionPreference = "Stop"
$docxPath = "D:\QLy Phòng Khám Thú Y\Báo cáo thực tập\baocao 2206 v43_fixed.docx"
$tempZip = "C:\temp\baocao.zip"
$tempDir = "C:\temp\baocao_extracted"

# Copy docx as zip
Copy-Item $docxPath $tempZip -Force

# Remove old extracted dir
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

# Extract
Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

# Read XML
$xml = Get-Content (Join-Path $tempDir "word\document.xml") -Raw -Encoding UTF8

# Split into paragraphs
$paragraphs = [regex]::Split($xml, '<w:p[ >]')

$inCh4 = $false
$headingList = @()

foreach ($p in $paragraphs) {
    $m = [regex]::Matches($p, '<w:t[^>]*>([^<]*)</w:t>')
    $text = ($m | ForEach-Object { $_.Groups[1].Value }) -join ''
    $text = $text.Trim()
    
    if ([string]::IsNullOrEmpty($text)) { continue }
    
    # Detect chapters/headings
    if ($text -match '^\d+\.\d+\s' -or $text -match '^\d+\.\s' -or $text -match 'Chương' -or $text -match 'CHƯƠNG') {
        $headingList += $text
    }
    
    if ($text -match '^Chương\s*4' -or $text -match '^CHƯƠNG\s*4' -or $text -match '^4\.\s') {
        $inCh4 = $true
        Write-Output "=== CHƯƠNG 4 ==="
        continue
    }
    
    if ($inCh4 -and ($text -match '^Chương\s*5' -or $text -match '^CHƯƠNG\s*5' -or $text -match '^5\.\s')) {
        break
    }
    
    if ($inCh4) {
        Write-Output $text
    }
}

if (-not $inCh4) {
    Write-Output "=== KHONG TIM THAY CHUONG 4. DANH SACH CHUONG: ==="
    foreach ($h in $headingList) {
        Write-Output $h
    }
}

# Cleanup
Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
