/* SANJAYA 3D — portfolio
   Nav (links, active section, mobile menu), hero pointer light, stat counters, tools ticker.
   Plain JS, no build step, runs as-is on GitHub Pages. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Nav: backdrop on scroll, current-section highlight, mobile menu ---------- */
  const nav = $("#nav");
  const navLinks = $("#nav-links");
  const toggle = $(".nav__toggle");

  const sections = ["work", "services", "reviews", "addons", "contact"]
    .map((id) => ({ id, el: document.getElementById(id), link: $(`.nav__links a[href="#${id}"]`) }))
    .filter((s) => s.el && s.link);

  // The current section is the last one whose top has passed ~35% down the screen.
  // At the very bottom of the page the last section wins (it may be too short to reach that line).
  const markActive = () => {
    let current = null;
    const line = window.innerHeight * 0.35;
    sections.forEach((s) => { if (s.el.getBoundingClientRect().top <= line) current = s.id; });
    if (sections.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    sections.forEach((s) => {
      const on = s.id === current;
      s.link.classList.toggle("is-active", on);
      if (on) s.link.setAttribute("aria-current", "location");
      else s.link.removeAttribute("aria-current");
    });
  };

  let navTicking = false;
  const syncNav = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => { navTicking = false; markActive(); });
  };
  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });
  window.addEventListener("resize", syncNav);

  if (toggle && navLinks) {
    const isOpen = () => nav.classList.contains("is-open");
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!isOpen()));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("click", (e) => { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener("focusout", (e) => {
      if (isOpen() && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
    });
    window.matchMedia("(max-width: 960px)").addEventListener("change", () => setOpen(false));
  }

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

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
      const group = el.hasAttribute("data-group"); // data-group: show 2,391 instead of 2391
      const show = (v) => (group ? v.toLocaleString("en-US") : String(v));
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = show(Math.round(end * (1 - Math.pow(1 - p, 3))));
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
  const revealObserver =
    reduceMotion || !("IntersectionObserver" in window)
      ? null
      : new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
        );

  // Shared with later scripts (e.g. the video grid is built after this file runs)
  window.revealOnScroll = (list) => {
    list.forEach((el) => (revealObserver ? revealObserver.observe(el) : el.classList.add("is-in")));
  };
  window.revealOnScroll(document.querySelectorAll(".reveal"));

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
