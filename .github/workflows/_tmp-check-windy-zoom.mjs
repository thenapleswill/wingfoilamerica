import { chromium } from "playwright";

const lat = "28.357";
const lon = "-80.629";

function buildUrl(zoom) {
  return (
    "https://embed.windy.com/embed2.html?lat=" + lat + "&lon=" + lon +
    "&detailLat=" + lat + "&detailLon=" + lon +
    "&width=650&height=450&zoom=" + zoom + "&level=surface&overlay=wind&product=ecmwf" +
    "&menu=&message=true&marker=true&calendar=now&pressure=&type=map" +
    "&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1"
  );
}

const browser = await chromium.launch();

for (const zoom of [10, 11, 12, 14]) {
  const page = await browser.newPage({ viewport: { width: 650, height: 450 } });
  await page.goto(buildUrl(zoom), { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Windy exposes its Leaflet map instance on window.W.map (or similar) in
  // many builds; try a few known globals to read back the actual zoom the
  // map settled at after Windy clamps any out-of-range requested zoom.
  const actualZoom = await page.evaluate(() => {
    try {
      if (window.W && window.W.map && typeof window.W.map.getZoom === "function") {
        return window.W.map.getZoom();
      }
    } catch (e) {}
    try {
      if (window.map && typeof window.map.getZoom === "function") {
        return window.map.getZoom();
      }
    } catch (e) {}
    // Fallback: scan for any leaflet-pane and read a data attribute, or just
    // report undefined so we fall back to the screenshot comparison.
    return null;
  });

  console.log("REQUESTED_ZOOM:", zoom, "ACTUAL_ZOOM_FROM_JS:", actualZoom);
  await page.screenshot({ path: `zoom-${zoom}.png` });
  await page.close();
}

await browser.close();
