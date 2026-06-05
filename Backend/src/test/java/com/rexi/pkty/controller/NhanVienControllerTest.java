package com.rexi.pkty.controller;

import com.rexi.pkty.entity.NhanVien;
import com.rexi.pkty.entity.LichLamViecNhanVien;
import com.rexi.pkty.entity.TaiKhoan;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(NhanVienController.class)
@AutoConfigureMockMvc(addFilters = false)
public class NhanVienControllerTest extends BaseControllerTest {

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testThemNhanVien_Success() throws Exception {
        NhanVien nhanVien = new NhanVien();
        nhanVien.setHo_ten("Bac si Rexi Test");
        nhanVien.setEmail("rexi.test@gmail.com");

        when(nhanVienRepository.save(any(NhanVien.class))).thenReturn(nhanVien);
        when(taiKhoanRepository.save(any())).thenReturn(new com.rexi.pkty.entity.TaiKhoan());
        // Mock JdbcTemplate tranh NPE queryForObject count
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), (Object) any())).thenReturn(0);

        mockMvc.perform(post("/api/nhan-vien")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nhanVien)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ho_ten").value("Bac si Rexi Test"));
        
        System.out.println("--- TEST THEM NHAN VIEN: OK! ---");
    }

    @Test
    @WithMockUser(username = "bacsi4", roles = {"BAC_SI"})
    public void testNhanVienDangKyCa_BiChanKhiDaCoToiDa3BacSi() throws Exception {
        TaiKhoan currentAccount = new TaiKhoan();
        currentAccount.setTen_dang_nhap("bacsi4");
        currentAccount.setId_nhan_vien("BS-004");
        currentAccount.setId_vai_tro("VT-BS");

        LichLamViecNhanVien lich = new LichLamViecNhanVien();
        lich.setId_nhan_vien("BS-004");
        lich.setNgay_lam(LocalDate.now().plusWeeks(2));
        lich.setGio_bat_dau(LocalTime.of(9, 0));

        when(taiKhoanRepository.findByTenDangNhap("bacsi4")).thenReturn(Optional.of(currentAccount));
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class)))
                .thenReturn(1, 0, 3);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class)))
                .thenReturn("VT-BS");

        mockMvc.perform(post("/api/nhan-vien/lich-lam-viec")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(lich)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("tối đa 3 bác sĩ")));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminThemVaXoaCaCuaNhanVienKhac() throws Exception {
        assertManagerCanAddAndDeleteOtherStaffShift("admin", "VT-ADMIN");
    }

    @Test
    @WithMockUser(username = "quanly", roles = {"QUAN_LY"})
    public void testQuanLyThemVaXoaCaCuaNhanVienKhac() throws Exception {
        assertManagerCanAddAndDeleteOtherStaffShift("quanly", "VT-QL");
    }

    @Test
    @WithMockUser(username = "quanly", roles = {"QUAN_LY"})
    public void testQuanLySuaCaCuaNhanVienKhacBangXoaRoiThem() throws Exception {
        TaiKhoan managerAccount = new TaiKhoan();
        managerAccount.setTen_dang_nhap("quanly");
        managerAccount.setId_nhan_vien("QL-001");
        managerAccount.setId_vai_tro("VT-QL");

        LichLamViecNhanVien oldShift = new LichLamViecNhanVien();
        oldShift.setId_lich_lam_viec(99L);
        oldShift.setId_nhan_vien("BS-OTHER");
        oldShift.setNgay_lam(LocalDate.now());
        oldShift.setGio_bat_dau(LocalTime.of(9, 0));
        oldShift.setGio_ket_thuc(LocalTime.of(10, 0));

        LichLamViecNhanVien newShift = new LichLamViecNhanVien();
        newShift.setId_nhan_vien("BS-OTHER");
        newShift.setNgay_lam(LocalDate.now().plusDays(1));
        newShift.setGio_bat_dau(LocalTime.of(10, 0));
        newShift.setGio_ket_thuc(LocalTime.of(11, 0));

        LichLamViecNhanVien savedShift = new LichLamViecNhanVien();
        savedShift.setId_lich_lam_viec(100L);
        savedShift.setId_nhan_vien("BS-OTHER");
        savedShift.setNgay_lam(newShift.getNgay_lam());
        savedShift.setGio_bat_dau(newShift.getGio_bat_dau());
        savedShift.setGio_ket_thuc(newShift.getGio_ket_thuc());

        when(taiKhoanRepository.findByTenDangNhap("quanly")).thenReturn(Optional.of(managerAccount));
        when(lichLamViecRepository.findById(99L)).thenReturn(Optional.of(oldShift));
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class)))
                .thenReturn(1, 0);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class)))
                .thenReturn("VT-BS");
        when(lichLamViecRepository.save(any(LichLamViecNhanVien.class))).thenReturn(savedShift);

        mockMvc.perform(delete("/api/nhan-vien/lich-lam-viec/99")
                .with(csrf()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/nhan-vien/lich-lam-viec")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newShift)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_nhan_vien").value("BS-OTHER"));
    }

    private void assertManagerCanAddAndDeleteOtherStaffShift(String username, String roleId) throws Exception {
        TaiKhoan managerAccount = new TaiKhoan();
        managerAccount.setTen_dang_nhap(username);
        managerAccount.setId_nhan_vien(username.equals("admin") ? "NV-ADMIN" : "QL-001");
        managerAccount.setId_vai_tro(roleId);

        LichLamViecNhanVien shift = new LichLamViecNhanVien();
        shift.setId_nhan_vien("BS-OTHER");
        shift.setNgay_lam(LocalDate.now());
        shift.setGio_bat_dau(LocalTime.of(9, 0));
        shift.setGio_ket_thuc(LocalTime.of(10, 0));

        LichLamViecNhanVien savedShift = new LichLamViecNhanVien();
        savedShift.setId_lich_lam_viec(88L);
        savedShift.setId_nhan_vien("BS-OTHER");
        savedShift.setNgay_lam(shift.getNgay_lam());
        savedShift.setGio_bat_dau(shift.getGio_bat_dau());
        savedShift.setGio_ket_thuc(shift.getGio_ket_thuc());

        when(taiKhoanRepository.findByTenDangNhap(username)).thenReturn(Optional.of(managerAccount));
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class)))
                .thenReturn(1, 0);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(Object[].class)))
                .thenReturn("VT-BS");
        when(lichLamViecRepository.save(any(LichLamViecNhanVien.class))).thenReturn(savedShift);
        when(lichLamViecRepository.findById(88L)).thenReturn(Optional.of(savedShift));
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of());

        mockMvc.perform(post("/api/nhan-vien/lich-lam-viec")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shift)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_nhan_vien").value("BS-OTHER"));

        mockMvc.perform(delete("/api/nhan-vien/lich-lam-viec/88")
                .with(csrf()))
                .andExpect(status().isOk());
    }
}
