/**
 * Build-time brand configuration for optional dedicated arena APKs.
 * Runtime theme can change, but application ID, launcher icon and deep link
 * scheme require a separately configured/signed build.
 *
 * Never ship the imported Jnapanam icon or package ID to a new customer.
 * Set ARENA_APP_ICON_PATH, ARENA_ANDROID_PACKAGE and ARENA_APP_SCHEME.
 */
const source = require("./app.json").expo;
const {existsSync} = require("node:fs");
const {resolve} = require("node:path");

const name = process.env.ARENA_APP_NAME || "PlayNexa Arena";
const slug = process.env.ARENA_APP_SLUG || "playnexa-arena";
const packageId = process.env.ARENA_ANDROID_PACKAGE || "com.varadatechworks.playnexa.demo";
const scheme = process.env.ARENA_APP_SCHEME || "playnexa";
const icon = process.env.ARENA_APP_ICON_PATH || undefined;
const city = process.env.ARENA_APP_CITY || "Bengaluru";
const isRelease = process.env.PLAYNEXA_BRANDED_RELEASE === "true" ||
  ["production","prod","release"].includes((process.env.EAS_BUILD_PROFILE || "").toLowerCase());

if (isRelease && (!process.env.ARENA_ANDROID_PACKAGE ||
    !process.env.ARENA_APP_ICON_PATH || !process.env.ARENA_APP_SCHEME)) {
  throw new Error("Branded release requires unique app package, icon and deep-link scheme");
}
if (isRelease && (!icon || icon.toLowerCase().includes("jnapanam") ||
    !icon.startsWith("./assets/") || !existsSync(resolve(__dirname, icon)))) {
  throw new Error("Branded release requires a valid arena-owned icon under assets");
}
if (isRelease) {
  const address = process.env.EXPO_PUBLIC_API_URL || "";
  let endpoint;
  try { endpoint = new URL(address); } catch { throw new Error("Branded release requires EXPO_PUBLIC_API_URL with HTTPS arena API"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password ||
      !endpoint.hostname.includes(".") ||
      endpoint.hostname==="localhost" || endpoint.hostname.endsWith(".localhost") ||
      endpoint.hostname==="0.0.0.0" || endpoint.hostname.startsWith("127.") ||
      endpoint.hostname.startsWith("10.") || endpoint.hostname.startsWith("192.168.")) {
    throw new Error("Branded release requires a trusted HTTPS arena API endpoint");
  }
}
if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) throw new Error("Invalid arena app scheme");
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(packageId))
  throw new Error("Invalid arena package ID");

module.exports = {
  expo: {
    ...source, name, slug, scheme, icon,
    extra: {...source.extra, arenaName:name, arenaCity:city},
    plugins: source.plugins?.map(plugin => {
      if (!Array.isArray(plugin)) return plugin;
      if (plugin[0] === "expo-splash-screen") return [plugin[0], {...plugin[1], image:icon}];
      if (plugin[0] === "expo-location") return [plugin[0], {...plugin[1], locationWhenInUsePermission:
        `${name} uses your location with permission to record activities. You can continue without location.`}];
      return plugin;
    }),
    ios: { ...source.ios, bundleIdentifier: process.env.ARENA_IOS_BUNDLE_ID || packageId, icon },
    android: {
      ...source.android, package: packageId,
      adaptiveIcon: icon ? { ...source.android?.adaptiveIcon, foregroundImage: icon } : undefined
    },
    web: { ...source.web, favicon: icon }
  }
};
