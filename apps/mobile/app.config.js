/**
 * Build-time brand configuration for optional dedicated arena APKs.
 * Runtime theme can change, but application ID, launcher icon and deep link
 * scheme require a separately configured/signed build.
 *
 * Never ship the imported Jnapanam icon or package ID to a new customer.
 * Set ARENA_APP_ICON_PATH, ARENA_ANDROID_PACKAGE and ARENA_APP_SCHEME.
 */
const source = require("./app.json").expo;

const name = process.env.ARENA_APP_NAME || "PlayNexa Arena";
const slug = process.env.ARENA_APP_SLUG || "playnexa-arena";
const packageId = process.env.ARENA_ANDROID_PACKAGE || "com.varadatechworks.playnexa.demo";
const scheme = process.env.ARENA_APP_SCHEME || "playnexa";
const icon = process.env.ARENA_APP_ICON_PATH || "./assets/images/icon.png";
const isRelease = process.env.PLAYNEXA_BRANDED_RELEASE === "true";

if (isRelease && (!process.env.ARENA_ANDROID_PACKAGE ||
    !process.env.ARENA_APP_ICON_PATH || !process.env.ARENA_APP_SCHEME)) {
  throw new Error("Branded release requires unique app package, icon and deep-link scheme");
}
if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) throw new Error("Invalid arena app scheme");
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(packageId))
  throw new Error("Invalid arena package ID");

module.exports = {
  expo: {
    ...source, name, slug, scheme, icon,
    ios: { ...source.ios, bundleIdentifier: process.env.ARENA_IOS_BUNDLE_ID || packageId, icon },
    android: {
      ...source.android, package: packageId,
      adaptiveIcon: { ...source.android?.adaptiveIcon, foregroundImage: icon }
    },
    web: { ...source.web, favicon: icon }
  }
};
