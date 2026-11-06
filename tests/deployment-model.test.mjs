import test from "node:test";
import assert from "node:assert/strict";
import {
  DEPLOYMENT_OPTIONS, DEPLOYMENT_DETAILS, FULL_PRODUCT_CAPABILITIES,
  REQUIRED_BOOKING_CAPABILITIES, selectDeploymentOption, productEntitlements,
  launchReadiness, deploymentSummary
} from "../packages/platform-core/deployment.mjs";
import {buildArenaDraft, validateRegistry} from "../packages/platform-core/index.mjs";

const base={name:"Victory Sports Arena",city:"Bengaluru",sports:["Badminton","Football"]};

test("three hosting choices map to the same booking software",()=>{
  assert.deepEqual(DEPLOYMENT_OPTIONS,[
    "customer_hosted","playnexa_managed_single_tenant","multi_tenant_saas"
  ]);
  assert.equal(DEPLOYMENT_DETAILS.customer_hosted.operationsOwner,"arena");
  assert.equal(DEPLOYMENT_DETAILS.playnexa_managed_single_tenant.operationsOwner,"varada");
  assert.equal(DEPLOYMENT_DETAILS.multi_tenant_saas.isolation,"tenant-enforced");
});
test("three choices share identical complete product entitlements",()=>{
  const [first,...rest]=DEPLOYMENT_OPTIONS.map(productEntitlements);
  for(const item of rest)assert.deepEqual(item,first);
  assert.ok(FULL_PRODUCT_CAPABILITIES.length>=25);
  for(const cap of REQUIRED_BOOKING_CAPABILITIES){
    assert.ok(FULL_PRODUCT_CAPABILITIES.includes(cap),cap);
    assert.equal(first[cap],true);
  }
  for(const required of [
    "online_payments","partial_and_full_refunds","memberships_and_subscriptions",
    "coaching_and_training","tournaments","dynamic_pricing","gst_and_tax_rules",
    "invoices_and_credit_notes","commerce_shop_and_inventory",
    "operator_check_in_uat","role_based_staff_operations","mobile_app_support"
  ].filter(x=>x!=="operator_check_in_uat")){
    assert.equal(first[required],true,required);
  }
});
test("onboarding creates the correct deployment type and all features",()=>{
  for(const deploymentOption of DEPLOYMENT_OPTIONS){
    const draft=buildArenaDraft({...base,deploymentOption});
    assert.equal(draft.deploymentOption,deploymentOption);
    assert.equal(draft.hostingMode,DEPLOYMENT_DETAILS[deploymentOption].hostingMode);
    assert.equal(draft.capabilities.customer_online_booking,true);
    assert.equal(draft.capabilities.online_payments,true);
    assert.equal(draft.capabilities.partial_and_full_refunds,true);
    assert.equal(draft.marketplaceListed,false);
    assert.equal(draft.status,"draft");
    assert.deepEqual(deploymentSummary(draft).capabilities,FULL_PRODUCT_CAPABILITIES);
    assert.equal(deploymentSummary(draft).marketplaceEnabled,false);
    assert.equal(validateRegistry([draft]),true);
  }
});
test("legacy dedicated/SaaS drafts retain their historical meaning",()=>{
  assert.equal(selectDeploymentOption(undefined,"dedicated"),"playnexa_managed_single_tenant");
  assert.equal(selectDeploymentOption(undefined,"saas"),"multi_tenant_saas");
  assert.equal(buildArenaDraft({...base,hostingMode:"saas"}).deploymentOption,"multi_tenant_saas");
  assert.equal(buildArenaDraft({...base,hostingMode:"dedicated"}).deploymentOption,"playnexa_managed_single_tenant");
});
test("invalid/contradictory customer hosting options are rejected",()=>{
  assert.throws(()=>buildArenaDraft({...base,deploymentOption:"multi_tenant_saas",hostingMode:"dedicated"}),/conflicts/);
  assert.throws(()=>buildArenaDraft({...base,deploymentOption:"customer_hosted",hostingMode:"saas"}),/conflicts/);
  assert.throws(()=>buildArenaDraft({...base,deploymentOption:"unknown"}),/Unknown|Invalid/);
  assert.throws(()=>productEntitlements("unknown"),/Unknown/);
});
test("a hosting choice cannot make production booking ready without payment and refund UAT",()=>{
  for(const option of DEPLOYMENT_OPTIONS){
    const result=launchReadiness(option);
    assert.equal(result.eligible,false);
    assert.ok(result.missing.includes("booking_quote_uat"));
    assert.ok(result.missing.includes("booking_hold_uat"));
    assert.ok(result.missing.includes("real_payment_sandbox_uat"));
    assert.ok(result.missing.includes("cancellation_refund_uat"));
    assert.ok(result.missing.includes("invoice_uat"));
  }
});
test("SaaS additionally requires tenant data/security isolation gates",()=>{
  const saas=launchReadiness("multi_tenant_saas");
  assert.ok(saas.missing.includes("cross_tenant_negative_tests"));
  assert.ok(saas.missing.includes("tenant_scoped_webhooks_and_payments"));
  assert.ok(saas.missing.includes("tenant_scoped_background_jobs"));
  for(const option of DEPLOYMENT_OPTIONS.slice(0,2)){
    const dedicated=launchReadiness(option);
    assert.ok(dedicated.missing.includes("separate_database"));
    assert.ok(!dedicated.missing.includes("cross_tenant_negative_tests"));
  }
});
test("evidence checklist is only complete when every release gate is confirmed",()=>{
  for(const option of DEPLOYMENT_OPTIONS){
    const pending=launchReadiness(option);
    const evidence=Object.fromEntries(pending.missing.map(key=>[key,true]));
    assert.equal(launchReadiness(option,evidence).eligible,true);
    assert.equal(launchReadiness(option,{...evidence,real_payment_sandbox_uat:false}).eligible,false);
  }
});
test("feature entitlements never contain a marketplace checkout obligation",()=>{
  for(const option of DEPLOYMENT_OPTIONS){
    const entitlements=productEntitlements(option);
    assert.ok(!Object.hasOwn(entitlements,"marketplace_booking"));
    assert.ok(!Object.hasOwn(entitlements,"marketplace_commission"));
  }
});
