package com.jnapanam.sportszone.tenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TenantControlPlaneSchemaIntegrationTest {
    @Autowired JdbcTemplate jdbc;

    @Test
    void controlPlaneTablesAndSafetyColumnsAreInstalled() {
        assertThat(tableExists("playnexa_tenants")).isTrue();
        assertThat(tableExists("playnexa_tenant_domains")).isTrue();
        assertThat(tableExists("playnexa_tenant_memberships")).isTrue();
        assertThat(tableExists("playnexa_tenant_subscriptions")).isTrue();
        assertThat(tableExists("playnexa_tenant_provisioning_jobs")).isTrue();
        assertThat(columnExists("playnexa_tenant_domains", "verification_token_hash")).isTrue();
        assertThat(columnExists("playnexa_tenant_domains", "verified_at")).isTrue();
        assertThat(columnExists("playnexa_tenant_provisioning_jobs", "idempotency_key")).isTrue();
    }

    @Test
    void hostnameIsGloballyUniqueAcrossTenants() {
        UUID first = createTenant("arena-one-" + UUID.randomUUID().toString().substring(0, 8));
        UUID second = createTenant("arena-two-" + UUID.randomUUID().toString().substring(0, 8));
        String hostname = "venue-" + UUID.randomUUID().toString().substring(0, 8) + ".example.test";
        insertDomain(first, hostname);
        assertThatThrownBy(() -> insertDomain(second, hostname)).isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    void invalidSlugAndDedicatedHostingModeAreRejected() {
        assertThatThrownBy(() -> jdbc.update(
                "insert into playnexa_tenants(id,slug,display_name,hosting_mode) values(?,?,?,?)",
                UUID.randomUUID(), "Bad Slug", "Invalid", "CUSTOMER_HOSTED"))
                .isInstanceOf(RuntimeException.class);
    }

    private UUID createTenant(String slug) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into playnexa_tenants(id,slug,display_name) values(?,?,?)", id, slug, "Integration " + slug);
        return id;
    }
    private void insertDomain(UUID tenantId, String hostname) {
        jdbc.update("insert into playnexa_tenant_domains(id,tenant_id,hostname,verification_token_hash) values(?,?,?,?)",
                UUID.randomUUID(), tenantId, hostname, "a".repeat(64));
    }
    private boolean tableExists(String table) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from information_schema.tables where table_schema=current_schema() and table_name=?)",
                Boolean.class, table));
    }
    private boolean columnExists(String table, String column) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from information_schema.columns where table_schema=current_schema() and table_name=? and column_name=?)",
                Boolean.class, table, column));
    }
}
