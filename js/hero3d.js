/* SANJAYA 3D — portfolio
   Part 2: interactive 3D hero object.

   A glossy cube (the logo mark) lit by a procedural studio: softbox reflections,
   Blender-style bounding box, floating dust, warm light spill.
   - Idle: slow spin + gentle float
   - Mouse: the cube turns to look at the cursor
   - Drag the cube to spin it (with inertia); click it to flick it
   - Respects prefers-reduced-motion; pauses when off-screen
   - If Three.js fails to load or WebGL is unavailable, the page silently keeps
     the Part 1 hero (nothing breaks).

   Needs Three.js r149 (UMD build) loaded before this file — see index.html.
   Lights use r149's legacy intensity scale; if you upgrade Three.js past r155,
   re-tune the light intensities in `addLights`. */
(() => {
  "use strict";

  const THREE = window.THREE;
  const hero = document.querySelector(".hero");
  const stage = document.getElementById("hero-stage");
  if (!THREE || !hero || !stage) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Tweak the look here */
  const CONFIG = {
    accent: 0xff6b2c,
    exposure: 1.05,
    cubeRadius: 0.13,   // corner rounding, as a fraction of the edge
    segments: 40,       // smoothness of the rounded corners
    idleSpin: 0.38,     // radians per second
    tiltX: 0.28,        // how far the cube turns toward the cursor
    tiltY: 0.5,
    particles: 80,
    camDist: 10,
    fov: 30,
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  let renderer = null;
  let canvas = null;

  try {
    init();
  } catch (err) {
    console.warn("[hero3d] 3D hero disabled, keeping the static hero.", err);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (renderer && renderer.dispose) renderer.dispose();
  }

  /* ---------- helpers ---------- */

  // Hex colours are sRGB; older Three.js builds need an explicit conversion to linear.
  function colorFromHex(hex) {
    const c = new THREE.Color(hex);
    const cm = THREE.ColorManagement;
    const managed = !!cm && (cm.enabled === true || cm.legacyMode === false);
    if (!managed && typeof c.convertSRGBToLinear === "function") c.convertSRGBToLinear();
    return c;
  }

  function markSRGB(texture) {
    if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
    else texture.encoding = THREE.sRGBEncoding;
  }

  function radialTexture(stops) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([at, col]) => grad.addColorStop(at, col));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    markSRGB(tex);
    return tex;
  }

  // Unit cube with rounded edges: subdivide a box, then push each vertex out
  // from the inner (shrunk) box by the corner radius.
  function roundedCubeGeometry(radius, segments) {
    const geo = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const h = 0.5 - radius;
    const v = new THREE.Vector3();
    const inner = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      inner.set(clamp(v.x, -h, h), clamp(v.y, -h, h), clamp(v.z, -h, h));
      n.set(v.x - inner.x, v.y - inner.y, v.z - inner.z);
      if (n.lengthSq() > 1e-10) {
        n.normalize();
        v.set(inner.x + n.x * radius, inner.y + n.y * radius, inner.z + n.z * radius);
        nor.setXYZ(i, n.x, n.y, n.z);
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    return geo;
  }

  // A tiny photo studio: dark room + a few emissive softboxes, baked to an
  // environment map so the cube picks up believable reflections.
  function buildEnvironment(gl) {
    const env = new THREE.Scene();

    env.add(new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.03, 0.04), side: THREE.BackSide })
    ));

    const softbox = (w, h, x, y, z, hex, intensity) => {
      const mat = new THREE.MeshBasicMaterial({
        color: colorFromHex(hex).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };

    softbox(14, 9, -12, 10, 10, 0xfff2e6, 7);    // key light, upper left, warm white
    softbox(6, 14, 14, 2, 6, 0x9db8ff, 3.5);     // cool strip on the right
    softbox(18, 4, 0, 16, -4, 0xffffff, 4);      // overhead strip
    softbox(4, 14, -14, 0, -10, 0xffffff, 5);    // back-left rim
    softbox(10, 10, 0, -8, 12, 0xff8a50, 0.8);   // warm floor bounce

    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(env, 0.02);
    pmrem.dispose();
    return target.texture;
  }

  /* ---------- main ---------- */

  function init() {
    canvas = document.createElement("canvas");
    canvas.className = "hero3d";
    canvas.setAttribute("aria-hidden", "true");

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.exposure;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100);
    camera.position.set(0, 0, CONFIG.camDist);
    camera.updateMatrixWorld();

    const envTexture = buildEnvironment(renderer);
    addLights(scene);

    /* --- the cube --- */
    const root = new THREE.Group();       // positioned + scaled to fit the hero
    const spinner = new THREE.Group();    // the part that rotates
    spinner.rotation.order = "YXZ";
    root.add(spinner);
    scene.add(root);

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: colorFromHex(CONFIG.accent),
      metalness: 0.05,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: colorFromHex(0xff4a10),
      emissiveIntensity: 0.05,
      envMap: envTexture,
      envMapIntensity: 1,
    });
    spinner.add(new THREE.Mesh(roundedCubeGeometry(CONFIG.cubeRadius, CONFIG.segments), bodyMat));

    // Blender-style bounding box with corner handles
    const FRAME = 1.38;
    const boundingBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0xf3f0ea, transparent: true, opacity: 0.22 })
    );
    boundingBox.scale.set(FRAME, FRAME, FRAME);
    spinner.add(boundingBox);

    const handlePos = [];
    [-1, 1].forEach((x) => [-1, 1].forEach((y) => [-1, 1].forEach((z) => {
      handlePos.push((x * FRAME) / 2, (y * FRAME) / 2, (z * FRAME) / 2);
    })));
    const handleGeo = new THREE.BufferGeometry();
    handleGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(handlePos), 3));
    const dotTexture = radialTexture([[0, "rgba(255,255,255,1)"], [0.55, "rgba(255,255,255,0.9)"], [1, "rgba(255,255,255,0)"]]);
    spinner.add(new THREE.Points(handleGeo, new THREE.PointsMaterial({
      color: colorFromHex(CONFIG.accent), size: 8, sizeAttenuation: false,
      map: dotTexture, transparent: true, depthWrite: false,
    })));

    // Warm light spill under the cube (billboard, so no floor perspective to fight)
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: radialTexture([[0, "rgba(255,107,44,0.85)"], [0.4, "rgba(255,107,44,0.25)"], [1, "rgba(255,107,44,0)"]]),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
      })
    );
    glow.position.set(0, -1.0, -0.6);
    glow.scale.set(2.8, 0.6, 1);
    root.add(glow);

    /* --- floating dust --- */
    const N = CONFIG.particles;
    const dust = new Array(N).fill(0).map(() => ({
      u: Math.random(), v: Math.random(), z: (Math.random() - 0.5) * 6, speed: 0.006 + Math.random() * 0.014,
    }));
    const dustAttr = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", dustAttr);
    const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: colorFromHex(0xffb08a), size: 3, sizeAttenuation: false, map: dotTexture,
      transparent: true, depthWrite: false, opacity: 0.55, blending: THREE.AdditiveBlending,
    }));
    dustPoints.frustumCulled = false;
    scene.add(dustPoints);

    /* --- hint label --- */
    const hint = document.createElement("div");
    hint.className = "hero__hint is-hidden";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = '<span class="hero__hint-dot"></span>Drag to rotate';
    stage.appendChild(hint);
    setTimeout(() => { if (!interacted) hint.classList.remove("is-hidden"); }, 1600);

    stage.appendChild(canvas);

    /* --- state --- */
    let W = 1, H = 1, visW = 1, visH = 1, pxPerUnit = 1;
    let cx = 0, cy = 0, edgePx = 100, worldX = 0, worldY = 0, edgeWorld = 1;

    let autoY = Math.PI / 4;           // start on the logo's isometric pose
    const BASE_X = 0.6155;             // 35.26 degrees
    let dragX = 0, dragY = 0, velX = 0, velY = 0;
    const tilt = { x: 0, y: 0 };
    const tiltTarget = { x: 0, y: 0 };
    let idleSpeed = reduceMotion ? 0 : CONFIG.idleSpin;
    let hoverK = 0, hovering = false, dragging = false, interacted = false;
    let dragId = -1, lastX = 0, lastY = 0, lastT = 0, moved = 0;
    let visible = true, raf = 0, lastFrame = 0, clock = 0, settle = 0;

    /* --- layout: park the cube in the empty space above the wordmark --- */
    function measure() {
      const hr = hero.getBoundingClientRect();
      W = Math.max(hr.width, 1);
      H = Math.max(hr.height, 1);

      const dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.75 : 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      visH = 2 * CONFIG.camDist * Math.tan((CONFIG.fov * Math.PI) / 360);
      pxPerUnit = H / visH;
      visW = W / pxPerUnit;

      const wide = W >= 820;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      const anchor = document.querySelector(wide ? ".wordmark" : ".eyebrow");
      const top = navH + 8;
      const bottom = anchor ? anchor.getBoundingClientRect().top - hr.top - 20 : H * 0.4;
      const avail = Math.max(bottom - top, 120);

      edgePx = clamp(avail / 1.9, 84, Math.min(W * 0.3, 260));
      cx = wide ? W * 0.74 : W * 0.5;
      cy = top + avail / 2;

      edgeWorld = edgePx / pxPerUnit;
      worldX = (cx - W / 2) / pxPerUnit;
      worldY = (H / 2 - cy) / pxPerUnit;
      root.scale.set(edgeWorld, edgeWorld, edgeWorld);
      root.position.set(worldX, worldY, 0);

      hint.style.left = cx + "px";
      hint.style.top = Math.min(cy + edgePx * 1.12, bottom + 4) + "px";
      wake();
    }

    /* --- per-frame update --- */
    function update(dt) {
      clock += dt;
      const ease = 1 - Math.exp(-dt * 4);

      tilt.x = lerp(tilt.x, tiltTarget.x, ease);
      tilt.y = lerp(tilt.y, tiltTarget.y, ease);

      const idleTarget = dragging || reduceMotion ? 0 : CONFIG.idleSpin;
      idleSpeed = lerp(idleSpeed, idleTarget, 1 - Math.exp(-dt * 3));
      autoY += idleSpeed * dt;

      if (!dragging) {
        dragY += velY * dt;
        dragX += velX * dt;
        const decay = Math.exp(-dt * 2.6);
        velY *= decay;
        velX *= decay;
        if (Math.abs(velY) < 0.002) velY = 0;
        if (Math.abs(velX) < 0.002) velX = 0;
      }

      const sway = reduceMotion ? 0 : Math.sin(clock * 0.5) * 0.12;
      spinner.rotation.x = BASE_X + sway + dragX + tilt.x;
      spinner.rotation.y = autoY + dragY + tilt.y;

      hoverK = lerp(hoverK, hovering || dragging ? 1 : 0, 1 - Math.exp(-dt * 6));
      const s = 1 + 0.06 * hoverK;
      spinner.scale.set(s, s, s);
      bodyMat.emissiveIntensity = 0.05 + 0.2 * hoverK;
      glow.material.opacity = 0.5 + 0.3 * hoverK;

      const bob = reduceMotion ? 0 : Math.sin(clock * 0.9) * 0.035;
      root.position.set(worldX, worldY + bob * edgeWorld, 0);

      if (!reduceMotion) {
        for (let i = 0; i < N; i++) {
          const d = dust[i];
          d.v += d.speed * dt;
          if (d.v > 1) d.v -= 1;
        }
      }
      for (let i = 0; i < N; i++) {
        const d = dust[i];
        dustAttr.setXYZ(i, (d.u - 0.5) * visW, (d.v - 0.5) * visH, d.z);
      }
      dustAttr.needsUpdate = true;
    }

    /* --- render loop --- */
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) { lastFrame = 0; return; }
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
      lastFrame = now;
      update(dt);
      renderer.render(scene, camera);
      if (!canvas.classList.contains("is-ready")) canvas.classList.add("is-ready");

      if (!reduceMotion || dragging || velX !== 0 || velY !== 0 || settle > 0) {
        settle = Math.max(0, settle - 1);
        raf = requestAnimationFrame(frame);
      } else {
        lastFrame = 0;
      }
    }
    function wake() {
      settle = 45;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    /* --- pointer interaction --- */
    const local = (e) => {
      const r = hero.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const overCube = (x, y) => Math.hypot(x - cx, y - cy) < edgePx * 0.72;

    function hideHint() {
      interacted = true;
      hint.classList.add("is-hidden");
    }

    hero.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest && e.target.closest("a, button, input, textarea, select")) return;
      const p = local(e);
      if (!overCube(p.x, p.y)) return;
      dragging = true;
      dragId = e.pointerId;
      moved = 0;
      lastX = p.x; lastY = p.y; lastT = performance.now();
      velX = 0; velY = 0;
      hero.classList.add("is-dragging");
      try { hero.setPointerCapture(e.pointerId); } catch (_) { /* not critical */ }
      hideHint();
      wake();
    });

    hero.addEventListener("pointermove", (e) => {
      const p = local(e);

      if (dragging && e.pointerId === dragId) {
        const now = performance.now();
        const dt = Math.max((now - lastT) / 1000, 0.008);
        const rotY = (p.x - lastX) * 0.011;
        const rotX = (p.y - lastY) * 0.011;
        moved += Math.abs(p.x - lastX) + Math.abs(p.y - lastY);
        dragY += rotY;
        dragX += rotX;
        velY = lerp(velY, clamp(rotY / dt, -9, 9), 0.5);
        velX = lerp(velX, clamp(rotX / dt, -9, 9), 0.5);
        lastX = p.x; lastY = p.y; lastT = now;
        wake();
        return;
      }

      if (e.pointerType === "touch") return;
      const over = overCube(p.x, p.y);
      if (over !== hovering) {
        hovering = over;
        hero.classList.toggle("is-over-cube", over);
      }
      if (!reduceMotion) {
        tiltTarget.y = clamp((p.x - cx) / (W * 0.5), -1, 1) * CONFIG.tiltY;
        tiltTarget.x = clamp((p.y - cy) / (H * 0.5), -1, 1) * CONFIG.tiltX;
      }
      wake();
    }, { passive: true });

    const endDrag = (e) => {
      if (!dragging || e.pointerId !== dragId) return;
      dragging = false;
      hero.classList.remove("is-dragging");
      try { hero.releasePointerCapture(e.pointerId); } catch (_) { /* not critical */ }
      if (performance.now() - lastT > 90) { velX = 0; velY = 0; }   // paused before release: no fling
      if (e.type === "pointerup" && moved < 5) velY += (Math.random() < 0.5 ? -1 : 1) * 5.5;  // click = flick
      if (reduceMotion) { velX = 0; velY = 0; }
      wake();
    };
    hero.addEventListener("pointerup", endDrag);
    hero.addEventListener("pointercancel", endDrag);

    hero.addEventListener("pointerleave", () => {
      if (dragging) return;
      hovering = false;
      hero.classList.remove("is-over-cube");
      tiltTarget.x = 0;
      tiltTarget.y = 0;
      wake();
    });

    /* --- lifecycle --- */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) wake();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());

    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(hero);
    else window.addEventListener("resize", measure);

    // The wordmark finishes its entrance animation and the web font swaps in after
    // first paint, both of which nudge the layout, so measure again.
    setTimeout(measure, 1700);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    measure();
  }

  function addLights(scene) {
    const key = new THREE.DirectionalLight(0xfff0e0, 1.1);
    key.position.set(-4, 6, 8);
    const rim = new THREE.DirectionalLight(0x8fb4ff, 0.9);
    rim.position.set(6, 2, -6);
    scene.add(key);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  }
})();
