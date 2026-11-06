package com.jnapanam.sportszone.arena;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class PublicArenaBrandingControllerTest {
    private JdbcTemplate emptyDatabase() {
        JdbcTemplate jdbc=mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString())).thenReturn(List.of());
        return jdbc;
    }

    @Test
    void servesConfiguredBrandAndDeduplicatedSports() {
        var env=new MockEnvironment()
                .withProperty("ARENA_NAME","Victory Sports")
                .withProperty("ARENA_CITY","Bengaluru")
                .withProperty("ARENA_SPORTS","Badminton,Cricket,Badminton")
                .withProperty("ARENA_PRIMARY_COLOR","#123456");
        var controller=new PublicArenaBrandingController(new ArenaBrandingService(emptyDatabase(),env));
        var result=controller.getBranding();
        var brand=result.getBody();
        assertNotNull(brand);
        assertEquals(HttpStatus.OK,result.getStatusCode());
        assertEquals("Victory Sports",brand.name());
        assertEquals("Bengaluru",brand.city());
        assertEquals("#123456",brand.primaryColor());
        assertEquals(List.of("Badminton","Cricket"),brand.sports());
        assertEquals(0,brand.revision());
        assertNotNull(result.getHeaders().getCacheControl());
        assertTrue(result.getHeaders().getCacheControl().contains("no-store"));
        assertFalse(brand.toString().contains("RAZORPAY_KEY_SECRET"));
    }

    @Test
    void savedBrandOverridesEnvironment() {
        var jdbc=emptyDatabase();
        when(jdbc.queryForList(anyString())).thenReturn(List.of(Map.of(
                "name","Saved Arena","city","Mysuru","revision",2L,
                "primary_color","#345678","sports_csv","Football,Cricket")));
        var brand=new ArenaBrandingService(jdbc,
                new MockEnvironment().withProperty("ARENA_NAME","Fallback Arena")).current();
        assertEquals("Saved Arena",brand.name());
        assertEquals("Mysuru",brand.city());
        assertEquals(2L,brand.revision());
        assertEquals(List.of("Football","Cricket"),brand.sports());
        assertEquals("#345678",brand.primaryColor());
    }

    @Test
    void invalidAssetAndColourFallbackDoesNotLeak() {
        var env=new MockEnvironment()
                .withProperty("ARENA_LOGO_URL","javascript:alert(1)")
                .withProperty("ARENA_PRIMARY_COLOR","red")
                .withProperty("ARENA_HERO_IMAGE_URL","//evil.example");
        var brand=new ArenaBrandingService(emptyDatabase(),env).current();
        assertEquals("",brand.logoUrl());
        assertEquals("",brand.heroImageUrl());
        assertEquals("#113e54",brand.primaryColor());
    }

    @Test
    void sharedHostingFailsClosedEvenWithDatabase() {
        var env=new MockEnvironment().withProperty("PLAYNEXA_HOSTING_MODE","saas");
        var jdbc=emptyDatabase();
        var service=new ArenaBrandingService(jdbc,env);
        assertThrows(ResponseStatusException.class,service::current);
        assertThrows(ResponseStatusException.class,()->service.save(validUpdate(0),"admin"));
        verify(jdbc,never()).queryForList(anyString());
    }

    @Test
    void rejectsBadUploadsAndInvalidSportsBeforeSqlUpdate() {
        var service=new ArenaBrandingService(emptyDatabase(),new MockEnvironment());
        var invalid=new ArenaBrandingService.Update(0,"New Arena","Arena","City",
                "Tagline","Purpose","#123456","#ffffff","javascript:alert(1)","","","",
                List.of("Football"));
        var error=assertThrows(ResponseStatusException.class,()->service.save(invalid,"admin"));
        assertEquals(HttpStatus.BAD_REQUEST,error.getStatusCode());
        var sports=new ArenaBrandingService.Update(0,"New Arena","Arena","City",
                "Tagline","Purpose","#123456","#ffffff","","","","",List.of("Badminton","Badminton"));
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class,()->service.save(sports,"admin")).getStatusCode());
    }

    @Test
    void optimisticUpdateReturnsConflictInsteadOfLostBranding() {
        var jdbc=emptyDatabase();
        var service=new ArenaBrandingService(jdbc,new MockEnvironment());
        // A mock JDBC update returns zero rows: version was changed elsewhere.
        var error=assertThrows(ResponseStatusException.class,()->service.save(validUpdate(11),"admin"));
        assertEquals(HttpStatus.CONFLICT,error.getStatusCode());
    }

    private ArenaBrandingService.Update validUpdate(long revision) {
        return new ArenaBrandingService.Update(revision,"Victory Sports","Victory",
                "Bengaluru","Play together","Community sports","#123456","#fbbc20",
                "https://assets.example.com/logo.png","","","",List.of("Badminton","Cricket"));
    }
}
