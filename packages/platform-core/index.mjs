import {DEPLOYMENT_DETAILS, selectDeploymentOption, productEntitlements} from "./deployment.mjs";

/**
 * PlayNexa platform contracts. Zero-dependency ESM for Node and the browser.
 *
 * Hosting mode (dedicated or saas) is independent of distribution (direct or
 * marketplace). Booking/payment inventory must always have ONE arena authority.
 * Security note: this module is a contract; production Spring Boot endpoints
 * must independently enforce tenant boundaries on every repository access.
 */
export const HOSTING_MODES = Object.freeze(["dedicated", "saas"]);
export const LISTING_CHANNELS = Object.freeze(["direct", "marketplace"]);
export const ARENA_STATES = Object.freeze(["draft", "ready", "published", "suspended"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const SPORT_CODE = /^[A-Z][A-Z0-9_]{1,30}$/;
const SAFE_HOST = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

export function slugify(value) {
  return String(value || "").normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 48).replace(/-$/, "");
}

export function normalizeHost(value) {
  if (typeof value !== "string") throw new TypeError("Host must be a string");
  const host = value.trim().toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "");
  if (!SAFE_HOST.test(host) || host.includes("..") ||
      host.split(".").some(label => label.length > 63 || label.startsWith("-") || label.endsWith("-"))) {
    throw new Error("Invalid host");
  }
  return host;
}

function requireText(value, key, max = 120) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error("Invalid " + key);
  return value.trim();
}

function color(value, name) {
  if (typeof value !== "string" || !COLOR.test(value)) throw new Error("Invalid " + name);
  return value.toLowerCase();
}

function publicWebUrl(value, name) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) throw new Error("Invalid " + name);
  let url;
  try { url = new URL(value); } catch { throw new Error("Invalid " + name); }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname || url.hostname === "localhost")
    throw new Error("Only public HTTPS URLs are accepted for " + name);
  return url.toString();
}

export function buildArenaDraft(input = {}) {
  const name = requireText(input.name, "arena name", 90);
  const slug = input.slug == null || input.slug === "" ? slugify(name) : String(input.slug).trim();
  if (!SLUG.test(slug) || slug.length < 3 || slug.length > 48) throw new Error("Invalid arena slug");
  const requestedMode = input.deploymentOption;
  const hostingMode = input.hostingMode ||
    (requestedMode && DEPLOYMENT_DETAILS[requestedMode]?.hostingMode) || "dedicated";
  if (!HOSTING_MODES.includes(hostingMode)) throw new Error("Invalid hosting mode");
  const deploymentOption = selectDeploymentOption(requestedMode, hostingMode);
  const city = requireText(input.city, "city", 80);
  const sports = (input.sports || []).map((entry, i) => {
    const label = requireText(typeof entry === "string" ? entry : entry.name, "sport " + i, 70);
    const code = (typeof entry === "string" ? slugify(label).replace(/-/g, "_") : entry.code ||
      slugify(label).replace(/-/g, "_")).toUpperCase();
    if (!SPORT_CODE.test(code)) throw new Error("Invalid sport code");
    return { code, name: label };
  });
  if (!sports.length || sports.length > 30 || new Set(sports.map(s => s.code)).size !== sports.length)
    throw new Error("Sports must be 1-30 unique values");
  const brand = {
    primary: color(input.primaryColor || "#113e54", "primary colour"),
    accent: color(input.accentColor || "#efa948", "accent colour"),
    logoUrl: publicWebUrl(input.logoUrl, "logo"),
    heroUrl: publicWebUrl(input.heroUrl, "hero")
  };
  const domains = (input.domains || []).map(normalizeHost);
  if (new Set(domains).size !== domains.length) throw new Error("Duplicate domains");
  const listed = Boolean(input.marketplaceListed);
  const contact = {
    email: input.email ? requireText(input.email, "email", 254) : "",
    phone: input.phone ? requireText(input.phone, "phone", 30) : ""
  };
  return {
    schemaVersion: 1, id: "arena-" + slug, slug, name,
    tagline: typeof input.tagline === "string" ? input.tagline.trim().slice(0, 150) : "Play • Train • Compete",
    city, state: input.state || "Karnataka", country: input.country || "IN",
    hostingMode, deploymentOption, marketplaceListed: listed, status: "draft", domains, verifiedDomains: [], brand, sports,
    bookingBaseUrl: publicWebUrl(input.bookingBaseUrl, "booking URL"),
    contact,
    // Full entitlement is identical for customer-hosted, managed and SaaS;
    // actual feature visibility still follows each venue's admin preferences.
    capabilities: productEntitlements(deploymentOption),
    features: { booking: true, membership: true, coaching: true, tournaments: true },
    currency: "INR", timezone: "Asia/Kolkata"
  };
}

