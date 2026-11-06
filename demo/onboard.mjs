import {buildArenaDraft, slugify, validateRegistry} from "../packages/platform-core/index.mjs";
import {DEPLOYMENT_DETAILS} from "../packages/platform-core/deployment.mjs";
import {demoLocalKey, demoRegistry} from "./demo-data.mjs";
const $ = id => document.getElementById(id);
function preview(){
  $("preview-name").textContent=$("name").value.trim()||"Your Sports Arena";
  $("preview-tagline").textContent=$("tagline").value.trim()||"Play • Train • Compete";
  $("preview-mode").textContent=DEPLOYMENT_DETAILS[$("deployment").value].label;
  $("preview").style.background="linear-gradient(125deg, "+$("primary").value+", #142b43)";
  $("preview").style.borderTop="5px solid "+$("accent").value;
}
for(const id of ["name","tagline","deployment","primary","accent"])$(id).addEventListener("input",preview);
$("form").addEventListener("reset",()=>{setTimeout(preview,0);$("error").textContent="";$("success").textContent=""});
$("form").addEventListener("submit",e=>{
  e.preventDefault();$("error").textContent="";$("success").textContent="";
  try{
    const sports=$("sports").value.split(",").map(x=>x.trim()).filter(Boolean);
    const domain=$("domain").value.trim();
    const slug=slugify($("name").value);
    const draft=buildArenaDraft({
      name:$("name").value,slug,city:$("city").value,sports,
      deploymentOption:$("deployment").value,marketplaceListed:false,
      tagline:$("tagline").value,primaryColor:$("primary").value,
      accentColor:$("accent").value,domains:domain?[domain]:[]
    });
    const registry=demoRegistry();
    if(registry.some(a=>a.slug===draft.slug))throw new Error("That arena name/slug already exists in this demo. Choose a different name.");
    // ONLY for local sales preview. Production publishing must require readiness checks.
    draft.id="arena-demo-"+draft.slug;
    draft.status="published";
    draft.samplePrices=Object.fromEntries(draft.sports.map(s=>[s.code,350]));
    validateRegistry([...registry,draft]);
    let added=[];try{added=JSON.parse(localStorage.getItem(demoLocalKey)||"[]")}catch{}
    if(!Array.isArray(added))added=[];
    added.push(draft);localStorage.setItem(demoLocalKey,JSON.stringify(added));
    $("success").textContent="Full-featured arena profile created for this browser demo. Open its booking preview.";
    $("preview-link").href="./arena.html?arena="+encodeURIComponent(draft.slug);
    $("json").textContent=JSON.stringify(draft,null,2);
    $("result").classList.remove("hidden");
  }catch(err){$("error").textContent=err instanceof Error?err.message:"Could not create demo arena";}
});
$("copy").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("json").textContent);$("success").textContent="Configuration copied."}
  catch{$("success").textContent="Select and copy the JSON from the preview above."}
});
preview();
