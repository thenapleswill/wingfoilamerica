# Wing Foil America — working agreement

This is a static site (Markdown pages, no database) deployed via
GitHub Pages, worked on with a non-technical owner who can't read
code or diffs directly — so verification and clear reporting matter
more than usual here.

## Before saying something is done

- Never report a task as complete without independently confirming
  it. For a content change: re-read the file after editing to
  confirm the change is actually there. For anything meant to be
  live on the site: after committing and pushing, wait for the
  GitHub Pages deploy to actually finish (check deployment status if
  you have gh CLI access, or wait ~60-90 seconds) before fetching the
  live URL to confirm. Checking immediately after a push will show
  stale content and give a false read either way.
- If you can't verify something (no network access, deploy still
  pending, genuinely ambiguous), say so plainly instead of assuming
  success. "I made the change but couldn't confirm it's live yet" is
  a fine thing to report. A false "done" is not.
- When you add a new page, always link it from its section's landing
  page AND add it to sitemap.xml. A page that exists but isn't linked
  or isn't in the sitemap is effectively broken — this has already
  happened once on this project (the Downwinding page, Aug 2026).

## Favicons and cached assets

- Favicons and similar assets cache aggressively in browsers. If told
  an old icon/image is still showing, don't assume the fix failed —
  first confirm what's actually being served (fetch the asset
  directly, check it server-side), and if it's correct, say so and
  suggest a hard refresh or incognito window rather than re-doing
  work that already succeeded.

## Data files

- where-to-ride-spots.json is hand-edited, not database-backed.
  Before adding or changing entries, look at the existing structure
  and match field names exactly rather than inventing new ones.
  After editing, validate the file is syntactically correct JSON
  before committing — a broken file silently breaks the whole map.

## Scope discipline

- Make exactly the change described in a given task — don't bundle
  in unrelated cleanup without flagging it separately. If a task has
  multiple parts, confirm and report on each part individually
  rather than one blanket "done."

## What's outside this repo

- Some things aren't code changes at all: newsletter form fields
  live in Kit's dashboard, spot submissions go through Airtable's own
  form builder, analytics config lives in Cloudflare. If asked to
  change one of these, say clearly that it's outside the repo and
  needs to be done in that service's dashboard — don't fake it in
  site code or claim it's handled.

## Reporting back

- When reporting a change as done, name the specific file(s) changed
  and, for anything live, the exact URL to check. The owner will
  often spot-check directly rather than trusting the report, so make
  that easy.
