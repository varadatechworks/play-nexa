package com.jnapanam.sportszone.arena;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * This imported booking system is not yet multi-tenant. Fail closed for ALL
 * HTTP API routes when someone accidentally configures shared SaaS hosting,
 * including auth, public slots, checkout, refunds and admin endpoints.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SharedHostingSafetyGateFilter extends OncePerRequestFilter {
    private final Environment environment;

    public SharedHostingSafetyGateFilter(Environment environment) {
        this.environment=environment;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String hosting=environment.getProperty("PLAYNEXA_HOSTING_MODE","dedicated");
        if (!"dedicated".equalsIgnoreCase(hosting)) {
            // Only health endpoints may be queried by deployment infrastructure.
            // Unknown modes are disabled too, preventing accidental exposure.
            String path=request.getRequestURI();
            if (!path.equals("/actuator/health") && !path.startsWith("/actuator/health/")) {
                response.setHeader("Cache-Control","no-store");
                response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                        "Shared arena hosting is not yet available");
                return;
            }
        }
        chain.doFilter(request,response);
    }
}
