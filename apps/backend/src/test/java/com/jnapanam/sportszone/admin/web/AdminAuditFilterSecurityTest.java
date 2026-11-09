package com.jnapanam.sportszone.admin.web;

import com.jnapanam.sportszone.admin.model.AuditLog;
import com.jnapanam.sportszone.admin.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminAuditFilterSecurityTest {
  @Test void auditPathMasksUuidAndEmailAddresses(){
    var path=AdminAuditFilter.safePath("/api/v1/bookings/7c8b5d46-79a6-4a31-ae6f-707969ac12e6/guest/abc@example.com");
    assertFalse(path.contains("7c8b5d46"));
    assertFalse(path.contains("abc@example.com"));
    assertTrue(path.contains("{id}"));
  }
  @Test void spoofedForwardedIpDoesNotBecomeAuditIdentity() throws Exception {
    AuditLogRepository logs=mock(AuditLogRepository.class);
    MockHttpServletRequest req=new MockHttpServletRequest("POST","/api/v1/bookings");
    req.setRemoteAddr("192.0.2.12");
    req.addHeader("X-Forwarded-For","203.0.113.44");
    MockHttpServletResponse res=new MockHttpServletResponse();
    new AdminAuditFilter(logs).doFilterInternal(req,res,(a,b)->{
      ((jakarta.servlet.http.HttpServletResponse)b).setStatus(201);
    });
    ArgumentCaptor<AuditLog> captured=ArgumentCaptor.forClass(AuditLog.class);
    verify(logs).save(captured.capture());
    assertEquals("192.0.2.12",captured.getValue().getRemoteAddress());
  }
  @Test void untrustedCorrelationHeaderIsReplaced() throws Exception {
    AuditLogRepository logs=mock(AuditLogRepository.class);
    MockHttpServletRequest req=new MockHttpServletRequest("POST","/api/v1/bookings");
    req.addHeader("X-Correlation-ID","\r\nX-Fake: attack");
    MockHttpServletResponse res=new MockHttpServletResponse();
    new AdminAuditFilter(logs).doFilterInternal(req,res,(a,b)->{
      ((jakarta.servlet.http.HttpServletResponse)b).setStatus(201);
    });
    assertTrue(res.getHeader("X-Correlation-ID").matches("[a-f0-9-]{36}"));
  }
}
