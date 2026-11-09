#!/usr/bin/env node
/** Source-only Spring REST API inventory. This is deliberately NOT a proof of
 * runtime exposure, method security, request validation, or tenant isolation.
 *
 * npm run audit:api
 * npm run audit:api -- --json
 */
import {readdir,readFile} from "node:fs/promises";
import {resolve,join,relative} from "node:path";

const root=resolve("."),javaRoot=join(root,"apps/backend/src/main/java");
async function files(dir){
  const collected=[];
  for(const item of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,item.name);
    if(item.isDirectory())collected.push(...await files(path));
    else if(item.isFile()&&path.endsWith(".java"))collected.push(path);
  }
  return collected;
}
const api=[];
const warnings=[];
for(const file of await files(javaRoot)){
  const source=await readFile(file,"utf8");
  if(!source.includes("@RestController"))continue;
  const short=relative(root,file).replaceAll("\\","/");
  // This captures simple quoted class mapping forms. Annotation arrays,
  // constants and dynamic paths require manual OpenAPI reconciliation.
  const classAnnotation=source.slice(0,source.indexOf(" class ")+7);
  const match=classAnnotation.match(/@RequestMapping\s*\(\s*(?:(?:value|path)\s*=\s*)?"([^"]+)"/);
  const prefix=match?.[1]||"";
  if(!match)warnings.push(short+" has no simple literal class RequestMapping; check manually");
  const endpoint=/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\(\s*(?:(?:value|path)\s*=\s*)?"([^"]*)"[^)]*\))?/g;
  let found;
  while((found=endpoint.exec(source))){
    if(classAnnotation.includes(found[0])&&found.index<classAnnotation.lastIndexOf("@RequestMapping")+200 && found[1]==="RequestMapping")continue;
    const method=({GetMapping:"GET",PostMapping:"POST",PutMapping:"PUT",PatchMapping:"PATCH",DeleteMapping:"DELETE",RequestMapping:"ANY"})[found[1]];
    const suffix=found[2]||"";
    const path=(prefix+"/"+suffix).replace(/\/+/g,"/")||"/";
    const line=source.slice(0,found.index).split("\n").length;
    api.push({method,path,file:short,line,annotation:found[1]});
  }
}
api.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method)||a.file.localeCompare(b.file));
const counts={controllers:new Set(api.map(x=>x.file)).size,endpoints:api.length,
  webApi:api.filter(x=>x.path.startsWith("/api/")).length,warnings:warnings.length};
if(process.argv.includes("--json"))console.log(JSON.stringify({counts,api,warnings},null,2));
else{
  console.log("PlayNexa source API mapping audit (NOT runtime authorization verification)");
  console.log(JSON.stringify(counts));
  for(const x of api)console.log(x.method.padEnd(7)+" "+x.path.padEnd(65)+" "+x.file+":"+x.line);
  for(const w of warnings)console.log("REVIEW: "+w);
  console.log("Reconcile with runtime OpenAPI in UAT. Review all protected roles, 401/403/404/409/429/5xx and arena ownership; annotations alone do not authorize access.");
}
