#!/usr/bin/env node
/**
 * Read-only static inventory of PlayNexa customer/admin web pages and Expo
 * screens. This is NOT a browser-based accessibility, UAT or penetration test.
 * Run npm run audit:routes (human) or npm run audit:routes -- --json (machine).
 */
import {readdir,readFile} from "node:fs/promises";
import {resolve,relative,join} from "node:path";

const root=resolve(".");
const report={generatedAt:null,counts:{webRoutes:0,mobileScreens:0},routes:[],flags:[]};
const checks=[
  {key:"legacy_brand",regex:/\b(?:jnapanam|holalkere)\b|jnapanam[._-]/i,
    why:"Legacy venue identity: review text, media or data before white-label release"},
  {key:"development_endpoint",regex:/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i,
    why:"Localhost URL: ensure this is not shipped to an arena customer"},
  {key:"raw_network_message",regex:/Failed to fetch|Network request failed|Internal Server Error|fetch failed/i,
    why:"Technical failure string: show a helpful localized user message"},
  {key:"browser_alert",regex:/\b(?:window\.)?alert\s*\(/,
    why:"Browser alert: consider accessible dialog and non-blocking feedback"},
  {key:"console_error",regex:/console\.(?:error|log)\s*\(/,
    why:"Console diagnostics: check that PII, tokens, or payloads are not logged"}
];
async function traverse(directory,filter){
  const found=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const p=join(directory,entry.name);
    if(entry.isDirectory() && !["node_modules",".next","dist","build"].includes(entry.name)){
      found.push(...await traverse(p,filter));
    } else if(entry.isFile() && filter(p))found.push(p);
  }
  return found;
}
const web=await traverse(join(root,"apps/web/app"),p=>p.endsWith("/page.tsx"));
const mobile=await traverse(join(root,"apps/mobile/src/app"),p=>p.endsWith(".tsx")&&!p.endsWith("/_layout.tsx"));
report.counts.webRoutes=web.length;report.counts.mobileScreens=mobile.length;
for(const [type,files] of [["web",web],["mobile",mobile]]){
  for(const file of files){
    const lines=(await readFile(file,"utf8")).split(/\r?\n/);
    const name=relative(root,file).replaceAll("\\","/");
    const route=type==="web"?
      "/"+name.replace(/^apps\/web\/app\//,"").replace(/\/page\.tsx$/,"").replace(/^page\.tsx$/,"")
      : name.replace(/^apps\/mobile\/src\/app\//,"").replace(/\.tsx$/,"");
    report.routes.push({type,route,file:name});
    for(let index=0;index<lines.length;index++){
      for(const check of checks){
        // React Native Alert.alert is an appropriate native confirmation UI, not a browser alert.
        if(type==="mobile" && check.key==="browser_alert")continue;
        if(check.regex.test(lines[index]))report.flags.push({
          type,route,file:name,line:index+1,category:check.key,reason:check.why
        });
      }
    }
  }
}
report.routes.sort((a,b)=>a.file.localeCompare(b.file));
report.flags.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line);
if(process.argv.includes("--json"))process.stdout.write(JSON.stringify(report,null,2)+"\n");
else{
  console.log("PlayNexa read-only source audit");
  console.log(report.counts.webRoutes+" Next.js pages, "+report.counts.mobileScreens+" mobile screens");
  for(const row of report.routes)console.log(row.type.padEnd(6)+" "+row.route.padEnd(38)+" "+row.file);
  console.log("\nReview flags: "+report.flags.length+" occurrences; not all flags are defects.");
  for(const issue of report.flags)console.log(issue.file+":"+issue.line+" ["+issue.category+"] "+issue.reason);
  console.log("\nNOT VERIFIED by this scan: visual polish, role behavior, booking UAT, live payments, security penetration or production configuration.");
}
