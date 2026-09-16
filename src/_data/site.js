module.exports = {
  name: "Wing Foil America",
  tagline: "Find Your Spot",
  // Host only (no path, no trailing slash) — used to build absolute URLs in
  // robots.txt/sitemap.xml.
  siteUrl: "https://wingfoilamerica.com",
  nav: [
    { title: "Find a Spot", url: "/where-to-ride/" },
    { title: "Beginner Guide", url: "/beginner-guide/" },
    { title: "Intermediate & Advanced", url: "/intermediate-advanced/" },
    { title: "Gear & Brands", url: "/gear-and-brands/" },
    {
      title: "Shop",
      url: "https://wingfoilamerica.printful.me",
      external: true,
      ariaLabel: "Wing Foil America shop on Printful, opens in a new tab",
    },
    { title: "Wind", url: "/wind/" },
    { title: "Bio", url: "/about/" },
  ],
};
