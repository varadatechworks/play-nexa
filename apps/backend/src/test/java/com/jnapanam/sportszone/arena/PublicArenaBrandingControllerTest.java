package com.jnapanam.sportszone.arena;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.server.ResponseStatusException;

class PublicArenaBrandingControllerTest {
    @Test
    void servesConfiguredArenaWithoutJnapanamBranding() {
        var environment = new MockEnvironment()
                .withProperty("ARENA_NAME", "Victory Sports")
                .withProperty("ARENA_CITY", "Bengaluru")
                .withProperty("ARENA_SPORTS", "Badminton,Cricket,Badminton")
                .withProperty("ARENA_PRIMARY_COLOR", "#123456");
        var brand = new PublicArenaBrandingController(environment).getBranding();
        assertEquals("Victory Sports", brand.get("name"));
        assertEquals("Bengaluru", brand.get("city"));
        assertEquals("#123456", brand.get("primaryColor"));
        assertEquals(List.of("Badminton", "Cricket"), brand.get("sports"));
        assertFalse(brand.toString().contains("RAZORPAY_KEY_SECRET"));
    }

    @Test
    void doesNotLeakUnsafeAssetsAndColours() {
        var environment = new MockEnvironment()
                .withProperty("ARENA_LOGO_URL", "javascript:alert(1)")
                .withProperty("ARENA_PRIMARY_COLOR", "red")
                .withProperty("ARENA_HERO_IMAGE_URL", "//evil.example");
        var brand = new PublicArenaBrandingController(environment).getBranding();
        assertEquals("", brand.get("logoUrl"));
        assertEquals("", brand.get("heroImageUrl"));
        assertEquals("#113e54", brand.get("primaryColor"));
    }

    @Test
    void sharedHostingFailsClosedUntilTenantImplementationExists() {
        var environment = new MockEnvironment().withProperty("PLAYNEXA_HOSTING_MODE", "saas");
        assertThrows(ResponseStatusException.class,
                () -> new PublicArenaBrandingController(environment).getBranding());
    }
}
