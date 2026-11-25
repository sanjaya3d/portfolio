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

## Before you go live (checklist)

- [ ] `js/videos.js`: paste your 10 YouTube links (empty entries show a "Coming soon" tile)
- [ ] `js/reviews-data.js`: replace the sample reviews with real ones and remove every `demo: true`
      (the "Sample reviews" tag then disappears by itself)
- [ ] `index.html`, LIPI card: replace the placeholder line with a real one-line description
- [ ] `index.html`, Mat-Baker card: update the download number now and then (two places, see the `EDIT:` note)
- [ ] Site address: if your repo is not `sanjaya3d.github.io`, change the address in the `<head>` (see below)
- [ ] Optional: add an email to the contact section; swap `assets/og.png` for a still from your best animation
- [ ] Read all headings and descriptions once. Much of the wording is a first draft, so make it sound like you.

To try the site on your own computer, open a terminal in this folder and run `python3 -m http.server`,
then open http://localhost:8000. (Opening `index.html` by double-click also works, except the video player.)

## Structure

```
index.html        page markup (sections are added part by part)
css/style.css     design tokens + styles
js/main.js        nav, hero light, stat counters, tools ticker
js/hero3d.js      the interactive 3D cube in the hero
js/videos.js      YOUR VIDEO LIST: paste YouTube links here
js/work.js        builds the video grid + player
js/reviews-data.js YOUR FIVERR REVIEWS (currently sample text)
js/reviews.js     builds the three sliding review rows
(add-ons section is plain HTML in index.html, search for id="addons")
assets/           favicon, apple-touch-icon.png, og.png (the picture shown when the link is shared)
404.html          shown for pages that do not exist (it links back to "/")
robots.txt        lets search engines in
```

## Adding your product animations

Open `js/videos.js` and paste each YouTube link between the quotes after `url:`
(watch links, `youtu.be` links, Shorts links, or the bare video ID all work).
The first entry is shown large as the featured piece. Entries left empty show a "Coming soon" tile.
Thumbnails come from YouTube automatically; to use your own cover image, add `thumb: "assets/thumbs/01.jpg"`.

## Adding your Fiverr reviews

`js/reviews-data.js` currently holds SAMPLE reviews. Replace each entry with a real review from your
Fiverr profile (name, review text, rating) and remove `demo: true` from it. While any entry still has
`demo: true`, the page shows a small "Sample reviews" tag. It disappears once all reviews are real.
You can also fill in `summary` (for example rating `"5.0"`, count `"130"`) to show headline numbers.

## Editing the Blender add-ons section

It is plain HTML in `index.html` (search for `id="addons"`). Comments marked `EDIT:` show what to change:
the download count (the number appears in `data-count` and in the text), the one-line description under LIPI,
and the Drive-rig card when you are ready to announce it.

## Contact, footer and sharing

- Contact and footer are plain HTML at the bottom of `index.html` (search for `id="contact"`). There is a
  commented-out email line there: add your address and remove the comment marks if you want one shown.
- **Site address:** the `<head>` assumes `https://sanjaya3d.github.io/` (a repo named `sanjaya3d.github.io`).
  If your address is different, search `index.html` for `sanjaya3d.github.io` and change all 5 places
  (canonical, og:url, og:image, twitter:image, and `url` in the JSON-LD block).
- `assets/og.png` is the 1200x630 picture shown when the link is shared. Replace it with a still from your best
  animation any time (same file name, same size).

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
