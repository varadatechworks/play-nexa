import {arenaConfig} from "@/lib/arena-config";
import { Activity, CircleDot, Crown, Dumbbell, Grid3X3, PersonStanding, Waves } from "lucide-react";

const sportCatalog = [
  { name: "Swimming", icon: Waves, text: "Structured pool sessions, coaching and recreation for every age." },
  { name: "Cricket", icon: CircleDot, text: "Practice nets, skill coaching and match-ready development." },
  { name: "Badminton", icon: Activity, text: "Quality courts and coaching for beginners and competitors." },
  { name: "Carrom", icon: Grid3X3, text: "Focus, control and friendly indoor competition." },
  { name: "Chess", icon: Crown, text: "Build strategy, patience and confident decision-making." },
  { name: "Gym", icon: Dumbbell, text: "Guided strength and conditioning in a supportive environment." },
  { name: "Aerobics", icon: PersonStanding, text: "Energetic group sessions for mobility, stamina and well-being." },
];

export const sports = arenaConfig.sportsCsv.split(",").map(name=>name.trim()).filter(Boolean).map(name=>
  sportCatalog.find(s=>s.name.toLowerCase()===name.toLowerCase()) ||
  {name,icon:Activity,text:`Discover ${name} sessions, bookings and coaching at ${arenaConfig.name}.`}
);

export const values = ["Discipline & Respect", "Teamwork & Leadership", "Health & Well-being", "Excellence in Everything"];
