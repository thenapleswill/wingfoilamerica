# Deployment & domain steps (for the site owner)

The code and automation are all set up. These are the manual steps that only you can do
(they require clicking around in GitHub's website / your domain registrar's website).

## 1. One-time: turn on GitHub Pages for this repo

1. Go to the repo on GitHub → **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment" → "Source", choose **GitHub Actions**.
3. That's it — no need to touch this again. Every push to `main` will now build and deploy
   automatically via the workflow in `.github/workflows/deploy.yml`.

After the first push, check the **Actions** tab on GitHub to watch the deploy run. Once it's
green, your site is live at:

```
https://<your-github-username>.github.io/wingfoilamerica/
```

(or, once step 2 below is done, at your custom domain instead.)

## 2. Custom domain — already done

`wingfoilamerica.com` is already configured as the site's custom domain (`src/CNAME`, and
`siteUrl` in `src/_data/site.js`) and is what's live in production today. The steps below are
kept for reference — e.g. if the domain moves to a new registrar, or a new domain gets added
later — not as something still to do.

1. **Buy the domain** from any registrar (Namecheap, Google Domains/Squarespace, GoDaddy, etc.).
2. In this GitHub repo: **Settings** → **Pages** → under "Custom domain", type your domain
   (e.g. `wingfoilamerica.com`) and save. GitHub will create a `CNAME` file in the repo for
   you automatically.
3. At your domain registrar, add these DNS records (exact screen varies by registrar, but
   look for "DNS settings" or "Manage DNS"):

   **If using the bare domain (`wingfoilamerica.com`, no "www"):** add four **A records**
   for the `@` host, pointing to GitHub's Pages IP addresses:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **If using `www.wingfoilamerica.com`:** add a **CNAME record** for the `www` host
   pointing to:
   ```
   <your-github-username>.github.io
   ```

   Most people set up both: A records for the bare domain, plus a CNAME for `www`, and then
   in GitHub Pages settings check "Enforce HTTPS" once it's available (can take up to 24
   hours after DNS is set).

4. DNS changes can take anywhere from a few minutes to 24-48 hours to fully propagate. GitHub
   will show a green checkmark next to your custom domain in Settings → Pages once it verifies.

If any of this is confusing when you get there, paste a screenshot of your registrar's DNS
page into a chat with Claude and it can tell you exactly which fields to fill in.
