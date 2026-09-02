(function () {
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
