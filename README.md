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

## The gear calculator page

`src/beginner-guide/what-gear-do-you-need.md` is a placeholder shell for your HTML/CSS/JS
gear calculator prototype. To integrate it:

1. Paste the calculator's **HTML** into the `#gear-calculator-root` div in that file.
2. Paste its **CSS** into `src/assets/css/gear-calculator.css`.
3. Paste its **JS** into `src/assets/js/gear-calculator.js`.

Both of those asset files only load on that one page, so they won't affect the rest of the
site's styling or scripts.

## Newsletter setup

The signup form (`src/_includes/partials/newsletter.njk`) is wired up but pointed at a
placeholder endpoint, since Buttondown's free tier only supports one newsletter and that's
already used by another project. Once you've picked a provider for this site:

1. Get that provider's signup **form action URL** (every provider calls this something
   slightly different — "embed form," "hosted form," "subscribe endpoint").
2. In `src/_includes/partials/newsletter.njk`, replace `REPLACE_WITH_YOUR_PROVIDER_ENDPOINT`
   in the `data-action="..."` attribute with that URL.
3. Check the provider's docs for the expected email field name — most use `name="email"`
   (already set), but a few (like Mailchimp) use something like `EMAIL` instead.
4. Push the change — the placeholder "coming soon" message in `src/assets/js/main.js` only
   fires while the endpoint still says `REPLACE_WITH_YOUR_PROVIDER_ENDPOINT`, so once you
   swap in a real URL the form will submit for real automatically.

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
