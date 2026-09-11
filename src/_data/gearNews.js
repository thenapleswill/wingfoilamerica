// Eleventy exposes JSON global data files under their literal filename
// ("gear-news"), which isn't a valid Nunjucks identifier. This wrapper
// re-exposes the same file (the exact path the weekly automation writes to)
// under a clean camelCase name templates can actually reference.
module.exports = require("./gear-news.json");
