"use client";

import {FormEvent,useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {api,ApiError} from "@/lib/api";
import {useApp} from "@/components/app-provider";
import {useArenaBrand,type ArenaBrand} from "@/components/arena-brand-provider";

type FieldName=Exclude<keyof ArenaBrand,"sports"|"revision">;
const fields: {key:FieldName;label:string;max:number;required?:boolean}[]=[
  {key:"name",label:"Arena display name",max:90,required:true},
  {key:"shortName",label:"Short name / brand",max:40,required:true},
  {key:"city",label:"City",max:80,required:true},
  {key:"tagline",label:"Hero tagline",max:150,required:true},
  {key:"purpose",label:"About this arena",max:600,required:true},
  {key:"phone",label:"Contact phone (optional)",max:30},
  {key:"logoUrl",label:"Logo URL (HTTPS or /images/...)",max:2048},
  {key:"heroImageUrl",label:"Hero image URL (optional)",max:2048},
  {key:"heroVideoUrl",label:"Hero video URL (optional)",max:2048}
];

export default function ArenaBrandingSettings(){
  const {user,ready}=useApp();
  const publicBrand=useArenaBrand();
  const [draft,setDraft]=useState<ArenaBrand|null>(null);
  const [sportsText,setSportsText]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const allowed=!!user?.roles.some(r=>r==="ADMIN"||r==="SUPER_ADMIN");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const brand=await api<ArenaBrand>("/api/v1/admin/arena-branding");
      setDraft(brand);setSportsText(brand.sports.join(", "));
    }catch(e){setError(e instanceof ApiError?e.message:"Unable to load arena branding.")}
    finally{setLoading(false)}
  },[]);

  useEffect(()=>{if(ready&&allowed)void load();else if(ready)setLoading(false)},[ready,allowed,load]);
  function change(key:FieldName,value:string){
    setDraft(current=>current?{...current,[key]:value}:current);setSuccess("");
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!draft||saving)return;
    setSaving(true);setError("");setSuccess("");
    try{
      const sports=sportsText.split(",").map(s=>s.trim()).filter(Boolean);
      if(!sports.length||new Set(sports.map(s=>s.toLowerCase())).size!==sports.length)
        throw new Error("Enter at least one sport, without duplicates.");
      const result=await api<ArenaBrand>("/api/v1/admin/arena-branding",{
        method:"PUT",body:JSON.stringify({...draft,sports})
      });
      setDraft(result);setSportsText(result.sports.join(", "));
      setSuccess("Branding saved. The public arena website now uses these settings.");
      window.dispatchEvent(new Event("playnexa:branding-updated"));
    }catch(e){
      setError(e instanceof ApiError?e.status===409?
        "Another administrator saved changes. Reload the page before editing again.":e.message:
        e instanceof Error?e.message:"Unable to update branding.");
    }finally{setSaving(false)}
  }
  if(!ready||loading)return <main className="admin-basic-page"><p role="status">Loading arena settings…</p></main>;
  if(!allowed)return <main className="admin-basic-page"><h1>Access restricted</h1></main>;
  if(!draft)return <main className="admin-basic-page"><h1>Branding & identity</h1><p role="alert">{error||"No branding available."}</p><button className="btn outline" onClick={()=>void load()}>Try again</button></main>;
  return <main className="admin-basic-page" style={{display:"grid",gap:18}}>
    <header className="admin-page-heading"><div><span className="eyebrow">Arena setup</span><h1>Branding & identity</h1>
      <p>Update this dedicated arena without changing source code. Logo and hero assets must already be hosted at approved URLs.</p></div>
      <Link href="/" target="_blank" rel="noopener noreferrer">Open public site</Link>
    </header>
    <div className="admin-card">
      <p><strong>Dedicated instance</strong> • Revision {draft.revision} • Changes update this arena only.</p>
      <p style={{fontSize:13}}>Facility schedules, payments, taxes, invoice identity and DNS remain separate setup steps. Shared SaaS onboarding is not enabled.</p>
    </div>
    <form className="admin-card" onSubmit={e=>void save(e)}>
      <h2>Public arena identity</h2>
      <div className="form-grid">
        {fields.map(f=><label key={f.key}>{f.label}
          {f.key==="purpose"?<textarea rows={3} maxLength={f.max} required={f.required} value={draft[f.key]} onChange={e=>change(f.key,e.target.value)}/>:
          <input maxLength={f.max} required={f.required} value={draft[f.key]} onChange={e=>change(f.key,e.target.value)}/>}
        </label>)}
        <label>Primary colour<input type="color" value={draft.primaryColor} onChange={e=>change("primaryColor",e.target.value)}/></label>
        <label>Accent colour<input type="color" value={draft.accentColor} onChange={e=>change("accentColor",e.target.value)}/></label>
        <label>Sports (comma separated)<textarea required rows={2} value={sportsText} onChange={e=>setSportsText(e.target.value)}/></label>
      </div>
      <div style={{margin:"18px 0",border:"1px solid #d5dddc",borderRadius:12,
        background:draft.primaryColor,color:"#fff",padding:24}}>
        <span style={{fontSize:12,letterSpacing:1,opacity:.9}}>LIVE BRAND PREVIEW</span>
        <h2 style={{color:"#fff",margin:"12px 0"}}>{draft.name||"Arena"}</h2>
        <p style={{color:"#fff"}}>{draft.tagline}</p>
        <span style={{display:"inline-block",padding:"9px 15px",borderRadius:8,
          background:draft.accentColor,color:"#111",fontWeight:800}}>Explore facilities</span>
      </div>
      {error&&<p role="alert" className="form-error">{error}</p>}
      {success&&<p role="status" style={{color:"#1a693d"}}>{success}</p>}
      <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
        <button className="btn primary" disabled={saving} type="submit">{saving?"Saving…":"Save arena branding"}</button>
        <button className="btn outline" type="button" disabled={saving} onClick={()=>void load()}>Discard changes / reload</button>
      </div>
      <p style={{fontSize:12,color:"#66705d"}}>Current website brand: {publicBrand.name}. Changes are version-checked and saved to this arena database.</p>
    </form>
  </main>;
}
