const spots = require("../assets/data/where-to-ride-spots.json");

// Powers the always-in-HTML "Browse All Spots" fallback list on /where-to-ride/
// so search crawlers and link-preview generators (which don't run the page's JS)
// still see every spot's name and description. Reads the same JSON the
// client-side map fetches at runtime, so the two can never drift apart.
module.exports = function () {
  const groups = {};
  for (const spot of spots) {
    const key = spot.state || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(spot);
  }
  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((state) => ({
      state,
      spots: groups[state].slice().sort((a, b) => a.name.localeCompare(b.name)),
    }));
};
