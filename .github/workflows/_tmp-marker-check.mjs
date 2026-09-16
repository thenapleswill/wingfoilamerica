import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("https://wingfoilamerica.com/where-to-ride/", { waitUntil: "load", timeout: 45000 });
await page.waitForTimeout(2500);

// Try to find marker elements. Leaflet markers are usually <img class="leaflet-marker-icon">
// or divIcon <div>, often wrapped in an <a> or with role="button" via clustering.
const markers = await page.evaluate(() => {
  const results = [];
  const candidates = document.querySelectorAll(
    ".leaflet-marker-icon, .leaflet-marker-pane img, .leaflet-marker-pane div, [role='button']"
  );
  candidates.forEach((el) => {
    const tag = el.tagName;
    const alt = el.getAttribute("alt");
    const ariaLabel = el.getAttribute("aria-label");
    const title = el.getAttribute("title");
    const cls = el.className && el.className.toString ? el.className.toString() : String(el.className);
    const role = el.getAttribute("role");
    results.push({ tag, cls, alt, ariaLabel, title, role, hasAccessibleName: !!(alt || ariaLabel || title) });
  });
  return results;
});

console.log(`Total candidate marker elements found: ${markers.length}`);
const withName = markers.filter((m) => m.hasAccessibleName);
const withoutName = markers.filter((m) => !m.hasAccessibleName);
console.log(`With accessible name: ${withName.length}`);
console.log(`WITHOUT accessible name: ${withoutName.length}`);
console.log("--- sample WITH name (first 5) ---");
console.log(JSON.stringify(withName.slice(0, 5), null, 2));
console.log("--- sample WITHOUT name (first 10) ---");
console.log(JSON.stringify(withoutName.slice(0, 10), null, 2));

await browser.close();
