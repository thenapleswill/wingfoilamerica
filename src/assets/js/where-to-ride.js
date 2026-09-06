(function () {
  var root = document.getElementById("where-to-ride-app");
  if (!root) return;

  // Value the `verified` field takes once a spot has been confirmed firsthand
  // (as opposed to the seed data's "community-reported"). Set a spot's
  // "verified" field in where-to-ride-spots.json to this exact string to
  // switch its pin from outlined to filled.
  var VERIFIED_VALUE = "firsthand-verified";

  var spotsUrl = root.dataset.spotsUrl;
  var spotBaseUrl = root.dataset.spotBaseUrl;
  var mapEl = document.getElementById("spotsMap");

  function goToSpot(spot) {
    window.location.href = spotBaseUrl + spot.id + "/";
  }

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
    });
  }

  function initMap(spots) {
    var map = L.map(mapEl, { scrollWheelZoom: true });

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
    var darkLayer = L.layerGroup([darkBase, darkReference]);

    var satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 18,
      }
    ).addTo(map);

    L.control.layers({ "Satellite": satelliteLayer, "Map": darkLayer }, null, { position: "topright" }).addTo(map);

    var clusterGroup = L.markerClusterGroup({ maxClusterRadius: 50 });

    spots.forEach(function (spot) {
      var marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(spot) });
      marker.on("click", function () { goToSpot(spot); });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

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

  // ---- Add a Spot modal: click-a-map-point step, then the Airtable embed ----
  // Same Airtable base/table as before ("Table 1"); the two lat/lng fields are
  // now set by clicking the map instead of guessed/researched after the fact,
  // via the same prefill_<Field Name>/hide_<Field Name> URL params already
  // used by the spot-feedback flow on individual spot pages.
  var AIRTABLE_BASE_ID = "appJHchIsjqLQ4gvL";
  var AIRTABLE_FORM_SHARE_ID = "shr9crEhnDAMc3X2U";

  var submitOpenBtn = document.getElementById("submitSpotOpen");
  var submitModal = document.getElementById("submitSpotModal");
  if (submitOpenBtn && submitModal) {
    var mapStepEl = document.getElementById("submitSpotMapStep");
    var pickerMapEl = document.getElementById("submitSpotMap");
    var coordsEl = document.getElementById("submitSpotCoords");
    var continueBtn = document.getElementById("submitSpotContinueBtn");
    var airtableWrap = document.getElementById("submitSpotAirtableWrap");
    var submitIframe = document.getElementById("submitSpotIframe");
    var locateBtn = document.getElementById("submitSpotLocateBtn");
    var searchForm = document.getElementById("submitSpotSearchForm");
    var searchInput = document.getElementById("submitSpotSearchInput");
    var searchSuggestions = document.getElementById("submitSpotSearchSuggestions");
    var mapStatusEl = document.getElementById("submitSpotMapStatus");
    var lastFocused = null;
    var pickerMap = null;
    var pickerMarker = null;
    var pickedLatLng = null;

    // Esri's free World Geocoding Service — the same tile-service family (Esri/
    // ArcGIS Online) already powering the satellite basemap below, used here for
    // "suggest" (light autocomplete) and "findAddressCandidates" (resolving a
    // typed place to coordinates). Both operations are usable keyless for this
    // kind of light, single-lookup, non-bulk/non-stored use.
    var ESRI_GEOCODE_BASE = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    var suggestDebounceTimer = null;

    function setMapStatus(message) {
      if (!mapStatusEl) return;
      if (!message) {
        mapStatusEl.hidden = true;
        mapStatusEl.textContent = "";
        return;
      }
      mapStatusEl.textContent = message;
      mapStatusEl.hidden = false;
    }

    function updateCoordsDisplay() {
      if (!pickedLatLng) {
        coordsEl.hidden = true;
        continueBtn.disabled = true;
        return;
      }
      coordsEl.textContent = pickedLatLng.lat.toFixed(6) + ", " + pickedLatLng.lng.toFixed(6);
      coordsEl.hidden = false;
      continueBtn.disabled = false;
    }

    function placeMarker(latlng) {
      pickedLatLng = latlng;
      if (pickerMarker) {
        pickerMarker.setLatLng(latlng);
      } else {
        pickerMarker = L.marker(latlng, { draggable: true }).addTo(pickerMap);
        pickerMarker.on("dragend", function () {
          pickedLatLng = pickerMarker.getLatLng();
          updateCoordsDisplay();
        });
      }
      updateCoordsDisplay();
    }

    function initPickerMapIfNeeded() {
      if (pickerMap || typeof L === "undefined") return;
      pickerMap = L.map(pickerMapEl, { scrollWheelZoom: true }).setView([39.5, -98.35], 4);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
          maxZoom: 18,
        }
      ).addTo(pickerMap);
      // Stacked on top of the satellite imagery so place names, roads, and
      // landmarks are visible without zooming way in first — same free,
      // no-key Esri reference layer used for this purpose elsewhere.
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      ).addTo(pickerMap);
      pickerMap.on("click", function (event) { placeMarker(event.latlng); });
      // The map starts inside a hidden modal, which gives Leaflet a zero-size
      // box to measure; fix its size once it's actually visible.
      setTimeout(function () { pickerMap.invalidateSize(); }, 50);
    }

    function flyToAndDropPin(lat, lng, zoom) {
      var latlng = L.latLng(lat, lng);
      pickerMap.setView(latlng, zoom || 15);
      placeMarker(latlng);
    }

    if (locateBtn) {
      locateBtn.addEventListener("click", function () {
        if (!("geolocation" in navigator) || !pickerMap) return;
        navigator.geolocation.getCurrentPosition(
          function (position) {
            flyToAndDropPin(position.coords.latitude, position.coords.longitude, 16);
          },
          function () {
            // Denied or unavailable — fail quietly, map just stays as-is.
          },
          { timeout: 8000 }
        );
      });
    }

    function populateSuggestions(query) {
      if (!searchSuggestions) return;
      fetch(ESRI_GEOCODE_BASE + "/suggest?f=json&maxSuggestions=5&text=" + encodeURIComponent(query))
        .then(function (response) { return response.json(); })
        .then(function (data) {
          searchSuggestions.innerHTML = "";
          if (!data || !data.suggestions) return;
          data.suggestions.forEach(function (suggestion) {
            var option = document.createElement("option");
            option.value = suggestion.text;
            searchSuggestions.appendChild(option);
          });
        })
        .catch(function () {
          // Autocomplete is a nice-to-have; silently skip on failure and let
          // the visitor keep typing and hit Search.
        });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var query = searchInput.value.trim();
        clearTimeout(suggestDebounceTimer);
        if (query.length < 3) return;
        suggestDebounceTimer = setTimeout(function () { populateSuggestions(query); }, 300);
      });
    }

    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!pickerMap) return;
        var query = searchInput.value.trim();
        if (!query) return;

        setMapStatus("Searching for “" + query + "”…");

        fetch(
          ESRI_GEOCODE_BASE + "/findAddressCandidates?f=json&maxLocations=1&singleLine=" + encodeURIComponent(query)
        )
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (!data || !data.candidates || !data.candidates.length) {
              setMapStatus("Couldn't find “" + query + "” — try a nearby city or landmark, or drop the pin manually.");
              return;
            }
            var candidate = data.candidates[0];
            setMapStatus("");
            flyToAndDropPin(candidate.location.y, candidate.location.x, 14);
          })
          .catch(function () {
            setMapStatus("Search isn't working right now — drop the pin manually instead.");
          });
      });
    }

    function resetModal() {
      mapStepEl.hidden = false;
      airtableWrap.hidden = true;
      submitIframe.removeAttribute("src");
      pickedLatLng = null;
      if (pickerMarker && pickerMap) {
        pickerMap.removeLayer(pickerMarker);
        pickerMarker = null;
      }
      updateCoordsDisplay();
      if (searchInput) searchInput.value = "";
      setMapStatus("");
    }

    function openSubmitModal() {
      lastFocused = document.activeElement;
      resetModal();
      submitModal.removeAttribute("hidden");
      document.body.classList.add("modal-open");
      initPickerMapIfNeeded();
      var closeBtn = submitModal.querySelector(".submit-spot-modal-close");
      if (closeBtn) closeBtn.focus();
    }

    function closeSubmitModal() {
      submitModal.setAttribute("hidden", "");
      document.body.classList.remove("modal-open");
      if (lastFocused) lastFocused.focus();
    }

    submitOpenBtn.addEventListener("click", openSubmitModal);

    continueBtn.addEventListener("click", function () {
      if (!pickedLatLng) return;
      var params = new URLSearchParams();
      params.set("prefill_Submitted Lat", pickedLatLng.lat.toFixed(6));
      params.set("prefill_Submitted Lng", pickedLatLng.lng.toFixed(6));
      params.set("hide_Submitted Lat", "true");
      params.set("hide_Submitted Lng", "true");
      submitIframe.src = "https://airtable.com/embed/" + AIRTABLE_BASE_ID + "/" + AIRTABLE_FORM_SHARE_ID + "?" + params.toString();
      mapStepEl.hidden = true;
      airtableWrap.hidden = false;
    });

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
