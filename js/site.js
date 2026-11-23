/* Haus Eiche · Grundstück, Hof, Garten, Himmel und Licht */
(function () {
  'use strict';
  var HE = window.HE; if (!HE || !HE.ok) return;
  var T = HE.T, D = HE.D, box = HE.box, mat = HE.mat, rnd = HE.rnd;
  var F0 = D.F0, WT = D.WT;

  // ---------------------------------------------------------------- Gelände
  function hash(ix, iz) { var s = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vn(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }
  var c01 = function (x) { return Math.min(1, Math.max(0, x)); };
  var sm = function (x) { x = c01(x); return x * x * (3 - 2 * x); };
  function ground(x, z) {
    var dist = Math.max(Math.abs(x - 1), (4 - z) * 1.05);
    var edgeS = 21 + 9 * sm((-x - 1) / 6);
    var s = Math.max(sm((dist - 40) / 50), sm((z - edgeS) / 16));
    var valley = -42 * (1 - Math.exp(-Math.max(0, z - edgeS) / 45)) + 120 * sm((z - 300) / 520);
    var north = 30 * sm((-z - 60) / 320) + 10 * sm((Math.abs(x) - 120) / 300);
    var roll = (vn(x * 0.005, z * 0.005) - 0.5) * 34 * sm((dist - 80) / 200) + (vn(x * 0.02 + 9, z * 0.02) - 0.5) * 6;
    return s * (valley + north + roll);
  }
  HE.ground = ground;
  (function () {
    var N = 130, S = 2600, g = new T.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2);
    var P = g.attributes.position.array, i;
    for (i = 0; i < P.length; i += 3) P[i + 1] = ground(P[i], P[i + 2]);
    g.computeVertexNormals();
    HE.addGeo(g, mat('grass', 'ext', { ground: 1 }), { edges: false, base: -100 });
    // See im Tal
    var w = new T.PlaneGeometry(S, 200); w.rotateX(-Math.PI / 2); w.translate(0, -41.2, 300);
    HE.addGeo(w, mat('water', 'ext', { ground: 1, color: 0x2a4a55 }), { edges: false, base: -100 });
  })();
  var pav = mat('paving', 'ext', { ground: 1 });
  box(pav, -7.7, -0.3, 10.4, -5.3, 0.03, 29, { base: -1 });

  // ---------------------------------------------------------------- Bäume
  function limb(m, a, b, r0, r1, o) {
    var dir = new T.Vector3().subVectors(b, a), len = dir.length();
    var g = new T.CylinderGeometry(r1, r0, len, 8);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()));
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    HE.addGeo(g, m, o);
  }
  function ring(zone, cx, cy, cz, R, base) {
    var seg = 32, q, pl, pts = [];
    for (pl = 0; pl < 3; pl++) for (q = 0; q < seg; q++) {
      var a0 = q / seg * Math.PI * 2, a1 = (q + 1) / seg * Math.PI * 2;
      var c0 = Math.cos(a0) * R, s0 = Math.sin(a0) * R, c1 = Math.cos(a1) * R, s1 = Math.sin(a1) * R;
      if (pl === 0) pts.push(cx + c0, cy, cz + s0, cx + c1, cy, cz + s1);
      if (pl === 1) pts.push(cx + c0, cy + s0, cz, cx + c1, cy + s1, cz);
      if (pl === 2) pts.push(cx, cy + s0, cz + c0, cx, cy + s1, cz + c1);
    }
    HE.addLines(zone, pts, base, true);
  }
  function leaves(m, blobs, n, size, base) {
    var pts = [], i;
    for (i = 0; i < n; i++) {
      var b = blobs[(rnd() * blobs.length) | 0];
      var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = b[3] * (0.82 + rnd() * 0.3);
      var px = b[0] + s * Math.cos(th) * rr * (b[4] || 1), py = b[1] + u * rr * (b[5] || 1), pz = b[2] + s * Math.sin(th) * rr * (b[4] || 1);
      var ax = rnd() - 0.5, ay = rnd() - 0.5, az = rnd() - 0.5, bx = rnd() - 0.5, by = rnd() - 0.5, bz = rnd() - 0.5;
      var la = Math.sqrt(ax * ax + ay * ay + az * az) || 1, lb = Math.sqrt(bx * bx + by * by + bz * bz) || 1, sz = size * (0.7 + rnd() * 0.7);
      ax *= sz / la; ay *= sz / la; az *= sz / la; bx *= sz * 0.7 / lb; by *= sz * 0.7 / lb; bz *= sz * 0.7 / lb;
      pts.push(px - ax, py - ay, pz - az, px + bx, py + by, pz + bz, px + ax, py + ay, pz + az,
        px - ax, py - ay, pz - az, px + ax, py + ay, pz + az, px - bx, py - by, pz - bz);
    }
    HE.tris(m, pts, { base: base, edges: false });
  }
  // große Eiche: Stamm, drei Starkäste, Krone aus Kugeln und Blattflächen
  function oak(zone, x, y, z, k, leafN, ls) {
    var bark = mat('bark', zone, { free: 1 }), core = mat('leaf', zone, { free: 1, color: 0x3f5a2a, flat: 1 });
    var leaf = mat('leaf', zone, { free: 1, double: 1, realOnly: 1, color: 0x6a8c40 });
    var v = function (a, b, c) { return new T.Vector3(x + a * k, y + b * k, z + c * k); };
    limb(bark, v(0, 0, 0), v(0.08, 2.3, 0.05), 0.46 * k, 0.34 * k, { edgeAngle: 50 });
    limb(bark, v(0.08, 2.3, 0.05), v(-1.5, 4.6, 0.7), 0.27 * k, 0.13 * k, { edgeAngle: 50 });
    limb(bark, v(0.08, 2.3, 0.05), v(1.6, 4.9, -0.5), 0.26 * k, 0.12 * k, { edgeAngle: 50 });
    limb(bark, v(0.08, 2.3, 0.05), v(0.2, 5.4, -1.3), 0.22 * k, 0.1 * k, { edgeAngle: 50 });
    limb(bark, v(-1.5, 4.6, 0.7), v(-2.8, 5.6, 1.8), 0.12 * k, 0.05 * k, { edges: false });
    limb(bark, v(1.6, 4.9, -0.5), v(3.0, 5.8, 0.6), 0.11 * k, 0.05 * k, { edges: false });
    var raw = [[-1.9, 5.5, 1.1, 1.9], [1.9, 5.7, -0.3, 2.0], [0.2, 6.5, -1.5, 1.9], [0.1, 7.0, 0.4, 2.2], [-2.9, 5.8, 2.0, 1.4], [3.1, 5.9, 0.9, 1.5],
      [-0.6, 5.6, 2.4, 1.5], [1.2, 5.4, 2.0, 1.4], [-1.6, 6.3, -1.4, 1.6], [2.2, 6.6, -1.7, 1.4]];
    var blobs = raw.map(function (b) { return [x + b[0] * k, y + b[1] * k, z + b[2] * k, b[3] * k]; });
    blobs.forEach(function (b, i) {
      var g = new T.IcosahedronGeometry(b[3] * 0.82, 1); g.translate(b[0], b[1], b[2]);
      HE.addGeo(g, core, { flat: true, edges: false, base: y + 2.6 * k });
      if (i < 4) ring(zone, b[0], b[1], b[2], b[3], y + 2.6 * k);
    });
    leaves(leaf, blobs, leafN, 0.26 * k * (ls || 1), y + 2.6 * k);
  }
  HE.oak = oak;
  // Säulenhainbuche
  function column(zone, x, y, z, h) {
    var bark = mat('bark', zone, { free: 1 }), core = mat('leaf', zone, { free: 1, color: 0x35502a, flat: 1 });
    var leaf = mat('leaf', zone, { free: 1, double: 1, realOnly: 1, color: 0x587a38 });
    HE.cyl(bark, x, y, z, 0.1, 0.07, h * 0.3, 7, { edges: false });
    var g = new T.IcosahedronGeometry(1, 1); g.scale(h * 0.15, h * 0.42, h * 0.15); g.translate(x, y + h * 0.58, z);
    HE.addGeo(g, core, { flat: true, edges: false, base: y + 1.0 });
    ring(zone, x, y + h * 0.58, z, h * 0.16, y + 1.0);
    leaves(leaf, [[x, y + h * 0.58, z, h * 0.17, 1, 2.6]], 360, 0.2, y + 1.0);
  }
  // ferne Bäume: nur Kugeln
  function blob(x, z, h, r) {
    var y = ground(x, z);
    var core = mat('leaf', 'ext', { free: 1, color: 0x3c5a2c, flat: 1 });
    HE.cyl(mat('bark', 'ext', { free: 1 }), x, y, z, 0.16, 0.1, h * 0.5, 6, { edges: false });
    for (var i = 0; i < 2; i++) {
      var g = new T.IcosahedronGeometry(r * (0.8 + rnd() * 0.4), 0);
      g.translate(x + (rnd() - 0.5) * r, y + h * 0.5 + r * 0.5 + (rnd() - 0.3) * r * 0.7, z + (rnd() - 0.5) * r);
      HE.addGeo(g, core, { flat: true, edges: false, base: y + 2 });
    }
  }
  (function () {
    HE.reseed(77);
    var i;
    for (i = 0; i < 260; i++) {
      var ang = rnd() * Math.PI * 2, rad = 60 + rnd() * 520, x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (z > 16 && z < 150 && Math.abs(x) < 40 + (z - 16) * 0.5) continue;
      if (ground(x, z) < -39) continue;
      blob(x, z, 6 + rnd() * 5, 2.2 + rnd() * 2.2);
    }
    // Garten
    oak('ext', -19, 0, -2, 0.7, 2200, 0.7);
    oak('ext', 22, 0, -9, 0.62, 2000, 0.7);
    oak('ext', -17, 0, 17, 0.55, 1800, 0.7);
    column('ext', 3.2, ground(3.2, 19.8) - 0.1, 19.8, 6.2); column('ext', 1.2, ground(1.2, 20.6) - 0.1, 20.6, 5.6); column('ext', 5.2, ground(5.2, 20.9) - 0.1, 20.9, 6.6);
    column('ext', -15.4, 0, 9.6, 5.8); column('ext', -15.9, 0, 11.6, 5.2);
    oak('ext', -13.5, 0, 24.0, 0.55, 1800, 0.7);
  })();

  // ---------------------------------------------------------------- Hof
  (function () {
    var z = 'hof';
    box(mat('paving', z, { color: 0xcfc7b8 }), -3.8, 0, -4.8, 5.8, F0, 4.8, { edges: false });
    // Baumscheibe mit Sitzring
    var prof = [new T.Vector2(1.5, 0), new T.Vector2(2.0, 0), new T.Vector2(2.0, 0.44), new T.Vector2(1.5, 0.44), new T.Vector2(1.5, 0)];
    var lg = new T.LatheGeometry(prof, 48); lg.translate(1, F0, 0);
    HE.addGeo(lg, mat('stone', z, { color: 0xd5cdbc }), { edgeAngle: 40 });
    HE.cyl(mat('gravel', z), 1, F0, 0, 1.5, 1.5, 0.34, 40, { edges: false });
    oak(z, 1, F0 + 0.3, 0, 1.0, 9000, 0.6);
    // Wasserbecken an der Südmauer
    var st = mat('stone', z, { color: 0xc9c1b0 });
    box(st, -3.2, F0, 3.25, 5.2, F0 + 0.42, 3.4); box(st, -3.2, F0, 4.55, 5.2, F0 + 0.42, 4.7);
    box(st, -3.2, F0, 3.4, -3.05, F0 + 0.42, 4.55); box(st, 5.05, F0, 3.4, 5.2, F0 + 0.42, 4.55);
    box(mat('water', z), -3.05, F0, 3.4, 5.05, F0 + 0.34, 4.55, { edges: false });
    // zwei Liegen
    var wood = mat('wood', z, { color: 0x8a6a4a }), lin = mat('linen', z, { color: 0xe9e3d6 });
    [[-3.3, 0.4], [-3.3, 1.6]].forEach(function (p) {
      box(wood, p[0], F0 + 0.12, p[1], p[0] + 2.0, F0 + 0.24, p[1] + 0.72);
      HE.soft(lin, p[0] + 0.03, F0 + 0.24, p[1] + 0.04, p[0] + 1.97, F0 + 0.36, p[1] + 0.68, 0.05);
      HE.soft(lin, p[0] + 1.45, F0 + 0.36, p[1] + 0.08, p[0] + 1.95, F0 + 0.5, p[1] + 0.64, 0.06, { edges: false });
    });
    // Pflanzkübel
    var con = mat('concrete', z, { color: 0x8f8b84 }), box2 = mat('leaf', z, { color: 0x4c6b36, flat: 1 });
    [[-3.2, -4.2], [-3.2, 2.6], [5.2, -4.2]].forEach(function (p) {
      HE.cyl(con, p[0], F0, p[1], 0.3, 0.38, 0.55, 20);
      var g = new T.IcosahedronGeometry(0.46, 1); g.translate(p[0], F0 + 0.9, p[1]);
      HE.addGeo(g, box2, { flat: true, edges: false });
    });
  })();

  // ---------------------------------------------------------------- Gartenterrasse mit Feuerschale
  (function () {
    var z = 'gar';
    var pv = mat('paving', z, { color: 0xcfc7b8 });
    box(pv, 5.2, 0, 13.2, 16.4, F0, 17.8, { edges: false });
    box(pv, 6.2, 0, 17.8, 15.4, 0.3, 18.2); box(pv, 6.2, 0, 18.2, 15.4, 0.15, 18.6);
    box(mat('concrete', z), 16.4, 0, 13.2, 16.8, F0 + 0.5, 17.8); // Sitzmauer
    // Feuerschale
    var steel = mat('metal', z, { color: 0x1f1b18, rough: 0.6 });
    var fx = 8.4, fz = 16.2;
    HE.cyl(steel, fx, F0, fz, 0.22, 0.16, 0.3, 16);
    var bowl = new T.SphereGeometry(0.62, 28, 12, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38); bowl.translate(fx, F0 + 0.86, fz);
    HE.addGeo(bowl, mat('metal', z, { color: 0x1f1b18, rough: 0.6, double: 1 }), { edgeAngle: 60 });
    var rock = mat('plain', z, { color: 0x3a3430, rough: 0.9 });
    for (var i = 0; i < 9; i++) HE.sphere(rock, fx + (rnd() - 0.5) * 0.7, F0 + 0.47 + rnd() * 0.06, fz + (rnd() - 0.5) * 0.7, 0.09 + rnd() * 0.05, 1, 0.8, 1, { edges: false });
    HE.fire = { x: fx, y: F0 + 0.5, z: fz };
    // drei Sessel
    function chair(cx, cz, rot, zn) {
      zn = zn || z;
      var lin = mat('linen', zn, { color: 0xece6da }), wood = mat('wood', zn, { color: 0x7a5236 }), cush = mat('linen', zn, { color: 0xc8703c });
      var grp = [];
      function add(m, x0, y0, z0, x1, y1, z1, r, e) { grp.push([m, x0, y0, z0, x1, y1, z1, r, e]); }
      add(wood, -0.48, 0.0, -0.46, 0.48, 0.16, 0.46, 0);
      add(lin, -0.46, 0.16, -0.44, 0.46, 0.42, 0.44, 0.08);
      add(lin, -0.5, 0.16, 0.28, 0.5, 0.82, 0.5, 0.09);
      add(lin, -0.5, 0.16, -0.44, -0.3, 0.62, 0.44, 0.08); add(lin, 0.3, 0.16, -0.44, 0.5, 0.62, 0.44, 0.08);
      add(cush, -0.22, 0.42, 0.12, 0.22, 0.72, 0.3, 0.08, 1);
      grp.forEach(function (b) {
        var w = b[4] - b[1], h = b[5] - b[2], d = b[6] - b[3];
        var g = b[7] ? softGeo(w, h, d, b[7]) : new T.BoxGeometry(w, h, d);
        g.translate((b[1] + b[4]) / 2, (b[2] + b[5]) / 2, (b[3] + b[6]) / 2); g.rotateY(rot); g.translate(cx, F0, cz);
        var eg = new T.BoxGeometry(w, h, d); eg.translate((b[1] + b[4]) / 2, (b[2] + b[5]) / 2, (b[3] + b[6]) / 2); eg.rotateY(rot); eg.translate(cx, F0, cz);
        HE.addGeo(g, b[0], { edgeGeo: eg, edges: !b[8] });
      });
    }
    HE.chair = chair;
    chair(8.5, 17.7, 0.15); chair(6.8, 16.3, -1.45); chair(7.3, 14.7, -2.5);
    HE.cyl(mat('stone', z), 9.7, F0, 17.5, 0.24, 0.24, 0.4, 20);
    // Gräser am Terrassenrand
    var gr = mat('leaf', z, { color: 0x8c9a58, double: 1, realOnly: 1 });
    var pts = [];
    for (var k = 0; k < 420; k++) {
      var gx = 5.4 + rnd() * 11.4, gz = 18.9 + rnd() * 1.6, gh = 0.5 + rnd() * 0.7, a = rnd() * Math.PI, lean = (rnd() - 0.5) * 0.5;
      var dx = Math.cos(a) * 0.035, dz = Math.sin(a) * 0.035;
      pts.push(gx - dx, 0, gz - dz, gx + dx, 0, gz + dz, gx + lean, gh, gz + lean * 0.5);
    }
    HE.tris(gr, pts, { base: 0, edges: false });
  })();
  function softGeo(w, h, d, r) {
    r = Math.min(r, w / 2, h / 2, d / 2);
    var g = new T.BoxGeometry(w, h, d, 5, 3, 5).toNonIndexed(), P = g.attributes.position.array, i;
    for (i = 0; i < P.length; i += 3) {
      var cx = Math.max(-w / 2 + r, Math.min(w / 2 - r, P[i])), cy = Math.max(-h / 2 + r, Math.min(h / 2 - r, P[i + 1])), cz = Math.max(-d / 2 + r, Math.min(d / 2 - r, P[i + 2]));
      var dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - cz, l = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (l > 1e-6) { P[i] = cx + dx / l * r; P[i + 1] = cy + dy / l * r; P[i + 2] = cz + dz / l * r; }
    }
    g.computeVertexNormals();
    return g;
  }
  HE.softGeo = softGeo;

  // ---------------------------------------------------------------- Himmel
  var SKY_GLSL = [
    'uniform vec3 uSun; uniform float uDusk;',
    'float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }',
    'vec3 skyCol(vec3 d) {',
    '  float h = d.y;',
    '  vec3 zen = mix(vec3(0.20, 0.38, 0.66), vec3(0.16, 0.22, 0.42), uDusk);',
    '  vec3 hor = mix(vec3(0.80, 0.84, 0.86), vec3(0.98, 0.66, 0.42), uDusk);',
    '  vec3 sky = mix(hor, zen, pow(clamp(h, 0.0, 1.0), mix(0.55, 0.42, uDusk)));',
    '  float sd = max(0.0, dot(d, normalize(uSun)));',
    '  vec3 sunC = mix(vec3(1.0, 0.92, 0.78), vec3(1.0, 0.62, 0.32), uDusk);',
    '  sky += sunC * (pow(sd, 6.0) * 0.28 + pow(sd, 60.0) * 0.6 + pow(sd, 900.0) * 6.0);',
    '  float cl = vn2(d.xz / max(d.y + 0.12, 0.05) * 1.3) * vn2(d.xz / max(d.y + 0.12, 0.05) * 3.7 + 4.0);',
    '  sky = mix(sky, mix(vec3(1.0), sunC, 0.5 + 0.4 * uDusk) * (0.9 + 0.3 * sd), smoothstep(0.34, 0.7, cl) * 0.5 * smoothstep(0.02, 0.25, h));',
    '  vec3 gr = mix(vec3(0.42, 0.44, 0.36), vec3(0.36, 0.30, 0.24), uDusk);',
    '  return h > 0.0 ? sky : mix(hor, gr, smoothstep(0.0, -0.25, h));',
    '}'
  ].join('\n');
  var skyU = HE.skyU = { uSun: { value: new T.Vector3(-0.56, 0.4, 0.74) }, uDusk: HE.U.uDusk, uPaper: HE.U.uPaper, uAmt: { value: 0 } };
  var sky = new T.Mesh(new T.SphereGeometry(4500, 48, 24), new T.ShaderMaterial({
    uniforms: skyU, side: T.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: SKY_GLSL + '\nuniform vec3 uPaper; uniform float uAmt; varying vec3 vP;\nvoid main(){ gl_FragColor = vec4(skyCol(normalize(vP)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n gl_FragColor.rgb = mix(uPaper, gl_FragColor.rgb, uAmt); }'
  }));
  sky.frustumCulled = false; sky.renderOrder = -10;
  HE.scene.add(sky);
  // Umgebung für Spiegelungen: derselbe Himmel, einmal am Nachmittag, einmal am Abend
  HE.makeEnv = function (sunDir, dusk) {
    var es = new T.Scene();
    es.add(new T.Mesh(new T.SphereGeometry(12, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, uniforms: { uSun: { value: sunDir.clone() }, uDusk: { value: dusk } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: SKY_GLSL + '\nvarying vec3 vP;\nvoid main(){ gl_FragColor = vec4(min(skyCol(normalize(vP)), vec3(4.0)), 1.0); }'
    })));
    var pm = new T.PMREMGenerator(HE.renderer);
    var tex = pm.fromScene(es, 0.02).texture;
    pm.dispose();
    return tex;
  };

  // ---------------------------------------------------------------- Licht
  var sun = HE.sun = new T.DirectionalLight(0xfff0d8, 3.4);
  sun.castShadow = true;
  var ms = HE.small ? 2048 : 4096;
  sun.shadow.mapSize.set(ms, ms);
  var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 10; sc.far = 260;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.target.position.set(1, 0, 3);
  HE.scene.add(sun, sun.target);
  HE.hemi = new T.HemisphereLight(0xcfe0ff, 0x9a8f78, 0.9);
  HE.scene.add(HE.hemi);
  HE.fill = new T.DirectionalLight(0xdbe6ff, 0.5);
  HE.fill.position.set(10, 12, -26);
  HE.scene.add(HE.fill);
  // Raumleuchten: [x, y, z, Farbe, Stärke, Reichweite, Zone]
  HE.lamps = [];
  HE.lamp = function (x, y, z, color, power, dist, zone, flicker) {
    var l = new T.PointLight(color, 0, dist, 1.8);
    l.position.set(x, y, z);
    HE.scene.add(l);
    HE.lamps.push({ l: l, power: power, zone: zone, flicker: !!flicker });
    return l;
  };
  HE.lamp(HE.fire.x, HE.fire.y + 0.55, HE.fire.z, 0xff9a4a, 9, 9, 'gar', true);

  // ---------------------------------------------------------------- Flammen
  HE.flames = [];
  HE.flame = function (x, y, z, w, h, zone) {
    var u = { uTime: HE.U.uTime, uOn: { value: 0 }, uSeed: { value: HE.flames.length * 3.7 } };
    var m = new T.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform float uTime; uniform float uOn; uniform float uSeed; varying vec2 vUv;',
        'float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
        'float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }',
        'void main(){',
        '  vec2 p = vUv; float t = uTime * 1.6 + uSeed;',
        '  float n = vn2(vec2(p.x * 3.2 + uSeed, p.y * 2.4 - t * 1.3)) * 0.6 + vn2(vec2(p.x * 7.0, p.y * 5.0 - t * 2.4)) * 0.4;',
        '  float w = (1.0 - p.y) * 0.5 * (0.6 + 0.6 * n);',
        '  float body = smoothstep(w, w * 0.3, abs(p.x - 0.5 + (n - 0.5) * 0.25 * p.y)) * smoothstep(1.0, 0.25 + 0.5 * n, p.y) * smoothstep(0.0, 0.08, p.y);',
        '  vec3 c = mix(vec3(1.0, 0.25, 0.04), vec3(1.0, 0.82, 0.38), body * (1.0 - p.y));',
        '  gl_FragColor = vec4(c * body * 1.6 * uOn, body * uOn);',
        '}'
      ].join('\n')
    });
    for (var i = 0; i < 3; i++) {
      var g = new T.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
      var p = new T.Mesh(g, m); p.position.set(x, y, z); p.rotation.y = i * Math.PI / 3; p.frustumCulled = false; p.renderOrder = 8;
      HE.scene.add(p);
    }
    HE.flames.push({ u: u, zone: zone });
  };
  HE.flame(HE.fire.x, HE.fire.y, HE.fire.z, 0.95, 1.15, 'gar');
})();
