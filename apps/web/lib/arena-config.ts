/** Dedicated deployment branding; SaaS must later fetch server-verified host-specific settings. */
const read = (v: string | undefined, fallback = "") => v?.trim() || fallback;
const hex = (value: string | undefined, fallback: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value || "") ? value! : fallback;
export const arenaConfig = Object.freeze({
  name: read(process.env.NEXT_PUBLIC_ARENA_NAME, "PlayNexa Sports Arena"),
  shortName: read(process.env.NEXT_PUBLIC_ARENA_SHORT_NAME, "PlayNexa"),
  city: read(process.env.NEXT_PUBLIC_ARENA_CITY, "Bengaluru"),
  tagline: read(process.env.NEXT_PUBLIC_ARENA_TAGLINE, "Play • Train • Compete"),
  purpose: read(process.env.NEXT_PUBLIC_ARENA_PURPOSE, "Building stronger communities through sport."),
  primaryColor: hex(process.env.NEXT_PUBLIC_ARENA_PRIMARY_COLOR, "#113e54"),
  accentColor: hex(process.env.NEXT_PUBLIC_ARENA_ACCENT_COLOR, "#efa948"),
  logoUrl: read(process.env.NEXT_PUBLIC_ARENA_LOGO_URL),
  heroImageUrl: read(process.env.NEXT_PUBLIC_ARENA_HERO_IMAGE_URL),
  heroVideoUrl: read(process.env.NEXT_PUBLIC_ARENA_HERO_VIDEO_URL),
  phone: read(process.env.NEXT_PUBLIC_ARENA_PHONE),
  sportsCsv: read(process.env.NEXT_PUBLIC_ARENA_SPORTS, "Swimming,Cricket,Badminton"),
});
