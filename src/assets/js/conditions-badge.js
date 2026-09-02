// Shared "Conditions Right Now" badge: live wind speed/direction from
// Open-Meteo (free, no key), rated Good/Marginal/Poor against a spot's
// idealWindDirections. Used on each spot's own page and on the Wind page's
// nearest-spot companion line — one implementation, not duplicated.
(function () {
  var COMPASS_POINTS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];

  function degToCompassIndex(deg) {
    var normalized = ((deg % 360) + 360) % 360;
    return Math.round(normalized / 22.5) % 16;
  }

  function circularDiff(a, b) {
    var diff = Math.abs(a - b) % 16;
    return Math.min(diff, 16 - diff);
  }

  // <10mph poor, 10-15 marginal, 15-25 good, 25-30 marginal, 30+ poor.
  function speedTier(mph) {
    if (mph < 10) return "poor";
    if (mph < 15) return "marginal";
    if (mph <= 25) return "good";
    if (mph <= 30) return "marginal";
    return "poor";
  }

  // "unknown" when the spot has no idealWindDirections yet — treated as
  // marginal for the overall rating, but worded differently in the message.
  function directionTier(liveIndex, idealDirections) {
    if (!idealDirections || !idealDirections.length) return "unknown";
    var idealIndices = idealDirections
      .map(function (label) { return COMPASS_POINTS.indexOf(label); })
      .filter(function (idx) { return idx !== -1; });
    if (!idealIndices.length) return "unknown";
    if (idealIndices.indexOf(liveIndex) !== -1) return "good";
    for (var i = 0; i < idealIndices.length; i++) {
      var oppositeIdx = (idealIndices[i] + 8) % 16;
      if (circularDiff(liveIndex, oppositeIdx) <= 2) return "poor";
    }
    return "marginal";
  }

  var BADNESS = { good: 0, marginal: 1, poor: 2 };

  function worstOf(a, b) {
    return BADNESS[a] >= BADNESS[b] ? a : b;
  }

  function buildMessage(speedMph, compassLabel, sTier, dTier) {
    var prefix = Math.round(speedMph) + "mph " + compassLabel + " — ";
    if (dTier === "poor") return prefix + "likely blowing offshore here, best avoided";
    if (sTier === "poor" && speedMph < 10) return prefix + "too light to get going right now";
    if (sTier === "poor") return prefix + "very strong wind, advanced riders only";
    if (dTier === "unknown") return prefix + "ideal direction for this spot isn't documented yet";
    if (dTier === "good" && sTier === "good") return prefix + "good match for this spot";
    if (dTier === "marginal" && sTier === "good") return prefix + "not this spot's best direction";
    if (dTier === "good" && sTier === "marginal") return prefix + "borderline wind speed for this spot";
    return prefix + "borderline conditions here";
  }

  function rate(windSpeedMph, windDirectionDeg, idealDirections) {
    var compassIndex = degToCompassIndex(windDirectionDeg);
    var compassLabel = COMPASS_POINTS[compassIndex];
    var sTier = speedTier(windSpeedMph);
    var dTier = directionTier(compassIndex, idealDirections);
    var overall = worstOf(sTier, dTier === "unknown" ? "marginal" : dTier);
    return { overall: overall, message: buildMessage(windSpeedMph, compassLabel, sTier, dTier) };
  }

  function renderBadge(container, rating) {
    var label = rating.overall.charAt(0).toUpperCase() + rating.overall.slice(1);
    container.innerHTML =
      '<p class="conditions-badge-heading">Conditions Right Now</p>' +
      '<span class="conditions-badge conditions-badge--' + rating.overall + '">' + label + "</span>" +
      '<p class="conditions-badge-detail">' + rating.message + "</p>";
    container.hidden = false;
  }

  function renderUnavailable(container) {
    container.innerHTML = '<p class="conditions-badge-unavailable">Conditions right now: unavailable</p>';
    container.hidden = false;
  }

  // Fetches live wind for (lat, lng) and renders the badge into `container`.
  // idealDirections may be an empty array (spot doesn't have one documented
  // yet) — never throws, never breaks the page: any failure renders the
  // neutral "unavailable" state instead of the colored badge.
  window.WFA_renderConditionsBadge = function (container, lat, lng, idealDirections) {
    if (!container) return;
    var url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
      "&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph";
    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("bad response");
        return response.json();
      })
      .then(function (data) {
        var current = data && data.current;
        if (!current || typeof current.wind_speed_10m !== "number" || typeof current.wind_direction_10m !== "number") {
          throw new Error("malformed data");
        }
        renderBadge(container, rate(current.wind_speed_10m, current.wind_direction_10m, idealDirections));
      })
      .catch(function () {
        renderUnavailable(container);
      });
  };

  // Haversine straight-line ("as the crow flies") distance in miles, plus the
  // closest spot to (lat, lng) out of a list of spots — used by the Wind
  // page's nearest-spot companion line.
  function distanceMiles(aLat, aLng, bLat, bLng) {
    var R = 3958.8;
    var dLat = (bLat - aLat) * Math.PI / 180;
    var dLng = (bLng - aLng) * Math.PI / 180;
    var lat1 = aLat * Math.PI / 180;
    var lat2 = bLat * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  window.WFA_findNearestSpot = function (spots, lat, lng) {
    if (!spots || !spots.length) return null;
    var nearest = null;
    var nearestDist = Infinity;
    spots.forEach(function (spot) {
      var d = distanceMiles(lat, lng, spot.lat, spot.lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = spot;
      }
    });
    return nearest ? { spot: nearest, distanceMiles: nearestDist } : null;
  };
})();
