import test from "node:test";
import assert from "node:assert/strict";
import {createDemoServer} from "../scripts/demo-server.mjs";

test("demo homepage redirects to the correct CSS/JS asset base, then loads all module imports",async t=>{
  const server=createDemoServer();
  await new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(0,"127.0.0.1",resolve);
  });
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin="http://127.0.0.1:"+server.address().port;

  const root=await fetch(origin+"/",{redirect:"manual"});
  assert.equal(root.status,302);
  assert.equal(root.headers.get("location"),"/demo/arena.html",
    "Browser root URL must change; internal rewriting causes broken relative CSS/JS links.");

  const home=await fetch(origin+"/");
  assert.equal(home.status,200);
  assert.equal(new URL(home.url).pathname,"/demo/arena.html");
  assert.match(home.headers.get("content-type"),/text\/html/);
  const html=await home.text();
  assert.match(html,/id="booking-form"/);
  assert.match(html,/id="arena"/);
  assert.match(html,/id="sports"/);
  assert.match(html,/class="hero"/);

  const onboard=await fetch(origin+"/demo/onboard.html");
  assert.equal(onboard.status,200);
  const onboardHtml=await onboard.text();
  assert.match(onboardHtml,/id="deployment"/);
  assert.match(onboardHtml,/id="preview-name"/);
  assert.match(onboardHtml,/id="form"/);

  for(const page of [html,onboardHtml]){
    const css=page.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/);
    assert.ok(css,"stylesheet reference missing");
    assert.equal(css[1],"/demo/theme.css","Use absolute demo assets, not root-relative browser ambiguity");
    const stylesheet=await fetch(origin+css[1]);
    assert.equal(stylesheet.status,200,"CSS must not return 404");
    assert.match(stylesheet.headers.get("content-type"),/text\/css/);
    const styles=await stylesheet.text();
    assert.ok(styles.length>5000,"Stylesheet must contain responsive component styles");
    assert.match(styles,/\.hero\{/);
    assert.match(styles,/\.sport-grid\{/);
    assert.match(styles,/@media\(max-width:620px\)/);
  }

  const loaded=new Set();
  async function followImports(path){
    if(loaded.has(path))return;
    loaded.add(path);
    const response=await fetch(origin+path);
    assert.equal(response.status,200,"Missing JavaScript module "+path);
    assert.match(response.headers.get("content-type"),/text\/javascript/);
    const script=await response.text();
    for(const match of script.matchAll(/(?:import|export)[\s\S]*?from\s*["']([^"']+)["']/g)){
      if(!match[1].startsWith("."))continue;
      const next=new URL(match[1],origin+path).pathname;
      await followImports(next);
    }
  }
  await followImports("/demo/arena.mjs");
  await followImports("/demo/onboard.mjs");
  for(const needed of ["/demo/arena.mjs","/demo/onboard.mjs","/demo/demo-data.mjs",
    "/demo/booking-model.mjs","/packages/platform-core/index.mjs",
    "/packages/platform-core/deployment.mjs"]){
    assert.ok(loaded.has(needed),needed+" must be reachable via a browser import");
  }

  const invalid=await fetch(origin+"/theme.css");
  assert.equal(invalid.status,404,"Unknown root-level routes should not be silently rewritten");
  const unsupported=await fetch(origin+"/demo/arena.html",{method:"POST"});
  assert.equal(unsupported.status,405);
  const head=await fetch(origin+"/demo/theme.css",{method:"HEAD"});
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
});
