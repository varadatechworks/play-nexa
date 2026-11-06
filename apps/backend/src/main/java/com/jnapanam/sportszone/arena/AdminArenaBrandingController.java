package com.jnapanam.sportszone.arena;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/arena-branding")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
public class AdminArenaBrandingController {
    private final ArenaBrandingService branding;

    public AdminArenaBrandingController(ArenaBrandingService branding) { this.branding=branding; }

    @GetMapping
    public ArenaBrandingService.Branding get() { return branding.current(); }

    @PutMapping
    public ArenaBrandingService.Branding update(
            @RequestBody ArenaBrandingService.Update request,
            Authentication actor) {
        return branding.save(request, actor==null?"administrator":actor.getName());
    }
}
