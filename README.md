# AGPixels

Landing site for AGPixels — web design & development, website maintenance, and mobile app development.

Live: https://agpixels.ca

## Stack

- Plain HTML / CSS / vanilla JS — no framework, no build step
- Hosted on Cloudflare Pages
- Deployed automatically on push to `main`

## Local development

Just open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8000

# Or Node
npx serve .
```

## Files

- `index.html` — markup
- `styles.css` — design system + layout
- `script.js` — mobile nav toggle + footer year
- `assets/` — images and logos
