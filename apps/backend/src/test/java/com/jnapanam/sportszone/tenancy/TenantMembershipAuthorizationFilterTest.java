package com.jnapanam.sportszone.tenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class TenantMembershipAuthorizationFilterTest {
    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private JdbcTemplate jdbc;
    private TenantMembershipAuthorizationFilter filter;

    @BeforeEach void setUp() {
        TenantContextHolder.set(new TenantContext(tenantId, "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        SecurityContextHolder.clearContext();
        jdbc = mock(JdbcTemplate.class);
        filter = new TenantMembershipAuthorizationFilter(jdbc);
    }

    @AfterEach void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void tenantMembershipReplacesGlobalAdminRoleWithScopedOperatorRole() throws Exception {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(userId))).thenReturn("OPERATOR");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"),
                new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/admin/commerce/orders"),
                response, new MockFilterChain());

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().map(a -> a.getAuthority()).toList();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(authorities).contains("ROLE_OPERATOR").doesNotContain("ROLE_ADMIN", "ROLE_CUSTOMER");
    }

    @Test
    void customerIsAddedToTenantOnFirstAuthenticatedVisit() throws Exception {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(userId)))
                .thenThrow(new EmptyResultDataAccessException(1)).thenReturn("CUSTOMER");
        when(jdbc.update(anyString(), any(UUID.class), eq(tenantId), eq(userId))).thenReturn(1);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/bookings/me"),
                response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority").contains("ROLE_CUSTOMER");
        verify(jdbc).update(contains("insert into playnexa_tenant_memberships"), any(UUID.class), eq(tenantId), eq(userId));
    }

    @Test
    void adminWithoutAnActiveTenantMembershipIsDenied() throws Exception {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(userId)))
                .thenThrow(new EmptyResultDataAccessException(1));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/admin"), response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
    }

    @Test
    void publicCatalogueRemainsAvailableToAuthenticatedUsersWithoutMembership() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/commerce/products"),
                response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        verifyNoInteractions(jdbc);
    }

    @Test
    void platformSuperAdminCanManageTenantWithoutARegularMembership() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
        var response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/platform/tenants"),
                response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        verifyNoInteractions(jdbc);
    }
}
