package com.rexi.pkty.integration;

import com.rexi.pkty.entity.KhachHang;
import com.rexi.pkty.entity.ThuCung;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.repository.ThuCungRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test tích hợp tầng Repository với H2 Database thật.
 * Xác minh dữ liệu được lưu đúng và truy vấn ra đúng — bắt lỗi ánh xạ Entity thực tế.
 * Không dùng Controller/HTTP để tránh SQL Server-specific syntax trong JdbcTemplate.
 */
@DataJpaTest
@ActiveProfiles("test")
public class HeThongIntegrationTest {

    @Autowired
    private ThuCungRepository thuCungRepository;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Test
    public void testLuuVaLayThuCung_DatabaseThuc() {
        // BƯỚC 0: Tạo Khách hàng trước (tránh lỗi khóa ngoại)
        KhachHang kh = new KhachHang();
        kh.setId_khach_hang("KH-TEST-001");
        kh.setTen_khach_hang("Chu Nhan Test");
        khachHangRepository.save(kh);

        // BƯỚC 1: Thêm Thú cưng thật vào H2 Database
        ThuCung thuCung = new ThuCung();
        thuCung.setId_thu_cung("TC-TEST-001");
        thuCung.setTen_thu_cung("Gau Map");
        thuCung.setLoai("Cho");
        thuCung.setId_khach_hang("KH-TEST-001");
        thuCungRepository.save(thuCung);

        // BƯỚC 2: Truy vấn từ DB ra — xác minh dữ liệu không bị mất/sai
        List<java.util.Map<String, Object>> ds = thuCungRepository.findByKhachHang("KH-TEST-001");
        assertFalse(ds.isEmpty(), "Dữ liệu phải được lưu vào Database!");
        assertEquals("Gau Map", ds.get(0).get("ten_thu_cung"), "Tên thú cưng phải khớp!");
        assertEquals("Cho", ds.get(0).get("loai"), "Loài phải khớp!");

        System.out.println("--- TEST TICH HOP DATABASE (H2 REPOSITORY): THANH CONG! ---");
    }

    @Test
    public void testXoaMemThuCung() {
        // Chuẩn bị dữ liệu
        KhachHang kh = new KhachHang();
        kh.setId_khach_hang("KH-TEST-002");
        kh.setTen_khach_hang("Chu Nhan Xoa Test");
        khachHangRepository.save(kh);

        ThuCung tc = new ThuCung();
        tc.setId_thu_cung("TC-TEST-002");
        tc.setTen_thu_cung("Meo Beo");
        tc.setLoai("Meo");
        tc.setId_khach_hang("KH-TEST-002");
        tc.setDa_xoa(false);
        thuCungRepository.save(tc);

        // Thực hiện xóa mềm
        ThuCung loaded = thuCungRepository.findById("TC-TEST-002").orElseThrow();
        loaded.setDa_xoa(true);
        thuCungRepository.save(loaded);

        // Xác minh cờ da_xoa được lưu đúng
        ThuCung afterDelete = thuCungRepository.findById("TC-TEST-002").orElseThrow();
        assertTrue(afterDelete.getDa_xoa(), "Cờ da_xoa phải là true sau khi xóa mềm!");

        System.out.println("--- TEST XOA MEM (H2 REPOSITORY): THANH CONG! ---");
    }
}
