import { chromium } from "playwright";

const results = {};

async function checkSpotPage(browser, id) {
  const page = await browser.newPage();
  const url = `https://wingfoilamerica.com/where-to-ride/${id}/`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  // give the fetch to open-meteo a moment
  await page.waitForTimeout(4000);
  const badge = await page.$("#spotConditionsBadge");
  const html = badge ? await badge.innerHTML() : null;
  const classes = badge ? await badge.getAttribute("class") : null;
  const dataAttrs = badge ? {
    lat: await badge.getAttribute("data-lat"),
    lng: await badge.getAttribute("data-lng"),
    idealDirections: await badge.getAttribute("data-ideal-directions"),
  } : null;
  results[id] = { url, found: !!badge, classes, html, dataAttrs };
  await page.close();
}

async function checkWindTab(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 28.35742, longitude: -80.628602 }, // near Cocoa Beach / Constitution Bicentennial Park
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await page.goto("https://wingfoilamerica.com/wind/", { waitUntil: "networkidle", timeout: 30000 });

  const btn = await page.$("#useLocationBtn, [id*='useLocation' i], button:has-text('Use My Location')");
  if (btn) {
    await btn.click();
  } else {
    results.windTab = { error: "Use My Location button not found" };
    await context.close();
    return;
  }

  await page.waitForTimeout(6000);

  const nearestInfo = await page.$("#nearestSpotInfo");
  const html = nearestInfo ? await nearestInfo.innerHTML() : null;
  const isHidden = nearestInfo ? await nearestInfo.evaluate(el => el.hasAttribute("hidden") || getComputedStyle(el).display === "none") : null;

  results.windTab = { found: !!nearestInfo, isHidden, html };
  await context.close();
}

const browser = await chromium.launch();
await checkSpotPage(browser, "constitution-bicentennial-park");
await checkSpotPage(browser, "cumbuco");
await checkWindTab(browser);
await browser.close();

console.log("===RESULTS_JSON_START===");
console.log(JSON.stringify(results, null, 2));
console.log("===RESULTS_JSON_END===");
