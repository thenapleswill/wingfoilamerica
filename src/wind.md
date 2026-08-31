---
layout: layouts/article-page.njk
title: "Wind"
eyebrow: "The Engine of the Sport"
description: "Wing foiling doesn't work without wind. Here's what's actually happening when the wing pulls, why gear choice depends on it, and how to check today's conditions before you drive to the water."
extraCss:
  - /assets/css/wind-checker.css
  - /assets/css/wind-tabs.css
extraJs:
  - /assets/js/windy-embed.js
  - /assets/js/wind-checker.js
  - /assets/js/wind-tabs.js
---

## Check the Wind Right Now

<div id="wind-checker" class="wind-checker">
  <div class="wind-checker-card">
    <p class="wind-checker-intro">See live wind conditions for your spot — share your location, or search for one manually.</p>
    <div class="wind-checker-actions">
      <button type="button" id="useLocationBtn" class="btn btn-accent">Use My Location</button>
      <span class="wind-checker-or">or</span>
      <form id="locationSearchForm" class="location-search-form">
        <label class="sr-only" for="locationSearchInput">Search for a location</label>
        <input type="text" id="locationSearchInput" placeholder="Search a city or beach (e.g. Hood River, OR)" autocomplete="off">
        <button type="submit" class="btn btn-outline">Search</button>
      </form>
    </div>
    <p class="wind-checker-status" id="windCheckerStatus" role="status" aria-live="polite"></p>

    <div class="wind-checker-map" id="windMapContainer" hidden>
      <div class="wind-checker-map-frame">
        <iframe id="windyEmbed" title="Live wind map" loading="lazy" frameborder="0"></iframe>
      </div>
      <p class="wind-checker-attribution">Live map powered by <a href="https://www.windy.com" target="_blank" rel="noopener">Windy.com</a></p>
    </div>

    <div class="wind-checker-links" id="windLinksContainer" hidden>
      <a id="windyLink" class="wind-quick-link" target="_blank" rel="noopener">Open in Windy &rarr;</a>
      <a id="windfinderLink" class="wind-quick-link" target="_blank" rel="noopener">Open in Windfinder &rarr;</a>
      <a id="noaaLink" class="wind-quick-link" target="_blank" rel="noopener">NOAA Marine Forecast &rarr;</a>
    </div>
  </div>
</div>

## Learn More

<div class="wind-tabs">
  <div class="wind-tabs-list" role="tablist" aria-label="Wind learning topics">
    <button type="button" class="wind-tab" id="tab-direction" role="tab" aria-selected="true" aria-controls="panel-direction">Reading Wind Direction</button>
    <button type="button" class="wind-tab" id="tab-spot" role="tab" aria-selected="false" aria-controls="panel-spot" tabindex="-1">Choosing Your Spot</button>
    <button type="button" class="wind-tab" id="tab-wing" role="tab" aria-selected="false" aria-controls="panel-wing" tabindex="-1">Wind Speed &rarr; Wing Size</button>
    <button type="button" class="wind-tab" id="tab-how" role="tab" aria-selected="false" aria-controls="panel-how" tabindex="-1">How Wind Works</button>
  </div>

  <div class="wind-tab-panel" id="panel-direction" role="tabpanel" aria-labelledby="tab-direction">

Direction relative to the shoreline matters as much as speed — arguably more, for safety. It's more nuanced than "onshore good, offshore bad":

- **Side-shore to side-onshore — best for beginners.** You can self-rescue toward shore if you're tired or the wind shifts.
- **Straight onshore — not ideal for beginners**, despite blowing toward shore. You can't yet ride upwind, so you get pushed through breaking waves and sandbars into the impact zone. Better suited to flat, protected, shallow spots, or to experienced riders who can handle the shorebreak.
- **Offshore (straight or angled) — the most dangerous condition at any level.** It blows you away from shore with no self-rescue option. Don't ride it without a safety boat and real experience.

Not sure about a spot's direction? Ask a local shop or experienced rider before you launch. More in [Mistakes & Safety](/beginner-guide/mistakes-and-safety/).

  </div>

  <div class="wind-tab-panel" id="panel-spot" role="tabpanel" aria-labelledby="tab-spot" hidden>

Not every beach faces the same way, so "good wind direction" depends on where you are — a clean side-shore breeze at one beach can slam straight onshore a mile away, just because the coastline bends.

**The fix:** scout a small rotation of spots with different orientations. One beach running roughly north–south and another running east–west between them cover most wind directions — whichever way it's blowing on a given day, one of the two is probably catching it side-shore or side-onshore instead of straight onshore or offshore.

The [Where to Ride](/where-to-ride/) map lists each spot's best wind directions, so you can match today's forecast to the right beach instead of forcing a session at the wrong one.

  </div>

  <div class="wind-tab-panel" id="panel-wing" role="tabpanel" aria-labelledby="tab-wing" hidden>

Most wing foiling happens somewhere in the **10–25+ mph** range. Below roughly 8–10 mph, most wings can't generate enough power to get an average rider up on foil — that's "go get lunch" wind.

| Wind tier | Speed | Typical wing size | Feel |
|---|---|---|---|
| Light | 10–15 mph | ~5–6.5 m² | Enough power to get up, but soft |
| Moderate | 15–20 mph | ~4–5.5 m² | The sweet spot for learning |
| Strong | 20–25 mph | ~3–4.5 m² | Sporty and physical, for a confident rider |
| Very strong | 25+ mph | ~2–3.5 m² | Small-wing, experienced-rider territory |

Wing size also depends on your weight and experience — run your numbers through the [gear calculator](/beginner-guide/gear-and-budget/) for a personalized size rather than treating this table as gospel.

Steady 10–20 mph without big gusts is about as good as it gets for a beginner.

  </div>

  <div class="wind-tab-panel" id="panel-how" role="tabpanel" aria-labelledby="tab-how" hidden>

**Wind is the only engine wing foilers have** — no wave energy to ride, no paddle to fall back on. Understanding it is the actual subject you're learning, not optional trivia.

**True vs. apparent wind:** True wind is what you'd feel standing still — the forecast number. Apparent wind is what you actually feel once moving (true wind plus the wind your own motion creates), which is why you constantly re-angle the wing as you speed up or change direction.

**The wind window:** Picture a dome of sky downwind of you. The edges (near 90° to either side) produce little power; straight downwind, dead-center, is the power zone. Flying the wing up toward the edge depowers it; sweeping it down into the zone repowers it — that one mechanic is behind all wing "feel."

**Gusts and lulls:** a gust is a sudden speed increase, a lull a temporary drop.

- Gust: sheet out or fly the wing toward the window's edge to depower before it drags you off balance.
- Lull: pump the wing back into the power zone to claw back speed.

This is also why wing **size** is a real tradeoff. A bigger wing makes more power in light or lulling wind, but becomes a handful once it builds. A smaller wing stays calm in strong, gusty wind, but won't get you going when it's light — which is why most riders who stick with the sport end up owning two or three.

**Thermal vs. gradient wind:** Thermal wind (a sea breeze) is driven by the daily heating cycle — it builds through late morning, peaks in the afternoon, and fades at sunset, so check the forecast for *time*, not just day. Gradient wind (driven by weather systems) can blow at any hour and is often steadier, but less predictable day-to-day. Some of the best spots get a boost from both lining up at once.

  </div>
</div>
