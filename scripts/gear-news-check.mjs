#!/usr/bin/env node
// Weekly "What's New in Gear" check. Run by .github/workflows/gear-news.yml
// (schedule + workflow_dispatch), no human in the loop.
//
// Calls Claude with the web_search tool to look for genuinely new wing
// foiling products from a fixed brand list, since the last time this ran.
// Hard rule: every entry must carry a sourceUrl that actually appeared in
// this run's own web search results — never an invented or remembered URL.
// If nothing checks out, the script makes no changes and exits cleanly;
// the workflow then has nothing to commit. No filler, ever.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NEWS_PATH = path.join(ROOT, "src/_data/gear-news.json");
const STATE_PATH = path.join(ROOT, "src/_data/gear-news-state.json");

const MODEL = "claude-haiku-4-5";
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 20 };

const BRANDS = [
  "Naish",
  "Armstrong Foils",
  "Slingshot Sports",
  "Duotone",
  "F-One",
  "North",
  "Cabrinha",
  "Ozone",
  "Axis Foils",
];
const CATEGORIES = new Set(["wing", "board", "foil", "accessory"]);

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

function normalizeName(brand, product) {
  return `${brand} ${product}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildPrompt(existing, lastChecked) {
  const since = lastChecked || "30 days ago (no prior check on record)";
  const known = existing.map((e) => `- ${e.brand}: ${e.product}`).join("\n") || "(none yet)";

  const system = `You are a research assistant for Wing Foil America, a wing foiling resource site. Your only job this run is to check whether any of these 9 brands have released or officially announced a genuinely NEW wing foiling product since ${since}: ${BRANDS.join(", ")}.

For each brand, prefer its own official site. Fall back to a reputable retailer or press source only if the brand's own site doesn't have clear information.

HARD RULES — non-negotiable:
1. Every entry you return MUST include a real, working sourceUrl that you actually found via the web_search tool during THIS conversation. Never invent, guess, remember from training, or reconstruct a URL.
2. If you cannot find a working source URL for something, leave it out entirely. Do not include it with a placeholder, guessed, or approximate URL.
3. Do not include a product based on training-data memory alone — it must be confirmed by a fresh search this run.
4. Skip restocks, color/graphic variants, and minor firmware/software updates. Only genuinely new products or new model releases count.
5. Skip anything already in this list of products we already have:
${known}
6. If nothing genuinely new was found across all 9 brands, that is the correct, expected outcome most weeks. Return an empty array — never pad it with filler, rumors, or "coming soon" speculation.

OUTPUT FORMAT: After you finish searching, respond with ONLY a single fenced code block containing a JSON array and nothing else before or after it (no prose, no explanation). Each element must look like:
{
  "date": "YYYY-MM-DD",
  "brand": "one of the exact 9 brand names above",
  "product": "product name",
  "category": "wing" | "board" | "foil" | "accessory",
  "summary": "One or two honest sentences on what's actually new. No hype, no marketing language.",
  "sourceName": "Brand (official product page)" or a retailer/press outlet name,
  "sourceUrl": "https://... — a URL you actually found via web_search this run"
}
If nothing qualifies, respond with exactly: []`;

  const user = `Today's date is ${todayUTC()}. Check for genuinely new wing foiling products (wings, boards, hydrofoils, accessories) from the 9 brands listed in your instructions, released or announced since ${since}. Search each brand's own site. Return only the JSON array as instructed.`;

  return { system, user };
}

export function extractJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function runClaude(system, user) {
  const client = new Anthropic();
  const foundUrls = new Set();
  let messages = [{ role: "user", content: user }];
  let finalMessage = null;

  // Server-side web search normally resolves within one response; loop only
  // to resume the rare pause_turn on a long-running search turn.
  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      tools: [WEB_SEARCH_TOOL],
      messages,
    });

    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const result of block.content) {
          if (result.url) foundUrls.add(result.url);
        }
      }
    }

    if (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      continue;
    }

    finalMessage = response;
    break;
  }

  if (!finalMessage) {
    throw new Error("Claude did not finish within the pause_turn retry limit");
  }

  const text = finalMessage.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return { text, foundUrls };
}

export function validateEntries(rawEntries, foundUrls, existing) {
  const known = new Set(existing.map((e) => normalizeName(e.brand, e.product)));
  const seenThisRun = new Set();
  const valid = [];
  const rejected = [];

  if (!Array.isArray(rawEntries)) {
    return { valid, rejected: [{ reason: "response was not a JSON array" }] };
  }

  for (const entry of rawEntries) {
    const problems = [];
    if (!entry || typeof entry !== "object") {
      rejected.push({ entry, reason: "not an object" });
      continue;
    }
    const { date, brand, product, category, summary, sourceName, sourceUrl } = entry;

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push("bad date");
    if (typeof brand !== "string" || !BRANDS.includes(brand)) problems.push("brand not in tracked list");
    if (typeof product !== "string" || !product.trim()) problems.push("missing product");
    if (typeof category !== "string" || !CATEGORIES.has(category)) problems.push("bad category");
    if (typeof summary !== "string" || !summary.trim()) problems.push("missing summary");
    if (typeof sourceName !== "string" || !sourceName.trim()) problems.push("missing sourceName");
    if (typeof sourceUrl !== "string" || !/^https?:\/\//.test(sourceUrl)) problems.push("missing/invalid sourceUrl");
    else if (!foundUrls.has(sourceUrl)) problems.push("sourceUrl was not among this run's actual web_search results");

    if (problems.length) {
      rejected.push({ entry, reason: problems.join("; ") });
      continue;
    }

    const key = normalizeName(brand, product);
    if (known.has(key) || seenThisRun.has(key)) {
      rejected.push({ entry, reason: "duplicate of an existing/already-seen entry" });
      continue;
    }
    seenThisRun.add(key);
    valid.push({ date, brand, product, category, summary, sourceName, sourceUrl });
  }

  return { valid, rejected };
}

async function main() {
  const existing = readJson(NEWS_PATH, []);
  const state = readJson(STATE_PATH, { lastChecked: null });

  const { system, user } = buildPrompt(existing, state.lastChecked);

  console.log(`Checking for new gear since: ${state.lastChecked || "(no prior check)"}`);
  const { text, foundUrls } = await runClaude(system, user);

  console.log(`Model returned ${foundUrls.size} distinct search-result URL(s) this run.`);

  const rawEntries = extractJsonArray(text);
  if (rawEntries === null) {
    console.error("Could not parse a JSON array out of the model's response. Raw response:");
    console.error(text);
    process.exitCode = 1;
    return;
  }

  const { valid, rejected } = validateEntries(rawEntries, foundUrls, existing);

  if (rejected.length) {
    console.log(`Rejected ${rejected.length} candidate entr${rejected.length === 1 ? "y" : "ies"}:`);
    for (const r of rejected) {
      console.log(`  - ${JSON.stringify(r.entry && (r.entry.brand + " " + r.entry.product))}: ${r.reason}`);
    }
  }

  if (valid.length === 0) {
    console.log("Nothing new and valid this run — leaving gear-news.json and lastChecked untouched (no commit).");
    return;
  }

  valid.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const updated = [...valid, ...existing];
  fs.writeFileSync(NEWS_PATH, JSON.stringify(updated, null, 2) + "\n");
  fs.writeFileSync(STATE_PATH, JSON.stringify({ lastChecked: todayUTC() }, null, 2) + "\n");

  console.log(`Added ${valid.length} new gear-news entr${valid.length === 1 ? "y" : "ies"}:`);
  for (const e of valid) {
    console.log(`  - ${e.date} ${e.brand} — ${e.product} (${e.category}) <${e.sourceUrl}>`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
