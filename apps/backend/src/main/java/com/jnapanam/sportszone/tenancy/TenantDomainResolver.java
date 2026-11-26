package com.jnapanam.sportszone.tenancy;

import java.net.IDN;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class TenantDomainResolver {
    private final JdbcTemplate jdbc;

    public TenantDomainResolver(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Optional<TenantContext> resolve(String rawHost) {
        String hostname = normalizeHostname(rawHost);
        if (hostname == null) return Optional.empty();
        List<TenantContext> matches = jdbc.query("""
                select t.id,t.slug,t.display_name,t.hosting_mode
                from playnexa_tenant_domains d
                join playnexa_tenants t on t.id=d.tenant_id
                join playnexa_tenant_subscriptions s on s.tenant_id=t.id
                where d.hostname=? and d.verification_status='VERIFIED'
                  and t.lifecycle_status='ACTIVE'
                  and t.hosting_mode='MULTI_TENANT_SAAS'
                  and s.subscription_status in ('TRIAL','ACTIVE')
                  and (s.current_period_end is null or s.current_period_end>now())
                  and (s.subscription_status<>'TRIAL' or s.trial_ends_at>now())
                """, (rs, row) -> new TenantContext(
                rs.getObject("id", UUID.class), rs.getString("slug"),
                rs.getString("display_name"), rs.getString("hosting_mode")), hostname);
        return matches.stream().findFirst();
    }

    public Optional<TenantContext> resolveConfiguredTenant(String rawTenantId, String hostingMode) {
        if (rawTenantId == null || rawTenantId.isBlank()) return Optional.empty();
        UUID tenantId;
        try { tenantId = UUID.fromString(rawTenantId.trim()); }
        catch (IllegalArgumentException ex) { return Optional.empty(); }
        String dbMode = databaseHostingMode(hostingMode);
        if (dbMode == null || "MULTI_TENANT_SAAS".equals(dbMode)) return Optional.empty();
        List<TenantContext> matches = jdbc.query("""
                select id,slug,display_name,hosting_mode
                from playnexa_tenants
                where id=? and lifecycle_status='ACTIVE' and hosting_mode=?
                """, (rs, row) -> new TenantContext(
                rs.getObject("id", UUID.class), rs.getString("slug"),
                rs.getString("display_name"), rs.getString("hosting_mode")), tenantId, dbMode);
        return matches.stream().findFirst();
    }

    static String normalizeHostname(String rawHost) {
        if (rawHost == null || rawHost.isBlank()) return null;
        String host = rawHost.trim();
        if (host.startsWith("[")) return null; // IPv6 literals are not tenant domains.
        int colon = host.indexOf(':');
        if (colon >= 0) {
            if (host.indexOf(':', colon + 1) >= 0) return null;
            String port = host.substring(colon + 1);
            if (!port.matches("[0-9]{1,5}")) return null;
            try {
                int portNumber = Integer.parseInt(port);
                if (portNumber < 1 || portNumber > 65535) return null;
            } catch (NumberFormatException ex) {
                return null;
            }
            host = host.substring(0, colon);
        }
        if (host.endsWith(".")) host = host.substring(0, host.length() - 1);
        if (host.isBlank() || host.contains("/") || host.contains("@")) return null;
        try {
            String ascii = IDN.toASCII(host, IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
            if (ascii.length() > 253 || ascii.equals("localhost") || ascii.matches("[0-9.]+")) return null;
            return ascii;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    static String databaseHostingMode(String hostingMode) {
        if (hostingMode == null) return null;
        return switch (hostingMode.trim().toLowerCase(Locale.ROOT)) {
            case "customer-hosted" -> "CUSTOMER_HOSTED";
            case "playnexa-managed-single-tenant", "dedicated" -> "PLAYNEXA_MANAGED_SINGLE_TENANT";
            default -> null;
        };
    }
}
