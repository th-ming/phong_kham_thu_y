package com.rexi.pkty;
import java.sql.*;

public class SoiCotDB {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://localhost:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true";
        String user = "rexi_user";
        String pass = "RexiUser@123";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("--- SOI TÊN CỘT DATABASE THỰC TẾ ---");
            
            String[] tables = {"DichVu", "NhanVien", "TaiKhoan", "ThuCung"};
            for (String table : tables) {
                System.out.println("\n[BẢNG: " + table + "]");
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT TOP 0 * FROM " + table)) {
                    ResultSetMetaData rsmd = rs.getMetaData();
                    int columnCount = rsmd.getColumnCount();
                    for (int i = 1; i <= columnCount; i++) {
                        System.out.println("- Cột " + i + ": " + rsmd.getColumnName(i));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi soi DB: " + e.getMessage());
        }
    }
}
