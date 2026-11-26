package com.jnapanam.sportszone.tenancy;

import java.util.UUID;

public record TenantMembershipResponse(
        UUID userId,
        String fullName,
        String email,
        String role,
        String membershipStatus) {
}
