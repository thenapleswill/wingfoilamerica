(function () {
  var badgeEl = document.getElementById("spotConditionsBadge");
  if (badgeEl && typeof window.WFA_renderConditionsBadge === "function") {
    var badgeLat = parseFloat(badgeEl.dataset.lat);
    var badgeLng = parseFloat(badgeEl.dataset.lng);
    var idealDirections = (badgeEl.dataset.idealDirections || "").split(",").filter(Boolean);
    if (!isNaN(badgeLat) && !isNaN(badgeLng)) {
      window.WFA_renderConditionsBadge(badgeEl, badgeLat, badgeLng, idealDirections);
    }
  }

  var mapEl = document.getElementById("spotMap");
  if (!mapEl || typeof L === "undefined") return;

  var lat = parseFloat(mapEl.dataset.lat);
  var lng = parseFloat(mapEl.dataset.lng);
  var name = mapEl.dataset.name || "";
  if (isNaN(lat) || isNaN(lng)) return;

  var map = L.map(mapEl, { scrollWheelZoom: true }).setView([lat, lng], 15);

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
    windFrame.src = window.WFA_buildWindyEmbedUrl(lat, lng, 10);
  }
})();
