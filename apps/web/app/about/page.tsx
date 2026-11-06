"use client";
import Link from "next/link";
import {ArrowRight,HeartHandshake,ShieldCheck,Sparkles,Users} from "lucide-react";
import {SiteHeader} from "@/components/site-header";
import {SiteFooter} from "@/components/site-footer";
import {useArenaBrand} from "@/components/arena-brand-provider";
import {values} from "@/lib/site-data";

export default function About(){
  const arena=useArenaBrand();
  return <><SiteHeader/><main>
    <section className="page-hero about-hero"><div className="container">
      <span className="eyebrow gold">Our Story</span><h1>More Than a Sports Centre</h1>
      <p>{arena.name} welcomes sports lovers in {arena.city}.</p>
    </div></section>
    <section className="section"><div className="container">
      <span className="eyebrow">Why {arena.shortName}</span>
      <h2>Play, train, compete and grow</h2><p>{arena.purpose}</p>
      <p>Explore facilities, find a suitable session and contact the arena team for coaching, memberships or events.</p>
      <Link className="text-link" href="/contact">Contact our team <ArrowRight/></Link>
    </div></section>
    <section className="values-cards section"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">What Guides Us</span><h2>Values in action</h2></div></div>
      <div className="value-card-grid">{[ShieldCheck,Users,HeartHandshake,Sparkles].map((Icon,i)=>
        <article key={values[i]}><span>0{i+1}</span><Icon/><h3>{values[i]}</h3>
          <p>Values we aim to bring to every sporting experience at {arena.name}.</p></article>)}</div>
    </div></section>
  </main><SiteFooter/></>;
}
