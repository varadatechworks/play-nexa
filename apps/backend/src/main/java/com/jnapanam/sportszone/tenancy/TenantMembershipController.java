package com.jnapanam.sportszone.tenancy;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/tenant-memberships")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class TenantMembershipController {
    private final TenantMembershipService service;

    public TenantMembershipController(TenantMembershipService service) {
        this.service = service;
    }

    @GetMapping
    public List<TenantMembershipResponse> list(Authentication authentication) {
        return service.list(user(authentication));
    }

    @PostMapping
    public TenantMembershipResponse addByEmail(Authentication authentication,
            @Valid @RequestBody TenantMembershipInviteRequest request) {
        return service.addByEmail(user(authentication), request);
    }

    @PutMapping("/{userId}")
    public TenantMembershipResponse upsert(Authentication authentication, @PathVariable UUID userId,
            @Valid @RequestBody TenantMembershipUpdateRequest request) {
        return service.upsert(user(authentication), userId, request);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(Authentication authentication, @PathVariable UUID userId) {
        service.revoke(user(authentication), userId);
    }

    private static UUID user(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
