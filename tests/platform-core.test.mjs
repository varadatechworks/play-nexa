import test from "node:test";
import assert from "node:assert/strict";
import {
  HOSTING_MODES, LISTING_CHANNELS, slugify, normalizeHost, buildArenaDraft,
  validateRegistry, resolveArenaHost, marketplaceSearch, publicArena,
  bookingHandoff, requireTenantAccess
} from "../packages/platform-core/index.mjs";
import {demoArenas} from "../demo/demo-data.mjs";

const base={name:"Victory Sports Zone",city:"Bengaluru",sports:["Badminton","Swimming"]};

test("hosting and marketplace are independent axes",()=>{
  assert.deepEqual(HOSTING_MODES,["dedicated","saas"]);
  assert.deepEqual(LISTING_CHANNELS,["direct","marketplace"]);
  for(const mode of HOSTING_MODES){
    assert.equal(buildArenaDraft({...base,hostingMode:mode,marketplaceListed:true}).hostingMode,mode);
    assert.equal(buildArenaDraft({...base,hostingMode:mode,marketplaceListed:true}).marketplaceListed,true);
  }
});
test("fast setup creates a safe draft with defaults",()=>{
  const arena=buildArenaDraft(base);
  assert.equal(arena.slug,"victory-sports-zone");
  assert.equal(arena.status,"draft");
  assert.deepEqual(arena.verifiedDomains,[]);
  assert.equal(arena.brand.accent,"#efa948");
  assert.equal(arena.timezone,"Asia/Kolkata");
  assert.equal(arena.sports.length,2);
});
test("slug and hostname normalization",()=>{
  assert.equal(slugify("Arena #17 Bengaluru!"),"arena-17-bengaluru");
  assert.equal(normalizeHost("ARENA.Example.COM:443"),"arena.example.com");
  assert.throws(()=>normalizeHost("https://arena.example.com"),/Invalid host/);
  assert.throws(()=>normalizeHost("evil..example.com"),/Invalid host/);
});
test("rejects missing sports and malformed colours",()=>{
  assert.throws(()=>buildArenaDraft({...base,sports:[]}),/Sports/);
  assert.throws(()=>buildArenaDraft({...base,accentColor:"red; background:url(x)"}),/colour/);
  assert.throws(()=>buildArenaDraft({...base,sports:["Gym","Gym"]}),/unique/);
});
test("rejects embedded credentials and non-HTTPS remote artwork",()=>{
  assert.throws(()=>buildArenaDraft({...base,logoUrl:"javascript:alert(1)"}),/HTTPS/);
  assert.throws(()=>buildArenaDraft({...base,logoUrl:"http://example.com/a.png"}),/HTTPS/);
  assert.throws(()=>buildArenaDraft({...base,bookingBaseUrl:"https://admin:password@example.com/"}),/HTTPS/);
});
test("registry detects duplicate tenant ids and domains",()=>{
  assert.equal(validateRegistry(demoArenas),true);
  assert.throws(()=>validateRegistry([demoArenas[0],demoArenas[0]]),/Duplicate/);
  const bad={...demoArenas[1],domains:[demoArenas[0].domains[0]],verifiedDomains:[demoArenas[0].domains[0]]};
  assert.throws(()=>validateRegistry([demoArenas[0],bad]),/Domain already owned/);
});
test("domain lookup fails closed for unknown and draft arenas",()=>{
  assert.deepEqual(resolveArenaHost("not-registered.example.com",demoArenas),{kind:"unknown",host:"not-registered.example.com"});
  assert.equal(resolveArenaHost("riverside.playnexa.example",demoArenas).arenaId,"arena-riverside");
  const draft={...demoArenas[0],status:"draft"};
  assert.equal(resolveArenaHost("riverside.playnexa.example",[draft]).kind,"unknown");
});
test("dedicated and SaaS domains both resolve to exact tenant",()=>{
  assert.deepEqual(resolveArenaHost("urban.playnexa.example",demoArenas),{
    kind:"arena",host:"urban.playnexa.example",arenaId:"arena-urban",hostingMode:"saas"
  });
  assert.equal(resolveArenaHost("summit.playnexa.example",demoArenas).hostingMode,"dedicated");
});
test("marketplace domain never implicitly becomes an arena",()=>{
  const result=resolveArenaHost("book.playnexa.example",demoArenas,["book.playnexa.example"]);
  assert.deepEqual(result,{kind:"marketplace",host:"book.playnexa.example"});
});
test("marketplace includes only published and explicitly listed venues",()=>{
  const all=marketplaceSearch(demoArenas);
  assert.equal(all.length,3);
  assert.ok(!all.some(a=>a.slug==="private"));
  assert.equal(marketplaceSearch([...demoArenas,{...demoArenas[3],id:"arena-temp",slug:"temp",status:"draft",marketplaceListed:true,domains:["temp.playnexa.example"],verifiedDomains:[]}]).length,3);
});
test("marketplace supports sport, city and general searches",()=>{
  assert.equal(marketplaceSearch(demoArenas,{city:"Mysuru"}).length,1);
  assert.equal(marketplaceSearch(demoArenas,{sport:"PICKLEBALL"})[0].slug,"urban");
  assert.equal(marketplaceSearch(demoArenas,{query:"cricket"}).length,2);
  assert.equal(marketplaceSearch(demoArenas,{city:"Delhi"}).length,0);
});
test("public profiles do not expose internal or sales-only values",()=>{
  const out=publicArena({...demoArenas[0],gatewaySecret:"NEVER_PUBLIC",contact:{secret:"private"}});
  assert.equal(out.gatewaySecret,undefined);
  assert.equal(out.contact,undefined);
  assert.equal(out.samplePrices,undefined);
  assert.equal(out.name,"Riverside Sports Arena");
});
test("booking goes to exactly one arena booking authority",()=>{
  const arena={...demoArenas[0],domains:[...demoArenas[0].domains,"riverside.example.org"],verifiedDomains:[...demoArenas[0].verifiedDomains,"riverside.example.org"],bookingBaseUrl:"https://riverside.example.org/book"};
  assert.equal(bookingHandoff(arena), "https://riverside.example.org/book?source=playnexa");
  assert.equal(bookingHandoff({...arena,status:"draft"}),null);
  assert.equal(bookingHandoff({...arena,bookingBaseUrl:null}),null);
  assert.equal(bookingHandoff({...arena,bookingBaseUrl:"https://unverified.example.com/book"}),null);
  assert.equal(bookingHandoff({...arena,marketplaceListed:false}),null);
});
test("tenant access helper rejects host, actor and target mismatch",()=>{
  assert.equal(requireTenantAccess({hostTenantId:"a",actorTenantId:"a",targetTenantId:"a"}),true);
  assert.throws(()=>requireTenantAccess({hostTenantId:"a",actorTenantId:"b",targetTenantId:"b"}),/TENANT_ACCESS_DENIED/);
  assert.throws(()=>requireTenantAccess({hostTenantId:"a",actorTenantId:"a",targetTenantId:"b"}),/TENANT_ACCESS_DENIED/);
  assert.throws(()=>requireTenantAccess({hostTenantId:"a",actorTenantId:"a"}),/TENANT_ACCESS_DENIED/);
});

test("new customer domains remain unverified and cannot route",()=>{
  const draft=buildArenaDraft({...base,domains:["victory.example.com"]});
  const published={...draft,status:"published"};
  assert.equal(resolveArenaHost("victory.example.com",[published]).kind,"unknown");
  const verified={...published,verifiedDomains:["victory.example.com"]};
  assert.equal(resolveArenaHost("victory.example.com",[verified]).arenaId,verified.id);
  assert.throws(()=>validateRegistry([{...draft,verifiedDomains:["other.example.com"]}]),/Verified domain/);
});
test("marketplace host cannot collide with an arena's custom domain",()=>{
  assert.throws(()=>resolveArenaHost("riverside.playnexa.example",demoArenas,["riverside.playnexa.example"]),/Marketplace domain/);
});
