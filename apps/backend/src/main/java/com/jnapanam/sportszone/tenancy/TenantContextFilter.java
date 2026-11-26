package com.jnapanam.sportszone.tenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class TenantContextFilter extends OncePerRequestFilter {
    private final Environment environment;
    private final TenantDomainResolver resolver;

    public TenantContextFilter(Environment environment, TenantDomainResolver resolver) {
        this.environment = environment;
        this.resolver = resolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        if (!Boolean.parseBoolean(environment.getProperty("PLAYNEXA_TENANT_CONTEXT_ENABLED", "false"))) {
            chain.doFilter(request, response);
            return;
        }

        String mode = environment.getProperty("PLAYNEXA_HOSTING_MODE", "dedicated").trim().toLowerCase();
        Optional<TenantContext> resolved;
        if (mode.equals("saas") || mode.equals("multi-tenant-saas")) {
            if (!Boolean.parseBoolean(environment.getProperty("PLAYNEXA_SHARED_SAAS_READY", "false"))) {
                response.setHeader("Cache-Control", "no-store");
                response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                        "Shared SaaS is disabled until tenant data isolation is certified");
                return;
            }
            resolved = resolver.resolve(request.getServerName());
        } else {
            resolved = resolver.resolveConfiguredTenant(environment.getProperty("PLAYNEXA_TENANT_ID"), mode);
        }

        if (resolved.isEmpty()) {
            response.setHeader("Cache-Control", "no-store");
            response.sendError(mode.equals("saas") || mode.equals("multi-tenant-saas")
                    ? HttpServletResponse.SC_NOT_FOUND : HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                    "No active tenant is configured for this request");
            return;
        }

        TenantContextHolder.set(resolved.get());
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
