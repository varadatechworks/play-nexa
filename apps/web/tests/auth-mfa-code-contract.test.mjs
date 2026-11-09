import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("401 invalid credentials never trigger OTP field via message text",()=>{
 const api=read("lib/api.ts");
 const login=read("app/login/page.tsx");
 assert.match(api,/body\?\.code==="MFA_REQUIRED"/);
 assert.match(api,/code:"INVALID_CREDENTIALS"/);
 assert.match(api,/Invalid email\/mobile or password/);
 assert.doesNotMatch(login,/message\.toLowerCase\(\)\.includes\("mfa code"\)/);
 assert.doesNotMatch(login,/msg\.toLowerCase\(\)\.includes\("verification code"\)/);
 assert.match(login,/e\.details\.code==="MFA_REQUIRED"/);
});
test("MFA login screen is both accessible and opt-in to a genuine challenge",()=>{
 const login=read("app/login/page.tsx");
 assert.match(login,/mfaRequired&&<label>/);
 assert.match(login,/name="mfaCode"/);
 assert.match(login,/role="alert"/);
});
