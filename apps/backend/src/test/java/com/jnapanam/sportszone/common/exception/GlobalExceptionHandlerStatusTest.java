package com.jnapanam.sportszone.common.exception;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

class GlobalExceptionHandlerStatusTest {
  private final GlobalExceptionHandler handler=new GlobalExceptionHandler();

  private static class Dummy { @SuppressWarnings("unused") void accept(Object request){} }

  @Test void validationIncludesReferenceCodeAndNoStore() throws Exception {
    var req=new org.springframework.mock.web.MockHttpServletRequest("POST","/api/v1/bookings");
    req.setAttribute("jnapanam.correlationId","trace-20261110");
    org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
        new org.springframework.web.context.request.ServletRequestAttributes(req));
    try {
      var binding=new org.springframework.validation.MapBindingResult(
          new java.util.HashMap<String,Object>(),"form");
      binding.rejectValue("name","required","Required");
      var method=new org.springframework.core.MethodParameter(
          Dummy.class.getDeclaredMethod("accept",Object.class),0);
      var response=handler.validation(new org.springframework.web.bind.MethodArgumentNotValidException(method,binding));
      assertEquals(400,response.getStatusCode().value());
      assertEquals("INVALID_REQUEST",response.getBody().getProperties().get("code"));
      assertEquals("trace-20261110",response.getBody().getProperties().get("requestId"));
      assertEquals("no-store",response.getHeaders().getFirst("Cache-Control"));
    } finally {
      org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    }
  }

  @Test void missingParameterIsBadRequest() throws Exception {
    var result=handler.missingParameter(
      new MissingServletRequestParameterException("date","String"));
    assertEquals(HttpStatus.BAD_REQUEST,result.getStatusCode());
    assertEquals("INVALID_REQUEST",result.getBody().getProperties().get("code"));
  }
  @Test void unsupportedHttpMethodIs405() {
    var result=handler.wrongMethod(new HttpRequestMethodNotSupportedException("TRACE"));
    assertEquals(HttpStatus.METHOD_NOT_ALLOWED,result.getStatusCode());
    assertEquals("no-store",result.getHeaders().getFirst("Cache-Control"));
  }
  @Test void unsupportedContentTypeIs415() {
    var result=handler.wrongContentType(new HttpMediaTypeNotSupportedException("unsupported"));
    assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE,result.getStatusCode());
  }
  @Test void oversizedUploadGets413WithoutInternalDetails() {
    var result=handler.oversizedFile(new MaxUploadSizeExceededException(100));
    assertEquals(HttpStatus.PAYLOAD_TOO_LARGE,result.getStatusCode());
    assertFalse(result.getBody().getDetail().contains("Exception"));
  }
}
