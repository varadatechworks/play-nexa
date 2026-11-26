-- Organizer is a tenant-scoped application role, not a global cross-tenant authority.
ALTER TABLE playnexa_tenant_memberships
    DROP CONSTRAINT IF EXISTS playnexa_tenant_memberships_role_check;
ALTER TABLE playnexa_tenant_memberships
    ADD CONSTRAINT playnexa_tenant_memberships_role_check
    CHECK (role IN ('OWNER','ADMIN','OPERATOR','COACH','ORGANIZER','SHOPKEEPER','CUSTOMER'));
