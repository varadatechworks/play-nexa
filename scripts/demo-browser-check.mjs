#!/usr/bin/env node
/**
 * Browser smoke test for the PlayNexa offline demo.
 * GitHub CI installs Chromium/Playwright separately; root npm test has no browser dependency.
 * These screenshots are CI evidence, not real payment or production UAT.
 */
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createDemoServer} from "./demo-server.mjs";

const server=createDemoServer();
await new Promise((yes,no)=>{
  server.once("error",no);
  server.listen(0,"127.0.0.1",yes);
});
const origin="http://127.0.0.1:"+server.address().port;
const folder=resolve(".artifacts");
await mkdir(folder,{recursive:true});
let browser;
const failures=[];
try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on("pageerror",err=>failures.push("Browser JS: "+err.message));
  page.on("response",res=>{
    if(new URL(res.url()).origin===origin&&res.status()>=400)
      failures.push("HTTP "+res.status()+": "+res.url());
  });

  await page.goto(origin+"/",{waitUntil:"networkidle"});
  assert.match(page.url(),/\/demo\/arena\.html/);
  await page.waitForSelector(".sports-card");
  assert.equal(await page.locator(".sports-card").count(),3);
  assert.equal((await page.locator("#name").textContent()).trim(),"Riverside Sports Arena");
  assert.equal(await page.locator("#demo-sport option").count(),3);
  const bg=await page.locator("body").evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.notEqual(bg,"rgba(0, 0, 0, 0)","Missing stylesheet: body has no computed background");
  const headerHeight=await page.locator(".site-header").evaluate(e=>e.getBoundingClientRect().height);
  assert.ok(headerHeight>55,"Missing component styling: header collapsed");
  await page.screenshot({path:resolve(folder,"playnexa-arena-desktop.png"),fullPage:true});

  // Browser DOM interaction, not a source-only test:
  await page.locator("#demo-customer").fill("QA Demo Player");
  await page.locator("#demo-sport").selectOption("BADMINTON");
  await page.locator("#booking-form button[type=submit]").click();
  await page.waitForFunction(()=>document.querySelector("#booking-result")?.textContent?.includes("sample booking created"));
  assert.match(await page.locator("#booking-result").textContent(),/no real reservation/i);

  await page.goto(origin+"/demo/onboard.html",{waitUntil:"networkidle"});
  await page.waitForSelector("#deployment");
  await page.locator("#name").fill("Victory QA Sports Arena");
  await page.locator("#city").fill("Bengaluru");
  await page.locator("#deployment").selectOption("multi_tenant_saas");
  await page.locator("#sports").fill("Badminton, Cricket");
  await page.locator("#form button[type=submit]").click();
  await page.locator("#result:not(.hidden)").waitFor({timeout:10000});
  const href=await page.locator("#preview-link").getAttribute("href");
  assert.match(href,/arena=victory-qa-sports-arena/);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:resolve(folder,"playnexa-onboarding-desktop.png"),fullPage:true});

  await page.goto(new URL(href,page.url()).href,{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.querySelector("#name")?.textContent==="Victory QA Sports Arena");
  assert.equal(await page.locator(".sports-card").count(),2);
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:"networkidle"});
  await page.waitForSelector(".sports-card");
  const overflow=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth
  }));
  assert.ok(overflow.scroll<=overflow.viewport+2,
    "Mobile page overflow: "+JSON.stringify(overflow));
  await page.screenshot({path:resolve(folder,"playnexa-arena-mobile.png"),fullPage:true});
  await page.goto(origin+"/demo/onboard.html",{waitUntil:"networkidle"});
  const onboardOverflow=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth
  }));
  assert.ok(onboardOverflow.scroll<=onboardOverflow.viewport+2,
    "Mobile onboarding overflow: "+JSON.stringify(onboardOverflow));
  await page.screenshot({path:resolve(folder,"playnexa-onboarding-mobile.png"),fullPage:true});

  assert.deepEqual(failures,[],"No same-origin asset failures or browser script errors permitted");
  console.log("PASS: live Chromium navigation, CSS rendering, sample booking, onboarding, desktop/mobile layouts.");
  console.log("Captured 4 full-page screenshots in .artifacts/");
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
