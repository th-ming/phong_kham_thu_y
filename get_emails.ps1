$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SQLEXPRESS;Database=PhongKhamThuY;User Id=rexi_user;Password=RexiUser@123;Encrypt=True;TrustServerCertificate=True"
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT T.ten_dang_nhap, N.email, N.ho_ten FROM TaiKhoan T JOIN NhanVien N ON T.id_nhan_vien = N.id_nhan_vien WHERE T.ten_dang_nhap = 'admin' OR T.ten_dang_nhap = 'quanly'"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $ds = New-Object System.Data.DataSet
    $adapter.Fill($ds)
    $ds.Tables[0] | Format-List
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $conn.Close()
}
