#!/usr/bin/env node
// Weekly "What's New in Gear" check. Run by .github/workflows/gear-news.yml
// (schedule + workflow_dispatch). No AI, no API key, no paid service of any
// kind — two free/keyless mechanisms only:
//
// 1. FEED_BRANDS: brands with a real, live Shopify-generated Atom feed
//    (verified by hand against each URL — see README note in this repo's
//    history). Each run fetches the feed directly and reads real entries:
//    real title, real published date, a real excerpt pulled straight from
//    the feed's own <content>/<summary> (HTML-stripped, truncated — never
//    paraphrased), and a link back to the brand's own post. The existing
//    keyword relevance filter still applies, since these are general brand
//    feeds covering their whole catalog (kite, wake, wing, competition,
//    team news), not just wing-foil gear.
//
// 2. DIFFCHECK_BRANDS: brands with no working feed. No scraping, no content
//    extraction — just fetch their news page, hash it, and compare to the
//    hash saved last run. A changed hash means "something on this page is
//    different" and gets appended to gear-news-manual-review.json for a
//    human to go look at; nothing about what changed is ever invented.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { isAllowed } from "./robots-check.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NEWS_PATH = path.join(ROOT, "src/_data/gear-news.json");
const STATE_PATH = path.join(ROOT, "src/_data/gear-news-state.json");
const DIFFCHECK_STATE_PATH = path.join(ROOT, "src/_data/gear-news-diffcheck-state.json");
const MANUAL_REVIEW_PATH = path.join(ROOT, "src/_data/gear-news-manual-review.json");

const UA = "WingFoilAmericaGearNewsBot/1.0 (+https://wingfoilamerica.com; weekly gear-news check, contact admin@wingfoilamerica.com)";
const ZERO_STREAK_WARNING_THRESHOLD = 4;
const MAX_ENTRIES = 30;
const MAX_MANUAL_REVIEW_ENTRIES = 50;

// Verified directly against each URL (fetched and inspected the real
// response) rather than assumed. Naish's /blogs/blog.atom and North's
// /blogs/all.atom both turned out to be real, live, current feeds even
// though they'd been assumed not to have one — included since the actual
// response is what matters, not the assumption. Axis Foils' feed is real
// but stale (no post since 2023-07) — kept as a feed anyway; if they ever
// post again it'll show up with its real date, nothing to fix here.
const FEED_BRANDS = [
  { brand: "Naish", feedUrl: "https://www.naish.com/blogs/blog.atom" },
  { brand: "Armstrong Foils", feedUrl: "https://armstrongfoils.com/blogs/news.atom" },
  { brand: "Slingshot Sports", feedUrl: "https://slingshotsports.com/blogs/news.atom" },
  { brand: "Cabrinha", feedUrl: "https://www.cabrinha.com/blogs/news.atom" },
  { brand: "Axis Foils", feedUrl: "https://axisfoils.com/blogs/news.atom" },
  { brand: "North", feedUrl: "https://northactionsports.com/blogs/all.atom" },
];

// No working feed found (checked /blogs/news.atom and a few other likely
// paths for each — see repo history). Duotone's news page is a Nuxt app
// that renders client-side (fetching it gets an empty shell, so a content
// hash still works as a change signal even though nothing can be parsed
// out of it). F-One's known news URL currently 404s. Ozone's brand domain
// (ozonegliders.com) turned out to be a bare iframe-redirect wrapper with
// no real content at any path checked; ozonekites.com's actual news page
// is real but blocks automated requests with a 403 — kept as the target
// since a future unblock or URL fix picks back up automatically, same
// "skip rather than invent" rule as before.
const DIFFCHECK_BRANDS = [
  { brand: "Duotone", url: "https://www.duotonesports.com/foilwing/about-us/news/" },
  { brand: "F-One", url: "https://www.f-one.world/news/?univers=foil" },
  { brand: "Ozone", url: "https://ozonekites.com/wing/news/" },
];

