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

- [ ] `js/videos.js`: when a new animation is ready, paste its link on the next "Coming soon" line (1 of 10 is in already)
- [ ] `js/reviews-data.js`: replace the sample reviews with real ones and remove every `demo: true`
      (the "Sample reviews" tag then disappears by itself)
- [ ] `index.html`, Mat-Baker card: update the download number now and then (two places, see the `EDIT:` note)
- [ ] Site address: if your repo is not `sanjaya3d.github.io`, change the address in the `<head>` (see below)
- [ ] Optional: add an email to the contact section; swap `assets/og.jpg` for a still from your best animation
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
assets/           logo.png (your S3D logo, orange, transparent), favicon-32/192.png, apple-touch-icon.png,
                  mat-baker-preview.webp, lipi-preview.webp, lipi-icon.png,
                  og.jpg (the picture shown when the link is shared)
404.html          shown for pages that do not exist (it links back to "/")
robots.txt        lets search engines in
```

## Adding your product animations

`js/videos.js` holds 10 lines: your first animation (shown large) and 9 reserved lines that show as "Coming soon" tiles.
When the next animation is ready, open `js/videos.js`, find the next line with `url: ""`, paste the YouTube link between
the quotes and change the title. The tile becomes playable and the label above the grid ("1 live · 9 coming soon")
updates itself. Need more than 10? Copy any line and add it at the end. The "Watch more on YouTube" button in
`index.html` links to your channel.

To change a link, open `js/videos.js` and paste each YouTube link between the quotes after `url:`
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
the download count (the number appears in `data-count` and in the text) and the Drive-rig card when you are
ready to announce it. The pictures are `assets/mat-baker-preview.webp` and `assets/lipi-preview.webp`; replace
a file (same name) to change the picture. The "Featured on" chips link to the articles; add or remove a chip
by copying or deleting one `<a class="outlet ...">` line.

## Editing the team section

It is plain HTML in `index.html` (search for `id="team"`). Each role is one `<li class="role">` block: change the
title and the one-line text, copy a block to add a role, or delete one. No names or numbers are shown; if you
want to add team members later, tell me and I will add photos and names.

## Contact, footer and sharing

- Contact and footer are plain HTML at the bottom of `index.html` (search for `id="contact"`). The WhatsApp button
  (`https://wa.me/message/BRLC23NIBSHRM1`) appears in the nav, hero, services, contact and footer; Instagram,
  Facebook, TikTok and YouTube links are in the contact section and the footer. There is a
  commented-out email line there: add your address and remove the comment marks if you want one shown.
- **Site address:** the `<head>` assumes `https://sanjaya3d.github.io/` (a repo named `sanjaya3d.github.io`).
  If your address is different, search `index.html` for `sanjaya3d.github.io` and change all 5 places
  (canonical, og:url, og:image, twitter:image, and `url` in the JSON-LD block).
- `assets/og.jpg` is the 1200x630 picture shown when the link is shared. Replace it with a still from your best
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
