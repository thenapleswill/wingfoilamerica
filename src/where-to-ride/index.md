---
layout: layouts/article-page.njk
title: "Where to Ride"
eyebrow: "Find a Spot"
description: "A growing map of U.S. wing foil launches — water type, best wind direction, skill level, and who to expect on the water, plotted so you can find a spot wherever you are."
extraCss:
  - /assets/vendor/leaflet/leaflet.css
  - /assets/vendor/leaflet.markercluster/MarkerCluster.css
  - /assets/vendor/leaflet.markercluster/MarkerCluster.Default.css
  - /assets/css/where-to-ride.css
extraJs:
  - /assets/vendor/leaflet/leaflet.js
  - /assets/vendor/leaflet.markercluster/leaflet.markercluster.js
  - /assets/js/where-to-ride.js
---

A living map of places wing foilers actually ride — built from research so far, and growing as
real, ridden reports come in. Zoom in to split up clusters, click any pin or list entry for the
full rundown, or jump straight to the bottom to tell us about a spot that's missing.

<div class="map-legend">
  <span><span class="spot-pin spot-pin--verified"></span> Firsthand verified</span>
  <span><span class="spot-pin spot-pin--community"></span> Community-reported</span>
</div>

<div id="where-to-ride-app" data-spots-url="{{ '/assets/data/where-to-ride-spots.json' | url }}">
  <div class="wtr-layout">
    <div id="spotsMap"></div>
    <div class="spots-list-panel">
      <div class="spots-list-header"><span id="spotsListCount">Loading spots&hellip;</span></div>
      <ul id="spotsList" class="spots-list"></ul>
    </div>
  </div>
</div>

## Know a spot that should be here?

<div class="submit-spot">
  <button type="button" id="submitSpotToggle" class="btn btn-accent" aria-expanded="false" aria-controls="submitSpotPanel">Submit a Spot</button>

  <div id="submitSpotPanel" class="submit-spot-panel" hidden>
    <form id="submitSpotForm" data-action="REPLACE_WITH_YOUR_FORMSPREE_ENDPOINT" method="post">
      <div class="field">
        <label for="spotName">Spot name</label>
        <input type="text" id="spotName" name="spot_name" required>
      </div>
      <div class="field">
        <label for="spotLocation">Location (city, state)</label>
        <input type="text" id="spotLocation" name="location" required>
      </div>
      <div class="field">
        <label for="spotWater">Water type</label>
        <input type="text" id="spotWater" name="water_type" placeholder="e.g. flat bay, ocean chop, lake" required>
      </div>
      <div class="field">
        <label for="spotWind">Best wind direction</label>
        <input type="text" id="spotWind" name="wind_direction" placeholder="e.g. SW, onshore" required>
      </div>
      <div class="field">
        <label for="spotSkill">Skill level</label>
        <select id="spotSkill" name="skill_level" required>
          <option value="">Choose one</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
          <option>All levels</option>
        </select>
      </div>
      <div class="field">
        <label for="spotWhy">Why it's worth adding</label>
        <textarea id="spotWhy" name="why" required></textarea>
      </div>
      <button type="submit" class="btn btn-accent">Send it in</button>
      <p class="submit-spot-status" id="submitSpotStatus" hidden></p>
    </form>
    <p class="submit-spot-note">Submissions come straight to Will for review — nothing publishes automatically.</p>
  </div>
</div>
