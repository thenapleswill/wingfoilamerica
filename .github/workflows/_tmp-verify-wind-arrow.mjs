import { chromium } from "playwright";

const SPOTS = [
  { id: "constitution-bicentennial-park", ideal: ["N", "NE", "NW", "W", "WNW"] },
  { id: "cumbuco", ideal: ["ESE", "SE", "SSE"] },
];

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

function extractRotateDeg(styleAttr) {
  if (!styleAttr) return null;
  const m = styleAttr.match(/rotate\(([-\d.]+)deg\)/);
  return m ? parseFloat(m[1]) : null;
}

async function readArrow(page) {
  await page.waitForSelector(".wind-direction-arrow", { timeout: 15000 }).catch(() => null);
  const el = await page.$(".wind-direction-arrow");
  if (!el) return null;
  const style = await el.getAttribute("style");
  const badgeDetail = await page.$eval(".conditions-badge-detail", (n) => n.textContent).catch(() => null);
  return { rotateDeg: extractRotateDeg(style), badgeDetail };
}

async function testLiveData(browser, spotId, viewportName) {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewportName] });
  const page = await context.newPage();
  const url = `https://wingfoilamerica.com/where-to-ride/${spotId}/`;
  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(5000);
  const result = await readArrow(page);
  console.log(`[LIVE] ${spotId} (${viewportName}):`, JSON.stringify(result));
  await context.close();
}

async function testHardcodedDirection(browser, spotId, ideal, injectedDeg) {
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();

  await page.route("**/api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        current: { wind_speed_10m: 18, wind_direction_10m: injectedDeg },
      }),
    });
  });

  const url = `https://wingfoilamerica.com/where-to-ride/${spotId}/`;
  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(3000);
  const result = await readArrow(page);
  const expectedToward = (injectedDeg + 180) % 360;
  const match = result && Math.abs(result.rotateDeg - expectedToward) < 0.01;
  console.log(
    `[HARDCODED] ${spotId} inject=${injectedDeg}deg expectedArrow=${expectedToward}deg ` +
    `actualArrow=${result ? result.rotateDeg : "null"}deg MATCH=${match} badge="${result ? result.badgeDetail : "n/a"}"`
  );
  await context.close();
}

const browser = await chromium.launch();

await testLiveData(browser, "cumbuco", "desktop");
await testLiveData(browser, "cumbuco", "mobile");

await testHardcodedDirection(browser, "constitution-bicentennial-park", ["N","NE","NW","W","WNW"], 0);   // wind FROM N
await testHardcodedDirection(browser, "constitution-bicentennial-park", ["N","NE","NW","W","WNW"], 90);  // wind FROM E
await testHardcodedDirection(browser, "constitution-bicentennial-park", ["N","NE","NW","W","WNW"], 180); // wind FROM S
await testHardcodedDirection(browser, "cumbuco", ["ESE","SE","SSE"], 135); // wind FROM SE (ideal match)
await testHardcodedDirection(browser, "cumbuco", ["ESE","SE","SSE"], 315); // wind FROM NW (opposite)

await browser.close();
