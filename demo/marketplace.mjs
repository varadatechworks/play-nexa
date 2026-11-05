import {marketplaceSearch} from "../packages/platform-core/index.mjs";
import {demoRegistry} from "./demo-data.mjs";
const $ = id => document.getElementById(id);
const all = demoRegistry();
for(const city of [...new Set(all.filter(a=>a.marketplaceListed&&a.status==="published").map(a=>a.city))].sort()){
  const option=document.createElement("option");option.value=city;option.textContent=city;$("city").append(option);
}
for(const sport of [...new Set(all.filter(a=>a.marketplaceListed&&a.status==="published").flatMap(a=>a.sports.map(s=>s.name)))].sort()){
  const option=document.createElement("option");option.value=sport;option.textContent=sport;$("sport").append(option);
}
function render(){
  const arenas=marketplaceSearch(all,{city:$("city").value,sport:$("sport").value,query:$("search").value});
  $("count").textContent=arenas.length+" demo arena"+(arenas.length===1?"":"s")+" found";
  const nodes=arenas.map(a=>{
    const card=document.createElement("article");card.className="card";
    const location=document.createElement("div");location.className="eyebrow";location.textContent=a.city+", "+a.state;
    const name=document.createElement("h3");name.textContent=a.name;
    const description=document.createElement("p");description.textContent=a.tagline;
    const pillBox=document.createElement("div");
    for(const sport of a.sports){const pill=document.createElement("span");pill.className="pill";pill.textContent=sport.name;pillBox.append(pill)}
    const action=document.createElement("a");action.className="button secondary";action.style.marginTop="19px";
    action.href="./arena.html?arena="+encodeURIComponent(a.slug);
    action.textContent="View arena demo";
    card.style.borderTop="4px solid "+a.brand.accent;
    card.append(location,name,description,pillBox,action);return card;
  });
  if(!nodes.length){const p=document.createElement("p");p.textContent="No arenas match your filters.";nodes.push(p)}
  $("results").replaceChildren(...nodes);
}
for(const id of ["search","city","sport"])$(id).addEventListener(id==="search"?"input":"change",render);
render();
