#!/usr/bin/env node
// Weekly "What's New in Gear" check. Run by .github/workflows/gear-news.yml
// (schedule + workflow_dispatch), no human in the loop, no AI/paid API.
//
// For each tracked brand: check robots.txt, make ONE fetch of the brand's
// own news/blog listing page, extract post title+link (+date if present),
// and diff against every URL already recorded in gear-news.json to find
// only what's genuinely new since the last run. Every entry's url is a
// real link this script itself found on that page this run — nothing is
// invented. A brand whose page fails to load, is disallowed by its own
// robots.txt, or can't be parsed is simply skipped for that run.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { isAllowed } from "./robots-check.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NEWS_PATH = path.join(ROOT, "src/_data/gear-news.json");
const STATE_PATH = path.join(ROOT, "src/_data/gear-news-state.json");

const UA = "WingFoilAmericaGearNewsBot/1.0 (+https://wingfoilamerica.com; weekly gear-news check, contact admin@wingfoilamerica.com)";
const ZERO_STREAK_WARNING_THRESHOLD = 4;

// Verified against each brand's actual news-page HTML during development
// (see scripts/gear-news-diagnostic.mjs, now removed). Duotone, F-One, and
// Ozone are kept at the URLs given in scope even though each currently
// fails to yield real posts (Duotone's list renders client-side, F-One's
// URL 404s, Ozone blocks automated requests with a 403) — per the "skip
// rather than invent" rule, they're left in so a future fix on the brand's
// side (or a corrected URL) picks back up automatically; until then they'll
// just repeatedly skip and get flagged by the consecutive-zero-run warning.
// North has no dedicated "/news" path — /blogs/all is its real, working
// news feed, confirmed via a real link on northactionsports.com's own
// homepage nav ("See more"), not guessed.
const BRANDS = [
  { brand: "Naish", url: "https://www.naish.com/blogs/blog" },
  { brand: "Armstrong Foils", url: "https://armstrongfoils.com/blogs/news" },
  { brand: "Slingshot Sports", url: "https://slingshotsports.com/blogs/news" },
  { brand: "Duotone", url: "https://www.duotonesports.com/foilwing/about-us/news/" },
  { brand: "F-One", url: "https://www.f-one.world/news/?univers=foil" },
  { brand: "Cabrinha", url: "https://www.cabrinha.com/blogs/news" },
  { brand: "Ozone", url: "https://ozonekites.com/wing/news/" },
  { brand: "Axis Foils", url: "https://axisfoils.com/blogs/news" },
  { brand: "North", url: "https://northactionsports.com/blogs/all" },
];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: controller.signal });
    const text = await res.text();
    return { status: res.status, finalUrl: res.url, text };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRobotsAllowed(pageUrl) {
  const origin = new URL(pageUrl).origin;
  try {
    const { status, text } = await fetchText(origin + "/robots.txt", 10000);
    if (status !== 200) return true; // no robots.txt on record — nothing disallows us
    return isAllowed(text, new URL(pageUrl).pathname);
  } catch {
    return true; // robots.txt itself unreachable — don't block the run over that
  }
}

// Clean up a raw scraped anchor text: strip a leading "DD Month YYYY" date
// stamp some themes prepend, and a trailing "Read more" / "Read full
// story" call-to-action some themes append to the same text node.
function cleanTitle(raw) {
  let t = raw.replace(/\s+/g, " ").trim();
  t = t.replace(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}\s*/, "");
  t = t.replace(/\s*(Read\s+(full\s+story|more)\.?|→)\s*$/i, "");
  return t.trim();
}

