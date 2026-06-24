// ═══════════════════════════════════════════════════
//  🦷 DENTAL CHAIR 3D — chair3d.js
//  Adds a realistic rotating 3D dental chair to the
//  login screen background of dental-moderator site.
//
//  HOW TO ADD:
//  Add BOTH lines just before </body> in index.html:
//
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//  <script src="chair3d.js"></script>
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  function initChair() {
    const loginScreen = document.getElementById('login-screen');
    if (!loginScreen || typeof THREE === 'undefined') return;

    // ── CANVAS SETUP ────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'chair-bg-canvas';
    canvas.style.cssText = [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'z-index:0', 'pointer-events:none', 'opacity:0',
      'transition:opacity 1.2s ease'
    ].join(';');
    loginScreen.style.position = 'relative';
    loginScreen.insertBefore(canvas, loginScreen.firstChild);

    // Make login card sit above canvas
    const card = loginScreen.querySelector('.login-card');
    if (card) card.style.position = 'relative', card.style.zIndex = '2';

    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    // ── RENDERER ────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x0A1628, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07101f, 0.038);

    // Position camera to show chair on the LEFT side
    // leaving the right side clear for the login card
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 80);
    const camX = W > 900 ? -3.5 : 0; // centered on mobile, left on desktop
    camera.position.set(camX + 5, 5.5, 10);
    camera.lookAt(camX, 2.8, 0);

    // ── LIGHTS ──────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0x1a3a5c, 0x060e1a, 1.2));

    const sun = new THREE.DirectionalLight(0xffffff, 3.5);
    sun.position.set(6, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;  sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4488cc, 1.8);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    const rim = new THREE.SpotLight(0x00D4AA, 8, 22, Math.PI / 7, 0.4, 1.5);
    rim.position.set(-4, 8, -5);
    rim.target.position.set(0, 2, 0);
    scene.add(rim); scene.add(rim.target);

    const lampPt = new THREE.PointLight(0xfff8e0, 14, 9, 2);
    lampPt.position.set(2.6, 5.9, 0.2);
    scene.add(lampPt);

    const underGlow = new THREE.PointLight(0x00D4AA, 3, 4, 2);
    underGlow.position.set(0, 0.3, 0);
    scene.add(underGlow);

    // ── MATERIALS ───────────────────────────────────
    const M = p => new THREE.MeshStandardMaterial(p);
    const chrome    = M({ color: 0xc8d8e8, metalness: 0.95, roughness: 0.08 });
    const darkChrome= M({ color: 0x3a4a5a, metalness: 0.9,  roughness: 0.15 });
    const vinyl     = M({ color: 0x007766, metalness: 0,     roughness: 0.65 });
    const vinylDark = M({ color: 0x004d40, metalness: 0,     roughness: 0.7  });
    const bodyGrey  = M({ color: 0xe8eef5, metalness: 0.3,   roughness: 0.35 });
    const plasticD  = M({ color: 0x1a2535, metalness: 0.05,  roughness: 0.6  });
    const plasticL  = M({ color: 0xc5cfd8, metalness: 0.05,  roughness: 0.45 });
    const tealLED   = M({ color: 0x00D4AA, metalness: 0.1,   roughness: 0.4, emissive: 0x00aa88, emissiveIntensity: 0.3 });
    const lampGlass = M({ color: 0xfffde0, metalness: 0.1,   roughness: 0.05, emissive: 0xfff8c0, emissiveIntensity: 1.4, transparent: true, opacity: 0.92 });
    const floorM    = M({ color: 0x0d1825, metalness: 0.0,   roughness: 0.85 });
    const rubberM   = M({ color: 0x111a24, metalness: 0.0,   roughness: 0.9  });

    function mk(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }
    function box(w, h, d, mat) { return mk(new THREE.BoxGeometry(w, h, d, 2, 2, 2), mat); }
    function cyl(rt, rb, h, seg, mat) { return mk(new THREE.CylinderGeometry(rt, rb, h, seg), mat); }
    function sph(r, mat) { return mk(new THREE.SphereGeometry(r, 24, 24), mat); }
    function add(obj, x, y, z, rx, ry, rz) {
      obj.position.set(x, y, z);
      if (rx) obj.rotation.x = rx;
      if (ry) obj.rotation.y = ry;
      if (rz) obj.rotation.z = rz;
      return obj;
    }

    const G = new THREE.Group();
    G.position.x = camX; // shift chair to left on desktop

    // ── FLOOR ───────────────────────────────────────
    const flr = mk(new THREE.CircleGeometry(7, 64), floorM);
    flr.rotation.x = -Math.PI / 2; flr.receiveShadow = true; flr.position.y = -0.01;
    scene.add(flr);
    // Floor grid
    for (let i = -6; i <= 6; i++) {
      [true, false].forEach(h => {
        const l = mk(new THREE.BoxGeometry(h ? 12 : 0.01, 0.005, h ? 0.01 : 12),
          M({ color: 0x1E3255, roughness: 1 }));
        l.position.set(h ? 0 : i, 0.005, h ? i : 0);
        scene.add(l);
      });
    }
    // Teal glow ring
    const ring = mk(new THREE.RingGeometry(1.4, 2.6, 64),
      M({ color: 0x00D4AA, emissive: 0x00D4AA, emissiveIntensity: 0.1, side: THREE.DoubleSide, transparent: true, opacity: 0.22 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006; scene.add(ring);

    // ── 5-STAR BASE ─────────────────────────────────
    G.add(add(cyl(0.2, 0.2, 0.08, 32, darkChrome), 0, 0.04, 0));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const arm = box(1.3, 0.07, 0.16, plasticD);
      arm.position.set(Math.sin(a) * 0.72, 0.08, Math.cos(a) * 0.72);
      arm.rotation.y = a; G.add(arm);
      G.add(add(cyl(0.11, 0.13, 0.09, 16, rubberM), Math.sin(a) * 1.25, 0.08, Math.cos(a) * 1.25));
      const wh = cyl(0.09, 0.09, 0.14, 16, chrome);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(Math.sin(a) * 1.25, 0.04, Math.cos(a) * 1.25); G.add(wh);
    }

    // ── HYDRAULIC COLUMN ────────────────────────────
    G.add(add(cyl(0.21, 0.24, 1.5, 32, plasticD),  0, 0.95, 0));
    G.add(add(cyl(0.17, 0.20, 0.9, 32, chrome),    0, 1.85, 0));
    G.add(add(cyl(0.14, 0.17, 0.5, 32, darkChrome),0, 2.35, 0));
    [1.4, 1.55, 1.7].forEach(y => G.add(add(cyl(0.245, 0.245, 0.04, 32, chrome), 0, y, 0)));

    // ── SEAT ────────────────────────────────────────
    G.add(add(box(1.38, 0.14, 2.05, plasticD), 0, 2.52, 0));
    G.add(add(box(1.22, 0.16, 1.88, vinyl),    0, 2.64, 0));
    G.add(add(box(1.18, 0.04, 1.84, vinylDark),0, 2.725, -0.02));
    G.add(add(box(0.02, 0.05, 1.6,  vinylDark),0, 2.73, -0.05));

    // ── BACKREST ────────────────────────────────────
    const backG = new THREE.Group();
    backG.add(box(1.36, 2.05, 0.16, plasticD));
    backG.add(add(box(1.2, 1.9, 0.12, vinyl), 0, 0, 0.08));
    backG.add(add(box(1.14, 1.82, 0.04, vinylDark), 0, 0, 0.135));
    [-0.32, 0, 0.32].forEach(x => { const s = box(0.025, 1.65, 0.025, vinylDark); s.position.set(x, 0, 0.14); backG.add(s); });
    [-0.3, 0.3].forEach(y => { const s = box(1.0, 0.025, 0.025, vinylDark); s.position.set(0, y, 0.14); backG.add(s); });
    [-0.7, 0.7].forEach(x => { const led = box(0.04, 1.7, 0.03, tealLED); led.position.set(x, 0, -0.09); backG.add(led); });
    backG.position.set(0, 3.48, -0.94);
    backG.rotation.x = -0.18;
    G.add(backG);

    // ── HEADREST ────────────────────────────────────
    const hrG = new THREE.Group();
    hrG.add(box(0.86, 0.46, 0.18, plasticD));
    hrG.add(add(box(0.76, 0.38, 0.12, vinyl), 0, 0, 0.06));
    hrG.add(add(box(0.72, 0.34, 0.04, vinylDark), 0, 0, 0.11));
    hrG.position.set(0, 3.65, -0.96); hrG.rotation.x = -0.18; G.add(hrG);
    G.add(add(cyl(0.07, 0.07, 0.32, 12, chrome), 0, 3.49, -0.96));

    // ── ARMRESTS ────────────────────────────────────
    [-0.82, 0.82].forEach(x => {
      const ag = new THREE.Group();
      ag.add(box(0.2, 0.1, 1.15, plasticD));
      ag.add(add(box(0.16, 0.075, 1.05, vinyl), 0, 0.055, 0));
      const cap = mk(new THREE.SphereGeometry(0.09, 16, 8), vinyl);
      cap.position.set(0, 0.04, 0.52); ag.add(cap);
      ag.position.set(x, 2.84, 0.1); G.add(ag);
      G.add(add(cyl(0.055, 0.055, 0.3,  8, chrome), x, 2.69, -0.32));
      G.add(add(cyl(0.055, 0.055, 0.18, 8, chrome), x, 2.65, -0.75));
    });

    // ── FOOTREST ────────────────────────────────────
    const frG = new THREE.Group();
    frG.add(box(1.18, 0.12, 0.66, plasticD));
    frG.add(add(box(1.06, 0.08, 0.58, vinyl), 0, 0.075, 0));
    frG.position.set(0, 2.49, 1.06); G.add(frG);
    const frH = cyl(0.07, 0.07, 1.1, 12, chrome);
    frH.rotation.z = Math.PI / 2; frH.position.set(0, 2.49, 0.76); G.add(frH);

    // ── LAMP ARM ────────────────────────────────────
    G.add(add(cyl(0.065, 0.065, 4.0, 12, plasticD), 0.55, 3.8, -1.05));
    const arm1 = cyl(0.055, 0.055, 1.6, 10, chrome);
    arm1.rotation.z = Math.PI / 2; arm1.position.set(1.3, 5.75, -1.05); G.add(arm1);
    const arm2 = cyl(0.05, 0.05, 1.3, 10, chrome);
    arm2.rotation.z = Math.PI / 2.8; arm2.position.set(2.15, 5.2, -1.05); G.add(arm2);
    G.add(add(cyl(0.42, 0.34, 0.22, 32, bodyGrey), 2.85, 4.55, -1.05, 0.45));
    G.add(add(cyl(0.44, 0.44, 0.06, 32, chrome),   2.85, 4.64, -0.87, 0.45));
    const lens = mk(new THREE.CircleGeometry(0.33, 32), lampGlass);
    add(lens, 2.85, 4.48, -1.22, 0.45); G.add(lens);
    const spot = mk(new THREE.CircleGeometry(0.07, 16),
      M({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 }));
    add(spot, 2.85, 4.43, -1.25, 0.45); G.add(spot);
    [{ x: 0.55, y: 5.76, z: -1.05 }, { x: 2.05, y: 5.76, z: -1.05 }, { x: 2.7, y: 4.95, z: -1.05 }]
      .forEach(p => { const j = sph(0.09, chrome); j.position.set(p.x, p.y, p.z); G.add(j); });

    // ── INSTRUMENT UNIT ─────────────────────────────
    G.add(add(cyl(0.07, 0.07, 1.4, 12, plasticL), -0.82, 2.0, -0.32));
    G.add(add(box(0.7, 0.06, 0.38, bodyGrey), -1.58, 2.74, -0.22));
    G.add(add(box(0.66, 0.025, 0.34, chrome), -1.58, 2.78, -0.22));
    const rod = cyl(0.05, 0.05, 0.85, 8, chrome);
    rod.rotation.z = Math.PI / 2; rod.position.set(-1.24, 2.74, -0.22); G.add(rod);
    [-.24, -.12, 0, .12, .24].forEach((dx, i) => {
      const len = 0.2 + i * 0.02;
      const inst = cyl(0.025, 0.018, len, 8, i % 2 ? chrome : darkChrome);
      inst.position.set(-1.58 + dx, 2.82 + len / 2, -0.22); G.add(inst);
      const tip = mk(new THREE.ConeGeometry(0.02, 0.05, 8), chrome);
      tip.position.set(-1.58 + dx, 2.82 + len + 0.02, -0.22); G.add(tip);
    });

    // ── SPITTOON ────────────────────────────────────
    G.add(add(cyl(0.12, 0.12, 0.8, 16, chrome), 1.4, 0.5, 0.3));
    const spitArm = cyl(0.05, 0.05, 0.55, 12, chrome);
    spitArm.rotation.z = Math.PI / 2; spitArm.position.set(1.68, 0.96, 0.3); G.add(spitArm);
    const bowl = mk(new THREE.SphereGeometry(0.28, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2), bodyGrey);
    bowl.position.set(1.95, 0.96, 0.3); G.add(bowl);
    G.add(add(cyl(0.285, 0.285, 0.04, 32, chrome), 1.95, 0.98, 0.3));

    scene.add(G);

    // ── ANIMATE ─────────────────────────────────────
    let t = 0;
    const rotSpeed = 0.004;
    let raf;

    function animate() {
      raf = requestAnimationFrame(animate);
      t += 0.008;
      G.rotation.y += rotSpeed;
      lampPt.intensity  = 13 + Math.sin(t * 1.2) * 1.5;
      underGlow.intensity = 2.5 + Math.sin(t * 0.8) * 0.8;
      renderer.render(scene, camera);
    }

    // ── RESPONSIVE ──────────────────────────────────
    window.addEventListener('resize', () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      canvas.width = nW; canvas.height = nH;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });

    // ── PAUSE WHEN LOGIN SCREEN HIDDEN ──────────────
    const observer = new MutationObserver(() => {
      const hidden = loginScreen.style.display === 'none';
      if (hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!hidden && !raf) animate();
    });
    observer.observe(loginScreen, { attributes: true, attributeFilter: ['style'] });

    // Fade in after first render
    animate();
    requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  }

  // Wait for THREE.js to be available
  function waitForThree(attempts) {
    if (typeof THREE !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChair);
      } else {
        initChair();
      }
    } else if (attempts > 0) {
      setTimeout(() => waitForThree(attempts - 1), 200);
    } else {
      console.warn('chair3d.js: THREE.js not found. Make sure to include it before chair3d.js');
    }
  }
  waitForThree(25);

})();
