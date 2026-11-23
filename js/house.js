/* Haus Eiche · Architektur
   Ein Geschoss, vier Flügel um einen Hof. Alle Wände stehen auf Achsen,
   der Grundriss und das Haus sind dieselben Zahlen. */
(function () {
  'use strict';
  var HE = window.HE; if (!HE || !HE.ok) return;
  var T = HE.T, D = HE.D, box = HE.box, mat = HE.mat;
  var F0 = D.F0, WT = D.WT;
  var TE = 0.4, TI = 0.2; // Wandstärken außen / innen

  // Zonen: Ursprung des Wischers = wo man den Raum betritt
  HE.zone('ext', -6.2, 1.6, 9.2, 2);
  HE.zone('ein', -6.2, 1.8, 7.8);
  HE.zone('woh', -6.4, 1.8, 2.8);
  HE.zone('kue', -8.0, 1.8, -5.0);
  HE.zone('hof', -2.4, 1.6, -4.8);
  HE.zone('gal', 6.0, 1.8, -0.1);
  HE.zone('sch', 7.5, 1.8, 7.9);
  HE.zone('bad', 13.6, 1.8, 8.0);
  HE.zone('gar', 10.2, 1.6, 13.0);
  HE.zone('rest', 1, 1.8, 0);

  // Räume: r = [x0, z0, x1, z1] auf Achsmaß
  var rooms = HE.rooms = [
    { id: 'ein', name: 'EINGANG', r: [-9, 3, -4, 8], zone: 'ein', floor: 'travertine', label: [-6.5, 5.3], dim: '5,00 × 5,00', area: '25 m²' },
    { id: 'gard', name: 'GARDEROBE', r: [-13, 3, -9, 8], zone: 'rest', floor: 'travertine', label: [-11, 4.6], dim: '4,00 × 5,00', area: '20 m²', small: 1 },
    { id: 'woh', name: 'WOHNEN', r: [-13, -5, -4, 3], zone: 'woh', floor: 'oakFloor', label: [-8.5, 2.05], dim: '9,00 × 8,00', area: '72 m²' },
    { id: 'kue', name: 'KOCHEN · ESSEN', r: [-13, -11, 1, -5], zone: 'kue', floor: 'travertine', label: [-5.6, -6.05], dim: '14,00 × 6,00', area: '84 m²' },
    { id: 'arb', name: 'ARBEITEN', r: [1, -11, 9, -5], zone: 'rest', floor: 'oakFloor', label: [5, -6.2], dim: '8,00 × 6,00', area: '48 m²' },
    { id: 'gal', name: 'GALERIE', r: [6, -5, 9, 8], zone: 'gal', floor: 'travertine', label: [7.5, 1.6], dim: '3,00 × 13,00', area: '39 m²', rot: 1 },
    { id: 'ank', name: 'ANKLEIDE', r: [9, 5, 11.8, 8], zone: 'bad', floor: 'oakFloor', label: [10.4, 6.9], dim: '', area: '8 m²', small: 1 },
    { id: 'bad', name: 'BAD', r: [11.8, 5, 15.5, 8], zone: 'bad', floor: 'travertine', label: [13.65, 6.9], dim: '', area: '11 m²', small: 1 },
    { id: 'sch', name: 'SCHLAFEN', r: [6, 8, 15.5, 13], zone: 'sch', floor: 'oakFloor', label: [9.0, 11.9], dim: '9,50 × 5,00', area: '47 m²' }
  ];
  HE.axesX = [-13, -9, -4, 1, 6, 9, 15.5];
  HE.axesZ = [-11, -5, 3, 5, 8, 13];
  HE.PIT = [-11, -3.2, -6.5, 0.8]; // Sitzgrube im Wohnen
  HE.SKY = [[-4.4, -3.4], [-2.8, -1.8], [-1.2, -0.2]]; // Oberlichter x, z = -8.7 .. -7.5

  var brick = mat('brick', 'ext', { poche: 1 });
  var frame = mat('metal', 'ext', { color: 0x2b2622 });
  var glass = mat('glass', 'ext');
  function plaster(zone) { return mat('plaster', zone, { poche: 1, interior: 1 }); }
  function side(s) { return s === 'E' ? brick : plaster(s); }

  // Wandlauf mit Öffnungen. axis 'x': läuft entlang x, belegt z in [c0, c1]
  function run(axis, a, b, c0, c1, y0, y1, ops, m) {
    function put(u0, u1, v0, v1) { if (axis === 'x') box(m, u0, v0, c0, u1, v1, c1); else box(m, c0, v0, u0, c1, v1, u1); }
    var list = (ops || []).filter(function (o) { return o.b > a + 1e-6 && o.a < b - 1e-6; }).sort(function (p, q) { return p.a - q.a; });
    var u = a;
    list.forEach(function (o) {
      var oa = Math.max(o.a, a), ob = Math.min(o.b, b);
      put(u, oa, y0, y1);
      if (o.sill > 0) put(oa, ob, y0, F0 + o.sill);
      put(oa, ob, F0 + o.head, y1);
      u = ob;
    });
    put(u, b, y0, y1);
  }
  // Fenster: schmale Bronzeprofile, Glas, optional offener Schiebeflügel
  function win(axis, c, o) {
    var y0 = F0 + o.sill, y1 = F0 + o.head, f = 0.05, hd = 0.045;
    function put(u0, u1, v0, v1, m, d, off) {
      off = off || 0;
      if (axis === 'x') box(m, u0, v0, c - d + off, u1, v1, c + d + off); else box(m, c - d + off, v0, u0, c + d + off, v1, u1);
    }
    put(o.a, o.b, y1 - f, y1, frame, hd); put(o.a, o.b, y0, y0 + f, frame, hd);
    put(o.a, o.a + f, y0 + f, y1 - f, frame, hd); put(o.b - f, o.b, y0 + f, y1 - f, frame, hd);
    var w = o.b - o.a, n = Math.max(1, Math.round(w / 1.5)), i, cuts = [o.a];
    for (i = 1; i < n; i++) cuts.push(o.a + w * i / n);
    cuts.push(o.b);
    if (o.slide) {
      cuts = cuts.filter(function (x) { return x < o.slide[0] - 0.4 || x > o.slide[1] + 0.4; });
      cuts.push(o.slide[0], o.slide[1]);
      cuts.sort(function (p, q) { return p - q; });
    }
    for (i = 0; i < cuts.length - 1; i++) {
      var u0 = cuts[i], u1 = cuts[i + 1];
      if (i > 0) put(u0 - 0.025, u0 + 0.025, y0 + f, y1 - f, frame, 0.04);
      if (o.slide && Math.abs(u0 - o.slide[0]) < 0.01) {
        // offener Flügel: steht vor der Nachbarscheibe
        var wS = o.slide[1] - o.slide[0];
        put(u0 - wS + 0.05, u0 + 0.05, y0 + f, y1 - f, glass, 0.008, 0.07);
        put(u0 + 0.0, u0 + 0.05, y0 + f, y1 - f, frame, 0.03, 0.07);
        put(u0 - wS + 0.05, u0 - wS + 0.1, y0 + f, y1 - f, frame, 0.03, 0.07);
        continue;
      }
      put(u0 + 0.025, u1 - 0.025, y0 + f, y1 - f, glass, 0.008);
    }
    if (o.sill > 0) { // Fensterbank außen
      var s = o.out || 1;
      if (axis === 'x') box(frame, o.a - 0.03, y0 - 0.03, c + (s > 0 ? 0.18 : -0.26), o.b + 0.03, y0, c + (s > 0 ? 0.26 : -0.18));
      else box(frame, c + (s > 0 ? 0.18 : -0.26), y0 - 0.03, o.a - 0.03, c + (s > 0 ? 0.26 : -0.18), y0, o.b + 0.03);
    }
  }
  // zweischalige Wand: neg = Nord- bzw. Westseite, pos = Süd- bzw. Ostseite
  var walls = HE.walls = [];
  function wall(axis, c, a, b, neg, pos, ops, o) {
    o = o || {};
    var t = o.t || ((neg === 'E' || pos === 'E') ? TE : TI);
    var y1 = o.h || WT, ea = o.ea || 0, eb = o.eb || 0;
    // nur die Außenschale läuft um die Ecke
    run(axis, a - (neg === 'E' ? ea : 0), b + (neg === 'E' ? eb : 0), c - t / 2, c, 0, y1, ops, side(neg));
    run(axis, a - (pos === 'E' ? ea : 0), b + (pos === 'E' ? eb : 0), c, c + t / 2, 0, y1, ops, side(pos));
    (ops || []).forEach(function (op) {
      if (op.glass !== false && !op.open && !op.leaf && !op.door) { op.out = pos === 'E' ? 1 : -1; win(axis, c, op); }
    });
    walls.push({ axis: axis, c: c, a: a - ea, b: b + eb, t: t, ops: ops || [], low: !!o.h });
  }
  var W = function (a, b, sill, head, extra) { var o = { a: a, b: b, sill: sill, head: head }; if (extra) for (var k in extra) o[k] = extra[k]; return o; };

  // ---------------------------------------------------------------- Außenwände
  wall('x', -11, -13, 1, 'E', 'kue', [W(-11.5, -7, 1.15, 2.1), W(-5, 0.2, 0.9, 2.6)], { ea: 0.2 });
  wall('x', -11, 1, 9, 'E', 'rest', [W(2.6, 7.4, 0.9, 2.6)], { eb: 0.2 });
  wall('z', -13, -11, -5, 'E', 'kue', [], { ea: 0.2 });
  wall('z', -13, -5, 3, 'E', 'woh', []);
  wall('z', -13, 3, 8, 'E', 'rest', [W(5, 6.2, 1.5, 2.4)], { eb: 0.2 });
  wall('x', 8, -13, -9, 'rest', 'E', [], { ea: 0.2 });
  wall('x', 8, -9, -4, 'ein', 'E', [W(-7.3, -5.7, 0, 3.0, { door: 1 })], { eb: 0.2 });
  wall('z', -4, 3, 8, 'ein', 'E', [W(3.5, 4.7, 0, 2.9)], { eb: 0.2 });
  wall('z', -4, -5, 3, 'woh', 'E', [W(-4.5, 2.5, 0, 3.0)]);
  wall('x', -5, -4, 1, 'kue', 'E', [W(-3.5, 0.5, 0, 3.0, { slide: [-3.3, -1.5] })]);
  wall('x', -5, 1, 6, 'rest', 'E', [W(2, 5, 0.5, 2.7)]);
  wall('z', 9, -11, -5, 'rest', 'E', [W(-9.6, -6.4, 0.9, 2.6)], { ea: 0.2 });
  wall('z', 9, -5, 5, 'gal', 'E', []);
  wall('z', 6, -5, 5, 'E', 'gal', [W(-4.6, 4.6, 0, 3.0, { slide: [-0.8, 0.7] })]);
  wall('x', 5, 9, 15.5, 'E', 'bad', [W(13.2, 15.0, 1.3, 2.4)], { eb: 0.2 });
  wall('z', 15.5, 5, 8, 'bad', 'E', [], { ea: 0.2 });
  wall('z', 15.5, 8, 13, 'sch', 'E', [W(9.4, 11.8, 0.5, 2.7)], { eb: 0.2 });
  wall('x', 13, 6, 15.5, 'sch', 'E', [W(6.8, 14.7, 0, 3.0, { slide: [9.2, 11.2] })], { ea: 0.2, eb: 0.2 });
  wall('z', 6, 5, 8, 'E', 'gal', []);
  wall('z', 6, 8, 13, 'E', 'sch', [W(9.4, 12, 0.5, 2.7)], { eb: 0.2 });
  wall('x', 5, -4, 6, 'E', 'E', [], { h: F0 + 2.3 }); // Hofmauer
  box(mat('stone', 'ext'), -4.25, F0 + 2.3, 4.74, 6.25, F0 + 2.36, 5.26); // Mauerabdeckung

  // ---------------------------------------------------------------- Innenwände
  wall('x', 3, -13, -9, 'woh', 'rest', []);
  wall('x', 3, -9, -4, 'woh', 'ein', [W(-7.5, -5.5, 0, 2.9, { open: 1 })]);
  wall('z', -9, 3, 8, 'rest', 'ein', [W(5.6, 6.5, 0, 2.2, { leaf: 1 })]);
  wall('x', -5, -13, -4, 'kue', 'woh', [W(-11.6, -5.4, 0, 3.0, { open: 1 })]);
  wall('z', 1, -11, -5, 'kue', 'rest', [W(-7.6, -6.6, 0, 2.2, { leaf: 1 })]);
  wall('x', -5, 6, 9, 'rest', 'gal', [W(6.5, 8.5, 0, 2.9, { open: 1 })]);
  wall('z', 9, 5, 8, 'gal', 'bad', [W(5.9, 7.1, 0, 2.7, { open: 1 })]);
  wall('z', 11.8, 5, 8, 'bad', 'bad', [W(5.9, 7.1, 0, 2.7, { open: 1 })]);
  wall('x', 8, 9, 15.5, 'bad', 'sch', [W(12.9, 14.1, 0, 2.7, { open: 1 })]);
  // Innentüren
  box(mat('wood', 'ein', { color: 0xb08a5e, interior: 1 }), -9.03, F0, 5.63, -8.98, F0 + 2.17, 6.47);
  box(mat('metal', 'ein'), -8.98, F0 + 1.03, 6.3, -8.94, F0 + 1.05, 6.42, { edges: false });
  box(mat('wood', 'kue', { color: 0xb08a5e, interior: 1 }), 0.97, F0, -7.57, 1.02, F0 + 2.17, -6.63);

  // ---------------------------------------------------------------- Böden
  var PIT = HE.PIT;
  rooms.forEach(function (rm) {
    var m = mat(rm.floor, rm.zone, { interior: 1 }), r = rm.r;
    if (rm.id !== 'woh') { box(m, r[0], 0, r[1], r[2], F0, r[3], { edges: false }); return; }
    box(m, r[0], 0, r[1], r[2], F0, PIT[1], { edges: false });
    box(m, r[0], 0, PIT[3], r[2], F0, r[3], { edges: false });
    box(m, r[0], 0, PIT[1], PIT[0], F0, PIT[3], { edges: false });
    box(m, PIT[2], 0, PIT[1], r[2], F0, PIT[3], { edges: false });
    box(m, PIT[0], 0, PIT[1], PIT[2], 0.05, PIT[3]);
    // Stufe in die Grube
    box(m, PIT[2] - 0.45, 0.05, -1.9, PIT[2], 0.25, -0.5);
  });

  // ---------------------------------------------------------------- Decken und Dach (nur von unten sichtbar)
  var RO = { roof: true, base: WT };
  var SKY = HE.SKY, sz0 = -8.7, sz1 = -7.5;
  rooms.forEach(function (rm) {
    var m = mat('plaster', rm.zone, { color: 0xf6f3ec, interior: 1 }), r = rm.r, y0 = WT - 0.02;
    if (rm.id !== 'kue') { box(m, r[0], y0, r[1], r[2], WT, r[3], { roof: true, base: WT, edges: false }); return; }
    box(m, r[0], y0, r[1], r[2], WT, sz0, { roof: true, base: WT, edges: false });
    box(m, r[0], y0, sz1, r[2], WT, r[3], { roof: true, base: WT, edges: false });
    var xs = [r[0]];
    SKY.forEach(function (s) { xs.push(s[0], s[1]); });
    xs.push(r[2]);
    for (var i = 0; i < xs.length; i += 2) box(m, xs[i], y0, sz0, xs[i + 1], WT, sz1, { roof: true, base: WT, edges: false });
    SKY.forEach(function (s) { // Schächte
      box(m, s[0] - 0.02, WT, sz0 - 0.02, s[0], WT + 0.34, sz1 + 0.02, RO); box(m, s[1], WT, sz0 - 0.02, s[1] + 0.02, WT + 0.34, sz1 + 0.02, RO);
      box(m, s[0], WT, sz0 - 0.02, s[1], WT + 0.34, sz0, RO); box(m, s[0], WT, sz1, s[1], WT + 0.34, sz1 + 0.02, RO);
      box(glass, s[0], WT + 0.3, sz0, s[1], WT + 0.32, sz1, RO);
    });
  });
  var zinc = mat('zinc', 'ext', { color: 0x595d61 });
  var gravelR = mat('gravel', 'ext', { color: 0xbdb6a8 });
  function roofRect(x0, z0, x1, z1) {
    box(zinc, x0, WT, z0, x1, WT + 0.3, z1, RO);
    box(gravelR, x0 + 0.25, WT + 0.3, z0 + 0.25, x1 - 0.25, WT + 0.33, z1 - 0.25, { roof: true, base: WT, edges: false });
  }
  roofRect(-13.7, -11.7, 9.7, sz0); roofRect(-13.7, sz1, 9.7, -4.5);
  (function () {
    var xs = [-13.7];
    SKY.forEach(function (s) { xs.push(s[0] - 0.02, s[1] + 0.02); });
    xs.push(9.7);
    for (var i = 0; i < xs.length; i += 2) box(zinc, xs[i], WT, sz0, xs[i + 1], WT + 0.3, sz1, { roof: true, base: WT, edges: false });
  })();
  roofRect(-13.7, -4.5, -3.5, 8.9);
  roofRect(5.5, -4.5, 9.7, 5.0);
  roofRect(5.5, 5.0, 16.2, 13.8);

  // ---------------------------------------------------------------- Eingang
  var stone = mat('stone', 'ext');
  box(stone, -8.6, 0, 8.2, -4.4, F0, 9.7);
  box(stone, -8.6, 0, 9.7, -4.4, 0.3, 10.05);
  box(stone, -8.6, 0, 10.05, -4.4, 0.15, 10.4);
  box(stone, -7.3, 0, 7.8, -5.7, F0, 8.2, { edges: false }); // Schwelle
  // Lamellen aus Eiche vor der Garderobe, Bank aus Beton
  var fin = mat('wood', 'ext', { color: 0xa9774a });
  for (var i = 0; i < 21; i++) { var fx = -12.7 + i * 0.165; box(fin, fx, 0.1, 8.3, fx + 0.05, WT, 8.46); }
  box(mat('concrete', 'ext'), -12.5, 0, 8.7, -9.9, 0.46, 9.25);
  // Zarge
  box(frame, -7.3, F0, 7.95, -7.25, F0 + 3.0, 8.05); box(frame, -5.75, F0, 7.95, -5.7, F0 + 3.0, 8.05);
  // Wandleuchten neben der Tür
  var lampX = mat('plain', 'ext', { color: 0xfff1d0, emissive: 0xffd49a, ei: 2.2, rough: 0.4 });
  box(lampX, -7.72, F0 + 1.0, 8.2, -7.66, F0 + 2.3, 8.24, { edges: false });
  box(lampX, -5.34, F0 + 1.0, 8.2, -5.28, F0 + 2.3, 8.24, { edges: false });

  // Haustür: ein Blatt aus Eiche auf einem Drehzapfen
  var pivot = HE.doorPivot = new T.Group();
  pivot.position.set(-6.9, 0, 8.0);
  var oakDoor = mat('wood', 'ext', { color: 0xa87648, obj: 1 });
  HE.part(pivot, oakDoor, -0.38, F0 + 0.01, -0.035, 1.18, F0 + 2.98, 0.035);
  HE.part(pivot, mat('metal', 'ext', { color: 0x8c6a3a, rough: 0.3, metal: 0.9, obj: 1 }), 0.98, F0 + 0.7, 0.05, 1.01, F0 + 2.2, 0.09);
  HE.part(pivot, mat('metal', 'ext', { color: 0x8c6a3a, rough: 0.3, metal: 0.9, obj: 1 }), 0.98, F0 + 0.7, -0.09, 1.01, F0 + 2.2, -0.05);
  HE.scene.add(pivot);

  // Hausname an der Wand rechts der Tür (im Code gezeichnet)
  (function () {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = '600 76px "Archivo", "Helvetica Neue", Arial, sans-serif'; g.textBaseline = 'middle';
    var txt = 'HAUS EICHE', x = 8;
    for (var k = 0; k < txt.length; k++) { g.fillText(txt[k], x, 68); x += g.measureText(txt[k]).width + 26; }
    var t = new T.CanvasTexture(c); t.anisotropy = 4;
    var m = new T.MeshBasicMaterial({ color: 0x1d1b19, alphaMap: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    HE.patch(m, 'plain', 'ext', { realOnly: 1 });
    m.userData = { key: 'sign', zone: 'ext', kind: 'plain', o: { realOnly: 1 } };
    var p = new T.Mesh(new T.PlaneGeometry(2.6, 0.325), m);
    p.position.set(-1.5, F0 + 1.45, 5.215); p.frustumCulled = false; p.renderOrder = 4;
    HE.scene.add(p);
    HE.sign = p;
  })();
})();