// Same relevance filter as before: negative keyword matches (wrong sport,
// or a non-gear content shape) are excluded outright; everything else
// needs a gear noun AND a substantive-content signal to be included.
// Brand feeds cover a brand's whole catalog and news cycle — kiteboarding,
// wakeboarding, competition recaps, team announcements — not just wing-foil
// gear, so this still matters even though the source is now a real feed.
const EXCLUDE_PATTERNS = [
  /kiteboard|kitesurf|kite-surf|kite[- ]?foiling|twin[- ]?tip|big air|king of the air|\bgka\b|mega ?loop|kite gear|kite-specific/i,
  /\bwake/i,
  /windsurf/i,
  /\b(recap|results?|championships?|world (cup|tour|title|champ)|podium|qualifiers?|wins?|winner|winning|racing|races?|slalom|gwa|red bull|sailgp|defi|m2o|molokai|top spot|top step|best trick|world record)\b/i,
  /\bwelcomes?\b|\bjoins?\b[\s\S]*\bteam\b|international team|team rider|signs? with/i,
  /\bmeet [a-z]|rider check|check-?in|\bq ?& ?a\b|\binterview\b|\bathlete profile\b/i,
  /podcast/i,
  /live ?stream|live broadcast/i,
  /magazine/i,
];

const GEAR_NOUN = /\b(wings?|boards?|foils?|masts?|fuselages?|stabilizers?|fins?|harness(?:es)?|booms?|parawings?)\b/i;
const GEAR_SIGNAL =
  /\b(review|comparison|versus|vs\.?|guide|walkthrough|explained|collection|quiver|overview|new|launch(?:es|ing)?|introduc(?:e|ing)|first impression|first look)\b|how to|how does|why choose|choosing|tech talk|design difference|available now|\b20\d{2}\b/i;

function isRelevantGearPost({ title, url }) {
  const text = `${title} ${url}`;
  if (EXCLUDE_PATTERNS.some((re) => re.test(text))) return false;
  return GEAR_NOUN.test(text) && GEAR_SIGNAL.test(text);
}

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
    if (status !== 200) return true;
    return isAllowed(text, new URL(pageUrl).pathname);
  } catch {
    return true;
  }
}

