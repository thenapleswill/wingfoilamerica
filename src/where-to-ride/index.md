---
layout: layouts/article-page.njk
bodyClass: "wtr-page"
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
real, ridden reports come in. Zoom in to split up clusters, click any pin for the full rundown,
or add one yourself below the map if you know a spot that's missing.

<div class="map-legend">
  <span><span class="spot-pin spot-pin--verified" aria-hidden="true"></span> Firsthand verified</span>
  <span><span class="spot-pin spot-pin--community" aria-hidden="true"></span> Community-reported</span>
</div>

<div id="where-to-ride-app" data-spots-url="{{ '/assets/data/where-to-ride-spots.json' | url }}" data-spot-base-url="{{ '/where-to-ride/' | url }}">
  <div id="spotsMap"></div>
</div>

<div class="add-spot-callout">
  <div class="add-spot-callout-text">
    <h2>Know a spot that should be here?</h2>
    <p class="submit-spot-note">Submissions come straight to Will for review — nothing publishes automatically.</p>
  </div>
  <button type="button" id="submitSpotOpen" class="btn btn-accent add-spot-callout-btn">Add a Spot</button>
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

<div class="submit-spot-modal" id="submitSpotModal" hidden>
  <div class="submit-spot-modal-backdrop" data-modal-close></div>
  <div class="submit-spot-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="submitSpotModalTitle">
    <div class="submit-spot-modal-header">
      <div>
        <p class="eyebrow submit-spot-modal-eyebrow">Where to Ride</p>
        <h2 id="submitSpotModalTitle" class="submit-spot-modal-title">Add a Spot</h2>
      </div>
      <button type="button" class="submit-spot-modal-close" data-modal-close aria-label="Close">&times;</button>
    </div>

    <div id="submitSpotMapStep">
      <p class="submit-spot-map-instruction">Click exactly where you'd launch from.</p>
      <div id="submitSpotMap" class="submit-spot-map"></div>
      <p class="submit-spot-map-coords" id="submitSpotCoords" hidden></p>
      <button type="button" class="btn btn-accent" id="submitSpotContinueBtn" disabled>Continue</button>
    </div>

    <div id="submitSpotAirtableWrap" hidden>
      <iframe id="submitSpotIframe" class="airtable-embed" frameborder="0" width="100%" height="533" style="background: transparent;"></iframe>
    </div>
  </div>
</div>
