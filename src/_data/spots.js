// The raw spots array, exposed as Eleventy global data so /where-to-ride/spot.njk
// can paginate over it to generate one static page per spot. Reads the same JSON
// the client-side map fetches at runtime and spotsByState.js groups, so all three
// can never drift apart.
module.exports = require("../assets/data/where-to-ride-spots.json");
