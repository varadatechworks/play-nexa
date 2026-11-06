import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {FULL_PRODUCT_CAPABILITIES,DEPLOYMENT_DETAILS} from "../packages/platform-core/deployment.mjs";
import {validateRegistry} from "../packages/platform-core/index.mjs";

test("committed example config is a full booking arena, not a marketplace listing",async()=>{
  const sample=JSON.parse(await readFile(new URL("../config/arena.example.json",import.meta.url),"utf8"));
  assert.equal(validateRegistry([sample]),true);
  assert.equal(sample.marketplaceListed,false);
  assert.equal(sample.hostingMode,DEPLOYMENT_DETAILS[sample.deploymentOption].hostingMode);
  for(const capability of FULL_PRODUCT_CAPABILITIES)
    assert.equal(sample.capabilities?.[capability],true,capability+" must be included for all customer options");
});
