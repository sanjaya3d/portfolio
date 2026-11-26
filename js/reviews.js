/* SANJAYA 3D — portfolio
   Part 5 + 16: Fiverr reviews as three sliding rows, with a "Repeat client" badge.
   Reads window.PORTFOLIO_REVIEWS (js/reviews-data.js). Rows alternate direction and
   speed; hovering a row pauses it; a Pause button stops everything. With
   prefers-reduced-motion the rows don't move and can be scrolled by hand instead. */
(() => {
  "use strict";

  const section = document.getElementById("reviews");
  const rowsEl = document.getElementById("reviews-rows");
  if (!section || !rowsEl) return;

  const data = window.PORTFOLIO_REVIEWS;
  const items = data && Array.isArray(data.items) ? data.items.filter((r) => r && r.text) : [];
  if (!items.length) { section.hidden = true; return; }   // nothing to show: hide the whole section

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Per-row look: direction, speed (px per second) and how dim the row sits behind the middle one */
  const ROW_STYLES = [
    { dir: "ltr", speed: 38, dim: 0.7 },
    { dir: "rtl", speed: 54, dim: 1 },
    { dir: "ltr", speed: 30, dim: 0.7 },
  ];
  const rowCount = items.length >= 9 ? 3 : items.length >= 4 ? 2 : 1;

  const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.3 5.8.8-4.2 4 1 5.8L10 14.9 4.9 17.7l1-5.8-4.2-4 5.8-.8z"/></svg>';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "•";
    const a = parts[0][0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }

  /* A name that appears in more than one review marks a repeat client (matched ignoring capitals).
     Add repeat: true / repeat: false to a review in the data file to force it. */
  const nameKey = (r) => String(r.name || "").trim().toLowerCase();
  const nameCount = new Map();
  items.forEach((r) => { const k = nameKey(r); if (k) nameCount.set(k, (nameCount.get(k) || 0) + 1); });
  const isRepeat = (r) => r.repeat === true || (r.repeat !== false && (nameCount.get(nameKey(r)) || 0) > 1);

  function buildCard(r, repeat) {
    // A missing or invalid rating shows no stars (never a made-up 5); anything above 5 counts as 5.
    // Decimals such as 4.7 are kept: the last star fills partly and the label gives the exact number.
    const n = Number(r.rating);
    const rating = Number.isFinite(n) && n >= 1 ? Math.min(5, Math.round(n * 10) / 10) : 0;
    const card = el("li", "review");

    if (rating || repeat) {
      const top = el("div", "review__top");
      if (rating) {
        const stars = el("div", "review__stars");
        stars.setAttribute("role", "img");
        stars.setAttribute("aria-label", rating + " out of 5 stars");
        for (let i = 0; i < 5; i++) {
          const fill = Math.max(0, Math.min(1, rating - i));
          const s = el("span", fill > 0 ? "" : "is-off");
          s.innerHTML = STAR;
          if (fill > 0 && fill < 1) {
            s.classList.add("is-part");
            s.style.setProperty("--fill", Math.round(fill * 100) + "%");
            s.insertAdjacentHTML("beforeend", STAR);      // second star on top, clipped to the filled part
          }
          stars.appendChild(s);
        }
        top.appendChild(stars);
      }
      if (repeat) top.appendChild(el("span", "review__badge", "Repeat client"));
      card.appendChild(top);
    }

    const text = el("p", "review__text", r.text);
    if (r.lang) text.lang = String(r.lang);               // e.g. a review written in Italian
    card.appendChild(text);

    const who = el("div", "review__who");
    const avatar = el("span", "review__avatar", initials(r.name));
    avatar.setAttribute("aria-hidden", "true");
    who.appendChild(avatar);
    const info = el("div");
    info.appendChild(el("div", "review__name", r.name || "Fiverr client"));
    const meta = [r.country, r.project].filter(Boolean).join(" · ");
    if (meta) info.appendChild(el("div", "review__meta", meta));
    who.appendChild(info);
    card.appendChild(who);
    return card;
  }

  /* ---------- render the rows ---------- */
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    const style = ROW_STYLES[i];
    const row = el("div", "reviews__row reviews__row--" + style.dir);
    row.style.setProperty("--dim", String(style.dim));
    const track = el("div", "reviews__track");
    const group = el("ul", "reviews__group");
    group.setAttribute("aria-label", "Client reviews, row " + (i + 1));
    items.forEach((r, idx) => { if (idx % rowCount === i) group.appendChild(buildCard(r, isRepeat(r))); });
    track.appendChild(group);
    row.appendChild(track);
    rowsEl.appendChild(row);
    rows.push({ track, group, speed: style.speed });
  }

  /* ---------- header extras: sample tag + optional summary ---------- */
  const demoTag = document.getElementById("reviews-demo");
  if (demoTag) demoTag.hidden = !items.some((r) => r.demo === true);

  const summary = document.getElementById("reviews-summary");
  const s = data.summary || {};
  if (summary && s.rating && s.count) {
    summary.innerHTML = "";
    const strong = el("strong", "", s.rating + " ★");
    summary.appendChild(strong);
    summary.appendChild(document.createTextNode(" · " + s.count + " reviews"));
    summary.hidden = false;
  }

  (window.revealOnScroll || ((list) => list.forEach((n) => n.classList.add("is-in"))))(
    section.querySelectorAll(".reveal")
  );

  /* ---------- the loop ---------- */
  const pauseBtn = document.getElementById("reviews-pause");

  if (reduceMotion) {
    section.classList.add("is-static");     // CSS turns the rows into hand-scrollable strips
    if (pauseBtn) pauseBtn.hidden = true;
    return;
  }

  // Clone each group until two full copies of the viewport are covered, then slide by exactly half.
  function build() {
    rows.forEach(({ track, group, speed }) => {
      track.classList.remove("is-running");
      track.querySelectorAll("[data-clone]").forEach((n) => n.remove());

      const viewport = track.parentElement.clientWidth;
      const groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) return;

      const n = Math.max(1, Math.ceil(viewport / groupWidth));
      for (let i = 0; i < 2 * n - 1; i++) {
        const clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.removeAttribute("aria-label");
        clone.dataset.clone = "";
        track.appendChild(clone);
      }
      track.style.setProperty("--dur", (groupWidth * n) / speed + "s");
      track.classList.add("is-running");
    });
  }

  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  // Pause control (people can stop moving content) + save work while the section is off-screen
  if (pauseBtn) {
    pauseBtn.hidden = false;                // shown only once the rows are moving
    const label = pauseBtn.querySelector(".reviews__pause-label");
    pauseBtn.addEventListener("click", () => {
      const paused = section.classList.toggle("is-paused");
      pauseBtn.setAttribute("aria-pressed", String(paused));
      if (label) label.textContent = paused ? "Play" : "Pause";
    });
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      section.classList.toggle("is-offscreen", !entries[entries.length - 1].isIntersecting);
    }).observe(section);
  }
})();
