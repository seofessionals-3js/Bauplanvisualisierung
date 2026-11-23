/* Haus Eiche · Ablauf
   Planblatt, Kamerafahrt, Wischer je Raum, Oberfläche. Eigener Scroll-Ablauf, nur three.js. */
(function () {
  'use strict';
  var HE = window.HE;
  if (!HE || !HE.ok) {
    document.getElementById('nogl').style.display = 'grid';
    document.getElementById('loader').classList.add('off');
    return;
  }
  var T = HE.T, D = HE.D, U = HE.U, zones = HE.zones, renderer = HE.renderer, scene = HE.scene, camera = HE.camera;
  var F0 = D.F0, WT = D.WT, CUT0 = D.CUT0, SH = D.SH, CX = U.uSheetC.value.x, CZ = U.uSheetC.value.y;
  var $ = function (id) { return document.getElementById(id); };
  var c01 = function (x) { return Math.min(1, Math.max(0, x)); };
  var sstep = function (a, b, x) { var t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  var lin = function (a, b, x) { return c01((x - a) / (b - a)); };
  var rad = function (d) { return d * Math.PI / 180; };
  var dirty = true;

  HE.finish();
  scene.add(HE.sun, HE.sun.target);

  // ---------------------------------------------------------------- Planblatt
  var sheetSize = (!HE.small && renderer.capabilities.maxTextureSize >= 4096) ? 4096 : 2048;
  var sheetCanvas = document.createElement('canvas'); sheetCanvas.width = sheetCanvas.height = sheetSize;
  var sheetTex = new T.CanvasTexture(sheetCanvas);
  sheetTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); sheetTex.premultiplyAlpha = false;
  U.uSheet.value = sheetTex;
  function drawSheet() {
    var g = sheetCanvas.getContext('2d'), S = sheetSize / (2 * SH);
    var X = function (x) { return (x - CX + SH) * S; }, Z = function (z) { return (z - CZ + SH) * S; };
    var mono = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
    g.clearRect(0, 0, sheetSize, sheetSize);
    g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = 'butt';
    function text(s, x, z, h, o) {
      o = o || {};
      g.save(); g.translate(X(x), Z(z)); if (o.rot) g.rotate(o.rot);
      g.font = (o.w || 500) + ' ' + (h * S) + 'px ' + mono;
      g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.globalAlpha = o.a || 1;
      g.fillText(s, 0, 0); g.restore();
    }
    function line(x1, z1, x2, z2, w, dash, a) {
      g.save(); g.globalAlpha = a || 1; g.lineWidth = Math.max(1, (w || 0.02) * S);
      if (dash) g.setLineDash(dash.map(function (d) { return d * S; }));
      g.beginPath(); g.moveTo(X(x1), Z(z1)); g.lineTo(X(x2), Z(z2)); g.stroke(); g.restore();
    }
    function circle(x, z, r, w, dash, a, fill) {
      g.save(); g.globalAlpha = a || 1; g.lineWidth = Math.max(1, (w || 0.02) * S);
      if (dash) g.setLineDash(dash.map(function (d) { return d * S; }));
      g.beginPath(); g.arc(X(x), Z(z), r * S, 0, 7); if (fill) g.fill(); else g.stroke(); g.restore();
    }
    function arc(cx, cz, r, a0, a1, lx, lz) {
      g.save(); g.globalAlpha = 0.75; g.lineWidth = Math.max(1, 0.02 * S);
      g.beginPath(); g.arc(X(cx), Z(cz), r * S, a0, a1); g.stroke();
      g.beginPath(); g.moveTo(X(cx), Z(cz)); g.lineTo(X(lx), Z(lz)); g.stroke(); g.restore();
    }
    function tick(x, z) { line(x - 0.16, z + 0.16, x + 0.16, z - 0.16, 0.04); }
    var de = function (n) { return n.toFixed(2).replace('.', ','); };
    // Blattrahmen
    g.save(); g.lineWidth = Math.max(1, 0.04 * S); g.globalAlpha = 0.55; g.strokeRect(X(CX - SH + 0.6), Z(CZ - SH + 0.6), (2 * SH - 1.2) * S, (2 * SH - 1.2) * S); g.restore();
    // Achsen mit Blasen
    var ax = HE.axesX, az = HE.axesZ, i;
    for (i = 0; i < ax.length; i++) {
      line(ax[i], -15.6, ax[i], 15.6, 0.012, [0.5, 0.12, 0.08, 0.12], 0.42);
      circle(ax[i], -16.25, 0.55, 0.025); text(String.fromCharCode(65 + i), ax[i], -16.22, 0.52);
    }
    for (i = 0; i < az.length; i++) {
      line(-17.2, az[i], 18.4, az[i], 0.012, [0.5, 0.12, 0.08, 0.12], 0.42);
      circle(-17.85, az[i], 0.55, 0.025); text(String(i + 1), -17.85, az[i] + 0.03, 0.52);
    }
    // Maßketten auf Achse
    line(ax[0] - 0.3, -13.6, ax[ax.length - 1] + 0.3, -13.6, 0.02); line(ax[0] - 0.3, -14.7, ax[ax.length - 1] + 0.3, -14.7, 0.02);
    for (i = 0; i < ax.length; i++) { tick(ax[i], -13.6); if (i < ax.length - 1) text(de(ax[i + 1] - ax[i]), (ax[i] + ax[i + 1]) / 2, -14.03, 0.48); }
    tick(ax[0], -14.7); tick(ax[ax.length - 1], -14.7); text(de(ax[ax.length - 1] - ax[0]), (ax[0] + ax[ax.length - 1]) / 2, -15.13, 0.48);
    line(-15.3, az[0] - 0.3, -15.3, az[az.length - 1] + 0.3, 0.02); line(-16.4, az[0] - 0.3, -16.4, az[az.length - 1] + 0.3, 0.02);
    for (i = 0; i < az.length; i++) { tick(-15.3, az[i]); if (i < az.length - 1) text(de(az[i + 1] - az[i]), -15.73, (az[i] + az[i + 1]) / 2, 0.48, { rot: -Math.PI / 2 }); }
    tick(-16.4, az[0]); tick(-16.4, az[az.length - 1]); text(de(az[az.length - 1] - az[0]), -16.83, (az[0] + az[az.length - 1]) / 2, 0.48, { rot: -Math.PI / 2 });
    // Raumnamen
    HE.rooms.forEach(function (r) {
      var h = r.small ? 0.36 : 0.56, o = r.rot ? { rot: -Math.PI / 2 } : {};
      if (r.rot) {
        text(r.name, r.label[0] - 0.3, r.label[1], h, o); text(r.area + (r.dim ? '  ' + r.dim : ''), r.label[0] + 0.32, r.label[1], h * 0.62, { rot: -Math.PI / 2, a: 0.8, w: 400 });
      } else {
        text(r.name, r.label[0], r.label[1], h); text(r.area + (r.dim ? '   ' + r.dim : ''), r.label[0], r.label[1] + h * 1.25, h * 0.62, { a: 0.8, w: 400 });
      }
    });
    text('HOF', 3.6, -3.85, 0.56); text('100 m²   10,00 × 10,00', 3.6, -3.15, 0.34, { a: 0.8, w: 400 });
    text('BECKEN', 1.0, 3.98, 0.26, { a: 0.8 });
    text('EICHE, CA. 1890', 1.0, 2.75, 0.24, { a: 0.75, w: 400 });
    circle(1, 0, 4.3, 0.02, [0.3, 0.2], 0.5); line(0.6, 0, 1.4, 0, 0.016, null, 0.6); line(1, -0.4, 1, 0.4, 0.016, null, 0.6);
    text('TERRASSE', 13.4, 14.6, 0.5, { a: 0.9 }); text('50 m²', 13.4, 15.25, 0.32, { a: 0.75, w: 400 });
    text('EINGANG', -6.5, 12.7, 0.44, { a: 0.9 });
    line(-6.5, 12.2, -6.5, 10.9, 0.025); g.beginPath(); g.moveTo(X(-6.5), Z(10.5)); g.lineTo(X(-6.75), Z(11.0)); g.lineTo(X(-6.25), Z(11.0)); g.closePath(); g.fill();
    // Sitzgrube, Oberlichter
    var P = HE.PIT;
    g.save(); g.globalAlpha = 0.6; g.lineWidth = Math.max(1, 0.016 * S); g.setLineDash([0.2 * S, 0.14 * S]);
    HE.SKY.forEach(function (s) { g.strokeRect(X(s[0]), Z(-8.7), (s[1] - s[0]) * S, 1.2 * S); });
    g.restore();
    text('−0,40', P[0] + 0.62, P[3] - 1.5, 0.22, { a: 0.75, w: 400, rot: -Math.PI / 2 });
    // Türaufschläge
    arc(-6.9, 8.0, 1.2, -Math.PI / 2, 0, -6.9, 6.8);
    arc(-9.0, 5.6, 0.9, Math.PI / 2, Math.PI, -9.9, 5.6);
    arc(1.0, -7.6, 1.0, 0, Math.PI / 2, 2.0, -7.6);
    // Bäume im Garten
    [[-19, -2, 3.2], [22, -9, 2.9], [-17, 17, 2.6]].forEach(function (t) { if (Math.abs(t[0] - CX) < SH - 1) { circle(t[0], t[1], t[2], 0.018, [0.3, 0.2], 0.45); } });
    [[3.2, 19.8], [1.2, 20.6], [5.2, 20.9]].forEach(function (t) { circle(t[0], t[1], 0.95, 0.018, [0.3, 0.2], 0.45); });
    // Nordpfeil, Maßstab, Titel
    circle(19.2, -16.0, 0.9, 0.025);
    g.beginPath(); g.moveTo(X(19.2), Z(-16.9)); g.lineTo(X(18.9), Z(-15.5)); g.lineTo(X(19.2), Z(-15.75)); g.lineTo(X(19.5), Z(-15.5)); g.closePath(); g.fill();
    text('N', 19.2, -17.35, 0.36);
    text('GRUNDRISS ERDGESCHOSS', 12.0, -18.3, 0.52, { align: 'left' });
    text('HAUS EICHE · SCHWERTE · M 1:100', 12.0, -17.55, 0.3, { align: 'left', a: 0.8, w: 400 });
    var bx = -15.0, bz = 17.0;
    for (i = 0; i < 4; i++) { g.save(); g.globalAlpha = 0.85; if (i % 2 === 0) g.fillRect(X(bx + i * 2.5), Z(bz), 2.5 * S, 0.16 * S); else g.strokeRect(X(bx + i * 2.5), Z(bz), 2.5 * S, 0.16 * S); g.restore(); }
    text('0', bx, bz + 0.6, 0.28, { w: 400 }); text('5', bx + 5, bz + 0.6, 0.28, { w: 400 }); text('10 m', bx + 10, bz + 0.6, 0.28, { w: 400 });
    sheetTex.needsUpdate = true; dirty = true;
  }
  drawSheet();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('500 20px "IBM Plex Mono"'), document.fonts.load('400 20px "IBM Plex Mono"')]).then(drawSheet, function () {});
  }
  var annU = { uSheet: U.uSheet, uInk: U.uInk, uOpacity: { value: 1 }, uRoll: U.uRoll, uEnd: { value: 0 } };
  var annGeo = new T.PlaneGeometry(2 * SH, 2 * SH); annGeo.rotateX(-Math.PI / 2);
  var ann = new T.Mesh(annGeo, new T.ShaderMaterial({
    uniforms: annU, transparent: true, depthTest: false, depthWrite: false, fog: false,
    vertexShader: 'varying vec2 vUv; varying float vX; void main(){ vUv = uv; vX = (modelMatrix * vec4(position, 1.0)).x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D uSheet; uniform vec3 uInk; uniform float uOpacity; uniform float uRoll; uniform float uEnd; varying vec2 vUv; varying float vX; void main(){ float a = texture2D(uSheet, vUv).a * max(uOpacity, uEnd * (1.0 - step(uRoll, vX))); if (a < 0.004) discard; gl_FragColor = vec4(uInk, a); }'
  }));
  ann.position.set(CX, CUT0 + 0.03, CZ); ann.renderOrder = 20; ann.frustumCulled = false;
  scene.add(ann);

  // ---------------------------------------------------------------- Kamera
  var EY = F0 + 1.6;
  var KEYS = [];
  function O(p, tgt, azDeg, polDeg, span, fov, o) {
    var k = { p: p, tgt: tgt, az: rad(azDeg), pol: rad(polDeg), span: span, spanH: (o && o.spanH) || span * 0.9, fov: fov };
    if (o) { k.sx = o.sx; k.sz = o.sz; k.lz = o.lz; }
    KEYS.push(k);
  }
  function E(p, eye, look, fov) {
    var lx = look[0] - eye[0], ly = look[1] - eye[1], lz = look[2] - eye[2], l = Math.sqrt(lx * lx + ly * ly + lz * lz), d = 0.5;
    lx /= l; ly /= l; lz /= l;
    KEYS.push({ p: p, tgt: [eye[0] + lx * d, eye[1] + ly * d, eye[2] + lz * d], az: Math.atan2(-lx, -lz), pol: Math.acos(-ly), d: d, fov: fov });
  }
  var HERO = { sx: -13, sz: -1.5, lz: -3.4, spanH: 33 };
  O(0.000, [1.2, 0, 1.0], 0, 0.07, 40, 5, HERO);
  O(0.045, [1.2, 0, 1.0], 0, 0.07, 40, 5, HERO);
  O(0.105, [0.5, 1.2, 0.5], 30, 50, 33, 26, { spanH: 31 });
  O(0.150, [-3, 1.6, 3], 16, 60, 25, 30, { spanH: 26 });
  O(0.180, [-6.2, 1.9, 6.5], 5, 79, 15, 36);
  E(0.208, [-6.6, 1.75, 17.0], [-6.9, 2.1, 8], 38);
  E(0.240, [-6.4, 1.72, 15.2], [-6.5, 2.0, 8], 42);
  E(0.266, [-6.25, 1.75, 13.0], [-6.25, 2.0, 8], 46);
  E(0.284, [-6.2, 1.9, 10.4], [-6.2, 2.0, 6], 50);
  E(0.298, [-6.15, EY, 8.3], [-6.2, 1.95, 3], 52);
  E(0.315, [-6.3, EY, 6.7], [-6.4, 1.85, 0], 56);
  E(0.338, [-6.4, EY, 6.1], [-6.5, 1.8, 0], 56);
  O(0.362, [-8.2, 0.45, -0.6], 22, 40, 18, 32);
  O(0.385, [-8.5, 0.45, -1.0], 0, 0.07, 13.5, 12, { spanH: 12.5 });
  O(0.407, [-8.4, 0.9, -1.0], 30, 36, 11.5, 34);
  E(0.432, [-5.5, EY, 2.1], [-9.6, 1.0, -1.6], 58);
  E(0.470, [-5.9, EY, 0.4], [-10.0, 1.1, -2.2], 58);
  E(0.500, [-5.3, EY, -3.9], [-6.6, 1.7, -8.4], 58);
  E(0.528, [-6.0, EY, -6.0], [-1.0, 1.5, -8.2], 60);
  E(0.560, [-4.7, EY, -6.7], [-2.0, 1.6, -4.0], 60);
  E(0.588, [-2.4, EY, -4.5], [0.7, 2.7, -0.3], 58);
  E(0.615, [-1.9, EY, -2.7], [1.0, 3.6, 0.0], 60);
  E(0.645, [2.4, EY, -3.5], [5.6, 1.8, -0.5], 58);
  E(0.668, [5.0, EY, -0.4], [7.6, 1.8, 2.6], 58);
  E(0.695, [7.3, EY, -0.2], [7.6, 1.8, 5.0], 58);
  E(0.725, [7.5, EY, 3.8], [7.9, 1.8, 9.0], 58);
  E(0.752, [7.7, EY, 8.5], [11.3, 1.3, 10.0], 60);
  E(0.772, [8.7, EY, 11.7], [11.6, 1.4, 9.4], 58);
  E(0.790, [12.5, EY, 11.7], [13.9, 1.4, 6.2], 58);
  E(0.812, [10.4, EY, 12.3], [10.0, 1.7, 16.5], 58);
  E(0.840, [10.7, EY, 14.3], [8.0, 1.3, 16.6], 58);
  E(0.878, [11.9, EY + 0.05, 14.6], [7.4, 1.2, 17.0], 56);
  O(0.915, [1.2, 0.5, 1.0], 62, 34, 44, 24, { spanH: 38 });
  O(0.940, [1.2, 0, 1.0], 0, 0.07, 40, 5, HERO);
  O(1.000, [1.2, 0, 1.0], 0, 0.07, 40, 5, HERO);
  (function unwrap() {
    for (var i = 1; i < KEYS.length; i++) {
      var a = KEYS[i].az, prev = KEYS[i - 1].az;
      while (a - prev > Math.PI) a -= 2 * Math.PI;
      while (a - prev < -Math.PI) a += 2 * Math.PI;
      KEYS[i].az = a;
    }
    // am Ende wieder genau Nord oben
    var last = KEYS[KEYS.length - 1].az, off = Math.round(last / (2 * Math.PI)) * 2 * Math.PI;
    KEYS[KEYS.length - 1].az = off; KEYS[KEYS.length - 2].az = off;
  })();
  var camCache = null, camAspect = 0;
  function buildCam(aspect) {
    var cols = { x: [], y: [], z: [], az: [], pol: [], ls: [], fov: [] };
    KEYS.forEach(function (k) {
      var fov = k.fov, span;
      if (k.d !== undefined) {
        if (aspect < 1.3) fov = Math.min(84, 2 * Math.atan(Math.tan(rad(k.fov) / 2) * Math.min(1.3 / aspect, 2.2)) * 180 / Math.PI);
        span = 2 * k.d * Math.tan(rad(fov) / 2);
      } else span = Math.max(k.span, k.spanH / aspect);
      var land = c01((aspect - 1.15) / 0.5);
      var lx = k.sx ? k.sx * land : 0, pz = (k.sz ? k.sz * c01((0.95 - aspect) / 0.35) : 0) + (k.lz ? k.lz * land : 0);
      cols.x.push(k.tgt[0] + lx); cols.y.push(k.tgt[1]); cols.z.push(k.tgt[2] + pz);
      cols.az.push(k.az); cols.pol.push(k.pol); cols.ls.push(Math.log(span)); cols.fov.push(fov);
    });
    var ps = KEYS.map(function (k) { return k.p; }), out = { ps: ps, v: cols, m: {} };
    Object.keys(cols).forEach(function (name) {
      var v = cols[name], n = v.length, d = [], m = [], i;
      for (i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / (ps[i + 1] - ps[i]));
      for (i = 0; i < n; i++) {
        if (i === 0) m.push(d[0]); else if (i === n - 1) m.push(d[n - 2]);
        else if (d[i - 1] * d[i] <= 0) m.push(0);
        else { var mm = (d[i - 1] + d[i]) / 2, lim = 3 * Math.min(Math.abs(d[i - 1]), Math.abs(d[i])); m.push(Math.sign(mm) * Math.min(Math.abs(mm), lim)); }
      }
      out.m[name] = m;
    });
    return out;
  }
  function herm(c, name, p) {
    var ps = c.ps, v = c.v[name], m = c.m[name], i = 0;
    if (p <= ps[0]) return v[0];
    if (p >= ps[ps.length - 1]) return v[v.length - 1];
    while (p > ps[i + 1]) i++;
    var h = ps[i + 1] - ps[i], t = (p - ps[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * v[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * v[i + 1] + (t3 - t2) * h * m[i + 1];
  }
  var tgtV = new T.Vector3(), camState = { d: 300, span: 38, x: 0, z: 0, az: 0 };
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  var vR = new T.Vector3(), vU = new T.Vector3();
  function setCamera(p) {
    var aspect = camera.aspect;
    if (!camCache || Math.abs(aspect - camAspect) > 1e-4) { camCache = buildCam(aspect); camAspect = aspect; }
    var c = camCache;
    var fov = herm(c, 'fov', p), span = Math.exp(herm(c, 'ls', p));
    var az = herm(c, 'az', p), pol = Math.max(0.0012, herm(c, 'pol', p));
    var d = span / (2 * Math.tan(rad(fov) / 2));
    tgtV.set(herm(c, 'x', p), herm(c, 'y', p), herm(c, 'z', p));
    camera.position.set(tgtV.x + d * Math.sin(pol) * Math.sin(az), tgtV.y + d * Math.cos(pol), tgtV.z + d * Math.sin(pol) * Math.cos(az));
    camera.fov = fov;
    camera.near = Math.min(60, Math.max(0.06, (d - 30) * 0.25));
    camera.far = 6000;
    camera.up.set(0, 1, 0);
    camera.lookAt(tgtV);
    if (d < 20) { // leichte Parallaxe mit dem Zeiger
      var k = c01((20 - d) / 15) * 0.05;
      camera.rotateY(-par.x * k); camera.rotateX(-par.y * k * 0.6);
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    camState.d = d; camState.span = span; camState.x = camera.position.x; camState.z = camera.position.z; camState.az = az; camState.tx = tgtV.x;
  }

  // ---------------------------------------------------------------- Stationen
  var ROOMS = [
    { id: 'ein', kind: 'Raum 01', title: ['Der', 'Eingang'], meta: ['5,00 × 5,00 m', '25 m²', 'Decke 3,20'], from: 0.303, to: 0.342, anchor: [-5.2, 2.75, 3.3],
      time: '16:50 Uhr · Sonne von Südwest', text: 'Die Tür ist ein einziges Blatt aus Eiche, 1,60 m breit und raumhoch. Sie dreht auf einem Zapfen und lässt sich mit einem Finger bewegen. Dahinter liegt die Achse des Hauses: Wohnen, Küche und ganz hinten das Fenster nach Norden.',
      facts: [['Boden', 'Travertin geschliffen, 120 × 60'], ['Tür', 'Eiche, Drehzapfen, 1,60 × 3,00 m'], ['Wand', 'Kalkputz, gefilzt']] },
    { id: 'woh', kind: 'Raum 02', title: ['Das', 'Wohnzimmer'], meta: ['9,00 × 8,00 m', '72 m²', 'Sitzgrube −0,40'], from: 0.436, to: 0.482, anchor: [-10.6, 2.9, -4.4],
      time: '17:05 Uhr · Feuer an', text: 'In diesen Raum steigt man hinab. Die Sitzgrube liegt 40 cm unter dem Eichenboden, der Kamin ist ein Block aus brettgeschaltem Beton, und die Glaswand holt den Hof mit seinem Baum ins Zimmer.',
      facts: [['Boden', 'Eiche geölt, Dielen 165 mm'], ['Kamin', 'Sichtbeton, Brettschalung'], ['Glas', 'raumhoch, 7,00 m zum Hof']] },
    { id: 'kue', kind: 'Raum 03', title: ['Kochen', 'und Essen'], meta: ['14,00 × 6,00 m', '84 m²', 'Tafel für zehn'], from: 0.528, to: 0.566, anchor: [-3.6, 2.9, -10.3],
      time: '17:20 Uhr · Licht von oben', text: 'Ein Raum zum Kochen und für lange Abende am Tisch. Vier Meter Kochinsel aus Travertin, eine Eichentafel für zehn und drei Oberlichter, durch die am Nachmittag die Sonne auf die Wand fällt.',
      facts: [['Insel', 'Travertin, 4,00 × 1,00 m'], ['Tafel', 'Eiche massiv, 4,60 m'], ['Oberlichter', '3 Stück, 1,00 × 1,20 m']] },
    { id: 'hof', kind: 'Hof 04', title: ['Der Hof', 'mit der Eiche'], meta: ['10,00 × 10,00 m', 'Eiche von ca. 1890'], from: 0.602, to: 0.645, anchor: [3.4, 3.6, 2.2],
      time: '17:35 Uhr · Schatten der Krone', text: 'Zuerst stand auf dem Grundstück nur der Baum. Jede Wand hält Abstand zu seiner Krone, und alle großen Räume schauen auf ihn. Im Becken an der Südmauer liegt abends sein Spiegelbild.',
      facts: [['Baum', 'Stieleiche, ca. 1890'], ['Becken', '8,40 × 1,30 m, 30 cm tief'], ['Belag', 'Travertinplatten 90 × 60']] },
    { id: 'gal', kind: 'Raum 05', title: ['Die', 'Galerie'], meta: ['3,00 × 13,00 m', '39 m²'], from: 0.688, to: 0.728, anchor: [8.75, 2.95, 2.0],
      time: '17:50 Uhr · Pfostenschatten', text: 'Der Weg zum Schlafen führt am Baum entlang. Links zehn Meter Glas zum Hof, rechts eine geschlossene Wand für drei Bilder und eine Bank.',
      facts: [['Glas', '9,20 m, Profile in Bronze'], ['Wand', 'Kalkputz, Bilderschiene'], ['Boden', 'Travertin geschliffen']] },
    { id: 'sch', kind: 'Raum 06', title: ['Das', 'Schlafzimmer'], meta: ['9,50 × 5,00 m', '47 m²', 'mit Ankleide und Bad'], from: 0.75, to: 0.796, anchor: [12.2, 2.95, 8.3],
      time: '18:05 Uhr · Leuchten an', text: 'Hinter dem Bett eine Wand aus geflämmter Lärche, vor dem Bett der Garten. Durch die Ankleide geht es ins Bad, dessen Wanne frei unter dem Fenster steht.',
      facts: [['Wand', 'Lärche geflämmt'], ['Bad', 'Wanne freistehend, Travertin'], ['Ankleide', 'Durchgang, Eiche']] },
    { id: 'gar', kind: 'Garten 07', title: ['Die', 'Terrasse'], meta: ['11,00 × 4,60 m', 'Blick ins Ruhrtal'], from: 0.838, to: 0.886, anchor: [5.4, 2.7, 19.0],
      time: '18:20 Uhr · Sonnenuntergang', text: 'Der Rundgang endet draußen. Eine Feuerschale, drei Sessel, dahinter fällt das Grundstück zum Tal ab. Im Sommer geht die Sonne hinter dem Hang rechts unter.',
      facts: [['Feuerschale', 'Stahl, 1,20 m'], ['Belag', 'Travertinplatten 90 × 60'], ['Ausrichtung', 'Südwest, zum See']] }
  ];
  // Wischer: [Zone, von, bis, Radius, Exponent]
  var SWEEP = [['ext', 0.215, 0.27, 640, 2.4], ['ein', 0.278, 0.314, 10, 1.2], ['woh', 0.405, 0.447, 14, 1.2], ['kue', 0.482, 0.527, 18, 1.2], ['hof', 0.563, 0.61, 17, 1.2],
    ['gal', 0.642, 0.688, 17, 1.2], ['sch', 0.712, 0.758, 13, 1.2], ['bad', 0.77, 0.806, 9, 1.2], ['gar', 0.802, 0.845, 60, 1.6], ['rest', 0.86, 0.905, 34, 1.2]];
  var zoneT = {}, lastShadowP = -1;
  HE.sun.shadow.autoUpdate = false; HE.sun.shadow.needsUpdate = true;

  // ---------------------------------------------------------------- Oberfläche
  var tagsEl = $('tags'), tagEls = [];
  ROOMS.forEach(function (r, i) {
    var el = document.createElement('div'); el.className = 'tag';
    el.innerHTML = '<div class="tag__in"><button class="tag__mark" type="button" aria-label="Akte ' + r.title.join(' ') + ' öffnen"></button><div class="tag__body"><span class="tag__no">' + r.kind +
      '</span><h2 class="tag__title">' + r.title.join('<br>') + '</h2><button class="tag__meta" type="button">' + r.meta.join(' <b>·</b> ') + ' <b>·</b> Akte öffnen +</button></div></div>';
    tagsEl.appendChild(el); tagEls.push(el);
    var open = function () { openFile(i); };
    el.querySelector('.tag__mark').addEventListener('click', open);
    el.querySelector('.tag__meta').addEventListener('click', open);
  });
  var fileEl = $('file');
  function openFile(i) {
    var r = ROOMS[i];
    $('fileNo').textContent = r.kind; $('fileTitle').textContent = r.title.join(' '); $('fileTime').textContent = r.time; $('fileText').textContent = r.text;
    var ul = $('fileFacts'); ul.innerHTML = '';
    r.facts.forEach(function (f) { var li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('b'); s.textContent = f[0]; b.textContent = f[1]; li.appendChild(s); li.appendChild(b); ul.appendChild(li); });
    fileEl.classList.add('on'); fileEl.setAttribute('aria-hidden', 'false'); $('fileClose').focus();
  }
  function closeFile() { fileEl.classList.remove('on'); fileEl.setAttribute('aria-hidden', 'true'); }
  $('fileClose').addEventListener('click', closeFile);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeFile(); });

  // Lineal
  var ruler = $('ruler'), rulerNow = $('rulerNow');
  (function () {
    for (var i = 0; i <= 40; i++) { var t = document.createElement('i'); t.style.top = (i * 2.5) + '%'; ruler.appendChild(t); }
    ROOMS.forEach(function (r, i) { var t = document.createElement('i'); t.className = 'big'; t.style.top = (r.from * 100) + '%'; t.setAttribute('data-no', '0' + (i + 1)); ruler.appendChild(t); });
  })();
  // kleiner Lageplan
  var radarC = $('radarC'), rg = radarC.getContext('2d'), radarBase = document.createElement('canvas');
  radarBase.width = radarC.width; radarBase.height = radarC.height;
  var RB = { x0: -14.5, z0: -12.5, s: 0 };
  RB.s = Math.min(radarC.width / 31.5, radarC.height / 27);
  var RX = function (x) { return (x - RB.x0) * RB.s; }, RZ = function (z) { return (z - RB.z0) * RB.s; };
  (function () {
    var g = radarBase.getContext('2d');
    g.fillStyle = 'rgba(15,39,72,0.6)'; g.fillRect(0, 0, radarBase.width, radarBase.height);
    g.fillStyle = 'rgba(214,230,255,0.9)';
    HE.walls.forEach(function (w) {
      var segs = [], u = w.a;
      w.ops.slice().sort(function (p, q) { return p.a - q.a; }).forEach(function (o) { if (o.sill > 0) return; segs.push([u, o.a]); u = o.b; });
      segs.push([u, w.b]);
      segs.forEach(function (s) {
        if (w.axis === 'x') g.fillRect(RX(s[0]), RZ(w.c - w.t / 2), (s[1] - s[0]) * RB.s, Math.max(1.5, w.t * RB.s));
        else g.fillRect(RX(w.c - w.t / 2), RZ(s[0]), Math.max(1.5, w.t * RB.s), (s[1] - s[0]) * RB.s);
      });
    });
    g.strokeStyle = 'rgba(214,230,255,0.5)'; g.lineWidth = 1.5; g.setLineDash([4, 4]);
    g.beginPath(); g.arc(RX(1), RZ(0), 4.2 * RB.s, 0, 7); g.stroke();
  })();
  function drawRadar(room) {
    rg.clearRect(0, 0, radarC.width, radarC.height);
    rg.drawImage(radarBase, 0, 0);
    if (room) {
      var rm = null; HE.rooms.forEach(function (r) { if (r.id === room) rm = r; });
      rg.fillStyle = 'rgba(255,180,84,0.28)';
      if (rm) rg.fillRect(RX(rm.r[0]), RZ(rm.r[1]), (rm.r[2] - rm.r[0]) * RB.s, (rm.r[3] - rm.r[1]) * RB.s);
      else if (room === 'hof') rg.fillRect(RX(-4), RZ(-5), 10 * RB.s, 10 * RB.s);
    }
    var x = RX(c01((camState.x - RB.x0) / 31.5) * 31.5 + RB.x0), z = RZ(c01((camState.z - RB.z0) / 27) * 27 + RB.z0);
    var a = camState.az; // Blickrichtung = -dir
    rg.fillStyle = 'rgba(255,180,84,0.35)';
    rg.beginPath(); rg.moveTo(x, z);
    rg.arc(x, z, 46, Math.atan2(-Math.cos(a), -Math.sin(a)) - 0.5, Math.atan2(-Math.cos(a), -Math.sin(a)) + 0.5); rg.closePath(); rg.fill();
    rg.fillStyle = '#ffb454'; rg.beginPath(); rg.arc(x, z, 6, 0, 7); rg.fill();
  }

  var heroEl = $('hero'), finaleEl = $('finale'), beatEl = $('beat'), countEl = $('count').querySelector('b'), hintText = $('hintText'), hintFill = $('hintFill'), hintEl = $('hint');
  var radarEl = $('radar'), radarP = $('radarP'), rollEl = $('roll');
  var BEATS = [[0.352, 0.392, 'Jeder Raum war zuerst<br>ein Rechteck.'], [0.902, 0.936, 'Derselbe Plan.<br>Jetzt mit Wänden.']];
  var ui = { hint: '', count: -1, beat: -1, room: '?' };
  var v3 = new T.Vector3();
  var envA = null, envB = null, envState = '';
  var sunA = new T.Vector3(-0.56, 0.44, 0.70).normalize(), sunB = new T.Vector3(-0.88, 0.10, 0.46).normalize(), sunV = new T.Vector3();
  var colA = new T.Color(0xfff0d8), colB = new T.Color(0xffa860), fogA = new T.Color(0xd9d3c6), fogB = new T.Color(0xe7b48a), hemA = new T.Color(0xcfe0ff), hemB = new T.Color(0xf0c8a8);

  function apply(p, time) {
    // Schnitthöhe und Dach
    var rise = sstep(0.05, 0.125, p), sink = sstep(0.94, 0.955, p);
    var roofOn = Math.max(sstep(0.185, 0.2, p) * (1 - sstep(0.338, 0.35, p)), sstep(0.418, 0.43, p) * (1 - sstep(0.884, 0.9, p)));
    var cut = CUT0 + (WT - CUT0) * rise * (1 - sink) + 0.8 * roofOn;
    U.uCut.value = cut;
    var grow = sstep(0.125, 0.16, p) * (1 - sstep(0.925, 0.94, p));
    U.uCutFree.value = (grow >= 1) ? 1000 : Math.min(cut, WT) + (16 - WT) * grow;
    HE.roofMeshes.forEach(function (m) { m.visible = roofOn > 0.001; m.castShadow = roofOn > 0.5; });
    // Beschriftung
    var annO = 1 - sstep(0.05, 0.1, p), end = sstep(0.952, 0.958, p);
    annU.uOpacity.value = annO; annU.uEnd.value = end; ann.visible = annO > 0.003 || end > 0.003;
    U.uFloorAnn.value = (1 - annO) * (1 - end);
    // Wischer je Zone
    SWEEP.forEach(function (s) {
      var t = lin(s[1], s[2], p), z = zones[s[0]];
      zoneT[s[0]] = t;
      if (t >= 1) { z.uZR.value = 1e4; z.uZW.value = 1.5; }
      else { var r = s[3] * Math.pow(t, s[4]); z.uZR.value = r; z.uZW.value = s[0] === 'ext' ? 1.6 + r * 0.14 : 1.0 + r * 0.08; }
    });
    HE.skyU.uAmt.value = sstep(0.1, 0.8, zoneT.ext);
    // Planrolle zurück
    var rollT = lin(0.957, 0.981, p);
    var viewW = camState.span * camera.aspect;
    if (rollT > 0 && p > 0.95) {
      U.uRoll.value = camState.tx - viewW / 2 + viewW * 1.04 * rollT - 0.01 * viewW;
      rollEl.style.opacity = (rollT < 1) ? '1' : '0';
      rollEl.style.transform = 'translate3d(' + ((rollT * 1.04 - 0.01) * 100) + 'vw,0,0) translateX(-50%)';
    } else { U.uRoll.value = -1e6; if (!introRunning) rollEl.style.opacity = '0'; }
    // Tageszeit
    var dusk = sstep(0.3, 0.86, p) * (1 - 0.55 * sstep(0.885, 0.93, p));
    U.uDusk.value = Math.pow(dusk, 1.4);
    sunV.copy(sunA).lerp(sunB, dusk).normalize();
    HE.sun.position.copy(sunV).multiplyScalar(140).add(HE.sun.target.position);
    if (Math.abs(p - lastShadowP) > 0.0002) { lastShadowP = p; HE.sun.shadow.needsUpdate = true; }
    HE.sun.color.copy(colA).lerp(colB, dusk); HE.sun.intensity = 3.5 - 0.9 * dusk;
    HE.skyU.uSun.value.copy(sunV);
    HE.hemi.intensity = 0.95 - 0.38 * dusk; HE.hemi.color.copy(hemA).lerp(hemB, dusk);
    HE.fill.intensity = 0.5 - 0.3 * dusk;
    scene.fog.color.copy(fogA).lerp(fogB, dusk);
    var wantEnv = dusk > 0.5 ? 'b' : 'a';
    if (wantEnv !== envState && envA) { envState = wantEnv; scene.environment = wantEnv === 'b' ? envB : envA; }
    // Tür, Leuchten, Feuer
    HE.doorPivot.rotation.y = sstep(0.248, 0.29, p) * 1.36;
    var off = 1 - sstep(0.93, 0.95, p);
    HE.lamps.forEach(function (L) {
      var f = L.flicker ? 0.8 + 0.2 * Math.sin(time * 9.0) * Math.sin(time * 13.7 + 1.3) : 1;
      L.l.intensity = L.power * sstep(0.2, 1, zoneT[L.zone] || 0) * (0.4 + 0.6 * dusk) * f * off;
    });
    HE.flames.forEach(function (f) { f.u.uOn.value = sstep(0.4, 1, zoneT[f.zone] || 0) * off; });
    U.uTime.value = time;

    setCamera(p);

    // --- Oberfläche
    var onHero = p < 0.03, onFin = p > 0.984;
    heroEl.style.opacity = onHero ? '1' : String(c01(1 - (p - 0.03) / 0.035));
    heroEl.style.visibility = p < 0.07 ? 'visible' : 'hidden';
    finaleEl.classList.toggle('on', onFin);
    var count = 0, cur = -1, next = 1;
    ROOMS.forEach(function (r, i) {
      if (p >= r.from - 0.012) count = i + 1;
      var on = p >= r.from && p <= r.to;
      if (on) cur = i;
      var el = tagEls[i];
      if (on !== el.classList.contains('on')) el.classList.toggle('on', on);
      if (on) {
        v3.set(r.anchor[0], r.anchor[1], r.anchor[2]).project(camera);
        var w = canvasW, h = canvasH, x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h;
        if (v3.z > 1) { x = w * 0.5; y = h * 0.3; }
        var flip = x > w * 0.56, bw = el.offsetWidth || 320, bh = el.offsetHeight || 120;
        if (w < 760) { flip = false; x = 14; y = 118; }
        else {
          x = Math.min(w - 70 - (flip ? 0 : bw), Math.max(flip ? bw + 20 : 24, x));
          y = Math.min(h - bh - 90, Math.max(96, y));
        }
        el.classList.toggle('flip', flip);
        el.style.transform = 'translate3d(' + Math.round(flip ? x - bw : x) + 'px,' + Math.round(y) + 'px,0)';
      }
    });
    if (count !== ui.count) { ui.count = count; countEl.textContent = '0' + count; }
    var ht = p < 0.045 ? 'Scrollen und eintreten' : (cur >= 0 ? 'Marker anklicken und die Akte öffnen' : (p < 0.3 ? 'Weiter zur Haustür' : (p > 0.886 ? 'Weiter, zurück zum Plan' : 'Weiter zum nächsten Raum')));
    if (ht !== ui.hint) { ui.hint = ht; hintText.textContent = ht; }
    hintEl.style.opacity = (p > 0.955) ? '0' : '';
    var a = 0, b = 1, i;
    for (i = 0; i < ROOMS.length; i++) { if (p < ROOMS[i].from) { b = ROOMS[i].from; break; } a = ROOMS[i].from; b = i + 1 < ROOMS.length ? ROOMS[i + 1].from : 0.955; }
    hintFill.style.width = (c01((p - a) / Math.max(1e-4, b - a)) * 100) + '%';
    rulerNow.style.top = (p * 100) + '%';
    var bi = -1; BEATS.forEach(function (bt, k) { if (p >= bt[0] && p <= bt[1]) bi = k; });
    if (bi !== ui.beat) { ui.beat = bi; if (bi >= 0) beatEl.innerHTML = BEATS[bi][2]; beatEl.classList.toggle('on', bi >= 0); }
    var showRadar = p > 0.2 && p < 0.9;
    if (showRadar !== radarEl.classList.contains('on')) radarEl.classList.toggle('on', showRadar);
    if (showRadar) {
      var room = cur >= 0 ? ROOMS[cur].id : roomAt(camState.x, camState.z);
      drawRadar(room === 'gar' ? null : room);
      var label = room ? roomName(room) : 'Außen';
      if (label !== ui.room) { ui.room = label; radarP.textContent = 'Standort · ' + label; }
    }
  }
  function roomAt(x, z) {
    var hit = null;
    HE.rooms.forEach(function (r) { if (x > r.r[0] && x < r.r[2] && z > r.r[1] && z < r.r[3]) hit = r.id; });
    if (!hit && x > -4 && x < 6 && z > -5 && z < 5) hit = 'hof';
    if (!hit && x > 5 && x < 17 && z > 13 && z < 19) hit = 'gar';
    return hit;
  }
  function roomName(id) {
    var n = { hof: 'Hof', gar: 'Terrasse' }[id];
    HE.rooms.forEach(function (r) { if (r.id === id) n = r.name.charAt(0) + r.name.slice(1).toLowerCase(); });
    return n || 'Außen';
  }

  // ---------------------------------------------------------------- Scroll und Schleife
  var scroller = $('scroller'), track = $('track'), canvas = $('gl');
  var SCREENS = 19;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target = 0, cur = 0, forced = false, canvasW = 1, canvasH = 1, introRunning = false;
  function readScroll() {
    var max = scroller.scrollHeight - scroller.clientHeight;
    target = max > 0 ? c01(scroller.scrollTop / max) : 0;
  }
  function resize() {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    canvasW = w; canvasH = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HE.maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    track.style.height = Math.round(h * SCREENS) + 'px';
    if (!forced) readScroll();
    dirty = true;
  }
  scroller.addEventListener('scroll', function () { forced = false; readScroll(); }, { passive: true });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  function scrollToP(p) {
    var max = scroller.scrollHeight - scroller.clientHeight;
    closeFile();
    try { scroller.scrollTo({ top: max * p, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { scroller.scrollTop = max * p; }
  }
  $('mark').addEventListener('click', function () { scrollToP(0); });
  $('again').addEventListener('click', function () { scrollToP(0); });
  $('pillTop').addEventListener('click', function () { scrollToP(1); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-to="end"]'), function (b) { b.addEventListener('click', function () { scrollToP(1); }); });
  $('ctaEnd').addEventListener('click', function () { $('demoNote').hidden = false; });
  // Mausrad über Bedienelementen weiterreichen
  document.addEventListener('wheel', function (e) {
    if (document.body.classList.contains('locked')) return;
    if (e.target === scroller || scroller.contains(e.target) || fileEl.contains(e.target)) return;
    scroller.scrollTop += e.deltaY;
  }, { passive: true });
  window.addEventListener('pointermove', function (e) { par.tx = (e.clientX / canvasW) * 2 - 1; par.ty = (e.clientY / canvasH) * 2 - 1; }, { passive: true });

  var lastT = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.1, (t - lastT) / 1000 || 0.016); lastT = t;
    var diff = target - cur;
    if (Math.abs(diff) > 0.000015) {
      cur = (reduce || forced) ? target : cur + diff * (1 - Math.exp(-dt * 4.0));
      if (Math.abs(target - cur) < 0.000015) cur = target;
      dirty = true;
    }
    var px = par.tx - par.x, py = par.ty - par.y;
    if (!reduce && (Math.abs(px) > 0.002 || Math.abs(py) > 0.002)) { par.x += px * 0.06; par.y += py * 0.06; if (cur > 0.19 && cur < 0.9) dirty = true; }
    var live = cur > 0.2 && cur < 0.955 && !document.hidden && !HE.frozen;
    if (dirty || live) { dirty = false; apply(cur, t / 1000); renderer.render(scene, camera); }
  }

  // ---------------------------------------------------------------- Intro: Lader, dann rollt der Plan auf den Tisch
  var loader = $('loader'), view = $('view'), story = loader.querySelectorAll('.loader__story p');
  function setPct(v) { $('loadFill').style.width = (v * 100) + '%'; $('loadPct').textContent = Math.round(v * 100) + ' %'; }
  function endIntro() {
    introRunning = false;
    view.style.clipPath = ''; view.style.webkitClipPath = '';
    rollEl.style.opacity = '0';
    document.body.classList.remove('intro', 'locked');
    try { scroller.focus({ preventScroll: true }); } catch (e) { /* ohne Fokus weiter */ }
    scroller.blur();
    dirty = true;
  }
  function rollIn() {
    loader.classList.add('off');
    if (reduce) { endIntro(); return; }
    introRunning = true;
    var t0 = performance.now(), dur = 1900;
    rollEl.style.opacity = '1';
    (function step(now) {
      var t = c01((now - t0) / dur), e = 1 - Math.pow(1 - t, 3), x = e * 104 - 2;
      var cp = 'inset(0 ' + Math.max(0, 100 - x) + '% 0 0)';
      view.style.clipPath = cp; view.style.webkitClipPath = cp;
      rollEl.style.transform = 'translate3d(' + x + 'vw,0,0) translateX(-50%)';
      if (t < 1 && introRunning) requestAnimationFrame(step); else endIntro();
    })(t0);
  }
  function startIntro() {
    var direct = location.hash === '#direkt' || HE.skip;
    if (direct) { loader.classList.add('off'); endIntro(); return; }
    view.style.clipPath = 'inset(0 100% 0 0)'; view.style.webkitClipPath = 'inset(0 100% 0 0)';
    var i = 0, t0 = performance.now(), per = reduce ? 500 : 1150;
    story[0].classList.add('on');
    (function tick(now) {
      var t = (now - t0) / (per * story.length);
      setPct(c01(t));
      var k = Math.max(0, Math.min(story.length - 1, Math.floor((now - t0) / per)));
      if (k !== i) { story[i].classList.remove('on'); i = k; story[i].classList.add('on'); }
      if (t < 1) requestAnimationFrame(tick); else setTimeout(rollIn, 250);
    })(t0);
  }

  resize();
  apply(0, 0);
  try { envA = HE.makeEnv(sunA.clone().lerp(sunB, 0.2).normalize(), 0.1); envB = HE.makeEnv(sunA.clone().lerp(sunB, 0.85).normalize(), 0.8); scene.environment = envA; envState = 'a'; } catch (e) { /* ohne Spiegelung weiter */ }
  requestAnimationFrame(frame);
  startIntro();

  HE.jump = function (p) { forced = true; target = p; cur = p - 0.0001; dirty = true; };
  HE.end = endIntro;
  // Prüfhilfe: einen Zustand des Intros einfrieren
  HE.debugIntro = function (mode) {
    document.body.classList.add('intro', 'locked');
    if (mode === 'loader') { loader.classList.remove('off'); story[0].classList.remove('on'); story[1].classList.add('on'); setPct(0.6); return; }
    loader.classList.add('off');
    var x = 46, cp = 'inset(0 ' + (100 - x) + '% 0 0)';
    view.style.clipPath = cp; view.style.webkitClipPath = cp;
    rollEl.style.opacity = '1'; rollEl.style.transform = 'translate3d(' + x + 'vw,0,0) translateX(-50%)';
  };
  HE.openFile = openFile;
  HE.info = function () { return renderer.info.render; };
  HE.keys = KEYS;
})();
