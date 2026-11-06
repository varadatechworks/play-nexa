package com.jnapanam.sportszone.arena;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Public, non-secret branding of the single dedicated arena in this database. */
@RestController
@RequestMapping("/api/v1/public/arena-branding")
public class PublicArenaBrandingController {
    private final ArenaBrandingService branding;

    public PublicArenaBrandingController(ArenaBrandingService branding) { this.branding=branding; }

    @GetMapping
    public ResponseEntity<ArenaBrandingService.Branding> getBranding() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(branding.current());
    }
}
