# SANJAYA 3D — portfolio

Static site, no build step. Plain HTML, CSS and JavaScript, so it runs on GitHub Pages as-is.

## Deploy on GitHub Pages

1. On GitHub, create a new **public** repository named `sanjaya3d.github.io`
   (a repo named `<username>.github.io` is served at `https://<username>.github.io`).
2. Upload everything in this folder to the repository root, so `index.html` sits at the top level.
3. Open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**,
   branch `main`, folder `/ (root)`, then Save.
4. After a minute or two the site is live at `https://sanjaya3d.github.io`.

`.nojekyll` tells GitHub to serve the files exactly as they are.

## Structure

```
index.html        page markup (sections are added part by part)
css/style.css     design tokens + styles
js/main.js        nav, hero light, stat counters, tools ticker
js/hero3d.js      the interactive 3D cube in the hero
assets/           favicon (more media is added in later parts)
```

## The 3D hero

`js/hero3d.js` uses Three.js, loaded from jsDelivr and pinned to version 0.149.0 (see the
`<script>` tags at the bottom of `index.html`). If the CDN or WebGL is unavailable, the hero
quietly stays static, so the page never breaks.

To host Three.js yourself instead, download
`https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js` into `js/vendor/three.min.js`
and change the `src` of that `<script>` tag to `js/vendor/three.min.js`.

The look is tuned from the `CONFIG` block at the top of `js/hero3d.js` (spin speed, how far the
cube turns toward the cursor, corner rounding, exposure, dust count).

## Editing

Colours, fonts and spacing live in the `:root` block at the top of `css/style.css`.
Change `--accent` to recolour the whole site.
