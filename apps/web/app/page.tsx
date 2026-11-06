"use client";
import { Activity, ArrowRight, CalendarDays, Medal, Pause, Users } from "lucide-react";
import { useArenaBrand } from "@/components/arena-brand-provider";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BookSlotLink } from "@/components/book-slot-link";
import { HomeFeatureBand } from "@/components/home-feature-band";
import { sports, values } from "@/lib/site-data";

export default function Home() {
  const arena=useArenaBrand();
  const displayedSports=arena.sports.map(name=>
    sports.find(s=>s.name.toLowerCase()===name.toLowerCase()) ||
    {name,icon:Activity,text:`Discover ${name} sessions and coaching at ${arena.name}.`}
  );
  return <><SiteHeader/><main>
    <section className="home-hero">
      {arena.heroVideoUrl ? <video className="hero-video" autoPlay muted loop playsInline poster={arena.heroImageUrl || undefined} aria-label={`${arena.name} sports activities`}><source src={arena.heroVideoUrl} type="video/mp4"/></video> : <div className="hero-video" style={{background: arena.heroImageUrl ? `url("${arena.heroImageUrl}") center/cover no-repeat` : "linear-gradient(115deg,#103d52,#162743)"}}/>}
      <div className="hero-shade"/><div className="container hero-content">
        <span className="eyebrow gold">Welcome to {arena.name}</span><h1>Where Champions <em>Begin.</em></h1>
        <h2>Play <b>&bull;</b> Train <b>&bull;</b> Compete <b>&bull;</b> Grow</h2><p>Sports, fitness and community for every age in {arena.city}.</p>
        <div className="button-row"><BookSlotLink/><Link className="btn outline light large" href="/sports">Explore Facilities <ArrowRight/></Link></div>
        {arena.heroVideoUrl && <div className="video-label"><Pause size={18}/><span>Watch {arena.name} in Action</span></div>}
      </div>
    </section>
    <section className="trust-strip"><div className="container trust-grid">
      <div><Medal/><span><strong>{displayedSports.length} Sports</strong><small>Diverse facilities under one roof</small></span></div><div><Users/><span><strong>Expert Coaching</strong><small>Guidance with proven experience</small></span></div><div><Users/><span><strong>All Age Groups</strong><small>Programs for kids, youth & adults</small></span></div><div><CalendarDays/><span><strong>Flexible Memberships</strong><small>Plans that fit your goals</small></span></div>
    </div></section>
    <HomeFeatureBand/>
    <section className="values-band"><div className="container"><span className="eyebrow gold">Our Purpose</span><h2>More Than a Sports Centre</h2><p>{arena.purpose}</p><div className="values-grid">{values.map((value, i)=><div key={value}><span>0{i+1}</span><strong>{value}</strong></div>)}</div></div></section>
    <section className="section sports-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Discover Your Game</span><h2>Explore Our Sports & Activities</h2></div><Link className="text-link" href="/sports">View all facilities <ArrowRight/></Link></div><div className="sports-grid">{displayedSports.map(({name,icon:Icon,text},index)=><Link className="sport-card" href="/sports" key={name}><div className={`sport-photo sport-photo-${index}`}><div className="sport-icon"><Icon/></div></div><div className="sport-card-body"><h3>{name}</h3><p>{text}</p><span>Explore <ArrowRight/></span></div></Link>)}</div></div></section>
    <section className="cta-band"><div className="container"><div><span className="eyebrow gold">Your journey starts here</span><h2>Ready to get moving?</h2><p>Register today and become part of {arena.city}'s growing sports community.</p></div><div className="button-row"><Link className="btn primary large" href="/register">Register Now</Link><Link className="btn outline light large" href="/contact">Talk to Us</Link></div></div></section>
  </main><SiteFooter/></>;
}
