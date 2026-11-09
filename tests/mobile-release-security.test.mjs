import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const run=(env)=>spawnSync(process.execPath,["-e",'require("./apps/mobile/app.config.js")'],{
  cwd:root,encoding:"utf8",timeout:10000,
  env:{...process.env,PLAYNEXA_BRANDED_RELEASE:"false",...env}
});
test("development mobile brand config loads without a paid production API",()=>{
  const result=run({PLAYNEXA_BRANDED_RELEASE:"false"});
  assert.equal(result.status,0,result.stderr);
});
test("branded release requires distinct package, icon and deep link",()=>{
  const result=run({PLAYNEXA_BRANDED_RELEASE:"true",
    ARENA_ANDROID_PACKAGE:"",ARENA_APP_ICON_PATH:"",ARENA_APP_SCHEME:""});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/app package, icon and deep-link/);
});
test("branded release rejects missing or non-HTTPS API URL",()=>{
  const common={
    PLAYNEXA_BRANDED_RELEASE:"true",
    ARENA_ANDROID_PACKAGE:"com.example.victory",
    ARENA_APP_ICON_PATH:"./assets/images/icon.png",
    ARENA_APP_SCHEME:"victory"
  };
  for(const url of ["","http://api.example.com","https://localhost:8080","https://127.0.0.1"]){
    const result=run({...common,EXPO_PUBLIC_API_URL:url});
    assert.notEqual(result.status,0,"unsafe URL was accepted: "+url);
    assert.match(result.stderr,/HTTPS arena API|trusted HTTPS arena API/);
  }
});
