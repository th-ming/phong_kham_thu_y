package com.rexi.pkty.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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

    @Test
    void scheduleQuestions241To250UseDeterministicScheduleTools() throws Exception {
        ReActAgentService agent = new ReActAgentService();
        AiToolService toolService = mock(AiToolService.class);
        AiMemoryService memoryService = mock(AiMemoryService.class);
        GroqService groqService = mock(GroqService.class);
        GeminiService geminiService = mock(GeminiService.class);
        OpenRouterService openRouterService = mock(OpenRouterService.class);
        when(memoryService.getGlobalContext(anyString())).thenReturn("");
        when(memoryService.getUserContext(anyString())).thenReturn("");
        when(groqService.chat(anyList())).thenReturn("{\"final_answer\":\"ok\"}");
        when(geminiService.chat(anyList())).thenReturn("{\"final_answer\":\"ok\"}");
        when(openRouterService.chat(anyList())).thenReturn("{\"final_answer\":\"ok\"}");
        when(toolService.executeTool(anyString(), anyMap(), anyString(), anyString())).thenAnswer(invocation -> {
            String tool = invocation.getArgument(0, String.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> params = invocation.getArgument(1, Map.class);
            return switch (tool) {
                case "getStaffSchedule" -> "getStaffSchedule(" + params.get("staff") + ", " + params.get("week") + ") → 2026-06-08 09:00-12:00";
                case "getSlotUsage" -> "getSlotUsage(date=" + params.get("date") + ", time=" + params.get("time") + ") → 3 bác sĩ trực. Slot 9h đã full 3 BS.";
                case "findOverlapStaff" -> "findOverlapStaff(Minh,Hồng,next) → Thứ 3 09:00-12:00";
                case "checkConflict" -> "checkConflict → Slot 9h đã full 3 BS.";
                case "suggestSchedule" -> "suggestSchedule → 9h full. Ca trống gần nhất: 9h30, 14h. BS Lan rảnh 14h. Chốt 14h nhé?";
                case "tra_cuu_ma_nguon" -> "RAG mã nguồn động\nBackend/src/main/java/com/rexi/pkty/service/AiToolService.java\n- Dòng 52: if (count >= 3) return full";
                case "overrideDoctorSlot" -> "Đã override rule 3 BS. Slot 9h có 4 BS. Đã ghi log override.";
                case "findFreeStaff" -> "findFreeStaff roles=[accountant, reception] → rảnh: Kế toán An, Lễ tân Hoa.";
                case "autoSchedule" -> "autoSchedule(staff_count=5, avoid=surgery_overlap) → bảng phân ca + cảnh báo conflict.";
                default -> "unexpected tool " + tool;
            };
        });
        ReflectionTestUtils.setField(agent, "toolService", toolService);
        ReflectionTestUtils.setField(agent, "memoryService", memoryService);
        ReflectionTestUtils.setField(agent, "groqService", groqService);
        ReflectionTestUtils.setField(agent, "geminiService", geminiService);
        ReflectionTestUtils.setField(agent, "openRouterService", openRouterService);

        var q241 = agent.run("bác sĩ Minh tuần này đã đăng ký những lịch làm nào", "admin", "ADMIN");
        assertTrue(q241.steps().stream().anyMatch(step -> "getStaffSchedule".equals(step.toolName())));
        assertTrue(q241.finalAnswer().contains("getStaffSchedule"));

        var q242 = agent.run("9h sáng mai đã có mấy bác sĩ trực rồi", "admin", "ADMIN");
        assertTrue(q242.steps().stream().anyMatch(step -> "getSlotUsage".equals(step.toolName())));
        assertTrue(q242.finalAnswer().contains("full 3 BS"));

        var q243 = agent.run("bác sĩ Minh với bác sĩ Hồng ca nào trùng nhau tuần sau", "admin", "ADMIN");
        assertTrue(q243.steps().stream().anyMatch(step -> "findOverlapStaff".equals(step.toolName())));

        var q244 = agent.run("giúp tôi xem phân bổ thêm bác sĩ Lan vào ca nào cho hợp lý, 9h đã full 3 BS rồi", "admin", "ADMIN");
        assertTrue(q244.steps().stream().anyMatch(step -> "checkConflict".equals(step.toolName())));
        assertTrue(q244.steps().stream().anyMatch(step -> "suggestSchedule".equals(step.toolName())));
        assertTrue(q244.finalAnswer().contains("14h"));

        var q245 = agent.run("điều hướng vào trang xếp lịch rồi xem y tá Mai tuần này trực ca nào", "admin", "ADMIN");
        assertTrue(q245.finalAnswer().contains("[NAVIGATE:/quan-ly/lich-lam-viec]"));
        assertTrue(q245.steps().stream().anyMatch(step -> "getStaffSchedule".equals(step.toolName())));

        var q246Admin = agent.run("code check slot tối đa 3 bác sĩ nằm file nào", "admin", "ADMIN");
        assertTrue(q246Admin.steps().stream().anyMatch(step -> "tra_cuu_ma_nguon".equals(step.toolName())));
        assertTrue(q246Admin.finalAnswer().contains("AiToolService.java"));

        var q246Doctor = agent.run("code check slot tối đa 3 bác sĩ nằm file nào", "bs_minh", "BAC_SI");
        assertTrue(q246Doctor.finalAnswer().contains("chỉ dành cho Admin") || q246Doctor.finalAnswer().contains("Liên hệ IT"));

        var q247 = agent.run("tôi là BS Minh, cho tôi thêm ca 9h sáng mai", "bs_minh", "BAC_SI");
        assertTrue(q247.steps().stream().anyMatch(step -> "checkConflict".equals(step.toolName())));
        assertTrue(q247.finalAnswer().contains("Liên hệ quản lý"));

        var q248 = agent.run("tôi là quản lý, ép thêm BS Minh vào 9h sáng mai dù đã 3 BS", "manager", "QUAN_LY");
        assertTrue(q248.steps().stream().anyMatch(step -> "overrideDoctorSlot".equals(step.toolName())));
        assertTrue(q248.finalAnswer().contains("override rule 3 BS"));

        var q249 = agent.run("kế toán với lễ tân ai rảnh chiều thứ 4 tuần sau để họp", "manager", "QUAN_LY");
        assertTrue(q249.steps().stream().anyMatch(step -> "findFreeStaff".equals(step.toolName())));
        assertTrue(q249.finalAnswer().contains("Kế toán"));

        var q250 = agent.run("AI tự xếp lịch tối ưu cho 5 BS tuần sau, tránh trùng ca mổ", "manager", "QUAN_LY");
        assertTrue(q250.steps().stream().anyMatch(step -> "autoSchedule".equals(step.toolName())));
        assertTrue(q250.finalAnswer().contains("cảnh báo conflict"));

        verify(toolService).executeTool(eq("overrideDoctorSlot"), anyMap(), eq("QUAN_LY"), eq("manager"));
    }
}
