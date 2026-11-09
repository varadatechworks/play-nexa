package com.jnapanam.sportszone.security;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Rejects known insecure development defaults for actual production launches.
 * APP_ENV=production (or an active Spring "prod"/"production" profile) is mandatory
 * on production environments. No secret values are included in failure messages.
 */
@Component
public class ProductionConfigurationGuard {
    private final Environment env;

    public ProductionConfigurationGuard(Environment env) { this.env=env; }

    @EventListener(ApplicationReadyEvent.class)
    public void verifyAtStartup() { validate(); }

    void validate() {
        if (!production()) return;
        List<String> missing=new ArrayList<>();
        require("DB_URL",missing);
        require("DB_USERNAME",missing);
        require("DB_PASSWORD",missing);
        require("JWT_SECRET",missing);
        require("RAZORPAY_KEY_ID",missing);
        require("RAZORPAY_KEY_SECRET",missing);
        require("RAZORPAY_WEBHOOK_SECRET",missing);
        String provider=value("app.payment.provider",value("PAYMENT_PROVIDER","mock"));
        if (!"razorpay".equalsIgnoreCase(provider)) missing.add("PAYMENT_PROVIDER must be razorpay");
        if (Boolean.parseBoolean(value("app.security.test-otp-enabled",value("TEST_OTP_ENABLED","false"))))
            missing.add("TEST_OTP_ENABLED must be false");
        if (Boolean.parseBoolean(value("app.security.expose-development-reset-token",
                value("EXPOSE_DEVELOPMENT_RESET_TOKEN","false"))))
            missing.add("EXPOSE_DEVELOPMENT_RESET_TOKEN must be false");
        String jwt=value("JWT_SECRET","");
        if (jwt.length()<32 || jwt.equals("Sm5hcGFuYW0gU3BvcnRzIFpvbmUgRGV2ZWxvcG1lbnQgSldUIFNlY3JldCAyMDI2IQ=="))
            missing.add("JWT_SECRET must be a strong unique production signing key");
        String cors=value("CORS_ALLOWED_ORIGINS","");
        if (cors.isBlank() || Arrays.stream(cors.split(","))
                .map(String::trim).anyMatch(origin ->
                   !origin.matches("https://[A-Za-z0-9.-]+(?::[0-9]{2,5})?")
                     || origin.contains("localhost") || origin.contains("127.0.0.1")))
            missing.add("CORS_ALLOWED_ORIGINS must contain only explicit HTTPS production origins");
        String url=value("DB_URL","");
        if (!url.startsWith("jdbc:postgresql://") || url.contains("localhost") || url.contains("127.0.0.1"))
            missing.add("DB_URL must point to the provisioned production PostgreSQL instance");
        String access=value("JWT_ACCESS_MINUTES","43200");
        try {
            int minutes=Integer.parseInt(access);
            if(minutes<1 || minutes>60) missing.add("JWT_ACCESS_MINUTES must be between 1 and 60");
        } catch(NumberFormatException ex) { missing.add("JWT_ACCESS_MINUTES must be numeric"); }
        // An absent hosting-mode variable cannot silently opt a production
        // deployment into an imported single-arena database.
        if (!"dedicated".equalsIgnoreCase(value("PLAYNEXA_HOSTING_MODE","")))
            missing.add("PLAYNEXA_HOSTING_MODE must be explicitly dedicated; Shared SaaS remains blocked until tenant isolation is certified");
        if(!missing.isEmpty())throw new IllegalStateException(
                "Unsafe production configuration: "+String.join("; ",missing)
                +". No secrets were logged.");
    }

    private boolean production() {
        String app=value("APP_ENV","");
        if ("production".equalsIgnoreCase(app) || "prod".equalsIgnoreCase(app)) return true;
        return Arrays.stream(env.getActiveProfiles())
                .map(x->x.toLowerCase(Locale.ROOT))
                .anyMatch(x->x.equals("prod")||x.equals("production"));
    }

    private void require(String key,List<String> missing) {
        if (value(key,"").isBlank()) missing.add(key+" is required");
    }

    private String value(String name,String fallback) {
        String v=env.getProperty(name);
        return v==null?fallback:v.trim();
    }
}
