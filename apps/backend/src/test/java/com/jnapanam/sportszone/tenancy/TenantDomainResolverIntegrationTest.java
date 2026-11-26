package com.jnapanam.sportszone.tenancy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TenantDomainResolverIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired TenantDomainResolver resolver;

    @Test
    void resolvesOnlyVerifiedActiveDomainsWithAnUsableSubscription() {
        UUID tenant = tenant("MULTI_TENANT_SAAS");
        String hostname = "arena-" + UUID.randomUUID().toString().substring(0, 8) + ".example.test";
        subscription(tenant, "TRIAL", "now() + interval '7 days'");
        domain(tenant, hostname, "VERIFIED");

        assertThat(resolver.resolve(hostname.toUpperCase() + "."))
                .contains(new TenantContext(tenant, slugFor(tenant), "Tenant " + slugFor(tenant), "MULTI_TENANT_SAAS"));
    }

    @Test
    void pendingDomainAndExpiredTrialCannotResolve() {
        UUID pendingTenant = tenant("MULTI_TENANT_SAAS");
        subscription(pendingTenant, "ACTIVE", "null");
        domain(pendingTenant, "pending-" + UUID.randomUUID().toString().substring(0, 8) + ".example.test", "PENDING");
        String pendingHost = jdbc.queryForObject(
                "select hostname from playnexa_tenant_domains where tenant_id=?", String.class, pendingTenant);
        assertThat(resolver.resolve(pendingHost)).isEmpty();

        UUID expiredTenant = tenant("MULTI_TENANT_SAAS");
        subscription(expiredTenant, "TRIAL", "now() - interval '1 day'");
        String expiredHost = "expired-" + UUID.randomUUID().toString().substring(0, 8) + ".example.test";
        domain(expiredTenant, expiredHost, "VERIFIED");
        assertThat(resolver.resolve(expiredHost)).isEmpty();
    }

    @Test
    void resolvesConfiguredCustomerHostedAndManagedSingleTenantDeployments() {
        UUID customerHosted = tenant("CUSTOMER_HOSTED");
        UUID managed = tenant("PLAYNEXA_MANAGED_SINGLE_TENANT");
        assertThat(resolver.resolveConfiguredTenant(customerHosted.toString(), "customer-hosted"))
                .isPresent();
        assertThat(resolver.resolveConfiguredTenant(customerHosted.toString(), "customer-hosted").orElseThrow().tenantId())
                .isEqualTo(customerHosted);
        assertThat(resolver.resolveConfiguredTenant(managed.toString(), "playnexa-managed-single-tenant"))
                .isPresent();
        assertThat(resolver.resolveConfiguredTenant(managed.toString(), "playnexa-managed-single-tenant").orElseThrow().tenantId())
                .isEqualTo(managed);
        assertThat(resolver.resolveConfiguredTenant(managed.toString(), "saas")).isEmpty();
    }

    @Test
    void hostnameNormalizationRejectsLocalAndMalformedHosts() {
        assertThat(TenantDomainResolver.normalizeHostname("ARENA.EXAMPLE.TEST.:443"))
                .isEqualTo("arena.example.test");
        assertThat(TenantDomainResolver.normalizeHostname("localhost")).isNull();
        assertThat(TenantDomainResolver.normalizeHostname("bad host.example.test")).isNull();
        assertThat(TenantDomainResolver.normalizeHostname("[::1]")).isNull();
    }

    private UUID tenant(String mode) {
        UUID id = UUID.randomUUID();
        String slug = "tenant-" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.update("insert into playnexa_tenants(id,slug,display_name,hosting_mode,lifecycle_status) values(?,?,?,?, 'ACTIVE')",
                id, slug, "Tenant " + slug, mode);
        return id;
    }

    private String slugFor(UUID id) {
        return jdbc.queryForObject("select slug from playnexa_tenants where id=?", String.class, id);
    }

    private void subscription(UUID tenantId, String status, String trialEndExpression) {
        jdbc.update("insert into playnexa_tenant_subscriptions(id,tenant_id,plan_code,subscription_status,trial_ends_at) "
                + "values(?,?,?, ?, " + trialEndExpression + ")",
                UUID.randomUUID(), tenantId, "STARTER", status);
    }

    private void domain(UUID tenantId, String hostname, String verificationStatus) {
        jdbc.update("""
                insert into playnexa_tenant_domains(id,tenant_id,hostname,is_primary,verification_status,
                    verification_method,verification_token_hash,verified_at)
                values(?,?,?,?,?,'DNS_TXT',?,?)
                """, UUID.randomUUID(), tenantId, hostname, "VERIFIED".equals(verificationStatus),
                verificationStatus, "a".repeat(64),
                "VERIFIED".equals(verificationStatus) ? java.sql.Timestamp.from(java.time.Instant.now()) : null);
    }
}
