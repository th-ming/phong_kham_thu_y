package com.rexi.pkty.service;

import com.rexi.pkty.security.RoleAccessPolicy;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiToolServiceSourceIndexTest {

    private final AiToolService service = new AiToolService();

    @Test
    void sourceIndexToolIsAdminOnly() {
        assertTrue(RoleAccessPolicy.canUseAgentTool("ADMIN", "tra_cuu_ma_nguon"));
        assertFalse(RoleAccessPolicy.canUseAgentTool("QUAN_LY", "tra_cuu_ma_nguon"));
        assertFalse(RoleAccessPolicy.canUseAgentTool("KHACH_HANG", "tra_cuu_ma_nguon"));

        String managerReply = service.executeTool("tra_cuu_ma_nguon", Map.of("tu_khoa", "agent model"), "QUAN_LY");
        assertTrue(managerReply.contains("không có quyền"));
    }

    @Test
    void mapsChatbotVoiceQuestionToFrontendChatbotFiles() {
        String reply = service.executeTool("tra_cuu_ma_nguon", Map.of("tu_khoa", "mic opera chatbot nhận giọng nói"), "ADMIN");
        assertTrue(reply.contains("chatbot_voice_ui"));
        assertTrue(reply.contains("Frontend/src/components/ChatBot.tsx"));
        assertFalse(reply.contains("sk-"));
        assertFalse(reply.toLowerCase().contains("bearer "));
    }

    @Test
    void mapsAgentModelQuestionToReactAgentAndProviders() {
        String reply = service.executeTool("tra_cuu_ma_nguon", Map.of("tu_khoa", "agent đang dùng model provider groq openrouter"), "ADMIN");
        assertTrue(reply.contains("react_agent_core") || reply.contains("ai_provider_config"));
        assertTrue(reply.contains("ReActAgentService.java"));
        assertTrue(reply.contains("OpenRouter") || reply.contains("GroqService.java"));
    }

    @Test
    void mapsPermissionQuestionToSecurityPolicyFiles() {
        String reply = service.executeTool("tra_cuu_ma_nguon", Map.of("tu_khoa", "phân quyền tool admin quản lý khách hàng"), "ADMIN");
        assertTrue(reply.contains("permissions_security"));
        assertTrue(reply.contains("RoleAccessPolicy.java"));
        assertTrue(reply.contains("agentPermissions.ts"));
    }

    @Test
    void mapsBookingQuestionToAppointmentTools() {
        String reply = service.executeTool("tra_cuu_ma_nguon", Map.of("tu_khoa", "đặt lịch tìm lịch trống bác sĩ dịch vụ"), "ADMIN");
        assertTrue(reply.contains("appointment_booking"));
        assertTrue(reply.contains("tim_lich_trong"));
        assertTrue(reply.contains("dat_lich_hen"));
    }
}
