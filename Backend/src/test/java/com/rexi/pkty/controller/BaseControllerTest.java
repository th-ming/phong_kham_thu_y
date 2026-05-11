package com.rexi.pkty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.repository.*;
import com.rexi.pkty.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
public abstract class BaseControllerTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    // MOCK TOÀN BỘ 17 REPOSITORY CỦA HỆ THỐNG
    @MockBean protected ThuCungRepository thuCungRepository;
    @MockBean protected LichHenRepository lichHenRepository;
    @MockBean protected NhanVienRepository nhanVienRepository;
    @MockBean protected TaiKhoanRepository taiKhoanRepository;
    @MockBean protected DichVuRepository dichVuRepository;
    @MockBean protected KhachHangRepository khachHangRepository;
    @MockBean protected LichLamViecNhanVienRepository lichLamViecRepository;
    @MockBean protected FileDinhKemRepository fileDinhKemRepository;
    @MockBean protected LichSuTuVanRepository lichSuTuVanRepository;
    @MockBean protected HoSoBenhAnRepository hoSoBenhAnRepository;
    @MockBean protected HoaDonRepository hoaDonRepository;
    @MockBean protected ThuocRepository thuocRepository;
    @MockBean protected LoThuocRepository loThuocRepository;
    @MockBean protected TiemChungRepository tiemChungRepository;
    @MockBean protected GiaoDichKhoRepository giaoDichKhoRepository;
    @MockBean protected NhaCungCapRepository nhaCungCapRepository;
    @MockBean protected VaiTroHeThongRepository vaiTroHeThongRepository;

    // MOCK CÁC SERVICE QUAN TRỌNG
    @MockBean protected AuditLogService auditLogService;
    @MockBean protected EmailService emailService;
    @MockBean protected AiMemoryService aiMemoryService;
    @MockBean protected PasswordEncoder passwordEncoder;
    @MockBean protected JdbcTemplate jdbcTemplate;
}
