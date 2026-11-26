/* SANJAYA 3D — portfolio
   Part 4: product animation showcase.
   Reads window.PORTFOLIO_VIDEOS (js/videos.js), renders a featured tile + grid,
   and plays videos in a lightbox (YouTube, privacy-enhanced embed). */
(() => {
  "use strict";

  const grid = document.getElementById("work-grid");
  const dialog = document.getElementById("lightbox");
  const raw = Array.isArray(window.PORTFOLIO_VIDEOS) ? window.PORTFOLIO_VIDEOS : [];
  if (!grid || !raw.length) return;

  const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const pad = (n) => String(n).padStart(2, "0");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Accepts a full YouTube URL (watch, youtu.be, shorts, embed, live) or a bare 11-character ID. */
  function parseVideoId(input) {
    const s = String(input || "").trim();
    if (!s) return "";
    const isId = (v) => /^[\w-]{11}$/.test(v || "");
    if (isId(s)) return s;
    try {
      const u = new URL(s);
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return isId(u.pathname.split("/")[1]) ? u.pathname.split("/")[1] : "";
      if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const v = u.searchParams.get("v");
        if (isId(v)) return v;
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
        if (m) return m[1];
      }
    } catch (_) { /* not a URL */ }
    return "";
  }

  const items = raw.map((v, i) => ({
    index: i,
    n: i + 1,
    title: (v && v.title) || "Product animation " + pad(i + 1),
    id: parseVideoId(v && v.url),
    thumb: (v && v.thumb) || "",
  }));
  const playable = items.filter((it) => it.id);

  /* ---------- thumbnails: your own image, else YouTube's (max size, then a safe fallback) ---------- */
  function loadThumb(img, item) {
    const sources = item.thumb
      ? [item.thumb]
      : [
          "https://i.ytimg.com/vi/" + item.id + "/maxresdefault.jpg",
          "https://i.ytimg.com/vi/" + item.id + "/hqdefault.jpg",
        ];
    let k = 0;
    const next = () => { if (k < sources.length) img.src = sources[k++]; };
    img.addEventListener("load", () => {
      // YouTube answers a missing max-res image with a tiny placeholder: skip it
      if (img.naturalWidth <= 160 && k < sources.length) return next();
      img.classList.add("is-loaded");
    });
    img.addEventListener("error", next);
    next();
  }

  /* ---------- tiles ---------- */
  function buildTile(item) {
    const isPlayable = !!item.id;
    const tile = el(isPlayable ? "button" : "div", "tile reveal" + (isPlayable ? "" : " tile--empty"));
    if (item.index === 0) tile.classList.add("tile--featured");
    tile.style.setProperty("--i", item.index === 0 ? 0 : (item.index - 1) % 3);

    const media = el("span", "tile__media");
    media.setAttribute("aria-hidden", "true");
    if (isPlayable) {
      const img = el("img", "tile__thumb");
      img.alt = "";
      img.decoding = "async";
      if (item.index > 3) img.loading = "lazy";
      media.appendChild(img);
      loadThumb(img, item);
    }
    tile.appendChild(media);

    if (isPlayable) {
      tile.type = "button";
      tile.dataset.index = String(item.index);
      tile.setAttribute("aria-label", "Play video: " + item.title);
      const play = el("span", "tile__play");
      play.setAttribute("aria-hidden", "true");
      play.innerHTML = PLAY_ICON;
      tile.appendChild(play);
    } else {
      tile.appendChild(el("span", "tile__soon", "Coming soon"));
    }

    const meta = el("span", "tile__meta");
    if (raw.length > 1) meta.appendChild(el("span", "tile__num", pad(item.n)));   // numbering only makes sense for several pieces
    meta.appendChild(el("span", "tile__title", item.title));
    tile.appendChild(meta);
    if (item.index === 0 && raw.length > 1) tile.appendChild(el("span", "tile__badge", "Featured"));
    return tile;
  }

  const tiles = items.map(buildTile);
  tiles.forEach((t) => grid.appendChild(t));

  // With an odd number of small tiles the last one would sit alone on the 2-column layout: let it span.
  if ((items.length - 1) % 2 === 1 && tiles.length > 1) tiles[tiles.length - 1].classList.add("tile--wide");

  const count = document.getElementById("work-count");
  if (count) {
    // Honest count: say how many can be watched now, and how many are reserved
    const soon = items.length - playable.length;
    count.textContent = items.length < 2 ? "" : soon ? playable.length + " live \u00b7 " + soon + " coming soon" : items.length + " pieces";
  }

  (window.revealOnScroll || ((list) => list.forEach((t) => t.classList.add("is-in"))))(tiles);

  /* ---------- lightbox ---------- */
  if (!dialog || !playable.length) return;

  const frame = dialog.querySelector(".lightbox__frame");
  const titleEl = dialog.querySelector(".lightbox__title");
  const countEl = dialog.querySelector(".lightbox__count");
  const watchEl = dialog.querySelector(".lightbox__watch");
  const prevBtn = dialog.querySelector(".lightbox__prev");
  const nextBtn = dialog.querySelector(".lightbox__next");
  let current = -1;

  const watchUrl = (item) => "https://www.youtube.com/watch?v=" + item.id;

  function show(item) {
    current = item.index;
    frame.textContent = "";
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + item.id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
    iframe.title = item.title;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.setAttribute("allowfullscreen", "");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.appendChild(iframe);
    titleEl.textContent = item.title;
    // counts only the videos that can be played, so "01 / 10" never appears when 9 of them are still coming soon
    countEl.textContent = playable.length > 1 ? pad(playable.indexOf(item) + 1) + " / " + pad(playable.length) : "";
    watchEl.href = watchUrl(item);
  }

  function open(item) {
    if (typeof dialog.showModal !== "function") {
      window.open(watchUrl(item), "_blank", "noopener");
      return;
    }
    show(item);
    if (!dialog.open) {
      document.documentElement.classList.add("has-lightbox");
      dialog.showModal();
    }
  }

  function step(dir) {
    const pos = playable.findIndex((p) => p.index === current);
    show(playable[(pos + dir + playable.length) % playable.length]);
  }

  grid.addEventListener("click", (e) => {
    const tile = e.target.closest("button.tile");
    if (tile) open(items[Number(tile.dataset.index)]);
  });

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // click on the dimmed backdrop
  dialog.addEventListener("keydown", (e) => {
    if (playable.length < 2) return;
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });
  dialog.addEventListener("close", () => {
    frame.textContent = "";            // removing the iframe stops playback
    current = -1;
    document.documentElement.classList.remove("has-lightbox");
  });

  if (playable.length < 2) { prevBtn.hidden = true; nextBtn.hidden = true; }
})();
