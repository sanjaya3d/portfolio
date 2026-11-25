/* SANJAYA 3D — portfolio
   Part 1: nav state, hero pointer light, stat counters, tools ticker.
   Plain JS, no build step, runs as-is on GitHub Pages. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Nav: add a backdrop once the page scrolls ---------- */
  const nav = $("#nav");
  const syncNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });

  /* ---------- Hero: cursor drives the key-light and floor parallax ---------- */
  const hero = $(".hero");
  if (hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let frame = 0;
    let x = 0, y = 0, w = 1;

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      w = r.width;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        hero.style.setProperty("--sx", x + "px");
        hero.style.setProperty("--sy", y + "px");
        hero.style.setProperty("--mx", ((x / w) * 2 - 1).toFixed(3));
      });
    });

    hero.addEventListener("pointerleave", () => {
      ["--sx", "--sy", "--mx"].forEach((p) => hero.style.removeProperty(p));
    });
  }

  /* ---------- Stats: count up when they scroll into view ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const countUp = (el) => {
      const end = Number(el.dataset.count);
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((el) => {
      el.textContent = "0";
      io.observe(el);
    });
  }

  /* ---------- Scroll reveal for .reveal elements ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Tools ticker: clone the list so the loop has no gap ---------- */
  const track = $(".ticker__track");
  if (track && !reduceMotion) {
    const group = track.firstElementChild;
    const PX_PER_SECOND = 60;

    const build = () => {
      track.classList.remove("is-running");
      track.querySelectorAll("[data-clone]").forEach((n) => n.remove());

      const viewport = track.parentElement.clientWidth;
      const groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) return;

      // n groups fill the viewport; 2n groups in total, and we slide by exactly half.
      const n = Math.max(1, Math.ceil(viewport / groupWidth));
      for (let i = 0; i < 2 * n - 1; i++) {
        const clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.clone = "";
        track.appendChild(clone);
      }
      track.style.setProperty("--ticker-dur", (groupWidth * n) / PX_PER_SECOND + "s");
      track.classList.add("is-running");
    };

    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });
  }
})();
