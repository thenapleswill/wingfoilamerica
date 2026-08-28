module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

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
