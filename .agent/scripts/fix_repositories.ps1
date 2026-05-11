$repoPath = "Backend\src\main\java\com\rexi\pkty\repository"
$entities = @(
    "TiemChung", "Thuoc", "NhaCungCap", "LoThuoc", "LichLamViecNhanVien", 
    "LichHen", "HoSoBenhAn", "HoaDon", "GiaoDichKho", "DichVu", 
    "HoaDonChiTiet", "DonThuoc", "DonThuocChiTiet", "BenhAn_XetNghiem", "LoaiXetNghiem", "ThanhToan", "ThongBao"
)

Get-ChildItem -Path $repoPath -Filter "*Repository.java" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    $wasUpdated = $false
    
    foreach ($entity in $entities) {
        $pattern = "JpaRepository<$entity, String>"
        if ($content.Contains($pattern)) {
            $content = $content.Replace($pattern, "JpaRepository<$entity, Long>")
            Write-Host ">>> Đã cập nhật thực thể $entity trong file: $($_.Name)"
            $wasUpdated = $true
        }
    }
    
    if ($wasUpdated) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8
    }
}
