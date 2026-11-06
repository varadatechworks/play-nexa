"use client";

import {ChevronLeft,ChevronRight,PlayCircle,Trophy} from "lucide-react";
import Link from "next/link";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";
import {useArenaBrand} from "@/components/arena-brand-provider";

type LiveEvent={id:string;title:string;description:string;eventType:string;startsAt:string;endsAt:string;status:string;imageUrl?:string};
export function HomeFeatureBand(){
  const arena=useArenaBrand();
  const [events,setEvents]=useState<LiveEvent[]>([]);
  const [index,setIndex]=useState(0);
  const event=events[index];
  useEffect(()=>{
    let active=true;
    void api<LiveEvent[]>("/api/v1/public/content/events")
      .then(rows=>{if(active){setEvents((rows||[])
        .filter(e=>e.status==="PUBLISHED"&&new Date(e.endsAt).getTime()>=Date.now())
        .sort((a,b)=>a.startsAt.localeCompare(b.startsAt)).slice(0,5));setIndex(0);}})
      .catch(()=>{if(active)setEvents([])});
    return()=>{active=false};
  },[]);
  useEffect(()=>{
    if(events.length<2)return;
    const timer=window.setInterval(()=>setIndex(i=>(i+1)%events.length),5500);
    return()=>window.clearInterval(timer);
  },[events.length]);
  const move=(step:number)=>setIndex(i=>events.length?(i+step+events.length)%events.length:0);
  return <section className="feature-band section"><div className="container feature-grid">
    <article className="feature-card quote-card"><div style={{padding:24}}>
      <Trophy aria-hidden="true" size={36}/><span className="eyebrow">Play together</span>
      <h3>{arena.name}</h3><p>{arena.purpose}</p></div></article>
    <article className="feature-card event-card"><div className="section-kicker"><span/>Upcoming Events<span/></div>
      {event?<><div className="event-body">
        <div className="event-visual" style={{backgroundImage:event.imageUrl?
          `linear-gradient(#0003,#0008),url("${event.imageUrl}")`:"linear-gradient(#1b425a,#14283d)"}}>
          <PlayCircle/><span>{event.eventType.replaceAll("_"," ")}</span>
        </div><div><h3>{event.title}</h3><p>{event.description}</p>
        <p className="event-meta">{new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(event.startsAt))}</p>
        <Link className="text-link" href="/events">Event details</Link></div></div>
        {events.length>1&&<div className="slider-controls">
          <button type="button" aria-label="Previous event" onClick={()=>move(-1)}><ChevronLeft/></button>
          {events.map((x,i)=><button type="button" className={i===index?"event-dot active":"event-dot"}
            aria-label={"Show "+x.title} onClick={()=>setIndex(i)} key={x.id}/>)}
          <button type="button" aria-label="Next event" onClick={()=>move(1)}><ChevronRight/></button>
        </div>}</>:
        <div className="event-body"><div className="event-visual" style={{background:"linear-gradient(#1b425a,#14283d)"}}>
          <PlayCircle/><span>{arena.name}</span></div>
          <div><h3>Events announced here</h3><p>Confirmed camps and tournaments appear once published.</p>
            <Link className="text-link" href="/events">See all events</Link></div></div>}
    </article>
    <article className="feature-card founder-card"><div style={{padding:24}}>
      <span className="eyebrow">Our commitment</span><h3>More opportunities to play</h3>
      <p>Explore {arena.sports.join(", ")} and manage your bookings, training and memberships in one place.</p>
      <Link className="text-link" href="/sports">Explore sports</Link>
    </div></article>
  </div></section>;
}
