import { chromium } from "playwright";

const PAGES = [
  {
    url: "https://wingfoilamerica.com/beginner-guide/getting-started/",
    ids: ["rGUXVZ50aM8", "ztOgV05Rp2Q", "HjzLMAEZJVA"],
  },
  {
    url: "https://wingfoilamerica.com/intermediate-advanced/tacking-into-the-wind/",
    ids: ["Vfd5vibrL2Q", "r2U3TApX5aQ"],
  },
  {
    url: "https://wingfoilamerica.com/intermediate-advanced/wave-riding/",
    ids: ["8s_sd8R7xZI"],
  },
  {
    url: "https://wingfoilamerica.com/intermediate-advanced/wing-handling-and-power-control/",
    ids: ["SJ0tMxdV_bs"],
  },
  {
    url: "https://wingfoilamerica.com/intermediate-advanced/jumping-and-freestyle/",
    ids: ["-Ij_IpABKGA"],
  },
];

const browser = await chromium.launch();

// Desktop DOM presence + credit check for all pages
for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(p.url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(1000);

  for (const id of p.ids) {
    const iframe = await page.$(`iframe[src*="youtube-nocookie.com/embed/${id}"]`);
    const found = !!iframe;
    let loadingAttr = null;
    let creditText = null;
    if (iframe) {
      loadingAttr = await iframe.getAttribute("loading");
      // Find the sibling credit element within the same .video-embed wrapper
      creditText = await page.evaluate((videoId) => {
        const el = document.querySelector(`iframe[src*="youtube-nocookie.com/embed/${videoId}"]`);
        if (!el) return null;
        const wrap = el.closest(".video-embed");
        if (!wrap) return null;
        const credit = wrap.querySelector(".video-embed-credit a");
        return credit ? { text: credit.textContent, href: credit.getAttribute("href") } : null;
      }, id);
    }
    console.log(`[DESKTOP] ${p.url} id=${id} found=${found} loading=${loadingAttr} credit=${JSON.stringify(creditText)}`);
  }
  await page.close();
}

// Mobile viewport check specifically on Getting Started (per explicit history of video-related mobile bugs)
const mobileViewports = [375, 390];
for (const width of mobileViewports) {
  const context = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await context.newPage();
  await page.goto("https://wingfoilamerica.com/beginner-guide/getting-started/", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(1000);

  const metrics = await page.evaluate(() => {
    const frames = Array.from(document.querySelectorAll(".video-embed-frame"));
    return frames.map((f) => {
      const rect = f.getBoundingClientRect();
      const iframeRect = f.querySelector("iframe")?.getBoundingClientRect();
      return {
        frameWidth: rect.width,
        frameHeight: rect.height,
        iframeWidth: iframeRect ? iframeRect.width : null,
        iframeHeight: iframeRect ? iframeRect.height : null,
        docScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
  });
  console.log(`[MOBILE ${width}px] getting-started video-embed-frame metrics:`, JSON.stringify(metrics));
  await context.close();
}

await browser.close();
