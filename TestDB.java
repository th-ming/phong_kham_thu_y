package com.rexi.pkty;
import java.sql.*;
public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:sqlserver://localhost:1433;databaseName=PhongKhamThuY;encrypt=true;trustServerCertificate=true", "rexi_user", "RexiUser@123");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM VaiTroHeThong");
            while(rs.next()) {
                System.out.println(rs.getString("id_vai_tro") + " - " + rs.getString("ten_vai_tro"));
            }
        } catch(Exception e) { e.printStackTrace(); }
    }
}
