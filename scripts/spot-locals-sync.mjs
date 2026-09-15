#!/usr/bin/env node
// Weekly "Spot Locals" publish step. Run by .github/workflows/spot-locals-sync.yml
// (schedule + workflow_dispatch).
//
// Locals submit themselves via the "I'm a local here" modal on each spot
// page, which lands directly in Airtable's own hosted form (table "Spot
// Locals", base appJHchIsjqLQ4gvL) with Status defaulted to "New". Will
// reviews new rows in Airtable and flips Status to "Published" by hand —
// nothing on the site auto-publishes.
//
// This script is the read side of that: it asks Airtable's REST API for
// only the rows already marked "Published", and writes them to a local
// JSON file grouped by Spot ID, which the site then renders badges/chips
// from at build time. No client-side Airtable calls, no API key ships to
// the browser — the read token lives only in this GitHub Actions secret.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_PATH = path.join(ROOT, "src/_data/spot-locals.json");

const BASE_ID = "appJHchIsjqLQ4gvL";
const TABLE_ID = "tblGQHI617EVOZGqH"; // Spot Locals
const TOKEN = process.env.AIRTABLE_READ_TOKEN;

async function fetchPublishedRecords() {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("filterByFormula", '{Status}="Published"');
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) {
      throw new Error(`Airtable API error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function main() {
  if (!TOKEN) {
    console.error("AIRTABLE_READ_TOKEN is not set — skipping Spot Locals sync.");
    process.exitCode = 1;
    return Promise.resolve();
  }

  return fetchPublishedRecords().then((records) => {
    const bySpot = {};
    for (const record of records) {
      const fields = record.fields;
      const spotId = (fields["Spot ID"] || "").trim();
      const name = (fields["Display Name / Handle"] || "").trim();
      if (!spotId || !name) continue; // required fields on the form; skip anything malformed
      if (!bySpot[spotId]) bySpot[spotId] = [];
      bySpot[spotId].push({
        name,
        socialLink: fields["Social Link"] || null,
        shortNote: fields["Short Note"] || null,
      });
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(bySpot, null, 2) + "\n");
    const spotCount = Object.keys(bySpot).length;
    const localCount = records.length;
    console.log(`Wrote ${localCount} published local(s) across ${spotCount} spot(s) to ${path.relative(ROOT, OUT_PATH)}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
