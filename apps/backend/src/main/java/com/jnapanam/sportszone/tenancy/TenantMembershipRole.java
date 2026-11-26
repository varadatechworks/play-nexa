package com.jnapanam.sportszone.tenancy;

/** Roles assignable by a tenant OWNER/ADMIN. OWNER is bootstrap-only and cannot be reassigned here. */
public enum TenantMembershipRole {
    ADMIN, OPERATOR, COACH, ORGANIZER, SHOPKEEPER, CUSTOMER
}
