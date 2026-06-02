package com.rexi.pkty.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
