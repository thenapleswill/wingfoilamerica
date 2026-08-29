// Shared helper for building a Windy.com embed2.html URL from coordinates.
// Used by both the Wind page's live wind checker (wind-checker.js) and the
// Where to Ride spot popups (where-to-ride.js), so both surfaces render the
// same live wind widget instead of duplicating the URL format in two places.
window.WFA_buildWindyEmbedUrl = function (lat, lon) {
  var latF = lat.toFixed(3);
  var lonF = lon.toFixed(3);
  // Windy's free embeddable widget (embed2.html). Non-commercial embedding is
  // permitted per Windy's public embed terms as of this writing — the widget's
  // own on-map branding must stay visible (do not crop/hide it with CSS).
  return (
    "https://embed.windy.com/embed2.html?lat=" + latF + "&lon=" + lonF +
    "&detailLat=" + latF + "&detailLon=" + lonF +
    "&width=650&height=450&zoom=8&level=surface&overlay=wind&product=ecmwf" +
    "&menu=&message=true&marker=true&calendar=now&pressure=&type=map" +
    "&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1"
  );
};
