import java.sql.*;

public class CheckLogs {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://localhost:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true";
        try (Connection conn = DriverManager.getConnection(url, "sa", "123456")) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT TOP 5 * FROM NhatKyHeThong ORDER BY ngay_tao DESC");
            System.out.println("--- LAST 5 LOGS ---");
            while (rs.next()) {
                System.out.println(rs.getTimestamp("ngay_tao") + " | " + rs.getString("hanh_dong") + " | " + rs.getString("bang_du_lieu") + " | " + rs.getString("chi_tiet"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
