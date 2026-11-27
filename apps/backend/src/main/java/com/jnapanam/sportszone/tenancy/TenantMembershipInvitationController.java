package com.jnapanam.sportszone.tenancy;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tenant-memberships/me")
public class TenantMembershipInvitationController {
    private final TenantMembershipService service;

    public TenantMembershipInvitationController(TenantMembershipService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public TenantMembershipSelfResponse current(Authentication authentication) {
        return service.current(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/accept")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(Authentication authentication) {
        service.acceptInvitation(UUID.fromString(authentication.getName()));
    }
}
