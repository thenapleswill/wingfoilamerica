(function () {
  var useLocationBtn = document.getElementById("useLocationBtn");
  var searchForm = document.getElementById("locationSearchForm");
  var searchInput = document.getElementById("locationSearchInput");
  var statusEl = document.getElementById("windCheckerStatus");
  var mapContainer = document.getElementById("windMapContainer");
  var linksContainer = document.getElementById("windLinksContainer");
  var windyEmbed = document.getElementById("windyEmbed");
  var windyLink = document.getElementById("windyLink");
  var windfinderLink = document.getElementById("windfinderLink");
  var noaaLink = document.getElementById("noaaLink");

  if (!useLocationBtn || !searchForm) return;

  function setStatus(message) {
    statusEl.textContent = message || "";
  }

  function showWidgets(lat, lon, label) {
    var latF = lat.toFixed(3);
    var lonF = lon.toFixed(3);

    windyEmbed.src = window.WFA_buildWindyEmbedUrl(lat, lon);
    mapContainer.hidden = false;

    windyLink.href = "https://www.windy.com/" + latF + "/" + lonF + "?wind," + latF + "," + lonF + ",8";
    windfinderLink.href = "https://www.windfinder.com/weathermap#14/" + latF + "/" + lonF;
    noaaLink.href = "https://forecast.weather.gov/MapClick.php?lat=" + latF + "&lon=" + lonF;
    linksContainer.hidden = false;

    setStatus("Showing wind for " + label + ".");
  }

  function handleGeolocationError(err) {
    var message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Location access declined — no problem, search for your spot below instead.";
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Couldn't determine your location — try searching for your spot below.";
        break;
      case err.TIMEOUT:
        message = "Location request timed out — try searching for your spot below.";
        break;
      default:
        message = "Couldn't get your location — try searching for your spot below.";
    }
    setStatus(message);
    searchInput.focus();
  }

  useLocationBtn.addEventListener("click", function () {
    if (!("geolocation" in navigator)) {
      setStatus("Your browser doesn't support geolocation — search for your spot below instead.");
      searchInput.focus();
      return;
    }
    setStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      function (position) {
        showWidgets(position.coords.latitude, position.coords.longitude, "your current location");
      },
      handleGeolocationError,
      { timeout: 10000 }
    );
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var query = searchInput.value.trim();
    if (!query) return;

    setStatus("Searching for “" + query + "”…");

    // Client-side geocoding via OpenStreetMap's free Nominatim API (no API key
    // required). Nominatim's usage policy asks for light, non-bulk use — fine
    // for an individual visitor searching one location at a time.
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query))
      .then(function (response) { return response.json(); })
      .then(function (results) {
        if (!results || !results.length) {
          setStatus("Couldn't find “" + query + "” — try a nearby city or town name.");
          return;
        }
        var result = results[0];
        showWidgets(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
      })
      .catch(function () {
        setStatus("Something went wrong searching for that location — try again in a moment.");
      });
  });
})();
