package com.jnapanam.sportszone.arena;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class SharedHostingSafetyGateFilterTest {
    private MockHttpServletResponse run(String mode,String path) throws Exception {
        var request=new MockHttpServletRequest("GET",path);
        var response=new MockHttpServletResponse();
        new SharedHostingSafetyGateFilter(new MockEnvironment()
                .withProperty("PLAYNEXA_HOSTING_MODE",mode))
                .doFilter(request,response,new MockFilterChain());
        return response;
    }

    @Test void saasBlocksLoginPublicBookingsPaymentsAndAdmin() throws Exception {
        for(var path:new String[]{
                "/api/v1/auth/login","/api/v1/public/sports","/api/v1/bookings",
                "/api/v1/payments","/api/v1/admin/arena-branding","/v3/api-docs"}) {
            assertEquals(503,run("saas",path).getStatus(),"Shared mode must block "+path);
        }
    }

    @Test void unknownModeAlsoFailsClosed() throws Exception {
        assertEquals(503,run("shared", "/api/v1/public/arena-branding").getStatus());
    }

    @Test void dedicatedAllowsApplicationRequests() throws Exception {
        assertEquals(200,run("dedicated","/api/v1/public/sports").getStatus());
    }

    @Test void healthRemainsAvailableForOperationalDiagnostics() throws Exception {
        assertEquals(200,run("saas","/actuator/health").getStatus());
        assertEquals(200,run("saas","/actuator/health/readiness").getStatus());
    }
}
