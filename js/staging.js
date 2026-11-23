/* Haus Eiche · Einrichtung
   Jeder Raum hat seine Zone. Höhen sind ab Fertigfußboden gemessen. */
(function () {
  'use strict';
  var HE = window.HE; if (!HE || !HE.ok) return;
  var T = HE.T, D = HE.D, mat = HE.mat, rnd = HE.rnd;
  var F0 = D.F0, WT = D.WT;
  function B(m, x0, y0, z0, x1, y1, z1, o) { HE.box(m, x0, F0 + y0, z0, x1, F0 + y1, z1, o); }
  function S(m, x0, y0, z0, x1, y1, z1, r, o) { HE.soft(m, x0, F0 + y0, z0, x1, F0 + y1, z1, r, o); }
  var NE = { edges: false };
  HE.reseed(4242);

  // weicher Schatten unter Möbeln
  var blobTex = (function () {
    var n = 64, c = document.createElement('canvas'); c.width = c.height = n;
    var g = c.getContext('2d'), im = g.createImageData(n, n), i, j;
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var u = Math.min(i, n - 1 - i) / (n * 0.3), v = Math.min(j, n - 1 - j) / (n * 0.3);
      var a = Math.min(1, u) * Math.min(1, v); a = a * a * (3 - 2 * a);
      var k = (j * n + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = a * 255; im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return new T.CanvasTexture(c);
  })();
  var blobMats = {};
  function shade(zone, x0, z0, x1, z1, y, strength) {
    var key = zone + (strength || 0.4);
    var m = blobMats[key];
    if (!m) {
      m = blobMats[key] = new T.MeshBasicMaterial({ color: 0x120e0a, alphaMap: blobTex, transparent: true, opacity: strength || 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: false });
      HE.patch(m, 'plain', zone, { realOnly: 1 });
      m.userData = { key: 'blob' + key, zone: zone, kind: 'plain', o: { realOnly: 1 } };
    }
    var pad = 0.28, g = new T.PlaneGeometry(x1 - x0 + pad * 2, z1 - z0 + pad * 2); g.rotateX(-Math.PI / 2);
    var p = new T.Mesh(g, m); p.position.set((x0 + x1) / 2, F0 + (y || 0) + 0.004, (z0 + z1) / 2); p.frustumCulled = false; p.renderOrder = 2;
    HE.scene.add(p);
  }
  function vase(zone, x, y, z, r, h, color) {
    HE.sphere(mat('plain', zone, { color: color, rough: 0.45, interior: 1 }), x, F0 + y + h * 0.5, z, r, 1, h / (2 * r), 1, { edgeAngle: 70 });
  }
  function twigs(zone, x, y, z, n, h) {
    var m = mat('bark', zone, { color: 0x4a3a2c }), i;
    for (i = 0; i < n; i++) {
      var a = rnd() * 6.28, l = 0.25 + rnd() * 0.25;
      var p0 = new T.Vector3(x, F0 + y, z), p1 = new T.Vector3(x + Math.cos(a) * l, F0 + y + h * (0.7 + rnd() * 0.3), z + Math.sin(a) * l);
      var dir = new T.Vector3().subVectors(p1, p0), len = dir.length();
      var g = new T.CylinderGeometry(0.004, 0.009, len, 4);
      g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize()));
      g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
      HE.addGeo(g, m, NE);
    }
  }
  function greens(zone, x, y, z, r, n) {
    var m = mat('leaf', zone, { color: 0x56773a, double: 1, realOnly: 1 }), pts = [], i;
    for (i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, th = rnd() * 6.28, s = Math.sqrt(1 - u * u), rr = r * (0.5 + rnd() * 0.6);
      var px = x + s * Math.cos(th) * rr, py = F0 + y + Math.abs(u) * rr * 1.2, pz = z + s * Math.sin(th) * rr, q = 0.07 + rnd() * 0.06;
      var ax = (rnd() - 0.5) * q, ay = (rnd() - 0.5) * q, az = (rnd() - 0.5) * q, bx = (rnd() - 0.5) * q, by = (rnd() - 0.5) * q, bz = (rnd() - 0.5) * q;
      pts.push(px - ax, py - ay, pz - az, px + bx, py + by, pz + bz, px + ax, py + ay, pz + az);
    }
    HE.tris(m, pts, { base: F0 + y, edges: false });
  }
  function pendant(zone, x, z, y, r, color) {
    var cord = mat('metal', zone, { color: 0x1c1a18 });
    B(cord, x - 0.006, y + r, z - 0.006, x + 0.006, WT - F0, z + 0.006, NE);
    HE.sphere(mat('plain', zone, { color: color || 0xfff4dc, emissive: 0xffd9a0, ei: 1.5, rough: 0.5 }), x, F0 + y, z, r, 1, 1, 1, { edgeAngle: 70 });
  }
  function dome(zone, x, z, y, r) {
    var brass = mat('metal', zone, { color: 0xb08a4a, rough: 0.28, metal: 0.95, double: 1 });
    var g = new T.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); g.translate(x, F0 + y, z);
    HE.addGeo(g, brass, { edgeAngle: 60 });
    HE.cyl(mat('plain', zone, { color: 0xfff1cf, emissive: 0xffd08a, ei: 2.4 }), x, F0 + y + 0.02, z, r * 0.55, r * 0.55, 0.02, 20, NE);
    B(mat('metal', zone, { color: 0x1c1a18 }), x - 0.006, y + r, z - 0.006, x + 0.006, WT - F0, z + 0.006, NE);
  }
  function art(zone, axis, c, a, b, y0, y1, bg, shapes) {
    var fr = mat('wood', zone, { color: 0x3a2c20 }), cv = mat('linen', zone, { color: bg, interior: 1 });
    var d = 0.035;
    function put(m, u0, u1, v0, v1, d0, d1, o) {
      if (axis === 'x') HE.box(m, u0, F0 + v0, Math.min(c + d0, c + d1), u1, F0 + v1, Math.max(c + d0, c + d1), o);
      else HE.box(m, Math.min(c + d0, c + d1), F0 + v0, u0, Math.max(c + d0, c + d1), F0 + v1, u1, o);
    }
    var s = shapes && shapes.side ? shapes.side : -1;
    put(fr, a, b, y0, y1, 0, s * d);
    put(cv, a + 0.04, b - 0.04, y0 + 0.04, y1 - 0.04, s * d, s * (d + 0.006), NE);
    (shapes && shapes.list || []).forEach(function (sh) {
      put(mat('plain', zone, { color: sh[4], rough: 0.9, interior: 1 }), a + sh[0], a + sh[1], y0 + sh[2], y0 + sh[3], s * (d + 0.006), s * (d + 0.011), NE);
    });
  }

  // ================================================================ Eingang
  (function () {
    var z = 'ein';
    B(mat('rug', z, { color: 0xb5a78f }), -7.4, 0, 3.7, -5.4, 0.012, 7.1);
    var oak = mat('wood', z, { color: 0xa67c52, interior: 1, nog: 1 }), con = mat('concrete', z, { color: 0xa9a59c });
    B(oak, -8.75, 0.38, 3.5, -8.25, 0.45, 5.3); B(con, -8.7, 0, 3.6, -8.3, 0.38, 3.9); B(con, -8.7, 0, 4.9, -8.3, 0.38, 5.2);
    S(mat('linen', z, { color: 0xd9d0c0 }), -8.72, 0.45, 3.55, -8.28, 0.53, 4.4, 0.03, NE);
    shade(z, -8.75, 3.5, -8.25, 5.3, 0, 0.3);
    // Konsole an der Ostwand
    B(con, -4.75, 0, 5.4, -4.25, 0.82, 7.4);
    shade(z, -4.75, 5.4, -4.25, 7.4, 0, 0.35);
    vase(z, -4.5, 0.82, 5.9, 0.13, 0.34, 0x24211e); twigs(z, -4.5, 1.1, 5.9, 9, 0.9);
    B(mat('plain', z, { color: 0xc9a56a, rough: 0.4, metal: 0.6 }), -4.62, 0.82, 6.6, -4.38, 0.85, 7.05);
    // große Bodenvase
    vase(z, -8.35, 0, 7.2, 0.34, 0.8, 0xefe9dc); twigs(z, -8.35, 0.7, 7.2, 12, 1.5);
    shade(z, -8.65, 6.9, -8.05, 7.5, 0, 0.3);
    // Pendelleuchten
    pendant(z, -8.1, 4.0, 2.2, 0.2); pendant(z, -7.6, 4.45, 1.9, 0.24); pendant(z, -8.0, 4.9, 2.5, 0.14); pendant(z, -7.45, 3.8, 2.55, 0.12);
    HE.lamp(-7.5, F0 + 2.0, 4.6, 0xffd9a6, 7, 9, z);
    // Bild an der Westwand
    art(z, 'z', -8.9, 3.6, 5.0, 0.95, 2.55, 0xe9e2d2, { side: 1, list: [[0.3, 1.1, 0.35, 1.2, 0x1f1c1a], [0.5, 0.85, 0.2, 0.45, 0xc8572a]] });
  })();

  // ================================================================ Wohnen
  (function () {
    var z = 'woh', P = HE.PIT, pf = -0.4; // Grubenboden relativ
    var con = mat('concrete', z), lin = mat('linen', z, { color: 0xd8cfbf }), lin2 = mat('linen', z, { color: 0xcbbfa9 });
    // Kamin: Block aus brettgeschaltem Beton mit liegender Feueröffnung
    B(con, -12.8, 0, -3.0, -12.05, 0.36, 0.6); B(con, -12.8, 1.0, -3.0, -12.05, WT - F0 - 0.02, 0.6);
    B(con, -12.8, 0.36, -3.0, -12.05, 1.0, -2.3); B(con, -12.8, 0.36, -0.1, -12.05, 1.0, 0.6);
    B(mat('plain', z, { color: 0x14100d, rough: 1 }), -12.8, 0.36, -2.3, -12.6, 1.0, -0.1, NE);
    B(mat('plain', z, { color: 0x14100d, rough: 1 }), -12.6, 0.36, -2.3, -12.05, 0.38, -0.1, NE);
    B(con, -12.05, 0, -3.5, -11.5, 0.3, 1.1); // Feuerbank
    for (var i = 0; i < 5; i++) HE.cyl(mat('bark', z, { color: 0x3a2a1e }), -12.3, F0 + 0.4 + (i % 2) * 0.05, -1.9 + i * 0.32, 0.05, 0.05, 0.28, 7, NE);
    HE.flame(-12.32, F0 + 0.4, -1.2, 1.5, 0.55, z);
    HE.lamp(-11.7, F0 + 0.7, -1.2, 0xff8c3c, 6, 8, z, true);
    // Sitzgrube: Polster an drei Seiten, offen zum Feuer
    var x0 = P[0], z0 = P[1], x1 = P[2], z1 = P[3];
    S(lin, x0 + 0.3, pf, z0 + 0.05, x1 - 0.05, pf + 0.42, z0 + 1.0, 0.07);
    S(lin, x1 - 1.0, pf, z0 + 1.0, x1 - 0.05, pf + 0.42, z1 - 1.0, 0.07);
    S(lin, x0 + 0.3, pf, z1 - 1.0, x1 - 0.05, pf + 0.42, z1 - 0.05, 0.07);
    var k;
    for (k = 0; k < 4; k++) {
      S(lin2, x0 + 0.4 + k * 1.0, pf + 0.42, z0 + 0.06, x0 + 1.32 + k * 1.0, pf + 0.86, z0 + 0.34, 0.09, NE);
      S(lin2, x0 + 0.4 + k * 1.0, pf + 0.42, z1 - 0.34, x0 + 1.32 + k * 1.0, pf + 0.86, z1 - 0.06, 0.09, NE);
    }
    for (k = 0; k < 2; k++) S(lin2, x1 - 0.34, pf + 0.42, z0 + 1.05 + k * 0.98, x1 - 0.06, pf + 0.86, z0 + 1.97 + k * 0.98, 0.09, NE);
    S(mat('linen', z, { color: 0xc8703c }), x1 - 0.9, pf + 0.42, z1 - 0.9, x1 - 0.5, pf + 0.74, z1 - 0.72, 0.08, NE);
    S(mat('linen', z, { color: 0x8c8a6a }), x0 + 1.5, pf + 0.42, z0 + 0.36, x0 + 1.95, pf + 0.72, z0 + 0.55, 0.08, NE);
    S(mat('linen', z, { color: 0xd9a441 }), x0 + 2.9, pf + 0.42, z1 - 0.56, x0 + 3.35, pf + 0.72, z1 - 0.38, 0.08, NE);
    // Tisch aus Travertin
    var trav = mat('travertine', z, { color: 0xd9cfbc });
    B(trav, -9.5, pf, -1.95, -8.2, pf + 0.3, -0.45);
    shade(z, -9.5, -1.95, -8.2, -0.45, pf, 0.4);
    B(mat('wood', z, { color: 0x3a2a20 }), -9.2, pf + 0.3, -1.6, -8.75, pf + 0.325, -1.05);
    HE.sphere(mat('plain', z, { color: 0xb5432a, rough: 0.5 }), -8.97, F0 + pf + 0.4, -1.32, 0.09, 1, 0.8, 1, NE);
    vase(z, -8.55, pf + 0.3, -0.75, 0.1, 0.36, 0x1d1b19); twigs(z, -8.55, pf + 0.6, -0.75, 7, 0.55); greens(z, -8.55, pf + 0.95, -0.75, 0.22, 60);
    // Bogenleuchte
    var brass = mat('metal', z, { color: 0xb08a4a, rough: 0.3, metal: 0.95 });
    HE.cyl(mat('marble', z), -6.15, F0, -3.6, 0.22, 0.22, 0.12, 20);
    var curve = new T.QuadraticBezierCurve3(new T.Vector3(-6.15, F0 + 0.1, -3.6), new T.Vector3(-6.4, F0 + 3.3, -3.3), new T.Vector3(-8.2, F0 + 1.75, -2.0));
    HE.addGeo(new T.TubeGeometry(curve, 28, 0.016, 6, false), brass, NE);
    dome(z, -8.2, -2.0, 1.55, 0.3);
    HE.lamp(-8.2, F0 + 1.3, -2.0, 0xffd29a, 7, 9, z);
    // Sideboard an der Südwand mit Bildern
    var wal = mat('wood', z, { color: 0x6a4630, rot: 1, interior: 1, nog: 1 });
    B(wal, -12.6, 0.08, 2.42, -8.9, 0.55, 2.9); B(mat('metal', z), -12.5, 0, 2.5, -9.0, 0.08, 2.85, NE);
    shade(z, -12.6, 2.42, -8.9, 2.9, 0, 0.35);
    art(z, 'x', 2.9, -12.1, -10.9, 0.62, 2.1, 0xefe8d8, { list: [[0.2, 1.0, 0.15, 0.6, 0x23201d], [0.35, 0.85, 0.75, 1.25, 0xc65a2c]] });
    art(z, 'x', 2.9, -10.6, -9.7, 0.62, 1.7, 0xd9c7a4, { list: [[0.1, 0.8, 0.1, 0.35, 0x8a3a22], [0.1, 0.8, 0.4, 0.55, 0xe8ddc8]] });
    vase(z, -9.25, 0.55, 2.66, 0.11, 0.3, 0xe9e2d4);
    // Baum im Kübel
    HE.cyl(mat('concrete', z, { color: 0x8f8b84 }), -12.2, F0, 1.75, 0.3, 0.36, 0.5, 20);
    HE.oak(z, -12.2, F0 + 0.45, 1.75, 0.3, 420);
    shade(z, -12.55, 1.4, -11.85, 2.1, 0, 0.35);
    // Teppich oben am Grubenrand und Sessel am Feuer
    B(mat('rug', z, { color: 0xa79b86 }), -11.9, pf, -2.6, -11.1, pf + 0.01, 0.2);
  })();

  // ================================================================ Kochen · Essen
  (function () {
    var z = 'kue';
    var wal = mat('wood', z, { color: 0x5e3f2b, interior: 1, nog: 1 }), trav = mat('travertine', z, { color: 0xddd4c2 }), dark = mat('plain', z, { color: 0x15120f, rough: 0.6 });
    var brass = mat('metal', z, { color: 0xb08a4a, rough: 0.3, metal: 0.95 });
    // Zeile an der Nordwand, Hochschränke an der Westwand
    B(wal, -12.75, 0.1, -10.8, -6.3, 0.9, -10.15); B(dark, -12.7, 0, -10.75, -6.35, 0.1, -10.22, NE);
    B(trav, -12.78, 0.9, -10.8, -6.27, 0.94, -10.12);
    B(wal, -12.8, 0, -10.1, -12.15, 2.55, -6.3);
    B(dark, -12.16, 1.0, -9.3, -12.13, 1.6, -8.6, NE); B(dark, -12.16, 1.0, -8.5, -12.13, 1.6, -7.8, NE);
    B(brass, -9.3, 0.94, -10.6, -9.26, 1.25, -10.56, NE); B(brass, -9.3, 1.22, -10.6, -9.26, 1.25, -10.4, NE);
    // Kochinsel: vier Meter Travertin
    B(trav, -10.8, 0, -8.9, -6.8, 0.88, -7.9); B(trav, -10.85, 0.88, -8.95, -6.75, 0.93, -7.75);
    shade(z, -10.8, -8.9, -6.8, -7.9, 0, 0.45);
    B(dark, -9.9, 0.932, -8.7, -9.1, 0.936, -8.15, NE);
    vase(z, -7.3, 0.93, -8.4, 0.12, 0.34, 0x1b1917); twigs(z, -7.3, 1.2, -8.4, 6, 0.6); greens(z, -7.3, 1.55, -8.4, 0.25, 70);
    var stool = mat('leather', z, { color: 0x8a4a2e }), leg = mat('metal', z, { color: 0x1c1a18 });
    for (var i = 0; i < 4; i++) {
      var sx = -10.3 + i * 0.95;
      HE.cyl(stool, sx, F0 + 0.66, -7.45, 0.19, 0.19, 0.06, 18); HE.cyl(leg, sx, F0 + 0.02, -7.45, 0.015, 0.015, 0.64, 8, NE); HE.cyl(leg, sx, F0, -7.45, 0.17, 0.17, 0.02, 18, NE);
      HE.cyl(leg, sx, F0 + 0.25, -7.45, 0.13, 0.13, 0.012, 16, NE);
    }
    [-10.0, -8.8, -7.6].forEach(function (px) {
      B(leg, px - 0.005, 1.75, -8.405, px + 0.005, WT - F0, -8.395, NE);
      HE.cyl(dark, px, F0 + 1.55, -8.4, 0.045, 0.045, 0.2, 12, NE);
      HE.cyl(mat('plain', z, { color: 0xfff1cf, emissive: 0xffd08a, ei: 2.6 }), px, F0 + 1.545, -8.4, 0.035, 0.035, 0.008, 10, NE);
    });
    // Tafel aus Eiche für zehn
    var oak = mat('wood', z, { color: 0x8f6744, rot: 1, interior: 1, nog: 1 });
    B(oak, -4.9, 0.7, -8.65, -0.3, 0.76, -7.55);
    B(oak, -4.3, 0, -8.35, -4.2, 0.7, -7.85); B(oak, -1.0, 0, -8.35, -0.9, 0.7, -7.85);
    shade(z, -4.9, -8.65, -0.3, -7.55, 0, 0.42);
    var seat = mat('linen', z, { color: 0xc9bca6 }), seat2 = mat('leather', z, { color: 0x93512f });
    for (var c = 0; c < 5; c++) {
      var cx = -4.45 + c * 0.925, m = (c % 2) ? seat2 : seat;
      S(m, cx - 0.23, 0.4, -9.2, cx + 0.23, 0.48, -8.75, 0.03); S(m, cx - 0.23, 0.48, -9.25, cx + 0.23, 0.9, -9.17, 0.03, NE);
      S(m, cx - 0.23, 0.4, -7.45, cx + 0.23, 0.48, -7.0, 0.03); S(m, cx - 0.23, 0.48, -7.03, cx + 0.23, 0.9, -6.95, 0.03, NE);
      [[-0.2, -9.2], [0.2, -9.2], [-0.2, -8.8], [0.2, -8.8], [-0.2, -7.4], [0.2, -7.4], [-0.2, -7.0], [0.2, -7.0]].forEach(function (l) {
        B(leg, cx + l[0] - 0.012, 0, l[1] - 0.012, cx + l[0] + 0.012, 0.4, l[1] + 0.012, NE);
      });
    }
    vase(z, -3.4, 0.76, -8.1, 0.1, 0.42, 0xf0eadc); twigs(z, -3.4, 1.1, -8.1, 6, 0.5); greens(z, -3.4, 1.4, -8.1, 0.22, 60);
    vase(z, -1.5, 0.76, -8.1, 0.14, 0.5, 0x191715);
    HE.cyl(mat('plain', z, { color: 0xe7e0d2, rough: 0.5 }), -2.5, F0 + 0.76, -8.1, 0.12, 0.2, 0.07, 20, NE);
    dome(z, -3.7, -8.1, 1.6, 0.36); dome(z, -1.5, -8.1, 1.6, 0.36);
    HE.lamp(-2.6, F0 + 1.35, -8.1, 0xffd29a, 8, 9, z);
    HE.lamp(-8.8, F0 + 1.4, -8.4, 0xffd9a6, 5, 7, z);
    // Sideboard an der Ostwand
    B(wal, 0.3, 0.1, -10.6, 0.88, 0.85, -8.1); shade(z, 0.3, -10.6, 0.88, -8.1, 0, 0.35);
    art(z, 'z', 0.9, -10.3, -8.5, 1.05, 2.3, 0xe8e1d2, { side: -1, list: [[0.25, 1.55, 0.2, 0.5, 0x2a2622], [0.9, 1.3, 0.62, 1.02, 0xc8572a]] });
  })();

  // ================================================================ Arbeiten und Garderobe (bleiben lange Zeichnung)
  (function () {
    var z = 'rest';
    var oak = mat('wood', z, { color: 0x8f6744, interior: 1, nog: 1 }), dark = mat('metal', z, { color: 0x1c1a18 }), lin = mat('linen', z, { color: 0xd3c9b8 });
    B(oak, 2.6, 0.7, -9.7, 5.2, 0.75, -8.8); B(dark, 2.7, 0, -9.6, 2.76, 0.7, -8.9, NE); B(dark, 5.04, 0, -9.6, 5.1, 0.7, -8.9, NE);
    S(lin, 3.6, 0.42, -8.5, 4.2, 0.5, -7.95, 0.04); S(lin, 3.6, 0.5, -7.98, 4.2, 0.95, -7.9, 0.04, NE);
    B(oak, 8.35, 0, -10.7, 8.85, 2.5, -5.4);
    var cols = [0xb5432a, 0x2a3d55, 0xd9c7a4, 0x3a3a38, 0xc9a56a, 0x6a7a5a, 0xe8e1d2];
    for (var sh = 0; sh < 5; sh++) for (var k = 0; k < 26; k++) {
      var bz = -10.6 + k * 0.2 + rnd() * 0.02, bh = 0.24 + rnd() * 0.12;
      if (rnd() < 0.18) continue;
      B(mat('plain', z, { color: cols[(rnd() * cols.length) | 0], rough: 0.8 }), 8.3, 0.12 + sh * 0.47, bz, 8.36, 0.12 + sh * 0.47 + bh, bz + 0.03 + rnd() * 0.04, NE);
    }
    S(lin, 1.5, 0, -6.6, 3.6, 0.42, -5.7, 0.07); S(lin, 1.5, 0.42, -5.95, 3.6, 0.85, -5.7, 0.08, NE);
    B(mat('rug', z, { color: 0xa79b86 }), 1.8, 0, -9.9, 6.2, 0.012, -6.9);
    // Garderobe
    B(oak, -12.8, 0, 3.2, -12.2, 2.4, 5.0); B(mat('plaster', z, { interior: 1 }), -11.0, 0, 6.6, -9.1, 2.3, 6.7);
    HE.cyl(mat('plain', z, { color: 0xf3efe6, rough: 0.3 }), -12.3, F0, 7.3, 0.2, 0.22, 0.4, 16);
    B(oak, -10.6, 0.75, 7.45, -9.4, 0.8, 7.9);
  })();

  // ================================================================ Galerie
  (function () {
    var z = 'gal';
    art(z, 'z', 8.8, -3.8, -2.3, 0.75, 2.6, 0xeee7d8, { side: -1, list: [[0.25, 1.25, 0.3, 0.75, 0x1e1b19], [0.55, 0.95, 0.95, 1.35, 0xc8572a]] });
    art(z, 'z', 8.8, -0.9, 1.5, 0.55, 2.75, 0xe4d9c4, { side: -1, list: [[0.3, 2.1, 0.25, 0.4, 0x2a2622], [0.3, 1.3, 0.55, 0.7, 0x2a2622], [1.5, 2.0, 1.2, 1.7, 0x315a6b], [0.4, 0.8, 1.35, 1.75, 0xd9a441]] });
    art(z, 'z', 8.8, 2.7, 3.9, 0.9, 2.4, 0x23201d, { side: -1, list: [[0.3, 0.9, 0.3, 0.9, 0xb5432a]] });
    // Skulptur auf Sockel
    var trav = mat('travertine', z, { color: 0xd9cfbc });
    B(trav, 6.45, 0, -3.5, 6.9, 1.0, -3.05); shade(z, 6.45, -3.5, 6.9, -3.05, 0, 0.35);
    var blk = mat('plain', z, { color: 0x1a1816, rough: 0.35 });
    HE.sphere(blk, 6.675, F0 + 1.19, -3.275, 0.19, 1, 1, 1); HE.sphere(blk, 6.675, F0 + 1.5, -3.275, 0.14, 1, 1, 1); HE.sphere(blk, 6.675, F0 + 1.73, -3.275, 0.1, 1, 1, 1);
    // Bank
    var oak = mat('wood', z, { color: 0x9a7048, rot: 1, interior: 1, nog: 1 });
    B(oak, 8.3, 0.38, 4.2, 8.8, 0.44, 6.4); B(oak, 8.34, 0, 4.3, 8.76, 0.38, 4.4); B(oak, 8.34, 0, 6.2, 8.76, 0.38, 6.3);
    shade(z, 8.3, 4.2, 8.8, 6.4, 0, 0.3);
    // zweiter Sockel
    B(trav, 6.45, 0, 3.2, 6.9, 0.8, 3.65); shade(z, 6.45, 3.2, 6.9, 3.65, 0, 0.3);
    HE.cyl(mat('plain', z, { color: 0xe9e2d4, rough: 0.6 }), 6.675, F0 + 0.8, 3.425, 0.12, 0.12, 0.1, 18); HE.cyl(blk, 6.675, F0 + 0.9, 3.425, 0.15, 0.15, 0.06, 18);
    HE.cyl(mat('plain', z, { color: 0xe9e2d4, rough: 0.6 }), 6.675, F0 + 0.96, 3.425, 0.1, 0.1, 0.12, 18); HE.cyl(blk, 6.675, F0 + 1.08, 3.425, 0.13, 0.13, 0.05, 18);
    HE.lamp(7.5, F0 + 2.7, 0.5, 0xfff0dc, 4, 10, z);
    // Vorraum zum Schlafen
    vase(z, 6.6, 0, 7.3, 0.3, 0.7, 0xe9e2d4); twigs(z, 6.6, 0.6, 7.3, 10, 1.3);
  })();

  // ================================================================ Schlafen
  (function () {
    var z = 'sch';
    // Wand aus geflämmter Lärche hinter dem Bett
    B(mat('charred', z, { interior: 1 }), 9.25, 0, 8.1, 12.75, WT - F0 - 0.02, 8.15);
    var wood = mat('wood', z, { color: 0x6a4630, rot: 1, interior: 1, nog: 1 }), lin = mat('linen', z, { color: 0xf1ece2 }), lea = mat('leather', z, { color: 0x9a4e30 });
    S(lea, 9.55, 0.3, 8.15, 12.45, 1.2, 8.3, 0.05);
    B(wood, 9.75, 0.08, 8.3, 12.25, 0.3, 10.55); B(mat('metal', z, { color: 0x1c1a18 }), 9.9, 0, 8.4, 12.1, 0.08, 10.45, NE);
    S(lin, 9.85, 0.3, 8.32, 12.15, 0.58, 10.45, 0.08);
    S(mat('linen', z, { color: 0xe6dfd2 }), 9.82, 0.5, 9.0, 12.18, 0.63, 10.48, 0.06, NE);
    S(mat('linen', z, { color: 0xc99a3c }), 9.8, 0.55, 9.75, 12.2, 0.66, 10.25, 0.05, NE);
    S(lin, 10.0, 0.58, 8.38, 10.9, 0.8, 8.85, 0.1, NE); S(lin, 11.1, 0.58, 8.38, 12.0, 0.8, 8.85, 0.1, NE);
    S(mat('linen', z, { color: 0xc8703c }), 10.72, 0.6, 8.75, 11.28, 0.78, 8.98, 0.08, NE);
    shade(z, 9.75, 8.3, 12.25, 10.55, 0, 0.5);
    // Nachttische und Leuchten
    [[9.2, 9.68], [12.32, 12.8]].forEach(function (t, i) {
      B(wood, t[0], 0, 8.2, t[1], 0.5, 8.68);
      var cx = (t[0] + t[1]) / 2;
      HE.sphere(mat('plain', z, { color: 0xefe9dc, rough: 0.5 }), cx, F0 + 0.63, 8.44, 0.13, 1, 1, 1, NE);
      HE.cyl(mat('linen', z, { color: 0xfff3da, emissive: 0xffd9a0, ei: 1.7 }), cx, F0 + 0.78, 8.44, 0.14, 0.11, 0.2, 16, NE);
      if (i === 0) B(mat('plain', z, { color: 0xb5432a, rough: 0.8 }), t[0] + 0.05, 0.5, 8.24, t[0] + 0.3, 0.54, 8.4, NE);
    });
    HE.lamp(11.0, F0 + 0.95, 8.75, 0xffd29a, 7, 8, z);
    // Bank am Fußende, Teppich, Sessel
    S(mat('linen', z, { color: 0xd3c9b8 }), 10.05, 0.18, 10.75, 11.95, 0.44, 11.25, 0.07); B(wood, 10.1, 0, 10.8, 11.9, 0.18, 11.2);
    S(mat('linen', z, { color: 0x7d8468 }), 11.2, 0.44, 10.82, 11.8, 0.5, 11.18, 0.03, NE);
    shade(z, 10.05, 10.75, 11.95, 11.25, 0, 0.35);
    B(mat('rug', z, { color: 0xc4b89f }), 8.9, 0, 8.7, 13.0, 0.012, 11.9);
    HE.chair(14.5, 11.9, 2.4, z);
    // Vorhänge an der Glaswand
    var cur = mat('linen', z, { color: 0xe9e3d6 });
    for (var i = 0; i < 6; i++) { S(cur, 6.45 + i * 0.07, 0, 12.55, 6.53 + i * 0.07, 3.0, 12.72, 0.03, NE); S(cur, 14.75 + i * 0.07, 0, 12.55, 14.83 + i * 0.07, 3.0, 12.72, 0.03, NE); }
    vase(z, 14.9, 0, 8.6, 0.26, 0.6, 0xefe9dc);
  })();

  // ================================================================ Ankleide und Bad
  (function () {
    var z = 'bad';
    var wood = mat('wood', z, { color: 0x6a4630, interior: 1, nog: 1 }), brass = mat('metal', z, { color: 0xb08a4a, rough: 0.3, metal: 0.95 });
    // Ankleide: offenes Regal mit Kleiderstange
    B(wood, 9.2, 0, 5.1, 11.7, 0.5, 5.65); B(wood, 9.2, 2.2, 5.1, 11.7, 2.26, 5.65); B(wood, 9.2, 0, 5.1, 9.26, 2.26, 5.65); B(wood, 11.64, 0, 5.1, 11.7, 2.26, 5.65);
    B(brass, 9.26, 1.95, 5.36, 11.64, 1.97, 5.38, NE);
    var cols = [0xe9e3d6, 0x2a2622, 0x9a8a6a, 0xc8703c, 0x4a5a48, 0xd9c7a4, 0x6a4630, 0xefe9dc];
    for (var i = 0; i < 16; i++) {
      var cx = 9.4 + i * 0.14;
      S(mat('linen', z, { color: cols[i % cols.length] }), cx, 0.85 + (i % 3) * 0.12, 5.2, cx + 0.09, 1.93, 5.56, 0.03, NE);
    }
    for (var k = 0; k < 5; k++) S(mat('leather', z, { color: k % 2 ? 0x2a2622 : 0x8a4a2e }), 9.4 + k * 0.45, 0.5, 5.2, 9.7 + k * 0.45, 0.62, 5.5, 0.04, NE);
    B(mat('rug', z, { color: 0xb5a78f }), 9.4, 0, 5.9, 11.5, 0.012, 7.6);
    // Bad: Wanne frei vor dem Fenster, Waschtisch an der Ostwand
    var white = mat('plain', z, { color: 0xf5f2ec, rough: 0.25, double: 1 });
    var tub = new T.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5); tub.scale(0.92, 0.6, 0.44); tub.translate(14.05, F0 + 0.6, 5.85);
    HE.addGeo(tub, white, { edgeAngle: 60 });
    var rim = new T.TorusGeometry(1, 0.035, 8, 40); rim.rotateX(Math.PI / 2); rim.scale(0.92, 1, 0.44); rim.translate(14.05, F0 + 0.6, 5.85);
    HE.addGeo(rim, white, { edges: false });
    HE.cyl(mat('water', z, { color: 0x6f9aa0 }), 14.05, F0 + 0.5, 5.85, 0.4, 0.4, 0.01, 24, NE);
    shade(z, 13.2, 5.45, 14.9, 6.25, 0, 0.5);
    HE.cyl(brass, 13.0, F0, 6.35, 0.02, 0.02, 0.95, 8, NE); B(brass, 13.0, 0.93, 6.2, 13.02, 0.95, 6.36, NE);
    B(wood, 14.85, 0.3, 6.3, 15.3, 0.82, 7.75); B(mat('marble', z), 14.82, 0.82, 6.27, 15.3, 0.86, 7.78);
    HE.cyl(mat('plain', z, { color: 0xf5f2ec, rough: 0.25 }), 15.05, F0 + 0.86, 6.7, 0.17, 0.2, 0.1, 20); HE.cyl(mat('plain', z, { color: 0xf5f2ec, rough: 0.25 }), 15.05, F0 + 0.86, 7.35, 0.17, 0.2, 0.1, 20);
    B(mat('metal', z, { color: 0xe9eef2, rough: 0.03, metal: 1, env: 1.5 }), 15.26, 1.1, 6.35, 15.29, 2.3, 7.7);
    B(mat('plain', z, { color: 0xfff1cf, emissive: 0xffd08a, ei: 2.0 }), 15.24, 1.2, 6.27, 15.28, 2.2, 6.31, NE);
    B(mat('plain', z, { color: 0xfff1cf, emissive: 0xffd08a, ei: 2.0 }), 15.24, 1.2, 7.74, 15.28, 2.2, 7.78, NE);
    HE.cyl(mat('wood', z, { color: 0x9a7048 }), 12.5, F0, 5.6, 0.2, 0.2, 0.45, 16); S(mat('linen', z, { color: 0x7d8468 }), 12.34, 0.45, 5.44, 12.66, 0.53, 5.76, 0.03, NE);
    B(mat('rug', z, { color: 0x8f8472 }), 13.2, 0, 6.5, 14.6, 0.012, 7.3);
    HE.lamp(13.6, F0 + 2.3, 6.6, 0xffe2bd, 5, 7, z);
  })();
})();
