package com.rexi.pkty.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReActAgentServiceDeterministicTest {

    private final ReActAgentService service = new ReActAgentService();

    @Test
    void slangGreetingReturnsHelpfulAnswer() {
        var result = service.run("hí ờ lo bây bê bay hom nay help đc gì cho t nhỉ", "admin", "ADMIN");

        assertFalse(result.finalAnswer().isBlank());
        assertFalse(result.finalAnswer().equalsIgnoreCase("null"));
        assertTrue(result.finalAnswer().contains("Rexi"));
    }

    @Test
    void slangAppointmentNavigationReturnsNavigateTag() {
        var result = service.run("ê mở dùm t cái trang lịch hẹn coi hôm nay có gì", "admin", "ADMIN");

        assertTrue(result.finalAnswer().contains("[NAVIGATE:/quan-ly/lich-hen]"));
    }

    @Test
    void extractsOriginalIntentFromFrontendPageContextBeforeFastRules() {
        var result = service.run("""
                Yêu cầu người dùng: ê mở dùm t cái trang lịch hẹn coi hôm nay có gì
                Chỉ dẫn định danh và phong cách trả lời:
                Trang hiện tại: Dashboard (/quan-ly/dashboard)
                Bối cảnh giao diện hiện tại: button hóa đơn, button kho thuốc
                """, "admin", "ADMIN");

        assertFalse(result.finalAnswer().equalsIgnoreCase("null"));
        assertTrue(result.finalAnswer().contains("[NAVIGATE:/quan-ly/lich-hen]"));
    }

    @Test
    void slangPetSymptomUsesMedicalAdviceNotDatabaseTool() {
        var result = service.run("chóa nhà t cứ gãi bụng quài có ổn áp k", "admin", "ADMIN");

        assertFalse(result.finalAnswer().equalsIgnoreCase("null"));
        assertTrue(result.finalAnswer().contains("Gãi nhiều"));
        assertTrue(result.steps().stream().noneMatch(step -> "tim_thu_cung".equals(step.toolName())));
    }

    @Test
    void doctorAppointmentLookupDoesNotFallIntoMedicalAdvice() {
        var result = service.run("tìm cho tôi lịch khám của bác sĩ minh", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("biểu hiện bất thường"));
        assertFalse(result.finalAnswer().contains("Theo dõi nhịp thở"));
        assertTrue(result.finalAnswer().contains("truy vấn cơ sở dữ liệu lịch hẹn"));
    }

    @Test
    void doctorWorkloadStatsDoesNotTreatRankingPhraseAsDoctorName() {
        var result = service.run("bác sĩ nào đang có nhiều ca khám nhất", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("khớp 'nhieu ca nhat'"));
        assertFalse(result.finalAnswer().contains("Không tìm thấy lịch hẹn khám"));
        assertTrue(result.finalAnswer().contains("thống kê ca khám theo bác sĩ"));
    }

    @Test
    void todayCustomerTrendStatsNeverHallucinatesWhenToolUnavailable() {
        var result = service.run("Kiểm tra số khách hàng mới và xu hướng hôm nay", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("15 khách hàng"));
        assertFalse(result.finalAnswer().contains("60%"));
        assertTrue(result.finalAnswer().contains("không ước lượng số liệu"), result.finalAnswer());
    }

    @Test
    void modelFinalAnswerClaimingCompletedActionWithoutToolIsBlocked() throws Exception {
        ReActAgentService agent = new ReActAgentService();
        GroqService groq = mock(GroqService.class);
        GeminiService gemini = mock(GeminiService.class);
        OpenRouterService openRouter = mock(OpenRouterService.class);
        AiToolService toolService = mock(AiToolService.class);
        AiMemoryService memoryService = mock(AiMemoryService.class);

        when(groq.chat(anyList())).thenReturn("{\"final_answer\":\"Đã gửi email nhắc lịch cho khách Nguyễn A thành công.\"}");
        when(memoryService.getGlobalContext(anyString())).thenReturn("");
        when(memoryService.getUserContext(anyString())).thenReturn("");
        when(toolService.getToolsSchemaForRole(anyString())).thenReturn("");

        ReflectionTestUtils.setField(agent, "groqService", groq);
        ReflectionTestUtils.setField(agent, "geminiService", gemini);
        ReflectionTestUtils.setField(agent, "openRouterService", openRouter);
        ReflectionTestUtils.setField(agent, "toolService", toolService);
        ReflectionTestUtils.setField(agent, "memoryService", memoryService);

        var result = agent.run("nhắc lịch cho khách Nguyễn A", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("Đã gửi email"));
        assertTrue(result.finalAnswer().contains("chưa thực hiện thao tác nào"), result.finalAnswer());
        assertTrue(result.steps().stream().noneMatch(step -> "TOOL".equals(step.type())));
    }

    @Test
    void customerDoctorInfoQuestionAsksForPetOrAppointmentIdentifier() {
        var result = service.run("Cho tôi biết thông tin bác sĩ phụ trách khám cho thú cưng", "customer", "KHACH_HANG");

        assertFalse(result.finalAnswer().contains("data-ai-id"));
        assertFalse(result.finalAnswer().contains("button-"));
        assertTrue(result.finalAnswer().contains("tên thú cưng") || result.finalAnswer().contains("mã lịch hẹn"));
    }

    @Test
    void customerMedicalRecordNavigationReturnsCustomerRoute() {
        var result = service.run("Mở hồ sơ y tế thú cưng của tôi", "customer", "KHACH_HANG");

        assertTrue(result.finalAnswer().contains("[NAVIGATE:/khach-hang/ho-so-benh-an]"));
    }

    @Test
    void adminCodeLocationQuestionUsesSourceRagToolWithoutLlm() {
        ReActAgentService agent = new ReActAgentService();
        AiToolService toolService = mock(AiToolService.class);

        when(toolService.executeTool(anyString(), anyMap(), anyString(), anyString()))
                .thenReturn("RAG mã nguồn động\n1. Frontend/src/App.tsx\n- Dòng 194: <Route path=\"/quan-ly/hoa-don\" element={<QuanLyHoaDon />} />");
        ReflectionTestUtils.setField(agent, "toolService", toolService);

        var result = agent.run("trang hóa đơn admin ở file nào dòng code nào", "admin", "ADMIN");

        assertTrue(result.finalAnswer().contains("Frontend/src/App.tsx"), result.finalAnswer());
        assertTrue(result.finalAnswer().contains("Dòng 194"), result.finalAnswer());
        verify(toolService).executeTool(anyString(), anyMap(), anyString(), anyString());
        assertTrue(result.steps().stream().anyMatch(step -> "tra_cuu_ma_nguon".equals(step.toolName())));
    }

    @Test
    void customerWebResearchUsesToolPathInsteadOfPrintingToolCall() {
        var result = service.run("Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa", "customer", "KHACH_HANG");

        assertFalse(result.finalAnswer().contains("Tool:"));
        assertFalse(result.finalAnswer().contains("Params:"));
        assertTrue(result.finalAnswer().contains("tìm kiếm web") || result.finalAnswer().contains("tool hệ thống"));
    }

    @Test
    void customerOwnPetListQueryUsesOwnPetsDatabaseTool() {
        var result = service.run("tôi đang có những thú cưng nào", "customer", "KHACH_HANG");

        assertFalse(result.finalAnswer().contains("Bạn có muốn xem"));
        assertFalse(result.finalAnswer().contains("mở trang"));
        assertTrue(result.finalAnswer().contains("truy vấn cơ sở dữ liệu thú cưng"));
    }

    @Test
    void navigationToCustomerPageIsNotSensitiveDeleteCommand() {
        var result = service.run("chuyển trang khách hàng", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("CẢNH BÁO LỆNH NHẠY CẢM"));
        assertFalse(result.finalAnswer().contains("xóa/hủy dữ liệu quan trọng"));
        assertTrue(result.finalAnswer().contains("[NAVIGATE:/quan-ly/khach-hang-thu-cung]"));
    }

    @Test
    void adminApiDocumentationQuestionReturnsSwaggerLinks() {
        var result = service.run("trang xem api của toàn hệ thống là gì", "admin", "ADMIN");

        assertTrue(result.finalAnswer().contains("http://127.0.0.1:8081/swagger-ui/index.html"), result.finalAnswer());
        assertTrue(result.finalAnswer().contains("http://127.0.0.1:8081/v3/api-docs"), result.finalAnswer());
    }

    @Test
    void substringInsideNormalWordsDoesNotTriggerSensitiveDeleteCommand() {
        var result = service.run("xem thông tin khách hàng tên Huyền", "admin", "ADMIN");

        assertFalse(result.finalAnswer().contains("CẢNH BÁO LỆNH NHẠY CẢM"));
        assertFalse(result.finalAnswer().contains("xóa/hủy dữ liệu quan trọng"));
    }

    @Test
    void realCancelAppointmentStillTriggersSensitiveGate() {
        var result = service.run("hủy lịch hẹn LH-123 giúp tôi", "admin", "ADMIN");

        assertTrue(result.finalAnswer().contains("CẢNH BÁO LỆNH NHẠY CẢM"));
        assertTrue(result.finalAnswer().contains("xóa/hủy dữ liệu quan trọng"));
    }

    @Test
    void emergencyPetSymptomGetsUrgentAdvice() {
        var result = service.run("bé cún bị run run xong nằm im, cứu t", "admin", "ADMIN");

        assertTrue(result.finalAnswer().contains("khẩn cấp"));
        assertTrue(result.finalAnswer().contains("đưa bé đi khám ngay"));
    }

    @Test
    void vomitingAndNotEatingGetSpecificAdvice() {
        var vomiting = service.run("boss t ói 2 lần r có cần qua khám hong", "admin", "ADMIN");
        var notEating = service.run("miu nhà tui bỏ ăn từ sáng h phải làm j", "admin", "ADMIN");

        assertTrue(vomiting.finalAnswer().contains("nôn/bỏ ăn"));
        assertTrue(notEating.finalAnswer().contains("nôn/bỏ ăn"));
    }
}
