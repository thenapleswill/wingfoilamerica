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
  <span><span class="spot-pin spot-pin--verified" aria-hidden="true"></span> Firsthand verified</span>
  <span><span class="spot-pin spot-pin--community" aria-hidden="true"></span> Community-reported</span>
</div>

<div id="where-to-ride-app" data-spots-url="{{ '/assets/data/where-to-ride-spots.json' | url }}" data-spot-base-url="{{ '/where-to-ride/' | url }}">
  <div class="wtr-layout">
    <div id="spotsMap"></div>
    <div class="spots-list-panel">
      <div class="spots-list-header"><span id="spotsListCount">Loading spots&hellip;</span></div>
      <ul id="spotsList" class="spots-list"></ul>
    </div>
  </div>
</div>

<section class="spots-directory" aria-labelledby="spots-directory-heading">
  <h2 id="spots-directory-heading">Browse All Spots</h2>
  <p>Every spot on the map above, listed here as plain text too — useful if you're skimming on a slow connection, or just prefer to read.</p>
  {%- for group in spotsByState %}
  <h3>{{ group.state }}</h3>
  <ul class="spots-directory-list">
    {%- for spot in group.spots %}
    <li id="spot-{{ spot.id }}">
      <strong><a href="{{ ('/where-to-ride/' + spot.id + '/') | url }}">{{ spot.name }}</a></strong> — {{ spot.city }}, {{ spot.state }} ({{ spot.region }})<br>
      Skill level: {{ spot.skillLevel }}<br>
      {{ spot.description | excerpt(200) | linkify | safe }}
    </li>
    {%- endfor %}
  </ul>
  {%- endfor %}
</section>

## Know a spot that should be here?

<div class="submit-spot">
  <p class="submit-spot-note">Submissions come straight to Will for review — nothing publishes automatically.</p>
  <button type="button" id="submitSpotOpen" class="btn btn-accent">Submit a Spot</button>
</div>

<div class="submit-spot-modal" id="submitSpotModal" hidden>
  <div class="submit-spot-modal-backdrop" data-modal-close></div>
  <div class="submit-spot-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="submitSpotModalTitle">
    <div class="submit-spot-modal-header">
      <div>
        <p class="eyebrow submit-spot-modal-eyebrow">Where to Ride</p>
        <h2 id="submitSpotModalTitle" class="submit-spot-modal-title">Submit a Spot</h2>
      </div>
      <button type="button" class="submit-spot-modal-close" data-modal-close aria-label="Close">&times;</button>
    </div>
    <iframe id="submitSpotIframe" class="airtable-embed" data-src="https://airtable.com/embed/appJHchIsjqLQ4gvL/shr9crEhnDAMc3X2U" frameborder="0" width="100%" height="533" style="background: transparent;"></iframe>
  </div>
</div>
