$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SQLEXPRESS;Database=PhongKhamThuY;User Id=rexi_user;Password=RexiUser@123;Encrypt=True;TrustServerCertificate=True"
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT tk.ten_dang_nhap, tk.id_vai_tro, tk.id_nhan_vien, nv.ho_ten, nv.chuyen_mon FROM TaiKhoan tk LEFT JOIN NhanVien nv ON tk.id_nhan_vien = nv.id_nhan_vien"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $ds = New-Object System.Data.DataSet
    $adapter.Fill($ds)
    $ds.Tables[0] | Format-Table -AutoSize
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $conn.Close()
}
