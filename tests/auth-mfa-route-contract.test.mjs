import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";

const root=resolve(".");
const read=path=>readFile(resolve(root,path),"utf8");
test("web MFA challenge is recognized by server code, not a phrase in invalid credentials",async()=>{
 const [api,login]=await Promise.all([read("apps/web/lib/api.ts"),read("apps/web/app/login/page.tsx")]);
 assert.match(api,/body\?\.code==="MFA_REQUIRED"/);
 assert.match(login,/code==="MFA_REQUIRED"/);
 assert.doesNotMatch(login,/msg\.toLowerCase\(\)\.includes\("verification code"\)/);
 assert.doesNotMatch(api,/detail\?\.includes\("MFA code sent"\)/);
});
test("Android MFA fields and retry handling are based on server MFA_REQUIRED status",async()=>{
 const [api,login]=await Promise.all([read("apps/mobile/src/lib/api.ts"),read("apps/mobile/src/app/login.tsx")]);
 assert.match(api,/detail\?\.code==='MFA_REQUIRED'/);
 assert.match(login,/reason\.code==='MFA_REQUIRED'/);
 assert.doesNotMatch(api,/message\.includes\('MFA code sent'\)/);
 assert.match(api,/if\(lastAttemptedToken && accessToken===lastAttemptedToken\)/);
 assert.match(api,/key\.toLowerCase\(\)==='authorization'/);
});
test("API route inventory runs without a backend or database",()=>{
 const p=spawnSync(process.execPath,["scripts/audit-api-surface.mjs","--json"],{
  cwd:root,encoding:"utf8",timeout:15000,maxBuffer:8*1024*1024
 });
 assert.equal(p.status,0,p.stderr);
 const data=JSON.parse(p.stdout);
 assert.ok(data.counts.controllers>=40,"Unexpectedly few Spring controllers");
 assert.ok(data.counts.endpoints>=100,"Unexpectedly few endpoint annotations");
 assert.ok(data.api.some(item=>item.path.includes("/api/v1/") && item.method==="GET"));
 assert.ok(data.api.every(item=>item.file.endsWith(".java")&&item.line>0));
});
test("standard production EAS profile cannot bypass branded release settings",()=>{
 const out=spawnSync(process.execPath,["-e",'require("./apps/mobile/app.config.js")'],{
   cwd:root,encoding:"utf8",timeout:10000,
   env:{...process.env,PLAYNEXA_BRANDED_RELEASE:"false",EAS_BUILD_PROFILE:"production",ARENA_ANDROID_PACKAGE:"",ARENA_APP_ICON_PATH:"",ARENA_APP_SCHEME:""}
 });
 assert.notEqual(out.status,0);
 assert.match(out.stderr,/Branded release requires unique app package/);
});
