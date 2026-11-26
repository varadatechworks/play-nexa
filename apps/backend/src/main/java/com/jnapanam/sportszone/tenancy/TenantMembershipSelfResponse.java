package com.jnapanam.sportszone.tenancy;

import java.util.UUID;

public record TenantMembershipSelfResponse(UUID tenantId, String role, String membershipStatus) {
}
