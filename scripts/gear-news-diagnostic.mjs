#!/usr/bin/env node
// TEMPORARY diagnostic script — not part of the shipped feature.
// This sandbox's own egress is blocked for these brand domains, so this
// runs once on a GitHub Actions runner (open internet) to inspect each
// brand's real news-page HTML/robots.txt before the real scraper's
// per-brand selectors are written. Deleted once that's done — see
// scripts/gear-news-check.mjs for the real, permanent scraper.

import * as cheerio from "cheerio";

const UA = "WingFoilAmericaGearNewsBot/1.0 (+https://wingfoilamerica.com; diagnostic run, contact admin@wingfoilamerica.com)";

const BRANDS = [
  { brand: "Naish", url: "https://www.naish.com/blogs/blog" },
  { brand: "Armstrong Foils", url: "https://armstrongfoils.com/blogs/news" },
  { brand: "Slingshot Sports", url: "https://slingshotsports.com/blogs/news" },
  { brand: "Duotone", url: "https://www.duotonesports.com/foilwing/about-us/news/" },
  { brand: "F-One", url: "https://www.f-one.world/news/?univers=foil" },
  { brand: "Cabrinha", url: "https://www.cabrinha.com/blogs/news" },
  { brand: "Ozone", url: "https://ozonekites.com/wing/news/" },
  { brand: "Axis Foils", url: "https://axisfoils.com/blogs/news" },
];

const NORTH_CANDIDATES = [
  "https://northactionsports.com/",
  "https://northactionsports.com/blogs/news",
  "https://northactionsports.com/news",
  "https://northactionsports.com/pages/news",
  "https://northactionsports.com/blogs/journal",
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  const text = await res.text();
  return { status: res.status, finalUrl: res.url, text };
}

async function checkRobots(pageUrl) {
  const origin = new URL(pageUrl).origin;
  try {
    const { status, text } = await fetchText(origin + "/robots.txt");
    if (status !== 200) return { status, note: "no robots.txt (non-200), treating as allowed" };
    return { status, snippet: text.slice(0, 800) };
  } catch (e) {
    return { error: String(e) };
  }
}

function topPathPrefixes(html, baseUrl) {
  const $ = cheerio.load(html);
  const counts = new Map();
  const samples = new Map();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let abs;
    try {
      abs = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (abs.origin !== new URL(baseUrl).origin) return;
    const segments = abs.pathname.split("/").filter(Boolean);
    const prefix = "/" + segments.slice(0, 2).join("/");
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
    if (!samples.has(prefix)) samples.set(prefix, []);
    if (samples.get(prefix).length < 3) {
      samples.get(prefix).push({ href: abs.href, text: $(el).text().trim().slice(0, 80) });
    }
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([prefix, count]) => ({ prefix, count, samples: samples.get(prefix) }));
}

function directChildLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith("/") ? base.pathname : base.pathname + "/";
  const out = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let abs;
    try {
      abs = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (abs.origin !== base.origin) return;
    if (abs.pathname.startsWith(basePath) && abs.pathname !== basePath && abs.pathname !== base.pathname) {
      out.push({ href: abs.href, text: $(el).text().trim().slice(0, 80) });
    }
  });
  const seen = new Set();
  return out.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true))).slice(0, 15);
}

async function diagnoseBrand({ brand, url }) {
  console.log(`\n==== ${brand} — ${url} ====`);
  const robots = await checkRobots(url);
  console.log("robots.txt:", JSON.stringify(robots).slice(0, 500));

  try {
    const { status, finalUrl, text } = await fetchText(url);
    console.log(`status: ${status}  finalUrl: ${finalUrl}  bytes: ${text.length}`);
    const looksLikeSpaShell = text.length < 3000 && /<div id="(root|app)"/i.test(text);
    console.log("looksLikeSpaShell:", looksLikeSpaShell);

    const direct = directChildLinks(text, finalUrl);
    console.log(`direct child-path links (${direct.length}):`, JSON.stringify(direct, null, 2));

    const prefixes = topPathPrefixes(text, finalUrl);
    console.log("top path prefixes on page:", JSON.stringify(prefixes, null, 2));
  } catch (e) {
    console.log("FETCH ERROR:", String(e));
  }
}

async function diagnoseNorth() {
  console.log(`\n==== North — candidate discovery ====`);
  for (const url of NORTH_CANDIDATES) {
    try {
      const { status, finalUrl, text } = await fetchText(url);
      console.log(`\n-- ${url} -> status ${status}, finalUrl ${finalUrl}, bytes ${text.length}`);
      if (url.endsWith("/") && status === 200) {
        const $ = cheerio.load(text);
        const navHits = [];
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href") || "";
          const t = $(el).text().trim();
          if (/news|blog|press|journal|story|stories|update/i.test(href + " " + t)) {
            let abs;
            try {
              abs = new URL(href, finalUrl).href;
            } catch {
              abs = href;
            }
            navHits.push({ href: abs, text: t.slice(0, 60) });
          }
        });
        const seen = new Set();
        const uniq = navHits.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true))).slice(0, 20);
        console.log("nav links matching news/blog/press/journal:", JSON.stringify(uniq, null, 2));
      }
    } catch (e) {
      console.log(`-- ${url} -> FETCH ERROR:`, String(e));
    }
  }
}

async function main() {
  for (const b of BRANDS) {
    await diagnoseBrand(b);
  }
  await diagnoseNorth();
  console.log("\n==== DIAGNOSTIC COMPLETE ====");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
