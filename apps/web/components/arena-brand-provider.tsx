"use client";

import {createContext,useCallback,useContext,useEffect,useState} from "react";
import {API_BASE_URL} from "@/lib/api";
import {arenaConfig} from "@/lib/arena-config";

/** A dedicated instance exposes exactly one public arena brand, never a caller-supplied tenant. */
export type ArenaBrand = {
  name:string; shortName:string; city:string; tagline:string; purpose:string;
  primaryColor:string; accentColor:string; logoUrl:string;
  heroImageUrl:string; heroVideoUrl:string; phone:string;
  sports:string[]; revision:number;
};
export const initialArenaBrand: ArenaBrand = {
  ...arenaConfig,
  sports:arenaConfig.sportsCsv.split(",").map(x=>x.trim()).filter(Boolean),
  revision:0
};
const Context=createContext<ArenaBrand>(initialArenaBrand);
const HEX=/^#[a-fA-F0-9]{6}$/;
function text(input:unknown,fallback:string,max=600){
  return typeof input==="string"&&input.trim().length>0&&input.length<=max?input.trim():fallback;
}
function safeAsset(input:unknown,fallback=""){
  if(typeof input!=="string"||!input||input.length>2048||/["'\\\s]/.test(input))return fallback;
  if(input.startsWith("/")&&!input.startsWith("//")&&!input.includes(".."))return input;
  try{
    const url=new URL(input);
    if(url.protocol==="https:"&&!url.username&&!url.password&&url.hostname.includes("."))
      return input;
  }catch{}
  return fallback;
}
export function normalizeArenaBrand(input:unknown):ArenaBrand {
  if(!input||typeof input!=="object")return initialArenaBrand;
  const b=input as Partial<ArenaBrand>;
  const colors=(value:unknown,fallback:string)=>typeof value==="string"&&HEX.test(value)?value:fallback;
  const sports=Array.isArray(b.sports)?
    b.sports.filter((s):s is string=>typeof s==="string"&&!!s.trim()&&s.length<=70).slice(0,30):[];
  return {
    name:text(b.name,initialArenaBrand.name,90),
    shortName:text(b.shortName,initialArenaBrand.shortName,40),
    city:text(b.city,initialArenaBrand.city,80),
    tagline:text(b.tagline,initialArenaBrand.tagline,150),
    purpose:text(b.purpose,initialArenaBrand.purpose,600),
    primaryColor:colors(b.primaryColor,initialArenaBrand.primaryColor),
    accentColor:colors(b.accentColor,initialArenaBrand.accentColor),
    logoUrl:safeAsset(b.logoUrl),
    heroImageUrl:safeAsset(b.heroImageUrl),
    heroVideoUrl:safeAsset(b.heroVideoUrl),
    phone:typeof b.phone==="string"&&/^[+0-9 ()-]{0,30}$/.test(b.phone)?b.phone:"",
    sports:sports.length?sports:initialArenaBrand.sports,
    revision:typeof b.revision==="number"&&Number.isSafeInteger(b.revision)&&b.revision>=0?b.revision:0
  };
}

/** Updates appearance after initial render; rebuilds are not needed for dedicated admin changes. */
export function ArenaBrandProvider({children}:{children:React.ReactNode}){
  const [brand,setBrand]=useState<ArenaBrand>(initialArenaBrand);
  const reload=useCallback(async(signal?:AbortSignal)=>{
    try{
      const response=await fetch(`${API_BASE_URL}/api/v1/public/arena-branding`,{
        cache:"no-store",credentials:"omit",signal
      });
      if(!response.ok)return;
      const value=normalizeArenaBrand(await response.json());
      if(!signal?.aborted)setBrand(value);
    }catch{/* Keep safe build-time branding during an API outage. */}
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    void reload(controller.signal);
    const updated=()=>void reload();
    window.addEventListener("playnexa:branding-updated",updated);
    return ()=>{controller.abort();window.removeEventListener("playnexa:branding-updated",updated)};
  },[reload]);
  useEffect(()=>{
    document.body.style.setProperty("--olive",brand.primaryColor);
    document.body.style.setProperty("--saffron",brand.accentColor);
    document.body.style.setProperty("--gold",brand.accentColor);
    document.title=`${brand.name} | ${brand.city}`;
  },[brand]);
  return <Context.Provider value={brand}>{children}</Context.Provider>;
}
export function useArenaBrand(){return useContext(Context)}
