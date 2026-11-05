package com.jnapanam.sportszone.arena;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Dedicated-instance branding contract. No tenant ID is accepted from callers.
 * SaaS needs a verified-host registry and strict DB scoping before activation.
 */
@RestController
@RequestMapping("/api/v1/public/arena-branding")
public class PublicArenaBrandingController {
    private final Environment environment;

    public PublicArenaBrandingController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping
    public Map<String, Object> getBranding() {
        String hostingMode = property("PLAYNEXA_HOSTING_MODE", "dedicated");
        if (!"dedicated".equalsIgnoreCase(hostingMode)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Shared tenant hosting is not configured");
        }

        List<String> sports = Arrays.stream(property("ARENA_SPORTS", "Swimming,Cricket,Badminton").split(","))
                .map(String::trim).filter(value -> !value.isEmpty()).distinct().toList();
        return Map.of(
                "name", property("ARENA_NAME", "PlayNexa Sports Arena"),
                "city", property("ARENA_CITY", "Bengaluru"),
                "tagline", property("ARENA_TAGLINE", "Play • Train • Compete"),
                "shortName", property("ARENA_SHORT_NAME", "PlayNexa"),
                "primaryColor", safeColor(property("ARENA_PRIMARY_COLOR", "#113e54"), "#113e54"),
                "accentColor", safeColor(property("ARENA_ACCENT_COLOR", "#efa948"), "#efa948"),
                "logoUrl", safeAsset(property("ARENA_LOGO_URL", "")),
                "heroImageUrl", safeAsset(property("ARENA_HERO_IMAGE_URL", "")),
                "sports", sports
        );
    }

    private String property(String name, String fallback) {
        String value = environment.getProperty(name, fallback);
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String safeColor(String value, String fallback) {
        return value.matches("#[a-fA-F0-9]{6}") ? value : fallback;
    }

    private String safeAsset(String value) {
        return value.startsWith("https://") || value.startsWith("/")
                && !value.startsWith("//") ? value : "";
    }
}