// For each post-like href under the listing page's own path, prefer the
// text of a heading element inside/around the link (themes usually wrap
// the real title in an h1-h6 even when the whole card is one big <a>);
// fall back to the longest plain anchor text seen for that href otherwise.
function extractPosts(html, baseUrl) {
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
    if (/\/tagged\//i.test(abs.pathname)) return;

    const heading = $(el).find("h1,h2,h3,h4,h5,h6").first().text().replace(/\s+/g, " ").trim();
    const plain = $(el).text().replace(/\s+/g, " ").trim();
    const key = abs.origin + abs.pathname;
    const existing = byHref.get(key);

    if (heading) {
      if (!existing || !existing.fromHeading) byHref.set(key, { href: abs.href, text: heading, fromHeading: true });
    } else if (!existing || (!existing.fromHeading && plain.length > existing.text.length)) {
      byHref.set(key, { href: abs.href, text: plain, fromHeading: false });
    }
  });

  return [...byHref.values()]
    .map(({ href, text }) => ({ url: href, title: cleanTitle(text) }))
    // A short title (e.g. "Videos", "News") is almost always a nav/category
    // tab whose href happens to fall under the listing's own path, not a
    // real post — real post titles run much longer than this in practice.
    .filter((p) => p.title && p.title.length >= 10 && p.title.length <= 180);
}

async function checkBrand({ brand, url }, seenUrls) {
  const allowed = await checkRobotsAllowed(url);
  if (!allowed) {
    console.log(`${brand}: skipped — disallowed by robots.txt`);
    return { brand, newPosts: [], ok: false };
  }

  let status, finalUrl, text;
  try {
    ({ status, finalUrl, text } = await fetchText(url));
  } catch (e) {
    console.log(`${brand}: skipped — fetch failed (${e.message || e})`);
    return { brand, newPosts: [], ok: false };
  }

  if (status !== 200) {
    console.log(`${brand}: skipped — page returned HTTP ${status}`);
    return { brand, newPosts: [], ok: false };
  }

  let posts;
  try {
    posts = extractPosts(text, finalUrl);
  } catch (e) {
    console.log(`${brand}: skipped — could not parse page (${e.message || e})`);
    return { brand, newPosts: [], ok: false };
  }

  const newPosts = posts.filter((p) => !seenUrls.has(p.url));
  console.log(`${brand}: fetched OK, ${posts.length} post link(s) found, ${newPosts.length} new since last run`);
  return { brand, newPosts, ok: true };
}

async function main() {
  const existing = readJson(NEWS_PATH, []);
  const state = readJson(STATE_PATH, { lastChecked: null, zeroStreaks: {} });
  const zeroStreaks = { ...(state.zeroStreaks || {}) };
  const seenUrls = new Set(existing.map((e) => e.url));

  const allNew = [];
  for (const b of BRANDS) {
    const { brand, newPosts } = await checkBrand(b, seenUrls);

    if (newPosts.length > 0) {
      zeroStreaks[brand] = 0;
      for (const p of newPosts) {
        allNew.push({ brand, title: p.title, url: p.url, dateFound: todayUTC() });
        seenUrls.add(p.url); // guard against the same brand linking the same post twice on one page
      }
    } else {
      zeroStreaks[brand] = (zeroStreaks[brand] || 0) + 1;
      if (zeroStreaks[brand] >= ZERO_STREAK_WARNING_THRESHOLD) {
        console.log(
          `::warning::${brand}'s gear-news scraper has found zero new posts for ${zeroStreaks[brand]} consecutive weekly runs — its page may have changed or be blocking requests. Worth a manual check.`
        );
      }
    }
  }

  if (allNew.length === 0) {
    console.log("\nNothing new across any tracked brand this run — leaving gear-news.json untouched (no commit).");
    // Still worth persisting the zero-streak counters even when nothing is
    // new, since those are exactly what makes the 4-week warning fire —
    // losing them on a no-commit run would silently reset the count.
    fs.writeFileSync(STATE_PATH, JSON.stringify({ lastChecked: todayUTC(), zeroStreaks }, null, 2) + "\n");
    return;
  }

  const updated = [...allNew, ...existing];
  fs.writeFileSync(NEWS_PATH, JSON.stringify(updated, null, 2) + "\n");
  fs.writeFileSync(STATE_PATH, JSON.stringify({ lastChecked: todayUTC(), zeroStreaks }, null, 2) + "\n");

  console.log(`\nAdded ${allNew.length} new gear-news entr${allNew.length === 1 ? "y" : "ies"}:`);
  for (const e of allNew) {
    console.log(`  - [${e.brand}] ${e.title} <${e.url}>`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
