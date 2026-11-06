#!/usr/bin/env node
/**
 * Local config generator only. Does not publish an arena or provision services.
 * Run: npm run arena:new -- --name "New Arena" --city Bengaluru
 *   --sports "Badminton,Football" --deployment playnexa_managed_single_tenant
 */
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {buildArenaDraft} from "../packages/platform-core/index.mjs";

function argsOf(argv){
  const args={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];if(!key.startsWith("--"))throw new Error("Unexpected argument: "+key);
    if(key==="--marketplace")throw new Error("Marketplace onboarding is postponed. All arenas retain direct online booking.");
    if(key==="--help"){args.help=true;continue}
    if(i===argv.length-1||argv[i+1].startsWith("--"))throw new Error("Missing value: "+key);
    args[key.slice(2)]=argv[++i];
  }
  return args;
}
try{
  const args=argsOf(process.argv.slice(2));
  if(args.help){console.log('Usage: npm run arena:new -- --name "Arena" --city Bengaluru --sports "Badminton,Football" --deployment customer_hosted|playnexa_managed_single_tenant|multi_tenant_saas');process.exit(0)}
  const draft=buildArenaDraft({
    name:args.name,city:args.city,sports:(args.sports||"").split(",").filter(Boolean),
    deploymentOption:args.deployment,
    hostingMode:args.mode||undefined,marketplaceListed:false,
    domains:args.domain?[args.domain]:[],primaryColor:args.primary,
    accentColor:args.accent,tagline:args.tagline,email:args.email,phone:args.phone
  });
  const outputDirectory=resolve("config","tenants");
  await mkdir(outputDirectory,{recursive:true});
  const file=resolve(outputDirectory,draft.slug+".json");
  await writeFile(file,JSON.stringify(draft,null,2)+"\n",{flag:"wx"});
  console.log("Created draft: "+file+"\nHosting: "+draft.deploymentOption+"\nEntitlements: full PlayNexa booking and operations\nStatus: draft; not provisioned or production-ready.");
}catch(err){console.error("Arena setup failed: "+err.message);process.exitCode=1}
