package com.rexi.pkty.controller;

import com.rexi.pkty.entity.ThuCung;
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

@WebMvcTest(ThuCungController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ThuCungControllerTest extends BaseControllerTest {

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testThemThuCung_Success() throws Exception {
        ThuCung thuCung = new ThuCung();
        thuCung.setTen_thu_cung("Rexi Test");
        thuCung.setId_khach_hang("KH-001"); // Gán ID khách hàng để qua bước validation

        when(thuCungRepository.save(any(ThuCung.class))).thenReturn(thuCung);

        mockMvc.perform(post("/api/thu-cung")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(thuCung)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten_thu_cung").value("Rexi Test"));
        
        System.out.println("--- TEST THEM THU CUNG: OK! ---");
    }
}
