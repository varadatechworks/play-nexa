-- PlayNexa SaaS control-plane foundation only.
-- This migration does NOT enable shared-hosting APIs or add tenant_id to arena data.
-- The production safety gate must remain closed until data-plane isolation is complete.
CREATE TABLE playnexa_tenants (
 id UUID PRIMARY KEY, slug VARCHAR(63) NOT NULL UNIQUE, display_name VARCHAR(120) NOT NULL,
 lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION'
 CHECK (lifecycle_status IN ('DRAFT','PENDING_VERIFICATION','ACTIVE','SUSPENDED','CLOSED')),
 hosting_mode VARCHAR(32) NOT NULL DEFAULT 'MULTI_TENANT_SAAS' CHECK (hosting_mode = 'MULTI_TENANT_SAAS'),
 default_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'), CHECK (length(trim(display_name)) > 0)
);
CREATE TABLE playnexa_tenant_domains (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES playnexa_tenants(id) ON DELETE CASCADE,
 hostname VARCHAR(253) NOT NULL, is_primary BOOLEAN NOT NULL DEFAULT false,
 verification_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING','VERIFIED','REVOKED')),
 verification_method VARCHAR(16) NOT NULL DEFAULT 'DNS_TXT' CHECK (verification_method = 'DNS_TXT'),
 verification_token_hash CHAR(64) NOT NULL, verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (hostname = lower(hostname)), CHECK (hostname ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?([.][a-z0-9]([a-z0-9-]*[a-z0-9])?)*$'),
 CHECK ((verification_status = 'VERIFIED') = (verified_at IS NOT NULL)), UNIQUE (tenant_id, hostname)
);
CREATE UNIQUE INDEX playnexa_tenant_domains_hostname_uq ON playnexa_tenant_domains(hostname);
CREATE UNIQUE INDEX playnexa_tenant_domains_primary_uq ON playnexa_tenant_domains(tenant_id) WHERE is_primary AND verification_status = 'VERIFIED';
CREATE INDEX playnexa_tenant_domains_tenant_idx ON playnexa_tenant_domains(tenant_id);
CREATE TABLE playnexa_tenant_memberships (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES playnexa_tenants(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 role VARCHAR(24) NOT NULL CHECK (role IN ('OWNER','ADMIN','OPERATOR','COACH','SHOPKEEPER')),
 membership_status VARCHAR(16) NOT NULL DEFAULT 'INVITED' CHECK (membership_status IN ('INVITED','ACTIVE','SUSPENDED','REVOKED')),
 invited_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (tenant_id, user_id)
);
CREATE INDEX playnexa_tenant_memberships_user_idx ON playnexa_tenant_memberships(user_id, membership_status);
CREATE INDEX playnexa_tenant_memberships_tenant_role_idx ON playnexa_tenant_memberships(tenant_id, role, membership_status);
CREATE TABLE playnexa_tenant_subscriptions (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL UNIQUE REFERENCES playnexa_tenants(id) ON DELETE CASCADE,
 plan_code VARCHAR(40) NOT NULL, subscription_status VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
 CHECK (subscription_status IN ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED')),
 starts_at TIMESTAMPTZ NOT NULL DEFAULT now(), current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ,
 trial_ends_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (current_period_end IS NULL OR current_period_start IS NULL OR current_period_end > current_period_start)
);
CREATE TABLE playnexa_tenant_provisioning_jobs (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES playnexa_tenants(id) ON DELETE CASCADE,
 operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE','UPDATE','SUSPEND','RESUME','CLOSE')),
 job_status VARCHAR(16) NOT NULL DEFAULT 'QUEUED' CHECK (job_status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
 idempotency_key VARCHAR(120) NOT NULL UNIQUE, requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
 attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0), safe_error_code VARCHAR(80),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
 CHECK ((job_status IN ('SUCCEEDED','FAILED','CANCELLED')) = (completed_at IS NOT NULL))
);
CREATE INDEX playnexa_tenant_provisioning_queue_idx ON playnexa_tenant_provisioning_jobs(created_at) WHERE job_status IN ('QUEUED','FAILED');
