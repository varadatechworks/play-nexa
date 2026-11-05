// Synthetic showcase data. Never connect these profiles to production payments.
export const demoArenas = [
  {
    schemaVersion:1,id:"arena-riverside",slug:"riverside",name:"Riverside Sports Arena",
    tagline:"Find your game. Build your community.",city:"Bengaluru",state:"Karnataka",country:"IN",
    hostingMode:"dedicated",marketplaceListed:true,status:"published",
    domains:["riverside.playnexa.example"],brand:{primary:"#113e54",accent:"#efa948",logoUrl:null,heroUrl:null},
    sports:[{code:"BADMINTON",name:"Badminton"},{code:"SWIMMING",name:"Swimming"},{code:"CRICKET",name:"Cricket Turf"}],
    bookingBaseUrl:null,features:{booking:true,membership:true,coaching:true,tournaments:true},
    samplePrices:{"BADMINTON":350,"SWIMMING":200,"CRICKET":900}
  },
  {
    schemaVersion:1,id:"arena-urban",slug:"urban",name:"Urban Play Hub",
    tagline:"Your city. Your court. Your next win.",city:"Mysuru",state:"Karnataka",country:"IN",
    hostingMode:"saas",marketplaceListed:true,status:"published",
    domains:["urban.playnexa.example"],brand:{primary:"#253f70",accent:"#4be1ca",logoUrl:null,heroUrl:null},
    sports:[{code:"FOOTBALL",name:"Football Turf"},{code:"PICKLEBALL",name:"Pickleball"},{code:"BADMINTON",name:"Badminton"}],
    bookingBaseUrl:null,features:{booking:true,membership:true,coaching:false,tournaments:true},
    samplePrices:{"FOOTBALL":1200,"PICKLEBALL":400,"BADMINTON":300}
  },
  {
    schemaVersion:1,id:"arena-summit",slug:"summit",name:"Summit Sports Club",
    tagline:"Train stronger. Play together.",city:"Hubballi",state:"Karnataka",country:"IN",
    hostingMode:"dedicated",marketplaceListed:true,status:"published",
    domains:["summit.playnexa.example"],brand:{primary:"#302b61",accent:"#94a7ff",logoUrl:null,heroUrl:null},
    sports:[{code:"SWIMMING",name:"Swimming"},{code:"BASKETBALL",name:"Basketball"},{code:"CRICKET",name:"Cricket Nets"}],
    bookingBaseUrl:null,features:{booking:true,membership:true,coaching:true,tournaments:false},
    samplePrices:{"SWIMMING":250,"BASKETBALL":500,"CRICKET":450}
  },
  {
    schemaVersion:1,id:"arena-private",slug:"private",name:"Private Training Club",
    tagline:"Members only",city:"Bengaluru",state:"Karnataka",country:"IN",
    hostingMode:"saas",marketplaceListed:false,status:"published",
    domains:["private.playnexa.example"],brand:{primary:"#172d49",accent:"#d7a543",logoUrl:null,heroUrl:null},
    sports:[{code:"GYM",name:"Gym"}],bookingBaseUrl:null,
    features:{booking:true,membership:true,coaching:true,tournaments:false},samplePrices:{"GYM":150}
  }
];
export const demoLocalKey="playnexa-new-arena-demo-v1";
export function demoRegistry(){
  let added=[];try{const saved=localStorage.getItem(demoLocalKey);if(saved){const value=JSON.parse(saved);if(Array.isArray(value))added=value}}catch{}
  return [...demoArenas, ...added.filter(a=>a && typeof a.id==="string" && a.id.startsWith("arena-demo-"))];
}
