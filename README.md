# Wing Foil America

A static site for learning to wing foil — built with [Eleventy](https://www.11ty.dev/), Markdown content, no database.

This is a fully independent project, separate from any other site. It borrows the general
"plain static site, no framework lock-in" spirit of that other project, but the actual
tooling here (Eleventy + Markdown) is its own thing, chosen because it lets non-technical
content edits happen in plain `.md` files instead of raw HTML.

## Editing content (no coding needed)

All of the Beginner Guide pages live in `src/beginner-guide/*.md`. Each one is a plain
Markdown file with a small block at the top (between the `---` lines) for the title and
one-line description, and the actual page content below it. To edit a page:

1. Open the `.md` file for that page in `src/beginner-guide/`.
2. Replace the `_Placeholder — ..._` lines and `## heading` text with your real content.
3. Regular Markdown formatting works: `## Heading`, `**bold**`, `- bullet list`, `[link text](https://example.com)`.
4. Commit/push the change (or ask Claude to do it) — the site rebuilds and redeploys automatically.

Do **not** delete the `---` block at the very top of a file or the `order:` number in it —
that controls where the page shows up in the guide's navigation.

## The gear calculator widget

The gear calculator lives on `/gear-and-brands/` as a shared Nunjucks partial
(`src/_includes/partials/gear-calculator-widget.njk`, rendered into the page's
`#gear-calculator-root` div), with its own CSS/JS in `src/assets/css/gear-calculator.css`
and `src/assets/js/gear-calculator.js`. The same partial (and asset files) also back the
follow-up "Level Up Your Gear" tool at `/gear-and-brands/level-up/` via
`src/_includes/partials/level-up-widget.njk` and `src/assets/js/level-up-calculator.js`.

## Analytics setup

The site runs [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)
(cookieless, no consent banner needed) — already live site-wide via the script tag in
`src/_includes/layouts/base.njk`. Nothing to configure; to point it at a different
Cloudflare account, generate a new beacon token in the Cloudflare dashboard and swap the
`data-cf-beacon` token in that script tag.

## Newsletter setup

The signup form (`src/_includes/partials/newsletter.njk`) embeds a
[MailerLite](https://www.mailerlite.com) inline form (the `.ml-embedded` div, loaded by the
MailerLite Universal script in `src/_includes/layouts/base.njk`), shared across the
homepage, Community, and Intermediate & Advanced pages.

To change the form's fields, edit the form in your MailerLite dashboard, then swap the
`data-form` ID in `src/_includes/partials/newsletter.njk` for the new form's ID. MailerLite's
own form editor is the most reliable way to color-match the form to the site palette (ink
`#06232c`, coral `#ff5f45`, teal `#2fd1c5`) — check the embedded form still looks right after
any changes, since MailerLite renders its own markup at runtime.

## Where to Ride map

`src/assets/data/where-to-ride-spots.json` is the entire dataset behind the map and list on
the Where to Ride page — it's a plain JSON file you can open and edit directly, no code
needed. Each spot is one object with these fields:

- `name`, `city`, `state`, `region` — display text (region isn't grouped on yet, just stored
  for later).
- `lat`, `lng` — decimal coordinates for the pin.
- `waterType`, `windDirection`, `skillLevel`, `description` — shown in the popup/list.
- `localsMeetHere` — `true`/`false`, shows a "Locals meet here" badge.
- `verified` — set to `"community-reported"` for a researched-but-not-ridden spot (renders
  as an **outlined** pin), or to `"firsthand-verified"` once you've confirmed it yourself
  (renders as a **filled** pin). This exact string is what the map checks — typos will just
  fall back to the outlined style.
- `sourceNote` — optional; a small italic caveat shown at the bottom of the popup. Delete
  this field once a spot is firsthand-verified, since the caveat no longer applies.

To add, edit, or remove a spot, just edit this array — the map and list both rebuild from it
automatically on the next deploy.

The map itself runs on [Leaflet](https://leafletjs.com/) and the
[Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) plugin, both
self-hosted (not loaded from a CDN) in `src/assets/vendor/`, with map tiles from
[Esri's free dark basemap](https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base)
(no API key required — CARTO's free tiles started requiring one, so this switched providers).
To update either library later, download the new version's `dist/` files and replace the
matching files in `src/assets/vendor/leaflet/` or `src/assets/vendor/leaflet.markercluster/`.

### Submit a Spot form

The "Add a Spot" button on that page opens a modal (`src/where-to-ride/index.md`,
`src/assets/js/where-to-ride.js`) that has visitors drop a pin on a map — or use their
location or search an address — before showing an Airtable form, pre-filled with those
coordinates, embedded via `<iframe>` as the modal's last step. Submissions land as new rows
in the connected Airtable base — review them there before adding a spot to
`src/assets/data/where-to-ride-spots.json`.

To change the form's fields, edit the form in Airtable (Table view > your form view > Share
form), then in Airtable's "Embed this view" panel grab the updated share ID and swap it into
the `AIRTABLE_BASE_ID`/`AIRTABLE_FORM_SHARE_ID` constants at the top of
`src/assets/js/where-to-ride.js` (the URL and prefill params are built from those, not a
static iframe `src`). Nothing on the site publishes a submitted spot automatically; you (or
Claude) still add it to `where-to-ride-spots.json` by hand once you've reviewed it.

The same modal pattern — pre-filled Airtable form in an iframe, triggered from a button —
also powers per-spot correction/confirmation feedback (`src/assets/js/spot-feedback.js`) on
each spot's detail page.

## Site search

Search is powered by [Pagefind](https://pagefind.app), which indexes the built HTML directly
— no database, no backend, nothing to host separately. It runs automatically after every
build (`npm run build` triggers it via the `postbuild` script in `package.json`), so any new
page or content edit becomes searchable the next time the site deploys. Nothing needs to be
done by hand.

The search box lives in the top nav (`src/_includes/partials/nav.njk`, the `#navSearch` div)
and is themed in `src/assets/css/styles.css` under "nav search (Pagefind)".

## Local development (optional)

You don't need this to edit content, but if you want to preview changes before pushing:

```
npm install
npm start
```

Then open the URL it prints (usually `http://localhost:8080`). Note: the search box won't
find anything in this mode unless you've run `npm run build` at least once first — `npm start`
watches and rebuilds pages but doesn't re-run the Pagefind indexing step.

## Deployment

This repo deploys automatically to GitHub Pages via GitHub Actions on every push to `main`
(see `.github/workflows/deploy.yml`). See `DEPLOYMENT.md` for the one-time setup step and
how to point a real domain at the site later.
