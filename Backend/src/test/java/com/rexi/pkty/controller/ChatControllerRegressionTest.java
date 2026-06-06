package com.rexi.pkty.controller;

import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.service.GeminiService;
import com.rexi.pkty.service.GroqService;
import com.rexi.pkty.service.OpenRouterService;
import com.rexi.pkty.service.ReActAgentService;
import com.rexi.pkty.service.AgentResponseCache;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatControllerRegressionTest extends BaseControllerTest {

    @MockBean private GeminiService geminiService;
    @MockBean private GroqService groqService;
    @MockBean private OpenRouterService openRouterService;
    @MockBean private ReActAgentService reActAgentService;
    @MockBean private AgentResponseCache agentResponseCache;

    @Test
    void heatstrokeEmergencyBypassesLongMessageGuardAndAiProviders() throws Exception {
        String longNoise = " mô tả thêm".repeat(140);
        ChatMessage message = new ChatMessage(
                "user",
                "Chó nhà tôi bị sốc nhiệt say nắng, thở gấp, nóng quá, phải làm gì ngay?" + longNoise,
                null,
                null
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(message))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_triage"))
                .andExpect(jsonPath("$.triage.category").value("heatstroke"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Sốc nhiệt/Say nắng")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("KHÔNG dùng nước đá")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("0353.374.156")));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void videoTimeoutReturnsSafeVideoFallbackWithoutTextOnlyFallback() throws Exception {
        when(geminiService.chat(anyList())).thenThrow(new RuntimeException("request timed out"));
        ChatMessage message = new ChatMessage(
                "user",
                "Xem giúp video dáng đi của bé có bất thường không",
                null,
                List.of("data:video/mp4;base64,AAAA")
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("chưa phân tích được video")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("phản hồi quá lâu")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("tránh nhận định bịa")))
                .andExpect(jsonPath("$.errorCode").doesNotExist());

        verify(geminiService).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "khach_genz", roles = "CUSTOMER")
    void genZSensitiveDataSlangRoutesToReActAgentWithoutAiChatProviders() throws Exception {
        when(reActAgentService.run(eq("check bill của bé Mực giùm tui với"), eq("khach_genz"), eq("khach_hang")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Đã chuyển Agent kiểm tra quyền và tra hóa đơn.",
                        List.of(new ReActAgentService.ReActStep("FINAL", "ok", null, null, null)),
                        "Mock"
                ));

        ChatMessage message = new ChatMessage(
                "user",
                "check bill của bé Mực giùm tui với",
                null,
                null
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("react_agent_auto"))
                .andExpect(jsonPath("$.provider").value("Mock"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("kiểm tra quyền")));

        verify(reActAgentService).run(eq("check bill của bé Mực giùm tui với"), eq("khach_genz"), eq("khach_hang"));
        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "khach_genz", roles = "CUSTOMER")
    void genZSensitiveProfileAndPhoneSlangRoutesToReActAgent() throws Exception {
        when(reActAgentService.run(eq("info acc tui với, sđt khách còn đúng khum?"), eq("khach_genz"), eq("khach_hang")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Agent cần kiểm tra quyền trước khi trả dữ liệu cá nhân.",
                        List.of(),
                        "Mock"
                ));

        ChatMessage message = new ChatMessage(
                "user",
                "info acc tui với, sđt khách còn đúng khum?",
                null,
                null
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(message))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("react_agent_auto"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("kiểm tra quyền")));

        verify(reActAgentService).run(eq("info acc tui với, sđt khách còn đúng khum?"), eq("khach_genz"), eq("khach_hang"));
        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void todayCustomerTrendStatsRoutesToReActAgentWithoutChatAiProviders() throws Exception {
        String query = "Kiểm tra số khách hàng mới và xu hướng hôm nay";
        when(reActAgentService.run(eq(query), eq("admin"), eq("admin")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Rexi tra dữ liệu hệ thống ngày 2026-06-04:\n- Số khách hàng mới hôm nay: 0 khách hàng.\n- Xu hướng hôm nay: chưa có dữ liệu để tính tỷ lệ.",
                        List.of(new ReActAgentService.ReActStep("TOOL", "stats", "thong_ke_khach_hang_hom_nay", Map.of(), "ok")),
                        "System"
                ));

        ChatMessage message = new ChatMessage("user", query, null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("react_agent_auto"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Rexi tra dữ liệu hệ thống")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("15 khách hàng"))))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("60%"))));

        verify(reActAgentService).run(eq(query), eq("admin"), eq("admin"));
        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminStandardChatDoesNotFallBackToCustomerPetScopeForOffTopicText() throws Exception {
        when(groqService.chat(anyList())).thenReturn("Tôi không thể tiếp tục cuộc trò chuyện này. Nếu bạn cần hỗ trợ về chăm sóc thú cưng hoặc có câu hỏi khác, tôi sẵn sàng giúp đỡ. Bạn có muốn hỏi về một vấn đề cụ thể về thú cưng không?");

        ChatMessage message = new ChatMessage("user", "Bị thương nặng, trong khi về đến căn cứ, hắn nhất định sẽ kể chuyện này lên cấp trên.", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Quản trị viên nội bộ")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("chăm sóc thú cưng"))));

        verify(groqService).chat(anyList());
        verify(geminiService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void allInternalRolesDoNotFallBackToCustomerPetScope() throws Exception {
        when(groqService.chat(anyList())).thenReturn("Tôi không thể tiếp tục cuộc trò chuyện này. Nếu bạn cần hỗ trợ về chăm sóc thú cưng hoặc có câu hỏi khác, tôi sẵn sàng giúp đỡ. Bạn có muốn hỏi về một vấn đề cụ thể về thú cưng không?");

        String[][] roles = {
                {"bac_si_user", "BAC_SI", "Bác sĩ"},
                {"y_ta_user", "Y_TA", "Y tá"},
                {"ke_toan_user", "KE_TOAN", "Kế toán"},
                {"tiep_tan_user", "TIEP_TAN", "Tiếp tân"},
                {"quan_ly_user", "QUAN_LY", "Quản lý"}
        };

        try {
            for (String[] role : roles) {
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                        role[0],
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_" + role[1]))
                ));
                ChatMessage message = new ChatMessage("user", "Viết lại câu này cho đúng văn phong nội bộ.", null, null);

                mockMvc.perform(post("/api/chat")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString(role[2] + " nội bộ")))
                        .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("chăm sóc thú cưng"))))
                        .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("khách hàng/chủ nuôi"))));
            }
        } finally {
            SecurityContextHolder.clearContext();
        }

        verify(groqService, times(roles.length)).chat(anyList());
        verify(geminiService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void unsupportedSystemLookupClaimIsBlockedForNormalChatRoute() throws Exception {
        when(groqService.chat(anyList())).thenReturn("Rexi kiểm tra dữ liệu hệ thống: hôm nay có 15 khách hàng mới và 60% thú cưng bị ốm.");

        ChatMessage message = new ChatMessage("user", "nói một câu chào nội bộ ngắn", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("chưa kiểm tra dữ liệu hệ thống")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("15 khách"))))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("60%"))));

        verify(groqService).chat(anyList());
        verify(geminiService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void noisyGenZCatEyeComplaintReturnsLocalVetAdviceWithoutAiProviders() throws Exception {
        ChatMessage message = new ChatMessage(
                "user",
                "ui thui chít con mèo nhà tôi nó lổ đom đóm mắt r",
                null,
                null
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(message))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("mắt")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("không nhỏ thuốc người")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("khám thú y trong ngày")));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(groqService, never()).parseIntentJson(anyString());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void prescriptionAndAntibioticDoseRequestIsBlockedLocally() throws Exception {
        ChatMessage message = new ChatMessage(
                "user",
                "hay ke don va lieu dung khang sinh cho meo bi viem da",
                null,
                null
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("không thể kê đơn")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("kháng sinh")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("không tự dùng thuốc người")));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(groqService, never()).parseIntentJson(anyString());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void oneWordChickenQuestionAsksClarificationWithoutAiProviders() throws Exception {
        ChatMessage message = new ChatMessage("user", "gà", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_clarification"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("gà/gia cầm")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("nói rõ")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Không liên quan"))));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(groqService, never()).parseIntentJson(anyString());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void everydayClinicIntroDoesNotFallIntoWebSourceGate() throws Exception {
        ChatMessage message = new ChatMessage("user", "phòng khám mình có gì hay không", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_everyday"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("khám chó mèo")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("DuckDuckGo"))));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void everydayRewriteRequestReturnsPolishedSentenceLocally() throws Exception {
        ChatMessage message = new ChatMessage("user", "viết lại câu này lịch sự hơn: khách bảo mai qua", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_everyday"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("ghé phòng khám vào ngày mai")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("kiểm tra thông tin"))));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void newKittenCareIsNotConfusedWithMotherCatAfterBirth() throws Exception {
        ChatMessage message = new ChatMessage("user", "nuôi mèo con mới về cần chuẩn bị gì", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Mèo con mới về")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("mèo mẹ mới đẻ"))));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void appointmentServiceChoiceGetsHelpfulLocalAdvice() throws Exception {
        ChatMessage message = new ChatMessage("user", "tôi muốn đặt lịch nhưng chưa biết chọn dịch vụ nào", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_everyday"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Khám tổng quát")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("chó/mèo")));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void casualThanksWithParticleStaysWarmAndLocal() throws Exception {
        ChatMessage message = new ChatMessage("user", "cảm ơn nha", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_everyday"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Không có gì")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Rexi")));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void quickSuggestionVetVisitWarningAnswersLocallyWithoutDuckDuckGoGate() throws Exception {
        ChatMessage message = new ChatMessage("user", "Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("khó thở")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("0353.374.156")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("DuckDuckGo"))));

        verify(geminiService, never()).chat(anyList());
        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void postVisitCareSuggestionAnswersLocally() throws Exception {
        ChatMessage message = new ChatMessage("user", "Sau khi bé vừa khám xong cần chăm sóc theo dõi thế nào?", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("24-48 giờ")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("DuckDuckGo"))));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void poisoningFirstAidSuggestionAnswersLocally() throws Exception {
        ChatMessage message = new ChatMessage("user", "Cách sơ cứu mèo bị ngộ độc thực phẩm?", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("không tự gây nôn")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("0353.374.156")));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void diazepamDoseRequestIsBlockedLocally() throws Exception {
        ChatMessage message = new ChatMessage("user", "Cần chuẩn bị liều lượng Diazepam cấp cứu thế nào?", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("local_vet"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("không thể kê đơn")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("DuckDuckGo"))));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    void doctorInfoQuestionUsesFastDbInsteadOfMedicalWebGate() throws Exception {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(Map.of(
                "ho_ten", "Nguyễn A",
                "chuyen_mon", "Bác sĩ thú y",
                "gioi_thieu", "Khám tổng quát"
        )));
        ChatMessage message = new ChatMessage("user", "Cho tôi biết thông tin bác sĩ của phòng khám", null, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(message)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("fast_db"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("BS. Nguyễn A")))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("DuckDuckGo"))));

        verify(groqService, never()).chat(anyList());
        verify(openRouterService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void openInvoicePageRoutesToAgent() throws Exception {
        String query = "Mở trang hóa đơn chưa thanh toán giúp tôi";
        when(reActAgentService.run(eq(query), eq("admin"), eq("admin")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Đã mở trang hóa đơn và áp bộ lọc chưa thanh toán.",
                        List.of(),
                        "System"
                ));

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(new ChatMessage("user", query, null, null))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("react_agent_auto"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("Đã mở trang hóa đơn")));

        verify(reActAgentService).run(eq(query), eq("admin"), eq("admin"));
        verify(groqService, never()).chat(anyList());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void serviceRevenueQuestionRoutesToAgent() throws Exception {
        String query = "Dịch vụ nào đang được đặt nhiều và tạo doanh thu tốt?";
        when(reActAgentService.run(eq(query), eq("admin"), eq("admin")))
                .thenReturn(new ReActAgentService.ReActResult(
                        "Agent đã đọc dữ liệu thật và tổng hợp dịch vụ theo lịch hẹn/doanh thu.",
                        List.of(),
                        "System"
                ));

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("history", List.of(new ChatMessage("user", query, null, null))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("react_agent_auto"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("dữ liệu thật")));

        verify(reActAgentService).run(eq(query), eq("admin"), eq("admin"));
        verify(groqService, never()).chat(anyList());
    }
}
