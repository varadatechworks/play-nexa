const profiles = {
  riverside:{name:"Riverside Sports Arena",color:"#efa948",tagline:"Find your game. Build your community.",city:"Bengaluru",sports:[["Badminton","₹350 / hour"],["Swimming","₹200 / session"],["Cricket Turf","₹900 / hour"]]},
  urban:{name:"Urban Play Hub",color:"#51e1ca",tagline:"Your city. Your court. Your next win.",city:"Mysuru",sports:[["Football Turf","₹1,200 / hour"],["Pickleball","₹400 / hour"],["Badminton","₹300 / hour"]]},
  summit:{name:"Summit Sports Club",color:"#94a7ff",tagline:"Train stronger. Play together.",city:"Hubballi",sports:[["Swimming","₹250 / session"],["Basketball","₹500 / hour"],["Cricket Nets","₹450 / hour"]]}
};
const key="playnexa-demo-profile-v1";
let overrides={};try{overrides=JSON.parse(localStorage.getItem(key)||"{}")||{}}catch{}
const $=id=>document.getElementById(id);
function current(){return $("arena").value}
function render(){
  const id=current(), data={...profiles[id],...(overrides[id]||{})};
  $("name").value=data.name;$("color").value=data.color;
  $("eyebrow").textContent="Welcome to "+data.name+" · "+data.city;
  $("headline").textContent=data.name;
  $("tagline").textContent=data.tagline;
  document.querySelector(".hero").style.borderTop="5px solid "+data.color;
  $("facilities").replaceChildren(...data.sports.map(([sport,price])=>{
    const card=document.createElement("article");card.className="card";
    const h=document.createElement("h3");h.textContent=sport;
    const p=document.createElement("p");p.textContent="Sample slot availability";
    const b=document.createElement("div");b.className="price";b.textContent=price;b.style.color=data.color;
    card.append(h,p,b);return card;
  }));
  document.title=data.name+" | PlayNexa demo";
}
function save(field,value){const id=current();overrides[id]={...(overrides[id]||{}),[field]:value};localStorage.setItem(key,JSON.stringify(overrides));render()}
$("arena").addEventListener("change",render);
$("name").addEventListener("change",()=>save("name",$("name").value.trim()||profiles[current()].name));
$("color").addEventListener("input",()=>save("color",$("color").value));
$("reset").addEventListener("click",()=>{overrides={};localStorage.removeItem(key);render()});
$("book").addEventListener("click",()=>$("facilities-heading").scrollIntoView({behavior:"smooth"}));
render();
