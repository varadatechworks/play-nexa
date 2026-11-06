"use client";
import Link from "next/link";
import {useArenaBrand} from "@/components/arena-brand-provider";

export function SiteFooter() {
  const arena=useArenaBrand();
  return <footer className="site-footer"><div className="container footer-grid">
    <div>{arena.logoUrl?<img src={arena.logoUrl} alt={arena.name} width={155} height={120} style={{objectFit:"contain"}}/>:
      <strong style={{fontSize:23}}>{arena.shortName}</strong>}
      <p>{arena.tagline}</p><p>{arena.purpose}</p></div>
    <div><h3>Explore</h3><Link href="/about">About Us</Link><Link href="/sports">Sports &amp; Facilities</Link><Link href="/memberships">Memberships</Link><Link href="/events">Events</Link></div>
    <div><h3>Support</h3><Link href="/contact">Contact Us</Link><Link href="/login">Login</Link><Link href="/register">Register</Link></div>
    <div><h3>Visit Us</h3><p>{arena.name}<br/>{arena.city}, India</p>
      {arena.phone&&<a href={`tel:${arena.phone.replace(/[^+0-9]/g,"")}`}>{arena.phone}</a>}</div>
  </div><div className="footer-bottom">© {new Date().getFullYear()} {arena.name}. Booking software powered by PlayNexa.</div></footer>;
}
