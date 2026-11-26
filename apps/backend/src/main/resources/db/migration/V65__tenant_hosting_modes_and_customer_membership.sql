-- Allow the same tenant registry to describe the three supported hosting arrangements.
-- This does not enable shared SaaS; SharedHostingSafetyGateFilter remains closed for it.
ALTER TABLE playnexa_tenants
    DROP CONSTRAINT IF EXISTS playnexa_tenants_hosting_mode_check;
ALTER TABLE playnexa_tenants
    ADD CONSTRAINT playnexa_tenants_hosting_mode_check
    CHECK (hosting_mode IN ('CUSTOMER_HOSTED','PLAYNEXA_MANAGED_SINGLE_TENANT','MULTI_TENANT_SAAS'));

-- Customer membership is tenant-scoped and is created on first authenticated
-- visit to a verified tenant domain. Admin/operator roles still require an
-- explicit active membership; global JWT roles are not sufficient.
ALTER TABLE playnexa_tenant_memberships
    DROP CONSTRAINT IF EXISTS playnexa_tenant_memberships_role_check;
ALTER TABLE playnexa_tenant_memberships
    ADD CONSTRAINT playnexa_tenant_memberships_role_check
    CHECK (role IN ('OWNER','ADMIN','OPERATOR','COACH','SHOPKEEPER','CUSTOMER'));

CREATE INDEX IF NOT EXISTS playnexa_tenant_memberships_active_lookup_idx
    ON playnexa_tenant_memberships(tenant_id,user_id)
    WHERE membership_status='ACTIVE';
