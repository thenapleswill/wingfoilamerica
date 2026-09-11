#!/usr/bin/env node
// TEMPORARY diagnostic script — not part of the shipped feature.
// This sandbox's own egress is blocked for these brand domains, so this
// runs once on a GitHub Actions runner (open internet) to inspect each
// brand's real news-page HTML/robots.txt before the real scraper's
// per-brand selectors are written. Deleted once that's done — see
// scripts/gear-news-check.mjs for the real, permanent scraper.

import * as cheerio from "cheerio";
import { isAllowed } from "./robots-check.mjs";

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
  { brand: "North (candidate: blogs/all)", url: "https://northactionsports.com/blogs/all" },
  { brand: "North (candidate: blogs/news)", url: "https://northactionsports.com/blogs/news" },
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
    if (status !== 200) return { status, allowed: true, note: "no robots.txt (non-200), treating as allowed" };
    const allowed = isAllowed(text, new URL(pageUrl).pathname);
    return { status, allowed, fullText: text };
  } catch (e) {
    return { error: String(e), allowed: true };
  }
}

// For each candidate post href, keep the longest non-trivial anchor text
// seen anywhere on the page for that href (themes often wrap the same post
// link in an image anchor with empty text AND a separate title-text anchor).
function bestLinksUnderPrefix(html, baseUrl) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith("/") ? base.pathname : base.pathname + "/";
  const byHref = new Map();
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
    if (!(abs.pathname.startsWith(basePath) && abs.pathname !== basePath && abs.pathname !== base.pathname)) return;
    if (/\/tagged\//i.test(abs.pathname)) return; // category/tag pages, not posts
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const key = abs.origin + abs.pathname;
    const existing = byHref.get(key);
    if (!existing || text.length > existing.text.length) {
      byHref.set(key, { href: abs.href, text });
    }
  });
  return [...byHref.values()];
}

async function diagnoseBrand({ brand, url }) {
  console.log(`\n==== ${brand} — ${url} ====`);
  const robots = await checkRobots(url);
  console.log(`robots: status=${robots.status} allowed=${robots.allowed}`);
  if (robots.fullText) console.log("robots.txt full text:\n" + robots.fullText);

  try {
    const { status, finalUrl, text } = await fetchText(url);
    console.log(`status: ${status}  finalUrl: ${finalUrl}  bytes: ${text.length}`);

    const posts = bestLinksUnderPrefix(text, finalUrl);
    console.log(`candidate posts (${posts.length}):`, JSON.stringify(posts, null, 2));
  } catch (e) {
    console.log("FETCH ERROR:", String(e));
  }
}

async function main() {
  for (const b of BRANDS) {
    await diagnoseBrand(b);
  }
  console.log("\n==== DIAGNOSTIC COMPLETE ====");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
