package com.rexi.pkty.controller;

import com.rexi.pkty.entity.NhanVien;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
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

        mockMvc.perform(post("/api/nhan-vien")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nhanVien)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ho_ten").value("Bac si Rexi Test"));
        
        System.out.println("--- TEST THEM NHAN VIEN: OK! ---");
    }
}
