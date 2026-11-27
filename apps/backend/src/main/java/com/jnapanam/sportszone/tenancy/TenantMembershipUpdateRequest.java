package com.jnapanam.sportszone.tenancy;

import jakarta.validation.constraints.NotNull;

public record TenantMembershipUpdateRequest(
        @NotNull TenantMembershipRole role,
        @NotNull TenantMembershipStatus status) {
}
