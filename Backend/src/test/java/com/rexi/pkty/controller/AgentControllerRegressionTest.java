package com.rexi.pkty.controller;

import com.rexi.pkty.entity.NhatKyChat;
import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.NhatKyChatRepository;
import com.rexi.pkty.service.AiToolService;
import com.rexi.pkty.service.GeminiService;
import com.rexi.pkty.service.ReActAgentService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AgentController.class)
@AutoConfigureMockMvc(addFilters = false)
class AgentControllerRegressionTest extends BaseControllerTest {

    @MockBean private ReActAgentService reActAgentService;
    @MockBean private AiToolService aiToolService;
    @MockBean private GeminiService geminiService;
    @MockBean private NhatKyChatRepository nhatKyChatRepository;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void reactAgentPersistsChatLog() throws Exception {
        TaiKhoan taiKhoan = new TaiKhoan();
        taiKhoan.setId_tai_khoan("TK-ADMIN");
        when(taiKhoanRepository.findByTenDangNhap("admin")).thenReturn(Optional.of(taiKhoan));
        when(reActAgentService.run(eq("ping"), eq("admin"), eq("ADMIN")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Rexi đã sẵn sàng.",
                        List.of(new ReActAgentService.ReActStep("FINAL", "Rexi đã sẵn sàng.", null, null, null)),
                        "System"
                ));

        mockMvc.perform(post("/api/agent/react")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("query", "ping"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.finalAnswer").value("Rexi đã sẵn sàng."))
                .andExpect(jsonPath("$.provider").value("System"));

        verify(nhatKyChatRepository).save(any(NhatKyChat.class));
    }
}
