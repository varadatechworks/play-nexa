import {demoRegistry} from "./demo-data.mjs";
const $=id=>document.getElementById(id), arenas=demoRegistry();
const requested=new URLSearchParams(window.location.search).get("arena");
for(const a of arenas){
  const option=document.createElement("option");option.value=a.slug;option.textContent=a.name;$("arena").append(option);
}
$("arena").value=arenas.some(a=>a.slug===requested)?requested:arenas[0].slug;
function render(){
  const a=arenas.find(x=>x.slug===$("arena").value)||arenas[0];
  $("location").textContent=a.city+" · "+(a.hostingMode==="dedicated"?"Dedicated deployment":"SaaS deployment");
  $("name").textContent=a.name;$("tagline").textContent=a.tagline;
  $("hero").style.background="linear-gradient(115deg, "+a.brand.primary+", #101a2b)";
  $("hero").style.borderTop="5px solid "+a.brand.accent;
  $("footer").textContent=a.name+" • Powered by PlayNexa · Varada Techworks";
  document.title=a.name+" | Arena demo";
  $("sports").replaceChildren(...a.sports.map(s=>{
    const card=document.createElement("article");card.className="card";
    const h=document.createElement("h3");h.textContent=s.name;
    const price=document.createElement("p");
    price.textContent=a.samplePrices?.[s.code]?"Illustrative from ₹"+a.samplePrices[s.code]:"Price set by arena";
    const label=document.createElement("span");label.className="pill";label.textContent="Bookings via arena engine";
    card.style.borderTop="3px solid "+a.brand.accent;card.append(h,price,label);return card;
  }));
}
$("arena").addEventListener("change",()=>{const url=new URL(window.location.href);url.searchParams.set("arena",$("arena").value);history.replaceState({},"",url);render()});
render();
