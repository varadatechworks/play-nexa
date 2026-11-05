#!/usr/bin/env node
/**
 * Turn one non-secret arena JSON draft into dedicated deployment settings.
 * Output intentionally excludes merchant passwords, OTP and database credentials.
 * Run: npm run arena:env -- config/tenants/victory-sports-arena.json
 */
import {readFile} from "node:fs/promises";
import {validateRegistry} from "../packages/platform-core/index.mjs";
const file=process.argv[2];
if(!file || file==="--help"){
  console.log("Usage: npm run arena:env -- config/tenants/<slug>.json");
  process.exit(file?0:1);
}
try{
  const arena=JSON.parse(await readFile(file,"utf8"));
  validateRegistry([arena]);
  const escaped=value=>JSON.stringify(String(value??""));
  const rows=[
    "# PlayNexa arena deployment settings (NON-SECRET)",
    "# Copy only the relevant variables into each deployment's environment.",
    "# Dedicated hosting can be enabled now. SaaS mode requires verified domain routing and DB isolation.",
    `PLAYNEXA_HOSTING_MODE=${escaped(arena.hostingMode)}`,
    `ARENA_NAME=${escaped(arena.name)}`,
    `ARENA_SHORT_NAME=${escaped(arena.name.slice(0,25))}`,
    `ARENA_CITY=${escaped(arena.city)}`,
    `ARENA_TAGLINE=${escaped(arena.tagline)}`,
    `ARENA_PRIMARY_COLOR=${escaped(arena.brand.primary)}`,
    `ARENA_ACCENT_COLOR=${escaped(arena.brand.accent)}`,
    `ARENA_LOGO_URL=${escaped(arena.brand.logoUrl||"")}`,
    `ARENA_HERO_IMAGE_URL=${escaped(arena.brand.heroUrl||"")}`,
    `ARENA_SPORTS=${escaped(arena.sports.map(s=>s.name).join(","))}`,
    "",
    "# Web build-time settings. Set these on the arena web deployment:",
    `NEXT_PUBLIC_ARENA_NAME=${escaped(arena.name)}`,
    `NEXT_PUBLIC_ARENA_SHORT_NAME=${escaped(arena.name.slice(0,25))}`,
    `NEXT_PUBLIC_ARENA_CITY=${escaped(arena.city)}`,
    `NEXT_PUBLIC_ARENA_TAGLINE=${escaped(arena.tagline)}`,
    `NEXT_PUBLIC_ARENA_PRIMARY_COLOR=${escaped(arena.brand.primary)}`,
    `NEXT_PUBLIC_ARENA_ACCENT_COLOR=${escaped(arena.brand.accent)}`,
    `NEXT_PUBLIC_ARENA_LOGO_URL=${escaped(arena.brand.logoUrl||"")}`,
    `NEXT_PUBLIC_ARENA_HERO_IMAGE_URL=${escaped(arena.brand.heroUrl||"")}`,
    `NEXT_PUBLIC_ARENA_SPORTS=${escaped(arena.sports.map(s=>s.name).join(","))}`,
    "",
    "# Mobile build-time values (requires an arena-owned PNG icon and signing key):",
    `ARENA_APP_NAME=${escaped(arena.name)}`,
    `ARENA_APP_SLUG=${escaped("playnexa-"+arena.slug)}`,
    `ARENA_ANDROID_PACKAGE=${escaped("com.varadatechworks.playnexa."+arena.slug.replace(/-/g,"_"))}`,
    `ARENA_APP_SCHEME=${escaped("pn"+arena.slug.replace(/-/g,""))}`,
    "# ARENA_APP_ICON_PATH=./assets/images/your-arena-owned-icon.png",
    "# PLAYNEXA_BRANDED_RELEASE=true  (enable only once icon/package/scheme are valid)",
    "",
    "# Secret manager ONLY: DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET /",
    "# RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET / SMTP credentials",
    "# Never commit these credentials, reuse a production Jnapanam database,",
    "# or publish SaaS until server-enforced tenant isolation is verified."
  ];
  process.stdout.write(rows.join("\n")+"\n");
}catch(error){console.error("Cannot render arena environment: "+error.message);process.exitCode=1}
