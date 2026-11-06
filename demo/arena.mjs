import {demoRegistry} from "./demo-data.mjs";
import {DEMO_SLOT_TIMES,addDemoBooking} from "./booking-model.mjs";
import {DEPLOYMENT_DETAILS,selectDeploymentOption} from "../packages/platform-core/deployment.mjs";

const $=id=>document.getElementById(id);
const arenas=demoRegistry();
const requested=new URLSearchParams(window.location.search).get("arena");
const bookingStorageKey="playnexa-synthetic-bookings-v1";
function todayLocal(){
  const d=new Date(), two=n=>String(n).padStart(2,"0");
  return d.getFullYear()+"-"+two(d.getMonth()+1)+"-"+two(d.getDate());
}
function currentArena(){return arenas.find(x=>x.slug===$("arena").value)||arenas[0]}
function getBookings(){
  try{const data=JSON.parse(localStorage.getItem(bookingStorageKey)||"[]");return Array.isArray(data)?data:[]}
  catch{return []}
}
for(const a of arenas){
  const option=document.createElement("option");option.value=a.slug;option.textContent=a.name;$("arena").append(option);
}
for(const time of DEMO_SLOT_TIMES){
  const opt=document.createElement("option");opt.value=time;opt.textContent=time+" — sample slot";$("demo-time").append(opt);
}
$("arena").value=arenas.some(a=>a.slug===requested)?requested:arenas[0].slug;
$("demo-date").min=todayLocal();$("demo-date").value=todayLocal();
function render(){
  const a=currentArena();
  const deployment=selectDeploymentOption(a.deploymentOption,a.hostingMode);
  $("location").textContent=a.city+" · "+DEPLOYMENT_DETAILS[deployment].label;
  $("name").textContent=a.name;$("tagline").textContent=a.tagline;
  $("hero").style.background="linear-gradient(115deg, "+a.brand.primary+", #101a2b)";
  $("hero").style.borderTop="5px solid "+a.brand.accent;
  $("footer").textContent=a.name+" • Powered by PlayNexa · Varada Techworks";
  document.title=a.name+" | Booking demo";
  $("sports").replaceChildren(...a.sports.map(s=>{
    const card=document.createElement("article");card.className="card";
    const h=document.createElement("h3");h.textContent=s.name;
    const price=document.createElement("p");
    price.textContent=a.samplePrices?.[s.code]?"Illustrative from ₹"+a.samplePrices[s.code]:"Price set by arena";
    const label=document.createElement("span");label.className="pill";label.textContent="Online booking included";
    card.style.borderTop="3px solid "+a.brand.accent;card.append(h,price,label);return card;
  }));
  $("demo-sport").replaceChildren(...a.sports.map(s=>{
    const opt=document.createElement("option");opt.value=s.code;opt.textContent=s.name;return opt;
  }));
  $("booking-error").textContent="";$("booking-result").textContent="";
}
$("arena").addEventListener("change",()=>{
  const url=new URL(window.location.href);url.searchParams.set("arena",$("arena").value);
  history.replaceState({},"",url);render();
});
$("booking-form").addEventListener("submit",event=>{
  event.preventDefault();
  $("booking-error").textContent="";$("booking-result").textContent="";
  const a=currentArena();
  try{
    const existing=getBookings();
    if(existing.length>300)throw new Error("Reset the sales demo before creating more samples");
    const {bookings,booking}=addDemoBooking({
      arenaId:a.id,sportCode:$("demo-sport").value,date:$("demo-date").value,
      startTime:$("demo-time").value,customerName:$("demo-customer").value
    },existing,todayLocal());
    localStorage.setItem(bookingStorageKey,JSON.stringify(bookings));
    $("booking-result").textContent=booking.id+" — sample booking for "+
      booking.customerName+", "+booking.date+" at "+booking.startTime+
      ". DEMO ONLY: no inventory hold, payment, invoice or notification was created.";
  }catch(error){$("booking-error").textContent=error instanceof Error?error.message:"Unable to create sample booking";}
});
$("reset-bookings").addEventListener("click",()=>{
  localStorage.removeItem(bookingStorageKey);
  $("booking-result").textContent="All sample bookings in this browser have been cleared.";
  $("booking-error").textContent="";
});
render();
