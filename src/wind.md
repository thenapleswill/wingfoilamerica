---
layout: layouts/article-page.njk
title: "Wind"
eyebrow: "The Engine of the Sport"
description: "Wing foiling doesn't work without wind. Here's what's actually happening when the wing pulls, why gear choice depends on it, and how to check today's conditions before you drive to the water."
extraCss:
  - /assets/css/wind-checker.css
extraJs:
  - /assets/js/wind-checker.js
---

<!-- PLACEHOLDER-QUALITY DRAFT — accurate and structured, but feel free to refine the wording. -->

## Why wind is everything

Every other foiling discipline has a backup power source. SUP foilers paddle. Surf foilers ride wave energy. Wing foilers have exactly one engine: the wing in their hands. No wind, no power, no lift, no ride — it's the one ingredient you can't train around, buy your way past, or substitute with better technique. Understanding wind isn't optional trivia for this sport; it's the actual subject you're learning.

That's why a good wing foiler ends up reading wind forecasts the way a surfer reads swell charts — obsessively, and with a real mental model of what's going on, not just a glance at a single number.

## How much wind do you actually need

Most wing foiling happens somewhere in the **10–25+ mph** range, though the useful window depends heavily on your weight, skill, and wing size:

- **Below ~8–10 mph:** most wings can't generate enough power to get an average rider up on foil. This is "go get lunch" wind.
- **~12–18 mph:** the sweet spot for learning — enough power to get up and stay up without the wing constantly trying to rip out of your hands.
- **~18–25 mph:** solid, sporty conditions for a confident rider on the right wing size.
- **25+ mph:** possible, but physical and unforgiving. This is small-wing, experienced-rider territory, and a rough place to be learning.

Steady wind in the 12–18 mph range, without big gusts, is about as good as it gets for a beginner.

## True wind vs. apparent wind

**True wind** is what you'd feel standing still on the beach — the number in the forecast. **Apparent wind** is what you actually feel once you're moving, and it's a combination of the true wind plus the wind your own motion creates (the same reason sticking your hand out of a moving car feels windy even on a still day).

Once you're up on foil and accelerating, your apparent wind shifts — both in speed and in angle — compared to what you felt standing still. This is why a wing needs to be constantly re-angled as you speed up or change direction: the "correct" wing position for 5 mph of boat speed isn't the correct position for 15 mph. Learning to feel that shift, rather than fighting it, is a big part of what separates early beginners from riders who look relaxed on the water.

## The wind window

Borrowed straight from kiteboarding: picture a dome of sky downwind of you. The edges of that dome (out near 90° to either side of you) produce very little power — this is the **edge of the window**. Straight downwind, in the middle of the dome, is the **power zone**, where the wing generates maximum pull.

Wing foilers fly the wing through this window constantly to control power output — not by changing how hard they grip it, but by changing *where* it sits in the window:

- Flying the wing up toward the edge of the window **depowers** it.
- Sweeping it down into the power zone **repowers** it.

Everything about wing "feel" — smooth acceleration, controlled slowdowns, riding through gusty patches — comes down to this one mechanic.

## Gusts, lulls, and why gear size is a tradeoff

A **gust** is a sudden increase in wind speed; a **lull** is a temporary drop. Both are normal, and both demand a response:

- In a gust, riders sheet out or fly the wing toward the window's edge to depower before it drags them off balance.
- In a lull, riders pump the wing and sweep it back into the power zone to claw back speed and stay up on the foil.

This is also why wing **size** is a genuine tradeoff, not just a preference. A bigger wing makes more power in light or lulling wind — great for getting up early and staying up through soft patches — but becomes a handful once the wind builds, since there's more sail area for gusts to grab. A smaller wing is calm and controllable in strong, gusty wind, but won't generate enough power to get you going when it's light. There's no single "right size" — it's why most riders who stick with the sport end up owning two or three wings for different wind ranges.

## Thermal wind vs. gradient wind

Not all wind behaves the same way, and knowing which kind you're dealing with tells you a lot about how the session will unfold.

**Thermal wind** (often called a sea breeze) is driven by the daily heating cycle: land heats up faster than water during the day, the warm air over land rises, and cooler air gets pulled in off the water to replace it. Thermal wind typically builds through late morning, peaks in the afternoon, and fades as the sun goes down. It's common at many coastal and lake spots and tends to follow a fairly predictable daily rhythm — check the forecast for the *time*, not just the day.

**Gradient wind** (sometimes called synoptic or weather-system wind) is driven by large-scale pressure differences between weather systems — highs and lows moving across a region. It can blow at any hour, day or night, and doesn't care what the sun is doing. Gradient wind is often more sustained and directionally consistent than thermal wind, but its onset and duration are tied to the broader weather pattern, so it can be less predictable day-to-day. Some of the best wind spots in the world get a boost from both effects lining up — a thermal breeze reinforcing a background gradient flow.

## Wind direction and shore safety

Direction relative to the shoreline matters as much as speed — arguably more, from a safety standpoint. There are three basic cases:

- **Onshore** (blowing from the water toward the land) — generally the **safest condition for beginners**. If something goes wrong — you're exhausted, gear fails, you can't relaunch — the wind pushes you back toward the beach, not away from it.
- **Cross-shore** (blowing roughly parallel to the shoreline) — very rideable and common at good spots, but pay attention to how far you're drifting down the beach over a session so you don't end up walking back.
- **Offshore** (blowing from the land out toward open water) — the **highest-risk condition for beginners**. A problem on the water means the wind is actively working against you and pushing you further from help. Beginners should avoid launching in offshore wind entirely; even experienced riders should treat pure offshore days with real respect — ride with others, tell someone your plan, and know your limits.

When in doubt about direction, ask a local shop or experienced rider at the spot before you launch. See [Safety Basics](/beginner-guide/safety-basics/) for more.

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
