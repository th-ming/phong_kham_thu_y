package com.rexi.pkty.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActionAuthFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void nonAdminCannotRunDeleteAction() throws Exception {
        ActionAuthFilter filter = filterWithPolicy(Map.of(
            "admin", List.of("CLICK", "FILL", "SELECT", "TOGGLE", "DELETE"),
            "tiep_tan", List.of("CLICK", "FILL", "SELECT", "TOGGLE")
        ));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "le_tan",
            "n/a",
            List.of(new SimpleGrantedAuthority("ROLE_TIEP_TAN"))
        ));

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/lich-hen");
        request.addHeader("X-AI-ACTION", "DELETE:LH-001");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainReached = new AtomicBoolean(false);

        filter.doFilter(request, response, chainThatMarks(chainReached));

        assertEquals(403, response.getStatus());
        assertFalse(chainReached.get());
        assertTrue(response.getContentAsString().contains("DELETE"));
    }

    @Test
    void adminCanRunDeleteAction() throws Exception {
        ActionAuthFilter filter = filterWithPolicy(Map.of(
            "admin", List.of("CLICK", "FILL", "SELECT", "TOGGLE", "DELETE")
        ));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "admin",
            "n/a",
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        ));

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/lich-hen");
        request.addHeader("X-AI-ACTION", "DELETE:LH-001");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainReached = new AtomicBoolean(false);

        filter.doFilter(request, response, chainThatMarks(chainReached));

        assertEquals(200, response.getStatus());
        assertTrue(chainReached.get());
    }

    private ActionAuthFilter filterWithPolicy(Map<String, List<String>> policy) {
        ActionAuthFilter filter = new ActionAuthFilter();
        ReflectionTestUtils.setField(filter, "policy", policy);
        return filter;
    }

    private FilterChain chainThatMarks(AtomicBoolean chainReached) {
        return (request, response) -> chainReached.set(true);
    }
}
