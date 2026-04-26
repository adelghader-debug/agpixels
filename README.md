# AGPixels

Landing site for AGPixels — web design & development, website maintenance, and mobile app development.

Live: https://agpixels.ca

## Stack

- Plain HTML / CSS / vanilla JS — no framework, no build step
- Hosted on Cloudflare Pages
- Deployed automatically on push to `main`

## Local development

Just open `public/index.html` in a browser, or serve the folder:

```bash
# Python
cd public && python -m http.server 8000

# Or Node
npx serve public
```

## Files

- `public/index.html` — markup
- `public/styles.css` — design system + layout
- `public/script.js` — mobile nav toggle + footer year
- `public/assets/` — images and logos
- `wrangler.jsonc` — Cloudflare Workers (static assets) config
