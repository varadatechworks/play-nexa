package com.jnapanam.sportszone.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class ProductionConfigurationGuardTest {
    private MockEnvironment secureProduction() {
        return new MockEnvironment()
                .withProperty("APP_ENV","production")
                .withProperty("DB_URL","jdbc:postgresql://db.example.org:5432/arena")
                .withProperty("DB_USERNAME","playnexa")
                .withProperty("DB_PASSWORD","a-strong-unique-db-password")
                .withProperty("JWT_SECRET","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
                .withProperty("JWT_ACCESS_MINUTES","30")
                .withProperty("CORS_ALLOWED_ORIGINS","https://arena.example.com")
                .withProperty("PAYMENT_PROVIDER","razorpay")
                .withProperty("app.payment.provider","razorpay")
                .withProperty("RAZORPAY_KEY_ID","rzp_live_placeholder")
                .withProperty("RAZORPAY_KEY_SECRET","placeholder-only-test-secret")
                .withProperty("RAZORPAY_WEBHOOK_SECRET","placeholder-only-webhook")
                .withProperty("PLAYNEXA_HOSTING_MODE","dedicated");
    }

    @Test void permitsDevelopmentOnlyWithoutProdFlag() {
        assertDoesNotThrow(() -> new ProductionConfigurationGuard(
                new MockEnvironment().withProperty("PAYMENT_PROVIDER","mock")).validate());
    }

    @Test void rejectsKnownDefaultsInProductionWithoutLoggingTheirValues() {
        var environment=new MockEnvironment()
                .withProperty("APP_ENV","production")
                .withProperty("DB_PASSWORD","private-db-password")
                .withProperty("JWT_SECRET","private-jwt-value");
        var message=assertThrows(IllegalStateException.class,
                ()->new ProductionConfigurationGuard(environment).validate()).getMessage();
        assertTrue(message.contains("RAZORPAY_KEY_ID"));
        assertTrue(message.contains("CORS_ALLOWED_ORIGINS"));
        assertFalse(message.contains("private-db-password"));
        assertFalse(message.contains("private-jwt-value"));
    }

    @Test void acceptsExplicitDedicatedSandboxValidatedProductionConfiguration() {
        assertDoesNotThrow(()->new ProductionConfigurationGuard(secureProduction()).validate());
    }

    @Test void rejectsMockPaymentsAndTestOtpAndLongLivedTokens() {
        var environment=secureProduction()
                .withProperty("app.payment.provider","mock")
                .withProperty("app.security.test-otp-enabled","true")
                .withProperty("JWT_ACCESS_MINUTES","43200");
        var message=assertThrows(IllegalStateException.class,
                ()->new ProductionConfigurationGuard(environment).validate()).getMessage();
        assertTrue(message.contains("PAYMENT_PROVIDER"));
        assertTrue(message.contains("TEST_OTP_ENABLED"));
        assertTrue(message.contains("JWT_ACCESS_MINUTES"));
    }

    @Test void productionNeverDefaultsSilentlyToDedicatedHosting() {
        var environment=secureProduction()
                .withProperty("PLAYNEXA_HOSTING_MODE","");
        var message=assertThrows(IllegalStateException.class,
                ()->new ProductionConfigurationGuard(environment).validate()).getMessage();
        assertTrue(message.contains("PLAYNEXA_HOSTING_MODE"));
        assertTrue(message.contains("Shared SaaS"));
    }

    @Test void rejectsSharedModeAndHttpOrLocalhostCors() {
        var environment=secureProduction()
                .withProperty("PLAYNEXA_HOSTING_MODE","saas")
                .withProperty("CORS_ALLOWED_ORIGINS","http://localhost:3000");
        var message=assertThrows(IllegalStateException.class,
                ()->new ProductionConfigurationGuard(environment).validate()).getMessage();
        assertTrue(message.contains("Shared SaaS"));
        assertTrue(message.contains("CORS_ALLOWED_ORIGINS"));
    }

    @Test void prodSpringProfileEnforcesChecksWithoutAppEnv() {
        var environment=new MockEnvironment();
        environment.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                ()->new ProductionConfigurationGuard(environment).validate());
    }
    @Test void environmentPostProcessorRejectsUnsafeConfigurationBeforeStartup() {
        var env=new MockEnvironment().withProperty("APP_ENV","production");
        assertThrows(IllegalStateException.class,
                ()->new ProductionEnvironmentPostProcessor().postProcessEnvironment(env,null));
    }
}

