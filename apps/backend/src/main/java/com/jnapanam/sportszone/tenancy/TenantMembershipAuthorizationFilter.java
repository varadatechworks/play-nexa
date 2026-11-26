package com.jnapanam.sportszone.tenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

public class TenantMembershipAuthorizationFilter extends OncePerRequestFilter {
    private static final Set<String> TENANT_AUTHORITIES = Set.of(
            "ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_OPERATIONS", "ROLE_COACH", "ROLE_ORGANIZER", "ROLE_SHOP_KEEPER", "ROLE_CUSTOMER");
    private final JdbcTemplate jdbc;

    public TenantMembershipAuthorizationFilter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean safeRead = "GET".equalsIgnoreCase(request.getMethod())
                || "HEAD".equalsIgnoreCase(request.getMethod());
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.startsWith("/api/v1/auth/") || path.startsWith("/api/v1/public/")
                || path.startsWith("/actuator/")
                || (safeRead && (path.equals("/api/v1/commerce/settings")
                        || path.equals("/api/v1/commerce/categories")
                        || path.startsWith("/api/v1/commerce/products")
                        || path.equals("/api/v1/subscriptions/offerings")
                        || path.equals("/api/v1/subscriptions/config")))) {
            chain.doFilter(request, response);
            return;
        }
        TenantContext tenant = TenantContextHolder.get();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (tenant == null || authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            chain.doFilter(request, response);
            return;
        }

        boolean platformAdmin = hasAuthority(authentication, "ROLE_SUPER_ADMIN");
        if (platformAdmin) {
            chain.doFilter(request, response);
            return;
        }

        UUID userId;
        try { userId = UUID.fromString(authentication.getName()); }
        catch (IllegalArgumentException ex) {
            deny(response);
            return;
        }

        String membershipRole = activeRole(tenant.tenantId(), userId);
        if (membershipRole == null && hasAuthority(authentication, "ROLE_CUSTOMER")) {
            jdbc.update("""
                    insert into playnexa_tenant_memberships(id,tenant_id,user_id,role,membership_status)
                    values(?,?,?,'CUSTOMER','ACTIVE')
                    on conflict (tenant_id,user_id) do nothing
                    """, UUID.randomUUID(), tenant.tenantId(), userId);
            membershipRole = activeRole(tenant.tenantId(), userId);
        }
        String scopedRole = authorityFor(membershipRole);
        if (scopedRole == null) {
            deny(response);
            return;
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (!TENANT_AUTHORITIES.contains(authority.getAuthority())) authorities.add(authority);
        }
        authorities.add(new SimpleGrantedAuthority(scopedRole));
        Authentication scoped = authentication instanceof JwtAuthenticationToken jwt
                ? new JwtAuthenticationToken(jwt.getToken(), authorities, authentication.getName())
                : new UsernamePasswordAuthenticationToken(authentication.getPrincipal(), null, authorities);
        SecurityContextHolder.getContext().setAuthentication(scoped);
        chain.doFilter(request, response);
    }

    private String activeRole(UUID tenantId, UUID userId) {
        try {
            return jdbc.queryForObject("""
                    select role from playnexa_tenant_memberships
                    where tenant_id=? and user_id=? and membership_status='ACTIVE'
                    """, String.class, tenantId, userId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private static String authorityFor(String role) {
        if (role == null) return null;
        return switch (role) {
            case "OWNER", "ADMIN" -> "ROLE_ADMIN";
            case "OPERATOR" -> "ROLE_OPERATIONS";
            case "ORGANIZER" -> "ROLE_ORGANIZER";
            case "COACH" -> "ROLE_COACH";
            case "SHOPKEEPER" -> "ROLE_SHOP_KEEPER";
            case "CUSTOMER" -> "ROLE_CUSTOMER";
            default -> null;
        };
    }

    private static boolean hasAuthority(Authentication authentication, String expected) {
        return authentication.getAuthorities().stream().anyMatch(a -> expected.equals(a.getAuthority()));
    }

    private static void deny(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write("{\"code\":\"TENANT_MEMBERSHIP_REQUIRED\",\"message\":\"An active membership is required for this arena.\"}");
    }
}
