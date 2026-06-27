DUKOPS - Local scaffold
======================

This repository scaffold helps you run the DUKOPS static app locally and build a `dist/` folder for deployment to GitHub / Cloudflare Pages.

Quick start (Node >=14):

1. Install Node (if not installed).
2. From repo root, run:

```bash
npm run build
npm start
```

This will create `dist/` (copied files) and start a static server at `http://localhost:8080`.

To serve the built `dist/` explicitly:

```bash
npm run build
NODE_ENV=production node server.js dist
```

Deployment notes:
- You can push the repository to GitHub and use Cloudflare Pages or GitHub Pages to host the static `dist/` build. Configure the Pages build to run `npm run build` and publish the `dist/` directory (or directly serve the repository root if you prefer).

Next steps I can help with (pick one):
- Create a GitHub Action workflow to build and deploy to Cloudflare Pages (requires Cloudflare token).
- Consolidate duplicate assets automatically (I can propose moves and patches).
- Run a light audit of JS for obvious runtime errors or missing references.
# DUKOPS