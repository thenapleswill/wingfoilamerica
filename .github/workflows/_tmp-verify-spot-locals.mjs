import { chromium } from "playwright";

const SPOT_URL = "https://wingfoilamerica.com/where-to-ride/cumbuco/";
const TEST_NAME = "WFA Test Local " + Date.now();

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(SPOT_URL, { waitUntil: "networkidle", timeout: 30000 });

await page.click("#spotLocalsOpen");
await page.waitForSelector("#spotLocalsModal:not([hidden])");

await page.fill("#spotLocalsName", TEST_NAME);
await page.fill("#spotLocalsSocial", "https://instagram.com/wfa-test-account");
await page.fill("#spotLocalsNote", "Automated verification submission, safe to delete.");
await page.fill("#spotLocalsEmail", "wfa-test@example.com");

await page.click("#spotLocalsForm button[type=submit]");
await page.waitForSelector("#spotLocalsAirtableWrap:not([hidden])");

const iframeSrc = await page.getAttribute("#spotLocalsIframe", "src");
console.log("IFRAME_SRC:", iframeSrc);

// Give the Airtable-hosted form a moment to load inside the iframe.
await page.waitForTimeout(4000);

const frame = page.frameLocator("#spotLocalsIframe");
// Find and click the Airtable form's own submit button.
const submitBtn = frame.locator("button:has-text('Submit'), button[type=submit]").first();
await submitBtn.waitFor({ state: "visible", timeout: 15000 });
await submitBtn.click();

await page.waitForTimeout(4000);

const afterSubmitText = await frame.locator("body").innerText().catch(() => "(could not read frame body)");
console.log("AFTER_SUBMIT_FRAME_TEXT:", afterSubmitText.slice(0, 500));

console.log("TEST_NAME_USED:", TEST_NAME);

await browser.close();