export function validateRegistry(arenas) {
  if (!Array.isArray(arenas)) throw new Error("Arena registry must be an array");
  const ids = new Set(), slugs = new Set(), domains = new Map();
  for (const arena of arenas) {
    if (!arena || typeof arena !== "object" || !SLUG.test(arena.slug || "") ||
      !HOSTING_MODES.includes(arena.hostingMode) || !ARENA_STATES.includes(arena.status) ||
      typeof arena.id !== "string" || !arena.id || !arena.brand)
      throw new Error("Invalid arena record");
    // Older records without deploymentOption remain valid until migrated.
    if (arena.deploymentOption != null)
      selectDeploymentOption(arena.deploymentOption, arena.hostingMode);
    if (ids.has(arena.id) || slugs.has(arena.slug)) throw new Error("Duplicate arena ID or slug");
    ids.add(arena.id); slugs.add(arena.slug);
    const configured = (arena.domains || []).map(normalizeHost);
    const verified = (arena.verifiedDomains || []).map(normalizeHost);
    if (new Set(configured).size !== configured.length || new Set(verified).size !== verified.length)
      throw new Error("Duplicate arena domains");
    if (verified.some(host => !configured.includes(host)))
      throw new Error("Verified domain must be a configured arena domain");
    for (const host of configured) {
      if (domains.has(host)) throw new Error("Domain already owned by another arena: " + host);
      domains.set(host, arena.id);
    }
  }
  return true;
}

/** Resolve host ONLY against a server-controlled verified domain registry. */
export function resolveArenaHost(hostHeader, arenas, marketplaceHosts = []) {
  validateRegistry(arenas);
  const host = normalizeHost(hostHeader);
  const marketplace = marketplaceHosts.map(normalizeHost);
  if (marketplace.includes(host) && arenas.some(a => (a.domains || []).includes(host)))
    throw new Error("Marketplace domain cannot be assigned to an arena");
  if (marketplace.includes(host)) return { kind: "marketplace", host };
  const arena = arenas.find(a => (a.verifiedDomains || []).includes(host));
  if (!arena || arena.status !== "published") return { kind: "unknown", host };
  return { kind: "arena", host, arenaId: arena.id, hostingMode: arena.hostingMode };
}

/** Do not serialize full arena records to the marketplace or anonymous clients. */
export function publicArena(arena) {
  return {
    id: arena.id, slug: arena.slug, name: arena.name, tagline: arena.tagline,
    city: arena.city, state: arena.state, country: arena.country,
    brand: { primary: arena.brand.primary, accent: arena.brand.accent,
      logoUrl: arena.brand.logoUrl, heroUrl: arena.brand.heroUrl },
    sports: (arena.sports || []).map(s => ({ code: s.code, name: s.name })),
    features: { ...arena.features },
    bookingBaseUrl: bookingHandoff(arena)
  };
}

/** Search an explicitly published directory; NEVER imply real-time slots. */
export function marketplaceSearch(arenas, { city = "", sport = "", query = "" } = {}) {
  validateRegistry(arenas);
  const c = String(city).trim().toLowerCase(), s = String(sport).trim().toLowerCase(),
    q = String(query).trim().toLowerCase();
  return arenas.filter(a => a.status === "published" && a.marketplaceListed &&
      (!c || a.city.toLowerCase().includes(c)) &&
      (!s || a.sports.some(x => x.code.toLowerCase() === s || x.name.toLowerCase().includes(s))) &&
      (!q || [a.name, a.city, ...a.sports.map(x => x.name)].join(" ").toLowerCase().includes(q)))
    .map(publicArena);
}

/** Marketplace sends customers to the authoritative booking service. */
export function bookingHandoff(arena, { channel = "marketplace" } = {}) {
  if (arena.status !== "published" || !arena.bookingBaseUrl) return null;
  if (channel === "marketplace" && !arena.marketplaceListed) return null;
  const target = new URL(arena.bookingBaseUrl);
  if (target.protocol !== "https:" || target.username || target.password)
    throw new Error("Unsafe booking URL");
  if (!(arena.verifiedDomains || []).includes(normalizeHost(target.hostname)))
    return null; // No handoff to an unverified or attacker-controlled booking domain.

  target.searchParams.set("source", channel === "marketplace" ? "playnexa" : "direct");
  return target.toString();
}

/**
 * Tenant-scoped handler precondition. Backend still needs scoped SQL and
 * tenant-owned foreign key constraints; this helper alone is NOT a security boundary.
 */
export function requireTenantAccess({ hostTenantId, actorTenantId, targetTenantId }) {
  if (!hostTenantId || !actorTenantId || !targetTenantId ||
      hostTenantId !== actorTenantId || actorTenantId !== targetTenantId)
    throw new Error("TENANT_ACCESS_DENIED");
  return true;
}
