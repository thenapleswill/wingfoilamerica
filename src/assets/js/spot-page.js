(function () {
  var mapEl = document.getElementById("spotMap");
  var map = null;
  var mapLat = mapEl ? parseFloat(mapEl.dataset.lat) : NaN;
  var mapLng = mapEl ? parseFloat(mapEl.dataset.lng) : NaN;

  // Wind-direction arrow on the satellite map: Open-Meteo's wind_direction_10m
  // is the direction the wind is coming FROM (standard meteorological
  // convention), but what a rider cares about here is which way it's blowing
  // TOWARD — that's what determines onshore vs. offshore relative to the
  // beach. Rotate by +180 to go from "coming from" to "blowing toward".
  function renderWindArrow(windData) {
    if (!map || !windData || isNaN(mapLat) || isNaN(mapLng)) return;
    var towardDeg = (windData.windDirectionDeg + 180) % 360;
    var icon = L.divIcon({
      className: "wind-direction-arrow-wrap",
      html:
        '<div class="wind-direction-arrow" style="transform: rotate(' + towardDeg + 'deg);">&#8593;</div>' +
        '<div class="wind-direction-arrow-label">Wind blowing toward &#8593;</div>',
      iconSize: [0, 0],
      iconAnchor: [-18, 10],
    });
    L.marker([mapLat, mapLng], { icon: icon, interactive: false, keyboard: false }).addTo(map);
  }

  var badgeEl = document.getElementById("spotConditionsBadge");
  if (badgeEl && typeof window.WFA_renderConditionsBadge === "function") {
    var badgeLat = parseFloat(badgeEl.dataset.lat);
    var badgeLng = parseFloat(badgeEl.dataset.lng);
    var idealDirections = (badgeEl.dataset.idealDirections || "").split(",").filter(Boolean);
    if (!isNaN(badgeLat) && !isNaN(badgeLng)) {
      // Reuses this one Open-Meteo fetch for the wind-direction arrow too —
      // renderWindArrow runs once the map below exists (map is set
      // synchronously further down, well before this async fetch resolves).
      window.WFA_renderConditionsBadge(badgeEl, badgeLat, badgeLng, idealDirections, renderWindArrow);
    }
  }

  if (!mapEl || typeof L === "undefined") return;

  var lat = mapLat;
  var lng = mapLng;
  var name = mapEl.dataset.name || "";
  if (isNaN(lat) || isNaN(lng)) return;

  map = L.map(mapEl, { scrollWheelZoom: true }).setView([lat, lng], 15);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 18,
    }
  ).addTo(map);

  L.marker([lat, lng]).addTo(map).bindTooltip(name);

  var windFrame = document.getElementById("spotWindFrame");
  if (windFrame && typeof window.WFA_buildWindyEmbedUrl === "function") {
    windFrame.src = window.WFA_buildWindyEmbedUrl(lat, lng, 11);
  }
})();
