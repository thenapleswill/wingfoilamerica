(function () {
  var root = document.getElementById("where-to-ride-app");
  if (!root) return;

  // Value the `verified` field takes once a spot has been confirmed firsthand
  // (as opposed to the seed data's "community-reported"). Set a spot's
  // "verified" field in where-to-ride-spots.json to this exact string to
  // switch its pin from outlined to filled.
  var VERIFIED_VALUE = "firsthand-verified";

  var spotsUrl = root.dataset.spotsUrl;
  var mapEl = document.getElementById("spotsMap");
  var listEl = document.getElementById("spotsList");

  fetch(spotsUrl)
    .then(function (response) { return response.json(); })
    .then(initMap)
    .catch(function () {
      if (mapEl) mapEl.innerHTML = '<p class="map-error">Could not load spot data right now.</p>';
    });

  function escapeHTML(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function makeIcon(spot) {
    var verifiedClass = spot.verified === VERIFIED_VALUE ? "spot-pin--verified" : "spot-pin--community";
    var statusLabel = spot.verified === VERIFIED_VALUE ? "Firsthand-verified spot" : "Community-reported spot";
    var label = escapeHTML(spot.name) + " — " + statusLabel;
    return L.divIcon({
      className: "spot-pin-wrapper",
      html: '<span class="spot-pin ' + verifiedClass + '" role="img" aria-label="' + label + '" title="' + label + '"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -12],
    });
  }

  function buildPopupHTML(spot) {
    var verifiedBadge =
      spot.verified === VERIFIED_VALUE
        ? '<span class="spot-badge spot-badge--verified">Firsthand verified</span>'
        : '<span class="spot-badge spot-badge--community">Community-reported</span>';
    var localsBadge = spot.localsMeetHere
      ? '<span class="spot-badge spot-badge--locals">Locals meet here</span>'
      : "";
    var sourceNote = spot.sourceNote
      ? '<p class="spot-popup-source">' + escapeHTML(spot.sourceNote) + "</p>"
      : "";
    var windWidget =
      typeof window.WFA_buildWindyEmbedUrl === "function"
        ? '<div class="spot-popup-wind">' +
          '<p class="spot-popup-wind-label">Live wind here</p>' +
          '<div class="spot-popup-wind-frame">' +
          '<iframe src="' + window.WFA_buildWindyEmbedUrl(spot.lat, spot.lng) + '" title="Live wind map for ' +
          escapeHTML(spot.name) + '" frameborder="0"></iframe>' +
          "</div>" +
          '<p class="spot-popup-wind-attribution">Powered by <a href="https://www.windy.com" target="_blank" rel="noopener">Windy.com</a></p>' +
          "</div>"
        : "";

    return (
      '<div class="spot-popup">' +
      '<div class="spot-popup-badges">' + verifiedBadge + localsBadge + "</div>" +
      "<h3>" + escapeHTML(spot.name) + "</h3>" +
      '<p class="spot-popup-location">' + escapeHTML(spot.city) + ", " + escapeHTML(spot.state) +
      " &mdash; " + escapeHTML(spot.region) + "</p>" +
      '<dl class="spot-popup-facts">' +
      "<dt>Water</dt><dd>" + escapeHTML(spot.waterType) + "</dd>" +
      "<dt>Best wind</dt><dd>" + escapeHTML(spot.windDirection) + "</dd>" +
      "<dt>Skill level</dt><dd>" + escapeHTML(spot.skillLevel) + "</dd>" +
      "</dl>" +
      '<p class="spot-popup-desc">' + escapeHTML(spot.description) + "</p>" +
      sourceNote +
      windWidget +
      "</div>"
    );
  }

  function buildListItem(spot) {
    var li = document.createElement("li");
    li.className = "spot-list-item";
    li.setAttribute("data-spot-id", spot.id);
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");
    var verifiedClass = spot.verified === VERIFIED_VALUE ? "spot-pin--verified" : "spot-pin--community";
    var statusLabel = spot.verified === VERIFIED_VALUE ? "Firsthand verified" : "Community-reported";
    li.setAttribute("aria-label", spot.name + " — " + statusLabel);
    li.innerHTML =
      '<span class="spot-pin spot-list-item-pin ' + verifiedClass + '" aria-hidden="true"></span>' +
      '<span class="spot-list-item-body">' +
      '<span class="spot-list-item-name">' + escapeHTML(spot.name) + "</span>" +
      '<span class="spot-list-item-meta">' + escapeHTML(spot.city) + ", " + escapeHTML(spot.state) +
      " &middot; " + escapeHTML(spot.skillLevel) + " &middot; " + escapeHTML(statusLabel) + "</span>" +
      "</span>";
    return li;
  }

  function initMap(spots) {
    var countEl = document.getElementById("spotsListCount");
    if (countEl) countEl.textContent = spots.length + (spots.length === 1 ? " spot" : " spots");

    // closePopupOnClick is disabled here on purpose — see the guarded map click
    // listener below for why (mobile touch popups were closing themselves).
    var map = L.map(mapEl, { scrollWheelZoom: true, closePopupOnClick: false });

    // CARTO's free raster basemap started requiring an API key, so this uses Esri's
    // free, no-key dark basemap instead (base tiles + a reference layer for labels).
    var darkBase = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
        maxZoom: 16,
      }
    );
    var darkReference = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 16 }
    );
    var darkLayer = L.layerGroup([darkBase, darkReference]).addTo(map);

    var satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 18,
      }
    );

    L.control.layers({ "Map": darkLayer, "Satellite": satelliteLayer }, null, { position: "topright" }).addTo(map);

    var clusterGroup = L.markerClusterGroup({ maxClusterRadius: 50 });
    var markersById = {};
    var listItemsById = {};

    function setActive(id) {
      Object.keys(listItemsById).forEach(function (key) {
        listItemsById[key].classList.toggle("is-active", key === id);
      });
      if (listItemsById[id]) {
        listItemsById[id].scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    spots.forEach(function (spot) {
      var marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(spot) });
      // autoPan is off on purpose: see the note by the click-guard below — a popup's
      // own autoPan was the actual cause of popups closing themselves right after
      // opening on mobile.
      marker.bindPopup(buildPopupHTML(spot), { maxWidth: 320, minWidth: 260, maxHeight: 420, autoPan: false });
      marker.on("popupopen", function () { setActive(spot.id); });
      clusterGroup.addLayer(marker);
      markersById[spot.id] = marker;

      var li = buildListItem(spot);
      listEl.appendChild(li);
      listItemsById[spot.id] = li;
    });

    map.addLayer(clusterGroup);

    // The real cause of popups closing themselves right after opening on mobile:
    // a popup's default autoPan behavior pans the map, which fires "moveend" —
    // and Leaflet.markercluster reflows (removes and re-adds) every marker layer
    // on "moveend" as part of its normal dynamic clustering. If the marker whose
    // popup is open gets removed during that reflow, its popup is destroyed as a
    // side effect, without ever going through a "close" the way a click would.
    // Confirmed by instrumenting Leaflet's own event bus: click -> popupopen ->
    // autopanstart -> movestart -> (pan animation) -> moveend -> layerremove
    // (the marker + its popup) -> popupclose, all with no further user input.
    // autoPan: false above removes the trigger for the direct-marker-tap path.
    // The list-tap path had its own extra map.panTo() call below doing the same
    // thing on purpose (redundantly — zoomToShowLayer already reveals the
    // marker), so that's removed rather than disabled.
    //
    // closePopupOnClick is still turned off, with this guarded listener standing
    // in for it: it closes the popup on a later genuine tap on the map, but
    // ignores one arriving within 500ms of a popup opening, in case any other
    // path still produces a near-immediate map click/moveend around that time.
    var lastPopupOpenedAt = 0;
    map.on("popupopen", function () { lastPopupOpenedAt = Date.now(); });
    map.on("click", function () {
      if (Date.now() - lastPopupOpenedAt > 500) map.closePopup();
    });

    listEl.addEventListener("click", function (event) {
      var li = event.target.closest("[data-spot-id]");
      if (!li) return;
      var marker = markersById[li.getAttribute("data-spot-id")];
      if (!marker) return;
      clusterGroup.zoomToShowLayer(marker, function () {
        marker.openPopup();
      });
    });

    listEl.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var li = event.target.closest("[data-spot-id]");
      if (!li) return;
      event.preventDefault();
      li.click();
    });

    var bounds = clusterGroup.getBounds();
    function fallbackView() {
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
    }

    // A fixed zoom level (the old code used 9) shows a lot less real-world area on a
    // narrow phone map than on a wide desktop one, and if the rider isn't near
    // several spots it can drop them into a tight, empty-looking view with nothing
    // nearby to see or tap — which is exactly what "too zoomed in" turned out to be
    // on a real phone. Instead, zoom to fit the rider's own location together with
    // whichever nearby spots actually exist, so the first view always has real
    // content in it; fall back to the full map only if nothing is reasonably close.
    function geoView(position) {
      var userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
      var nearby = spots
        .map(function (spot) { return { spot: spot, distance: userLatLng.distanceTo([spot.lat, spot.lng]) }; })
        .filter(function (entry) { return entry.distance <= 400000; }) // ~250 miles
        .sort(function (a, b) { return a.distance - b.distance; })
        .slice(0, 10);

      if (!nearby.length) {
        fallbackView();
        return;
      }

      var nearbyBounds = L.latLngBounds([userLatLng]);
      nearby.forEach(function (entry) { nearbyBounds.extend([entry.spot.lat, entry.spot.lng]); });
      // Generous padding + a fairly low zoom ceiling: even where the nearest spots
      // happen to sit close together in real life (e.g. several Florida spots a
      // few miles apart), this keeps the first view wide and orienting rather than
      // a tight crop that only shows one or two markers with nothing around them.
      map.fitBounds(nearbyBounds.pad(0.8), { maxZoom: 9 });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(geoView, fallbackView, { timeout: 8000 });
    } else {
      fallbackView();
    }
  }

  // ---- Submit a Spot modal ----
  var submitOpenBtn = document.getElementById("submitSpotOpen");
  var submitModal = document.getElementById("submitSpotModal");
  if (submitOpenBtn && submitModal) {
    var submitIframe = document.getElementById("submitSpotIframe");
    var lastFocused = null;

    function openSubmitModal() {
      lastFocused = document.activeElement;
      if (submitIframe && !submitIframe.getAttribute("src")) {
        submitIframe.setAttribute("src", submitIframe.getAttribute("data-src"));
      }
      submitModal.removeAttribute("hidden");
      document.body.classList.add("modal-open");
      var closeBtn = submitModal.querySelector(".submit-spot-modal-close");
      if (closeBtn) closeBtn.focus();
    }

    function closeSubmitModal() {
      submitModal.setAttribute("hidden", "");
      document.body.classList.remove("modal-open");
      if (lastFocused) lastFocused.focus();
    }

    submitOpenBtn.addEventListener("click", openSubmitModal);

    submitModal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeSubmitModal);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !submitModal.hasAttribute("hidden")) {
        closeSubmitModal();
      }
    });
  }
})();
