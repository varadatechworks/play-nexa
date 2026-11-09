package com.jnapanam.sportszone.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerSafeMessagesTest {
    private final GlobalExceptionHandler advice=new GlobalExceptionHandler();
    @Test void unexpectedErrorDoesNotRevealCredentials(){
        var result=advice.unexpected(new IllegalStateException("password=SECRET SQL failure"));
        assertEquals(500,result.getStatusCode().value());
        assertFalse(result.getBody().getDetail().contains("SECRET"));
        assertEquals("SERVER_ERROR",result.getBody().getProperties().get("code"));
    }
    @Test void mfaChallengeRemainsDistinctFromSessionExpiry(){
        var result=advice.mfaChallenge(new MfaChallengeRequiredException());
        assertEquals(401,result.getStatusCode().value());
        assertTrue(result.getBody().getDetail().contains("MFA code sent"));
    }
    @Test void responseReasonCannotExposeSecrets(){
        var result=advice.status(new ResponseStatusException(HttpStatus.BAD_REQUEST,"password secret"));
        assertEquals(400,result.getStatusCode().value());
        assertFalse(result.getBody().getDetail().contains("password"));
    }
    @Test void referenceAndSafeErrorCategoryAreAssociatedWithRequest(){
        var request=new org.springframework.mock.web.MockHttpServletRequest("GET","/api/v1/bookings");
        request.setAttribute("jnapanam.correlationId","support-ref-1234");
        org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
                new org.springframework.web.context.request.ServletRequestAttributes(request));
        try{
            var result=advice.unexpected(new IllegalStateException("password=SECRET"));
            assertEquals("support-ref-1234",result.getBody().getProperties().get("requestId"));
            assertEquals("UNHANDLED_ILLEGALSTATEEXCEPTION",request.getAttribute("jnapanam.errorCode"));
            assertFalse(result.getBody().getDetail().contains("SECRET"));
        }finally{
            org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
        }
    }
    @Test void statusCodesStayMachineReadableAndVendorNeutral(){
        var conflict=advice.status(new ResponseStatusException(HttpStatus.CONFLICT,"Arena settings changed"));
        assertEquals(409,conflict.getStatusCode().value());
        assertEquals("CONFLICT",conflict.getBody().getProperties().get("code"));
        assertEquals("about:blank",conflict.getBody().getType().toString());
        assertEquals("no-store",conflict.getHeaders().getFirst("Cache-Control"));
        var missing=advice.status(new ResponseStatusException(HttpStatus.NOT_FOUND,"Arena not found"));
        assertEquals("NOT_FOUND",missing.getBody().getProperties().get("code"));
    }
    @Test void serverStatusReasonNeverExposesProviderOrDatabaseMessages(){
        var failure=advice.status(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "payment gateway user data unavailable"));
        assertEquals(503,failure.getStatusCode().value());
        assertEquals("SERVICE_UNAVAILABLE",failure.getBody().getProperties().get("code"));
        assertFalse(failure.getBody().getDetail().contains("payment gateway"));
        assertFalse(failure.getBody().getDetail().contains("user data"));
    }

}
