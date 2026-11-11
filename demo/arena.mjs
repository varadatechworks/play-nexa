import {demoRegistry} from "./demo-data.mjs";
import {DEMO_SLOT_TIMES,addDemoBooking} from "./booking-model.mjs";
import {DEPLOYMENT_DETAILS,selectDeploymentOption} from "../packages/platform-core/deployment.mjs";

const $=id=>document.getElementById(id);
const arenas=demoRegistry();
const requested=new URLSearchParams(window.location.search).get("arena");
const bookingStorageKey="playnexa-synthetic-bookings-v1";
const icons={
  BADMINTON:"🏸",SWIMMING:"🏊",CRICKET:"🏏",FOOTBALL:"⚽",PICKLEBALL:"🎾",
  BASKETBALL:"🏀",GYM:"🏋️",TENNIS:"🎾",VOLLEYBALL:"🏐",TABLE_TENNIS:"🏓",
  SQUASH:"🎾",YOGA:"🧘",HOCKEY:"🏑"
};
function todayLocal(){
  const d=new Date(),two=n=>String(n).padStart(2,"0");
  return d.getFullYear()+"-"+two(d.getMonth()+1)+"-"+two(d.getDate());
}
function currentArena(){return arenas.find(x=>x.slug===$("arena").value)||arenas[0]}
function getBookings(){
  try{const data=JSON.parse(localStorage.getItem(bookingStorageKey)||"[]");return Array.isArray(data)?data:[]}
  catch{return []}
}
function safeColor(s,fallback){
  return typeof s==="string"&&/^#[0-9a-f]{6}$/i.test(s)?s:fallback;
}
function sessionPrice(arena,sportCode){
  const value=arena.samplePrices?.[sportCode];
  return Number.isFinite(value)&&value>0 ? value:null;
}
function refreshEstimate(){
  const price=sessionPrice(currentArena(),$("demo-sport").value);
  $("booking-price").textContent=price!==null?"₹"+price.toLocaleString("en-IN"):"Set by arena";
}
if(!arenas.length)throw new Error("Sales demo needs at least one arena profile");
$("arena").replaceChildren(...arenas.map(a=>{
  const option=document.createElement("option");
  option.value=a.slug;option.textContent=a.name;return option;
}));
$("demo-time").replaceChildren(...DEMO_SLOT_TIMES.map(time=>{
  const opt=document.createElement("option");
  opt.value=time;opt.textContent=time+" — sample slot";return opt;
}));
$("arena").value=arenas.some(a=>a.slug===requested)?requested:arenas[0].slug;
$("demo-date").min=todayLocal();
$("demo-date").value=todayLocal();
$("year").textContent=new Date().getFullYear();

function render(){
  const a=currentArena();
  const deployment=selectDeploymentOption(a.deploymentOption,a.hostingMode);
  const primary=safeColor(a.brand?.primary,"#103a4d");
  const accent=safeColor(a.brand?.accent,"#f6c766");
  $("location").textContent=a.city+" · "+DEPLOYMENT_DETAILS[deployment].label;
  $("name").textContent=a.name;
  $("tagline").textContent=a.tagline||"Play your best game.";
  $("hero").style.background="linear-gradient(125deg,"+primary+" 0%,#0a283a 60%,#125063 100%)";
  $("hero").style.borderTop="4px solid "+accent;
  document.title=a.name+" | PlayNexa booking preview";
  $("sports-count").textContent=a.sports.length+" SPORT"+(a.sports.length===1?"":"S")+" TO EXPLORE";

  $("sports").replaceChildren(...a.sports.map((sport,index)=>{
    const card=document.createElement("article");
    card.className="sports-card";
    card.setAttribute("role","listitem");
    const top=document.createElement("div");top.className="sport-top";
    const emoji=document.createElement("span");emoji.className="sport-icon";
    emoji.textContent=icons[sport.code]||"🏟️";emoji.setAttribute("aria-hidden","true");
    const label=document.createElement("span");label.className="sport-label";label.textContent="BOOKING AVAILABLE";
    top.append(emoji,label);
    const heading=document.createElement("h3");heading.textContent=sport.name;
    const description=document.createElement("p");
    description.textContent="Find a time that fits your game. Simple booking from any device.";
    const bottom=document.createElement("div");bottom.className="sport-bottom";
    const info=document.createElement("div");
    const sub=document.createElement("span");sub.textContent="Illustrative from";
    const price=document.createElement("strong");
    const value=sessionPrice(a,sport.code);
    price.textContent=value!==null?" ₹"+value.toLocaleString("en-IN"):" Arena pricing";
    info.append(sub,price);
    const link=document.createElement("a");link.className="sport-link";link.href="#booking-demo";
    link.textContent="Try booking ↗";
    link.setAttribute("aria-label","Try a sample booking for "+sport.name);
    link.addEventListener("click",()=>{
      $("demo-sport").value=sport.code;
      refreshEstimate();
    });
    bottom.append(info,link);
    card.append(top,heading,description,bottom);
    card.style.animationDelay=(index*60)+"ms";
    return card;
  }));

  $("demo-sport").replaceChildren(...a.sports.map(s=>{
    const opt=document.createElement("option");
    opt.value=s.code;opt.textContent=s.name;return opt;
  }));
  refreshEstimate();
  $("booking-error").textContent="";
  $("booking-result").textContent="";
}
$("arena").addEventListener("change",()=>{
  const url=new URL(window.location.href);
  url.searchParams.set("arena",$("arena").value);
  history.replaceState({},"",url);
  render();
});
$("demo-sport").addEventListener("change",refreshEstimate);
$("booking-form").addEventListener("submit",event=>{
  event.preventDefault();
  $("booking-error").textContent="";
  $("booking-result").textContent="";
  const a=currentArena();
  try{
    const existing=getBookings();
    if(existing.length>=300)throw new Error("Clear the sales demo before creating more samples");
    const {bookings,booking}=addDemoBooking({
      arenaId:a.id,sportCode:$("demo-sport").value,date:$("demo-date").value,
      startTime:$("demo-time").value,customerName:$("demo-customer").value
    },existing,todayLocal());
    localStorage.setItem(bookingStorageKey,JSON.stringify(bookings));
    $("booking-result").textContent="✓ "+booking.id+" — sample booking created for "+
      booking.customerName+" on "+booking.date+" at "+booking.startTime+
      ". This is a demonstration only: no real reservation, payment or notification was made.";
  }catch(error){
    $("booking-error").textContent=error instanceof Error?error.message:"Unable to create sample booking";
  }
});
$("reset-bookings").addEventListener("click",()=>{
  localStorage.removeItem(bookingStorageKey);
  $("booking-result").textContent="Sample bookings were cleared from this browser.";
  $("booking-error").textContent="";
});
render();
