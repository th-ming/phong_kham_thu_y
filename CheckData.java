package com.rexi.pkty;
import java.sql.*;

public class CheckData {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://localhost:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true";
        String user = "rexi_user";
        String pass = "RexiUser@123";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("--- KẾT QUẢ QUÉT DỮ LIỆU THỰC TẾ ---");
            
            // Quét Bác sĩ
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT ho_ten, chuyen_mon FROM NhanVien WHERE id_vai_tro LIKE '%BS%' OR chuyen_mon IS NOT NULL")) {
                System.out.println("\n[DANH SÁCH BÁC SĨ]");
                boolean hasDoctor = false;
                while (rs.next()) {
                    hasDoctor = true;
                    System.out.println("- Bác sĩ: " + rs.getString("ho_ten") + " | Chuyên môn: " + rs.getString("chuyen_mon"));
                }
                if (!hasDoctor) System.out.println("(Trống trơn sếp ơi!)");
            }

            // Quét Dịch vụ
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT ten_dich_vu, gia_tien FROM DichVu WHERE da_xoa = 0")) {
                System.out.println("\n[DANH SÁCH DỊCH VỤ]");
                boolean hasService = false;
                while (rs.next()) {
                    hasService = true;
                    System.out.println("- Dịch vụ: " + rs.getString("ten_dich_vu") + " | Giá: " + rs.getDouble("gia_tien"));
                }
                if (!hasService) System.out.println("(Trống trơn sếp ơi!)");
            }
            
        } catch (Exception e) {
            System.err.println("Lỗi kết nối DB: " + e.getMessage());
        }
    }
}
