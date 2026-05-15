$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SQLEXPRESS;Database=PhongKhamThuY;User Id=rexi_user;Password=RexiUser@123;Encrypt=True;TrustServerCertificate=True"
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "DELETE FROM NhanVien WHERE id_nhan_vien LIKE 'BS-%'; DELETE FROM DichVu WHERE id_dich_vu LIKE 'DV-%';"
    $cmd.ExecuteNonQuery()
    Write-Host "SUCCESS: Data wiped."
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $conn.Close()
}
