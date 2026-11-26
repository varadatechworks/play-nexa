package com.jnapanam.sportszone.tenancy;

import java.util.UUID;

public record TenantContext(UUID tenantId, String slug, String displayName, String hostingMode) {
    public TenantContext {
        if (tenantId == null) throw new IllegalArgumentException("tenantId is required");
        if (slug == null || slug.isBlank()) throw new IllegalArgumentException("tenant slug is required");
        if (hostingMode == null || hostingMode.isBlank()) throw new IllegalArgumentException("hostingMode is required");
    }
}
