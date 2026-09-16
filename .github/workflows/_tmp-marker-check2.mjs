import { chromium } from "playwright";

const browser = await chromium.launch();

async function checkAtViewport(width, height, label) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("https://wingfoilamerica.com/where-to-ride/", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2500);

  const markers = await page.evaluate(() => {
    const els = document.querySelectorAll(".leaflet-marker-icon");
    return Array.from(els).map((el) => {
      const nestedNamed = el.querySelector("[role='img'][aria-label], [aria-label]");
      const ownName = el.getAttribute("aria-label") || el.getAttribute("title");
      const nestedName = nestedNamed ? nestedNamed.getAttribute("aria-label") : null;
      return {
        cls: el.className,
        ownName: ownName,
        nestedName: nestedName,
        hasAccessibleName: !!(ownName || nestedName),
      };
    });
  });

  const total = markers.length;
  const named = markers.filter((m) => m.hasAccessibleName);
  const unnamed = markers.filter((m) => !m.hasAccessibleName);

  console.log(`[${label}] Total .leaflet-marker-icon elements: ${total}`);
  console.log(`[${label}] With accessible name (own or nested aria-label): ${named.length}`);
  console.log(`[${label}] WITHOUT accessible name: ${unnamed.length}`);
  if (unnamed.length) {
    console.log(`[${label}] Unnamed marker classes:`, JSON.stringify(unnamed.map((m) => m.cls)));
  }
  console.log(`[${label}] Sample named labels:`, JSON.stringify(named.slice(0, 5).map((m) => m.nestedName || m.ownName)));

  await page.close();
  return { total, namedCount: named.length, unnamedCount: unnamed.length };
}

// Default (likely clustered) view
const defaultView = await checkAtViewport(1280, 900, "DEFAULT VIEW");

// Force a fully zoomed-in view where clusters should break apart into individual pins,
// by zooming in a lot after load, to confirm individual (unclustered) pins are also fine.
const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page2.goto("https://wingfoilamerica.com/where-to-ride/", { waitUntil: "load", timeout: 45000 });
await page2.waitForTimeout(2500);
// Zoom in several times via the map's zoom-in control to break clusters apart
for (let i = 0; i < 6; i++) {
  const zoomInBtn = await page2.$(".leaflet-control-zoom-in");
  if (zoomInBtn) {
    await zoomInBtn.click();
    await page2.waitForTimeout(600);
  }
}
const zoomedMarkers = await page2.evaluate(() => {
  const els = document.querySelectorAll(".leaflet-marker-icon");
  return Array.from(els).map((el) => {
    const nestedNamed = el.querySelector("[role='img'][aria-label], [aria-label]");
    const ownName = el.getAttribute("aria-label") || el.getAttribute("title");
    const nestedName = nestedNamed ? nestedNamed.getAttribute("aria-label") : null;
    return { cls: el.className, hasAccessibleName: !!(ownName || nestedName) };
  });
});
const zTotal = zoomedMarkers.length;
const zNamed = zoomedMarkers.filter((m) => m.hasAccessibleName).length;
console.log(`[ZOOMED IN] Total .leaflet-marker-icon elements: ${zTotal}`);
console.log(`[ZOOMED IN] With accessible name: ${zNamed}`);
console.log(`[ZOOMED IN] WITHOUT accessible name: ${zTotal - zNamed}`);
await page2.close();

await browser.close();
