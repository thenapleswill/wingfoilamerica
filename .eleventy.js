module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // Safely embeds a string inside a JSON-LD <script> block (escapes quotes, etc.)
  // so schema markup can't break if page content ever contains a literal quote.
  eleventyConfig.addFilter("jsonify", (value) => JSON.stringify(value));

  // Truncates a description to a word boundary for the plain-HTML spot list
  // on /where-to-ride/, rather than cutting mid-word.
  eleventyConfig.addFilter("excerpt", (str, length = 160) => {
    if (!str || str.length <= length) return str || "";
    const truncated = str.slice(0, length);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
  });

  // HTML-escapes free-text spot descriptions (still user-authored strings, not
  // markup) and then wraps any bare URL written in them — "https://site.com/",
  // "www.site.com", or a plain "site.com" — in a real, clickable <a> tag. Escape
  // always runs first so this stays safe even if a description ever contains a
  // literal <, >, or &; linkification is strictly a second pass on top of that.
  eleventyConfig.addFilter("linkify", (value) => {
    if (!value) return "";
    const escaped = String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const urlPattern = /((?:https?:\/\/|www\.)[^\s<>"')]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co)\b(?:\/[^\s<>"')]*)?)/gi;
    return escaped.replace(urlPattern, (match) => {
      const href = /^https?:\/\//i.test(match) ? match : "https://" + match;
      return '<a href="' + href + '" target="_blank" rel="noopener">' + match + "</a>";
    });
  });

  // Content is authored as plain Markdown links (e.g. "[Safety Basics](/beginner-guide/safety-basics/)"),
  // which never pass through the `url` filter that templates use to prepend PAGES_BASE_PATH. Without this,
  // every hand-written internal link breaks the moment the site is served from a subpath (GitHub Pages
  // project sites, e.g. /wingfoilamerica/) instead of a domain root. This transform rewrites root-relative
  // href/src attributes in the final rendered HTML so plain content links work under any base path,
  // without requiring content authors to think about it.
  eleventyConfig.addTransform("prefix-root-relative-links", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const prefix = (process.env.PAGES_BASE_PATH || "").replace(/\/+$/, "");
    if (!prefix) return content;
    const prefixNoSlash = prefix.replace(/^\//, "");
    const re = new RegExp(`(href|src)="\\/(?!\\/)(?!${prefixNoSlash}\\/)`, "g");
    return content.replace(re, `$1="${prefix}/`);
  });

  eleventyConfig.addCollection("guide", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/beginner-guide/*.md").sort((a, b) => {
      return (a.data.order || 0) - (b.data.order || 0);
    });
  });

  eleventyConfig.addCollection("intermediate", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/intermediate-advanced/*.md").sort((a, b) => {
      return (a.data.order || 0) - (b.data.order || 0);
    });
  });

  // Cheap guard against a page shipping without a link from its own section's
  // landing page (has happened before). For each section below, every page
  // matched by inputGlob must have its url appear somewhere in the rendered
  // landing page's HTML — otherwise the build fails with which page(s) are
  // missing. A plain substring check, not real HTML parsing, but enough to
  // catch a page silently dropped from the list.
  const sectionLandingPages = [
    { inputGlob: "src/beginner-guide/", landingOutputPath: "/beginner-guide/index.html" },
    { inputGlob: "src/intermediate-advanced/", landingOutputPath: "/intermediate-advanced/index.html" },
  ];
  eleventyConfig.on("eleventy.after", async ({ results }) => {
    for (const { inputGlob, landingOutputPath } of sectionLandingPages) {
      const landingPage = results.find((r) => r.outputPath.replace(/\\/g, "/").endsWith(landingOutputPath));
      if (!landingPage) continue;

      const sectionPages = results.filter(
        (r) => r.inputPath.replace(/\\/g, "/").includes(inputGlob) && r.inputPath.endsWith(".md")
      );
      const unlinked = sectionPages.filter((page) => !landingPage.content.includes(page.url));
      if (unlinked.length) {
        throw new Error(
          `Build check failed: ${landingOutputPath} has no link to ` +
            unlinked.map((p) => p.inputPath).join(", ") +
            " — every page in this section must be linked from its landing page."
        );
      }
    }
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    pathPrefix: process.env.PAGES_BASE_PATH || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
