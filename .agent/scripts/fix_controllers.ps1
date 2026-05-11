$controllerPath = "Backend\src\main\java\com\rexi\pkty\controller"
$entitiesToFix = @(
    "Thuoc", "DichVu", "HoSoBenhAn", "HoaDon", "LichHen", 
    "TiemChung", "LoThuoc", "NhaCungCap", "GiaoDichKho"
)

# Danh sách các file cần sửa
$files = Get-ChildItem -Path $controllerPath -Filter "*Controller.java"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $wasUpdated = $false
    
    # Sửa PathVariable String id -> Long id cho các thực thể đã refactor
    # Ví dụ: @PathVariable String id trong ThuocController
    if ($file.Name -match "(Thuoc|DichVu|HoSoBenhAn|HoaDon|LichHen|TiemChung|LoThuoc|NhaCungCap|GiaoDichKho)Controller") {
        $content = $content -replace '@PathVariable String id', '@PathVariable Long id'
        $content = $content -replace '@PathVariable String idBenhAn', '@PathVariable Long idBenhAn'
        $wasUpdated = $true
    }

    if ($wasUpdated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host ">>> Đã cập nhật Controller: $($file.Name)"
    }
}