// Strips HTML tags from a feed's <content>/<summary> and collapses
// whitespace, for a short real excerpt — not an AI paraphrase, just the
// feed's own text with markup removed and cut to length.
function excerptFromHtml(html, maxLen = 220) {
  if (!html) return "";
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

async function checkFeedBrand({ brand, feedUrl }) {
  const allowed = await checkRobotsAllowed(feedUrl);
  if (!allowed) {
    console.log(`${brand}: skipped — disallowed by robots.txt`);
    return { brand, entries: [], totalFound: 0, ok: false };
  }

  let status, text;
  try {
    ({ status, text } = await fetchText(feedUrl));
  } catch (e) {
    console.log(`${brand}: skipped — feed fetch failed (${e.message || e})`);
    return { brand, entries: [], totalFound: 0, ok: false };
  }
  if (status !== 200) {
    console.log(`${brand}: skipped — feed returned HTTP ${status}`);
    return { brand, entries: [], totalFound: 0, ok: false };
  }

  let entries;
  try {
    const $ = cheerio.load(text, { xmlMode: true });
    entries = $("entry")
      .map((_, el) => {
        const $el = $(el);
        const title = $el.find("title").first().text().trim();
        const link =
          $el.find("link[rel=alternate]").attr("href") || $el.find("link").first().attr("href") || "";
        const published = $el.find("published").first().text().trim() || $el.find("updated").first().text().trim();
        const contentHtml = $el.find("content").first().html() || $el.find("summary").first().html() || "";
        return { title, url: link, publishedDate: published, excerpt: excerptFromHtml(contentHtml) };
      })
      .get()
      .filter((e) => e.title && e.url);
  } catch (e) {
    console.log(`${brand}: skipped — could not parse feed XML (${e.message || e})`);
    return { brand, entries: [], totalFound: 0, ok: false };
  }

  const relevant = entries.filter(isRelevantGearPost);
  const filteredCount = entries.length - relevant.length;
  console.log(
    `${brand}: fetched feed OK, ${entries.length} entr${entries.length === 1 ? "y" : "ies"} found, ${filteredCount} filtered out (off-topic/non-gear)`
  );
  return { brand, entries: relevant, totalFound: entries.length, ok: true };
}

function hashContent(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function checkDiffBrand({ brand, url }, diffState) {
  const allowed = await checkRobotsAllowed(url);
  if (!allowed) {
    console.log(`${brand} (diff-check): skipped — disallowed by robots.txt`);
    return { brand, changed: false, ok: false };
  }

  let status, text;
  try {
    ({ status, text } = await fetchText(url));
  } catch (e) {
    console.log(`${brand} (diff-check): skipped — fetch failed (${e.message || e})`);
    return { brand, changed: false, ok: false };
  }
  if (status !== 200) {
    console.log(`${brand} (diff-check): skipped — page returned HTTP ${status}`);
    return { brand, changed: false, ok: false };
  }

  const hash = hashContent(text);
  const prevHash = diffState[brand]?.lastHash;
  const changed = prevHash !== undefined && prevHash !== hash;
  if (changed) {
    console.log(`${brand} (diff-check): page content changed since last check — flagging for manual review`);
  } else if (prevHash === undefined) {
    console.log(`${brand} (diff-check): first check, baseline hash saved`);
  } else {
    console.log(`${brand} (diff-check): unchanged since last check`);
  }
  diffState[brand] = { lastHash: hash, url, lastChecked: todayUTC() };
  return { brand, url, changed, ok: true };
}

async function main() {
  const existing = readJson(NEWS_PATH, []);
  const state = readJson(STATE_PATH, { lastChecked: null, zeroStreaks: {} });
  const zeroStreaks = { ...(state.zeroStreaks || {}) };
  const diffState = readJson(DIFFCHECK_STATE_PATH, {});
  const manualReview = readJson(MANUAL_REVIEW_PATH, []);
  const seenUrls = new Set(existing.map((e) => e.url));

  const allNew = [];
  for (const b of FEED_BRANDS) {
    const { brand, entries, totalFound } = await checkFeedBrand(b);

    if (totalFound > 0) {
      zeroStreaks[brand] = 0;
    } else {
      zeroStreaks[brand] = (zeroStreaks[brand] || 0) + 1;
      if (zeroStreaks[brand] >= ZERO_STREAK_WARNING_THRESHOLD) {
        console.log(
          `::warning::${brand}'s gear-news feed has found zero entries for ${zeroStreaks[brand]} consecutive weekly runs — its feed may have moved or broken. Worth a manual check.`
        );
      }
    }

    for (const e of entries) {
      if (seenUrls.has(e.url)) continue;
      seenUrls.add(e.url);
      allNew.push({
        brand,
        title: e.title,
        url: e.url,
        publishedDate: e.publishedDate ? e.publishedDate.slice(0, 10) : null,
        excerpt: e.excerpt,
        dateFound: todayUTC(),
      });
    }
  }

  for (const b of DIFFCHECK_BRANDS) {
    const { brand, url, changed } = await checkDiffBrand(b, diffState);
    if (changed) {
      manualReview.unshift({ brand, url, detectedAt: todayUTC() });
    }
  }
  const trimmedManualReview = manualReview.slice(0, MAX_MANUAL_REVIEW_ENTRIES);
  fs.writeFileSync(MANUAL_REVIEW_PATH, JSON.stringify(trimmedManualReview, null, 2) + "\n");
  fs.writeFileSync(DIFFCHECK_STATE_PATH, JSON.stringify(diffState, null, 2) + "\n");

  if (allNew.length === 0) {
    console.log("\nNothing new (or nothing gear-relevant) across any feed brand this run.");
    fs.writeFileSync(STATE_PATH, JSON.stringify({ lastChecked: todayUTC(), zeroStreaks }, null, 2) + "\n");
    return;
  }

  const updated = [...allNew, ...existing]
    .sort((a, b) => (b.publishedDate || b.dateFound).localeCompare(a.publishedDate || a.dateFound))
    .slice(0, MAX_ENTRIES);
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
