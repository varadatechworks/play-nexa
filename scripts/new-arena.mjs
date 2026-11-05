#!/usr/bin/env node
/**
 * Local config generator only. Does not publish an arena or provision services.
 * Run: npm run arena:new -- --name "New Arena" --city Bengaluru
 *   --sports "Badminton,Football" --mode dedicated --marketplace
 */
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {buildArenaDraft} from "../packages/platform-core/index.mjs";

function argsOf(argv){
  const args={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];if(!key.startsWith("--"))throw new Error("Unexpected argument: "+key);
    if(key==="--marketplace"){args.marketplace=true;continue}
    if(i===argv.length-1||argv[i+1].startsWith("--"))throw new Error("Missing value: "+key);
    args[key.slice(2)]=argv[++i];
  }
  return args;
}
try{
  const args=argsOf(process.argv.slice(2));
  if(args.help){console.log('Usage: npm run arena:new -- --name "Arena" --city Bengaluru --sports "Badminton,Football" --mode dedicated [--marketplace]');process.exit(0)}
  const draft=buildArenaDraft({
    name:args.name,city:args.city,sports:(args.sports||"").split(",").filter(Boolean),
    hostingMode:args.mode||"dedicated",marketplaceListed:Boolean(args.marketplace),
    domains:args.domain?[args.domain]:[],primaryColor:args.primary,
    accentColor:args.accent,tagline:args.tagline,email:args.email,phone:args.phone
  });
  const outputDirectory=resolve("config","tenants");
  await mkdir(outputDirectory,{recursive:true});
  const file=resolve(outputDirectory,draft.slug+".json");
  await writeFile(file,JSON.stringify(draft,null,2)+"\n",{flag:"wx"});
  console.log("Created draft: "+file+"\nStatus: draft. This is not a production deployment.");
}catch(err){console.error("Arena setup failed: "+err.message);process.exitCode=1}
