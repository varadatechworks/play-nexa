"use client";
import {useEffect,useState} from "react";
import {useArenaBrand} from "@/components/arena-brand-provider";
import {API_BASE_URL} from "@/lib/api";
import Link from "next/link";
import styles from "./app.module.css";
type Release={available:boolean;latestVersionCode:number;latestVersionName:string;
 updateMode:string;releaseNotes?:string|null;downloadPageUrl:string};
export default function AndroidAppDownload(){
 const arena=useArenaBrand();
 const enabled=process.env.NEXT_PUBLIC_ARENA_ANDROID_ENABLED==="true";
 const [release,setRelease]=useState<Release|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{if(!enabled)return;const controller=new AbortController();
  fetch(API_BASE_URL+"/api/v1/public/app-release/android",{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error("Unavailable");return response.json() as Promise<Release>})
   .then(setRelease).catch(e=>{if(!controller.signal.aborted)setError("Unable to check the latest APK. Please try again.");});
  return()=>controller.abort();
 },[enabled]);
 if(!enabled)return <main className={styles.page}><section className={styles.card}><h1>{arena.name} Android App</h1><p>This arena has not published its own Android application yet. Book online from the website.</p><Link href="/" className={styles.back}>Return to {arena.name}</Link></section></main>;
 return <main className={styles.page}>
  <section className={styles.card}>
    {arena.logoUrl&&<img className={styles.logo} src={arena.logoUrl} alt={arena.name}/>}
    <span className={styles.eyebrow}>{arena.name} · {arena.city}</span>
    <h1>Get the Android App</h1>
    <p>Book your favourite sport, access bookings and show your check-in QR at the venue.</p>
    {release?.available?<><p className={styles.version}>Latest version {release.latestVersionName} · Build {release.latestVersionCode}</p>
       <a className={styles.download} href={API_BASE_URL+"/api/v1/public/app-download/android"}>Download APK <span aria-hidden="true">↓</span></a>
       {release.releaseNotes&&<section className={styles.notes}><strong>What's new</strong><p>{release.releaseNotes}</p></section>}
       <p className={styles.hint}>Android may ask permission to install an APK from your browser. Install it over your existing app; uninstalling is usually unnecessary if the APK uses the same signing certificate.</p>
      </>:release?<p role="status" className={styles.notice}>The Android APK is not published yet. Please check again later.</p>:
       <p role="status" className={styles.notice}>{error||"Checking the latest version…"}</p>}
    <Link href="/" className={styles.back}>Return to {arena.name}</Link>
  </section>
 </main>;
}
