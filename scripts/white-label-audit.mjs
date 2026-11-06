#!/usr/bin/env node
/** Read-only scan of customer-facing source; require zero results before commercial release.
 * npm run branding:audit      -> report
 * npm run branding:audit -- --strict -> fail on any leftover Jnapanam branding
 */
import {readdir,readFile} from "node:fs/promises";
import {join,relative,extname,resolve} from "node:path";
const root=resolve(".");
const locations=["apps/web/app","apps/web/components","apps/mobile/src","apps/mobile/app.json"];
const textExts=new Set([".ts",".tsx",".js",".jsx",".json",".css"]);
const pattern=/\b(?:jnapanam|holalkere)\b|jnapanam[._-]|jnapanam\.in/gi;
const findings=[];
async function scan(p){
  const entries=await readdir(p,{withFileTypes:true});
  for(const entry of entries){
    const path=join(p,entry.name);
    if(entry.isDirectory()){if(!["node_modules",".next","build","dist","tests"].includes(entry.name))await scan(path);continue;}
    if(!entry.isFile()||!textExts.has(extname(path)))continue;
    const text=await readFile(path,"utf8");
    const lines=text.split(/\r?\n/);
    for(let i=0;i<lines.length;i++){
      pattern.lastIndex=0;
      if(pattern.test(lines[i]))findings.push({file:relative(root,path),line:i+1});
    }
  }
}
for(const dir of locations){
  const p=join(root,dir);
  if(dir.endsWith(".json")){
    const text=await readFile(p,"utf8");
    text.split(/\r?\n/).forEach((line,i)=>{pattern.lastIndex=0;if(pattern.test(line))findings.push({file:dir,line:i+1})});
  }else await scan(p);
}
console.log(`White-label audit: ${findings.length} potential legacy-brand references in ${new Set(findings.map(f=>f.file)).size} files.`);
for(const f of findings)console.log(`${f.file}:${f.line}`);
if(findings.length&&process.argv.includes("--strict")){
  console.error("Release blocked: remove or explicitly migrate legacy content before white-label commercial deployment.");
  process.exitCode=1;
}
