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

    var map = L.map(mapEl, { scrollWheelZoom: true });

    // CARTO's free raster basemap started requiring an API key, so this uses Esri's
    // free, no-key dark basemap instead (base tiles + a reference layer for labels).
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
        maxZoom: 16,
      }
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 16 }
    ).addTo(map);

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
      marker.bindPopup(buildPopupHTML(spot), { maxWidth: 320, minWidth: 260, maxHeight: 420 });
      marker.on("popupopen", function () { setActive(spot.id); });
      clusterGroup.addLayer(marker);
      markersById[spot.id] = marker;

      var li = buildListItem(spot);
      listEl.appendChild(li);
      listItemsById[spot.id] = li;
    });

    map.addLayer(clusterGroup);

    listEl.addEventListener("click", function (event) {
      var li = event.target.closest("[data-spot-id]");
      if (!li) return;
      var marker = markersById[li.getAttribute("data-spot-id")];
      if (!marker) return;
      clusterGroup.zoomToShowLayer(marker, function () {
        map.panTo(marker.getLatLng());
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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          map.setView([position.coords.latitude, position.coords.longitude], 9);
        },
        fallbackView,
        { timeout: 8000 }
      );
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
