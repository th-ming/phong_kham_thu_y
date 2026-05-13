package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichHen;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(LichHenController.class)
@AutoConfigureMockMvc(addFilters = false)
public class LichHenControllerTest extends BaseControllerTest {

    @Test
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    public void testDatLichHen_Success() throws Exception {
        LichHen lichHen = new LichHen();
        lichHen.setNgay_kham(LocalDate.now().plusDays(1));
        lichHen.setGio_kham(LocalTime.of(9, 0));
        lichHen.setLy_do("Kham dinh ky");
        lichHen.setId_khach_hang("KH-001");
        lichHen.setId_thu_cung("TC-001");
        lichHen.setId_bac_si("BS-001");
        lichHen.setId_dich_vu("DV-001");

        // Mock thời lượng dịch vụ: 30 phút
        // Ép kiểu (Object) any() để tránh tranh chấp với queryForList(String, Class, Object...)
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), (Object) any()))
                .thenReturn(30);

        // Mock ca trực của bác sĩ: Có ca lúc 09:00
        // Ép kiểu (Object) any() cho các tham số sau SQL để Java hiểu là dùng bản (String, Object...)
        when(jdbcTemplate.queryForList(anyString(), (Object) any(), (Object) any()))
                .thenReturn(List.of(Map.of("gio_bat_dau", Time.valueOf("09:00:00"))));

        // Mock lịch hẹn trùng: Trả về rỗng cho lần gọi thứ hai
        when(jdbcTemplate.queryForList(anyString(), (Object) any(), (Object) any()))
                .thenReturn(List.of(Map.of("gio_bat_dau", Time.valueOf("09:00:00"))), Collections.emptyList());

        when(lichHenRepository.save(any(LichHen.class))).thenReturn(lichHen);

        mockMvc.perform(post("/api/lich-hen")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(lichHen)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ly_do").value("Kham dinh ky"));
        
        System.out.println("--- TEST DAT LICH HEN (NO AMBIGUITY): OK! ---");
    }
}
