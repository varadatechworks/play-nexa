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
