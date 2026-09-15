import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

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
const shots = {};

for (const zoom of [10, 11, 12, 14]) {
  const page = await browser.newPage({ viewport: { width: 650, height: 450 } });
  await page.goto(buildUrl(zoom), { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(6000);
  const buf = await page.screenshot();
  shots[zoom] = PNG.sync.read(buf);
  await page.close();
}

await browser.close();

function diffPct(a, b) {
  const { width, height } = a;
  const diffPng = new PNG({ width, height });
  const diffPixels = pixelmatch(a.data, b.data, diffPng.data, width, height, { threshold: 0.1 });
  return ((diffPixels / (width * height)) * 100).toFixed(2);
}

console.log("=== Pairwise diff (% of pixels changed) ===");
console.log("zoom 10 vs 11:", diffPct(shots[10], shots[11]) + "%");
console.log("zoom 11 vs 12:", diffPct(shots[11], shots[12]) + "%");
console.log("zoom 12 vs 14:", diffPct(shots[12], shots[14]) + "%");
console.log("zoom 10 vs 14:", diffPct(shots[10], shots[14]) + "%");
