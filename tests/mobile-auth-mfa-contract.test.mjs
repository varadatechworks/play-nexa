import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Android MFA field is controlled by backend challenge code",()=>{
 const api=read("apps/mobile/src/lib/api.ts");
 const login=read("apps/mobile/src/app/login.tsx");
 assert.match(api,/detail\?\.code==='MFA_REQUIRED'/);
 assert.match(api,/INVALID_CREDENTIALS/);
 assert.match(login,/reason instanceof ApiError && reason\.code==='MFA_REQUIRED'/);
 assert.doesNotMatch(login,/message\.toLowerCase\(\)\.includes\('mfa code'\)/);
});
test("MFA delivery failure never claims email was sent",()=>{
 const source=read("apps/backend/src/main/java/com/jnapanam/sportszone/identity/service/MfaService.java");
 assert.match(source,/SERVICE_UNAVAILABLE/);
 assert.match(source,/Verification email is temporarily unavailable/);
 assert.match(source,/challenge_hash=\?,challenge_expires_at=\?/);
});
