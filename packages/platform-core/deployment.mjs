/**
 * Product contract for customer-selected PlayNexa hosting.
 *
 * These are commercial/architecture options, NOT flags that magically enable
 * database tenant isolation or provision infrastructure.
 *
 * Identical product entitlements across all three options. Arena administrators
 * may hide irrelevant modules, e.g. swimming at a badminton-only centre, but
 * hosting choice must NEVER withdraw booking, payment or operations capability.
 */
export const DEPLOYMENT_OPTIONS = Object.freeze([
  "customer_hosted",
  "playnexa_managed_single_tenant",
  "multi_tenant_saas"
]);

export const DEPLOYMENT_DETAILS = Object.freeze({
  customer_hosted: Object.freeze({
    label: "Customer-hosted",
    infrastructureOwner: "arena",
    operationsOwner: "arena",
    hostingMode: "dedicated",
    isolation: "dedicated-database"
  }),
  playnexa_managed_single_tenant: Object.freeze({
    label: "PlayNexa-managed, single-tenant",
    infrastructureOwner: "varada",
    operationsOwner: "varada",
    hostingMode: "dedicated",
    isolation: "dedicated-database"
  }),
  multi_tenant_saas: Object.freeze({
    label: "Multi-tenant SaaS",
    infrastructureOwner: "varada",
    operationsOwner: "varada",
    hostingMode: "saas",
    isolation: "tenant-enforced"
  })
});

/** Entitlement != enabled feature. All three customer types get the same software. */
export const FULL_PRODUCT_CAPABILITIES = Object.freeze([
  "sports_catalog",
  "courts_and_facilities",
  "availability_and_schedules",
  "capacity_and_slot_rules",
  "customer_online_booking",
  "booking_holds",
  "pricing_and_quotes",
  "online_payments",
  "payment_verification",
  "cancellations",
  "partial_and_full_refunds",
  "memberships_and_subscriptions",
  "coaching_and_training",
  "tournaments",
  "dynamic_pricing",
  "offers_and_coupons",
  "gst_and_tax_rules",
  "invoices_and_credit_notes",
  "commerce_shop_and_inventory",
  "loyalty",
  "customer_profile_and_portal",
  "role_based_staff_operations",
  "qr_check_in",
  "email_and_sms_notifications",
  "reporting_and_analytics",
  "audit_and_error_logs",
  "mobile_app_support",
  "english_kannada_support",
  "security_and_authentication"
]);

export const REQUIRED_BOOKING_CAPABILITIES = Object.freeze([
  "courts_and_facilities", "availability_and_schedules",
  "capacity_and_slot_rules", "customer_online_booking",
  "booking_holds", "pricing_and_quotes",
  "online_payments", "payment_verification",
  "cancellations", "partial_and_full_refunds"
]);

/**
 * Upgrade legacy {hostingMode:"dedicated"|"saas"} records without changing
 * their meaning. A legacy dedicated record cannot reveal who pays for hosting;
 * it defaults to managed-single-tenant until the owner selects an arrangement.
 */
export function selectDeploymentOption(deploymentOption, hostingMode = "dedicated") {
  const chosen = deploymentOption ||
    (hostingMode === "saas" ? "multi_tenant_saas" : "playnexa_managed_single_tenant");
  if (!DEPLOYMENT_OPTIONS.includes(chosen)) throw new Error("Unknown deployment option");
  if (hostingMode !== DEPLOYMENT_DETAILS[chosen].hostingMode)
    throw new Error("Deployment option conflicts with hosting mode");
  return chosen;
}

export function productEntitlements(deploymentOption) {
  if (!DEPLOYMENT_OPTIONS.includes(deploymentOption))
    throw new Error("Unknown deployment option");
  return Object.fromEntries(FULL_PRODUCT_CAPABILITIES.map(code => [code, true]));
}

/**
 * This is an evidence checklist, not real provisioning or payment validation.
 * All three options require a working, UAT-verified booking journey.
 * Multi-tenant SaaS requires additional isolation tests before removing the
 * Java backend's shared-hosting safety gate.
 */
export function launchReadiness(deploymentOption, evidence = {}) {
  if (!DEPLOYMENT_OPTIONS.includes(deploymentOption))
    throw new Error("Unknown deployment option");
  const common = [
    "verified_domain", "arena_branding", "isolated_secrets",
    "roles_and_admin_access", "sports_and_courts_configured",
    "schedules_and_capacity_configured", "pricing_and_taxes_configured",
    "booking_quote_uat", "booking_hold_uat", "real_payment_sandbox_uat",
    "payment_webhook_uat", "cancellation_refund_uat", "invoice_uat",
    "operator_check_in_uat", "notifications_uat", "backup_restore_uat"
  ];
  const dedicated = ["separate_database", "dedicated_service_deployment"];
  const saas = [
    "verified_tenant_routing", "tenant_scoped_database",
    "tenant_owned_foreign_keys", "tenant_scoped_auth",
    "tenant_scoped_background_jobs", "tenant_scoped_file_storage",
    "tenant_scoped_webhooks_and_payments", "cross_tenant_negative_tests"
  ];
  const checks = [
    ...common,
    ...(deploymentOption === "multi_tenant_saas" ? saas : dedicated)
  ];
  const missing = checks.filter(code => evidence[code] !== true);
  return {
    deploymentOption,
    eligible: missing.length === 0,
    missing,
    checked: checks.length
  };
}

/** Records commercial architecture without silently granting production access. */
export function deploymentSummary(arena) {
  if (!arena || typeof arena !== "object") throw new Error("Arena required");
  const option = selectDeploymentOption(arena.deploymentOption, arena.hostingMode);
  return {
    option,
    ...DEPLOYMENT_DETAILS[option],
    capabilities: FULL_PRODUCT_CAPABILITIES.slice(),
    marketplaceEnabled: false
  };
}
