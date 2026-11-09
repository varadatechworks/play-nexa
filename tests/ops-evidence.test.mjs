import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("all architecture and handover documents exist with editable Mermaid source",async()=>{
  for(const doc of [
    "SYSTEM_ARCHITECTURE.md","DEPLOYMENT_TOPOLOGIES.md","ER_BOOKING_PAYMENTS.md",
    "MIGRATION_RUNBOOK.md","STATUS_LOGS_SECURITY.md",
    "OPERATIONS_KT_UAT.md","SCREEN_ROUTE_INVENTORY.md"
  ]){
    const body=await readFile(resolve(root,"docs/architecture-kt",doc),"utf8");
    assert.ok(body.length>1000,doc+" is unexpectedly empty");
  }
  const architecture=await readFile(resolve(root,"docs/architecture-kt/SYSTEM_ARCHITECTURE.md"),"utf8");
  const er=await readFile(resolve(root,"docs/architecture-kt/ER_BOOKING_PAYMENTS.md"),"utf8");
  assert.ok(architecture.includes("```mermaid"),"architecture diagram must remain editable");
  assert.ok(er.includes("erDiagram"),"ER source diagram is missing");
});
test("booking, payments and SaaS isolation are explicit release gates",async()=>{
  const docs=await Promise.all(["MIGRATION_RUNBOOK.md","STATUS_LOGS_SECURITY.md","OPERATIONS_KT_UAT.md"]
    .map(name=>readFile(resolve(root,"docs/architecture-kt",name),"utf8")));
  assert.ok(docs.every(text=>/booking|refund|payment/i.test(text)));
  assert.ok(docs.some(text=>/tenant|SaaS/i.test(text)));
});
test("guarded Flyway migration script parses and plans without touching database",()=>{
  const p=resolve(root,"scripts/migrate-playnexa.sh");
  const check=spawnSync("bash",["-n",p],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
  const plan=spawnSync("bash",[p,"plan"],{encoding:"utf8",cwd:root,timeout:10000});
  assert.equal(plan.status,0,plan.stderr);
  assert.match(plan.stdout,/READ-ONLY/);
  assert.match(plan.stdout,/V60__playnexa_arena_branding_settings.sql/);
});
test("all Next pages and Expo screens are discoverable from a read-only audit",()=>{
  const result=spawnSync(process.execPath,["scripts/route-audit.mjs","--json"],{
    cwd:root,encoding:"utf8",timeout:15000,maxBuffer:1024*1024*3
  });
  assert.equal(result.status,0,result.stderr);
  const audit=JSON.parse(result.stdout);
  assert.ok(audit.counts.webRoutes>=35,JSON.stringify(audit.counts));
  assert.ok(audit.counts.mobileScreens>=18,JSON.stringify(audit.counts));
  assert.ok(audit.routes.every(x=>x.file.includes("/")));
  assert.ok(audit.flags.every(x=>x.line>=1));
});
