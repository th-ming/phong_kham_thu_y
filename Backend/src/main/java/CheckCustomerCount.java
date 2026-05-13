import java.sql.*;

public class CheckCustomerCount {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true";
        String user = "rexi_user";
        String password = "RexiUser@123";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            String sql = "SELECT COUNT(*) FROM KhachHang kh WHERE (kh.da_xoa = 0 OR kh.da_xoa IS NULL) AND NOT EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_khach_hang = kh.id_khach_hang AND tk.id_vai_tro NOT IN ('VT-KH', 'VT-5'))";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                if (rs.next()) {
                    System.out.println("REAL_CUSTOMER_COUNT:" + rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
