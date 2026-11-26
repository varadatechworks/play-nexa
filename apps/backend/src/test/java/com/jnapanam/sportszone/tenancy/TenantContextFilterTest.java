package com.jnapanam.sportszone.tenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class TenantContextFilterTest {
    @AfterEach void clearContext() { TenantContextHolder.clear(); }

    @Test
    void setsTenantContextOnlyForTheDurationOfTheRequest() throws Exception {
        UUID id = UUID.randomUUID();
        TenantContext context = new TenantContext(id, "arena-one", "Arena One", "CUSTOMER_HOSTED");
        TenantDomainResolver resolver = mock(TenantDomainResolver.class);
        when(resolver.resolveConfiguredTenant(id.toString(), "customer-hosted")).thenReturn(Optional.of(context));
        var env = new MockEnvironment().withProperty("PLAYNEXA_TENANT_CONTEXT_ENABLED", "true")
                .withProperty("PLAYNEXA_HOSTING_MODE", "customer-hosted")
                .withProperty("PLAYNEXA_TENANT_ID", id.toString());
        var filter = new TenantContextFilter(env, resolver);
        var request = new MockHttpServletRequest("GET", "/api/v1/bookings");
        request.addHeader("X-Tenant-ID", UUID.randomUUID().toString()); // Never trust client-supplied tenant selection.
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> assertThat(TenantContextHolder.get()).isEqualTo(context));

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(TenantContextHolder.get()).isNull();
        verify(resolver).resolveConfiguredTenant(id.toString(), "customer-hosted");
    }

    @Test
    void sharedSaasIsBlockedWhenTheEnvironmentGateIsClosed() throws Exception {
        TenantDomainResolver resolver = mock(TenantDomainResolver.class);
        var env = new MockEnvironment().withProperty("PLAYNEXA_TENANT_CONTEXT_ENABLED", "true")
                .withProperty("PLAYNEXA_HOSTING_MODE", "saas")
                .withProperty("PLAYNEXA_SHARED_SAAS_READY", "false");
        var filter = new TenantContextFilter(env, resolver);
        var response = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/bookings"), response, (req, res) -> fail("must not continue"));
        assertThat(response.getStatus()).isEqualTo(503);
        verifyNoInteractions(resolver);
    }

    @Test
    void sharedSaasCannotBeEnabledByEnvironmentFlagAlone() throws Exception {
        TenantDomainResolver resolver = mock(TenantDomainResolver.class);
        var env = new MockEnvironment().withProperty("PLAYNEXA_TENANT_CONTEXT_ENABLED", "true")
                .withProperty("PLAYNEXA_HOSTING_MODE", "multi-tenant-saas")
                .withProperty("PLAYNEXA_SHARED_SAAS_READY", "true");
        var filter = new TenantContextFilter(env, resolver);
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/bookings"), response,
                (req, res) -> fail("environment flag must not enable shared SaaS"));

        assertThat(response.getStatus()).isEqualTo(503);
        verifyNoInteractions(resolver);
    }

    @Test
    void healthChecksDoNotRequireTenantContext() throws Exception {
        TenantDomainResolver resolver = mock(TenantDomainResolver.class);
        var env = new MockEnvironment().withProperty("PLAYNEXA_TENANT_CONTEXT_ENABLED", "true")
                .withProperty("PLAYNEXA_HOSTING_MODE", "customer-hosted");
        var filter = new TenantContextFilter(env, resolver);
        var response = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/actuator/health"), response, (req, res) -> {});
        assertThat(response.getStatus()).isEqualTo(200);
        verifyNoInteractions(resolver);
    }
}
