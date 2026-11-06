package com.jnapanam.sportszone.arena;

import java.net.URI;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Dedicated instance settings. One database, one arena. This is NOT SaaS tenancy.
 * Does not accept a client-provided arena ID; a shared database is not safe yet.
 */
@Service
public class ArenaBrandingService {
    private static final Pattern COLOR = Pattern.compile("#[0-9a-fA-F]{6}");
    private static final Pattern PHONE = Pattern.compile("[+0-9 ()-]{0,30}");
    private static final String QUERY = """
            SELECT name,short_name,city,tagline,purpose,primary_color,accent_color,
                   logo_url,hero_image_url,hero_video_url,phone,sports_csv,revision
              FROM arena_branding_settings WHERE id=1
            """;
    private final JdbcTemplate jdbc;
    private final Environment env;

    public ArenaBrandingService(JdbcTemplate jdbc, Environment env) {
        this.jdbc = jdbc;
        this.env = env;
    }

    public record Branding(String name, String shortName, String city, String tagline,
            String purpose, String primaryColor, String accentColor, String logoUrl,
            String heroImageUrl, String heroVideoUrl, String phone, List<String> sports,
            long revision) {}

    public record Update(long revision, String name, String shortName, String city,
            String tagline, String purpose, String primaryColor, String accentColor,
            String logoUrl, String heroImageUrl, String heroVideoUrl, String phone,
            List<String> sports) {}

    private void requireDedicated() {
        if (!"dedicated".equalsIgnoreCase(env.getProperty("PLAYNEXA_HOSTING_MODE","dedicated"))) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Shared hosting requires verified tenant isolation");
        }
    }

    private String fallback(String key,String defaultValue) {
        String value=env.getProperty(key,defaultValue);
        return value==null || value.isBlank()?defaultValue:value.trim();
    }

    private static String read(Map<String,Object> row,String column,String def) {
        Object value=row.get(column);
        return value==null?def:value.toString();
    }

    private static String color(String supplied,String otherwise) {
        return supplied!=null && COLOR.matcher(supplied).matches()?supplied.toLowerCase(Locale.ROOT):otherwise;
    }

    private static String asset(String input) {
        if (input==null || input.isBlank()) return "";
        String value=input.trim();
        if (value.length()>2048 || value.contains("\\") || value.contains("\"")
                || value.contains("'") || value.matches(".*[\\p{Cntrl}].*")) return "";
        if (value.startsWith("/") && !value.startsWith("//") && !value.contains("..")) return value;
        try {
            URI uri=URI.create(value);
            if ("https".equalsIgnoreCase(uri.getScheme()) && uri.getHost()!=null
                    && uri.getRawUserInfo()==null && uri.getHost().contains(".")
                    && !uri.getHost().equalsIgnoreCase("localhost")) return value;
        } catch (IllegalArgumentException ignored) { /* invalid media URL */ }
        return "";
    }

    private static List<String> sports(String csv) {
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s->!s.isEmpty())
                .distinct().limit(30).toList();
    }

    public Branding current() {
        requireDedicated();
        List<Map<String,Object>> rows=jdbc.queryForList(QUERY);
        Map<String,Object> row=rows.isEmpty()?Map.of():rows.get(0);
        String csv=read(row,"sports_csv",fallback("ARENA_SPORTS","Swimming,Cricket,Badminton"));
        Object revision=row.get("revision");
        return new Branding(
                read(row,"name",fallback("ARENA_NAME","PlayNexa Sports Arena")),
                read(row,"short_name",fallback("ARENA_SHORT_NAME","PlayNexa")),
                read(row,"city",fallback("ARENA_CITY","Bengaluru")),
                read(row,"tagline",fallback("ARENA_TAGLINE","Play • Train • Compete")),
                read(row,"purpose",fallback("ARENA_PURPOSE","Building stronger communities through sport.")),
                color(read(row,"primary_color",fallback("ARENA_PRIMARY_COLOR","#113e54")),"#113e54"),
                color(read(row,"accent_color",fallback("ARENA_ACCENT_COLOR","#efa948")),"#efa948"),
                asset(read(row,"logo_url",fallback("ARENA_LOGO_URL",""))),
                asset(read(row,"hero_image_url",fallback("ARENA_HERO_IMAGE_URL",""))),
                asset(read(row,"hero_video_url",fallback("ARENA_HERO_VIDEO_URL",""))),
                read(row,"phone",fallback("ARENA_PHONE","")),
                sports(csv),
                revision instanceof Number n?n.longValue():0L);
    }

    private static String required(String s,String label,int max) {
        if (s==null || s.isBlank() || s.length()>max || s.matches(".*[\\p{Cntrl}].*"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid "+label);
        return s.trim();
    }

    private static String optional(String s,String label,int max) {
        if (s==null || s.isBlank()) return "";
        if (s.length()>max || s.matches(".*[\\p{Cntrl}].*"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid "+label);
        return s.trim();
    }

    private static String validatedColor(String s,String label) {
        if (s==null || !COLOR.matcher(s).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid "+label);
        return s.toLowerCase(Locale.ROOT);
    }

    private static String validatedAsset(String s,String label) {
        if (s==null || s.isBlank()) return "";
        String cleaned=asset(s);
        if (cleaned.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid "+label+" URL");
        return cleaned;
    }

    /** Optimistic version match prevents two admins overwriting each other's branding. */
    @Transactional
    public Branding save(Update update,String actor) {
        requireDedicated();
        if (update==null || update.revision()<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid revision");
        String name=required(update.name(),"arena name",90);
        String shortName=required(update.shortName(),"short name",40);
        String city=required(update.city(),"city",80);
        String tagline=required(update.tagline(),"tagline",150);
        String purpose=required(update.purpose(),"purpose",600);
        String primary=validatedColor(update.primaryColor(),"primary colour");
        String accent=validatedColor(update.accentColor(),"accent colour");
        String logo=validatedAsset(update.logoUrl(),"logo");
        String hero=validatedAsset(update.heroImageUrl(),"hero image");
        String video=validatedAsset(update.heroVideoUrl(),"hero video");
        String phone=optional(update.phone(),"phone",30);
        if (!PHONE.matcher(phone).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid contact phone");
        if (update.sports()==null || update.sports().isEmpty() || update.sports().size()>30)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select 1 to 30 sports");
        List<String> sportNames=update.sports().stream().map(s->required(s,"sport name",70)).distinct().toList();
        if (sportNames.size()!=update.sports().size() || sportNames.stream().anyMatch(s->s.contains(",")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Sports must be unique and cannot contain commas");
        int count=jdbc.update("""
                UPDATE arena_branding_settings
                   SET name=?,short_name=?,city=?,tagline=?,purpose=?,primary_color=?,
                       accent_color=?,logo_url=?,hero_image_url=?,hero_video_url=?,
                       phone=?,sports_csv=?,revision=revision+1,updated_by=?,updated_at=now()
                 WHERE id=1 AND revision=?
                """, name,shortName,city,tagline,purpose,primary,accent,logo,hero,video,
                phone,String.join(",",sportNames),optional(actor,"administrator",180),update.revision());
        if (count!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Arena branding was changed by another administrator. Reload and retry.");
        return current();
    }
}
