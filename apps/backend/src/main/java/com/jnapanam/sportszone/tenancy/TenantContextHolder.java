package com.jnapanam.sportszone.tenancy;

public final class TenantContextHolder {
    private static final ThreadLocal<TenantContext> CURRENT = new ThreadLocal<>();

    private TenantContextHolder() {}

    public static TenantContext get() { return CURRENT.get(); }

    public static void set(TenantContext context) {
        if (context == null) throw new IllegalArgumentException("Tenant context cannot be null");
        CURRENT.set(context);
    }

    public static void clear() { CURRENT.remove(); }
}
