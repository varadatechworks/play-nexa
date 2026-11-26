package com.jnapanam.sportszone.tenancy;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TenantMembershipInviteRequest(
        @NotBlank @Email String email,
        @NotNull TenantMembershipRole role,
        @NotNull TenantMembershipStatus status) {
}
