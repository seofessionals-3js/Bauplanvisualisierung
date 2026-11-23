/* Haus Eiche · Engine
   Ein Modell, zwei Darstellungen: Blaupause (Linie auf Blau) oder gebautes Material.
   Welche gilt, entscheidet pro Pixel der Wischer der jeweiligen Raumzone.
   Alle Materialien entstehen im Shader, es gibt keine Bilddateien. Nur three.js. */
(function () {
  'use strict';
  var T = window.THREE;
  var HE = window.HE = { ok: false };
  if (!T) return;
  var canvas = document.getElementById('gl');
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  if (!renderer.capabilities.isWebGL2) return;
  HE.ok = true;
  HE.T = T;
  HE.renderer = renderer;
  HE.small = Math.min(window.innerWidth, window.innerHeight) < 700 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  HE.maxDpr = HE.small ? 1.5 : 2;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HE.maxDpr));
  renderer.setClearColor(0x0f2748, 1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = HE.scene = new T.Scene();
  scene.fog = new T.Fog(0xd8cdbb, 120, 1500);
  HE.camera = new T.PerspectiveCamera(30, 1, 0.1, 6000);

  // ------------------------------------------------------------ Maße
  var D = HE.D = {
    F0: 0.45,        // Oberkante Fertigfußboden (Haus steht auf einem Sockel)
    WT: 3.65,        // Oberkante Wand
    CUT0: 1.65,      // Schnitthöhe Grundriss (1,20 m über Boden)
    SH: 21           // halbe Blattgröße in m
  };
  var hex3 = function (h) { return new T.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255); };
  HE.hex3 = hex3;

  var U = HE.U = {
    uCut: { value: D.CUT0 },
    uCutFree: { value: D.CUT0 },
    uCutMax: { value: D.WT + 0.02 },
    uSheet: { value: null },
    uSheetHalf: { value: D.SH },
    uSheetC: { value: new T.Vector2(1.2, 1.0) },
    uFloorAnn: { value: 0 },
    uPaper: { value: hex3(0x0f2748) },
    uFill: { value: hex3(0x18386a) },
    uInk: { value: hex3(0xd6e6ff) },
    uAccent: { value: hex3(0xffb454) },
    uRoll: { value: -1e6 },
    uTime: { value: 0 },
    uDusk: { value: 0 }
  };
  var zones = HE.zones = {};
  HE.zone = function (name, x, y, z, w) {
    zones[name] = { uZO: { value: new T.Vector3(x, y, z) }, uZR: { value: 0 }, uZW: { value: w || 1.2 } };
    return zones[name];
  };

  // ------------------------------------------------------------ GLSL
  var KIND = HE.KIND = {
    plain: 0, brick: 1, stone: 2, glass: 3, zinc: 4, wood: 5, paving: 6, oakFloor: 11, plaster: 12, travertine: 13,
    linen: 14, concrete: 15, grass: 16, gravel: 17, water: 18, charred: 19, bark: 20, leather: 21, rug: 22, marble: 23, metal: 24, leaf: 25
  };
  var BASE = {
    plain: { color: 0xe8e2d6, roughness: 0.84 },
    brick: { color: 0xc8b196, roughness: 0.88 },
    stone: { color: 0xdad3c4, roughness: 0.76 },
    zinc: { color: 0x676b6f, roughness: 0.48, metalness: 0.45 },
    wood: { color: 0x9c6a42, roughness: 0.58 },
    paving: { color: 0xc5beb0, roughness: 0.86 },
    oakFloor: { color: 0xc69c6d, roughness: 0.52 },
    plaster: { color: 0xf1ede4, roughness: 0.86 },
    travertine: { color: 0xdcd3c3, roughness: 0.58 },
    linen: { color: 0xe3dcd0, roughness: 0.92 },
    concrete: { color: 0xb9b5ad, roughness: 0.8 },
    grass: { color: 0x6f8a45, roughness: 1 },
    gravel: { color: 0xcfc6b4, roughness: 0.95 },
    water: { color: 0x1b3a40, roughness: 0.05, metalness: 0.2 },
    charred: { color: 0x2a2623, roughness: 0.7 },
    bark: { color: 0x5a4a3c, roughness: 0.95 },
    leather: { color: 0x9a4e30, roughness: 0.55 },
    rug: { color: 0xb9ad98, roughness: 1 },
    marble: { color: 0xe9e6e0, roughness: 0.35 },
    metal: { color: 0x262523, roughness: 0.38, metalness: 0.68 },
    leaf: { color: 0x5f7f3c, roughness: 0.85 },
    glass: { color: 0xdbe7f0, roughness: 0.06, metalness: 0.1 }
  };
  var ENV = { glass: 1.6, metal: 1.05, zinc: 0.95, wood: 0.5, oakFloor: 0.6, travertine: 0.5, marble: 0.8, water: 1.5, grass: 0.2, leaf: 0.3 };

  var GLSL_COMMON = [
    'varying float vBase; varying vec3 vWPos; varying vec3 vWN; varying vec3 vOPos; varying vec3 vON;',
    'uniform float uCut; uniform float uCutMax; uniform float uFloorAnn; uniform float uRoll; uniform float uTime; uniform float uDusk;',
    'uniform vec3 uZO; uniform float uZR; uniform float uZW;',
    'uniform sampler2D uSheet; uniform float uSheetHalf; uniform vec2 uSheetC;',
    'uniform vec3 uPaper; uniform vec3 uFill; uniform vec3 uInk; uniform vec3 uAccent;',
    'float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }',
    'vec2 planeUV(vec3 p, vec3 n) { vec3 a = abs(n); vec2 q;',
    '  if (a.y > 0.7) q = p.xz; else q = a.x > a.z ? vec2(p.z, p.y) : vec2(p.x, p.y);',
    '  #if UVROT == 1',
    '    q = q.yx;',
    '  #endif',
    '  return q; }',
    'vec2 matUV() {',
    '  #if OBJSPACE == 1',
    '    return planeUV(vOPos, normalize(vON));',
    '  #else',
    '    return planeUV(vWPos, normalize(vWN));',
    '  #endif',
    '}',
    'float zoneMask() {',
    '  float zd = distance(vWPos, uZO);',
    '  float zm = uZR <= 0.001 ? 0.0 : 1.0 - smoothstep(uZR - uZW, uZR, zd);',
    '  zm *= smoothstep(uRoll - 0.25, uRoll + 0.25, vWPos.x);',
    '  return zm; }',
    'float zoneEdge() {',
    '  float zd = distance(vWPos, uZO);',
    '  float e = uZR <= 0.001 ? 0.0 : exp(-pow((zd - (uZR - uZW * 0.5)) / (uZW * 0.16), 2.0)) + 0.3 * exp(-pow((zd - (uZR - uZW * 0.5)) / (uZW * 0.6), 2.0));',
    '  e *= step(uZR, 400.0);',
    '  float r = exp(-pow((vWPos.x - uRoll) / 0.35, 2.0));',
    '  return clamp(e + r * step(-1e5, uRoll), 0.0, 1.0); }',
    // Ziegel: Läuferverband 215 x 65, Fuge 10 mm
    'vec4 brickAt(vec2 q) { float course = floor(q.y / 0.075); float bx = q.x / 0.225 + mod(course, 2.0) * 0.5;',
    '  return vec4(floor(bx), course, fract(bx) * 0.225, fract(q.y / 0.075) * 0.075); }',
    'float matHeight(vec2 q) {',
    '  #if KIND == 1',
    '    vec4 b = brickAt(q);',
    '    float ex = min(b.z, 0.225 - b.z + 0.011), ey = min(b.w, 0.075 - b.w + 0.011);',
    '    float face = smoothstep(0.0035, 0.0095, min(ex - 0.0055, ey - 0.0055));',
    '    float grain = (vnoise(q * 380.0) - 0.5) * 0.0007 + (vnoise(q * 95.0 + b.xy * 7.0) - 0.5) * 0.0010 + (hash12(b.xy + 9.2) - 0.5) * 0.0014;',
    '    return mix(-0.0085 + (vnoise(q * 420.0) - 0.5) * 0.0005, grain, face);',
    '  #elif KIND == 2',
    '    float jx = smoothstep(0.004, 0.001, abs(fract(q.x / 0.9 + 0.5) - 0.5) * 0.9);',
    '    return (vnoise(q * 140.0) - 0.5) * 0.0007 + (vnoise(vec2(q.x * 12.0, q.y * 48.0)) - 0.5) * 0.0006 - jx * 0.003;',
    '  #elif KIND == 13',
    '    vec2 g = abs(fract(q / vec2(1.2, 0.6) + 0.5) - 0.5) * vec2(1.2, 0.6);',
    '    float j = smoothstep(0.005, 0.0015, min(g.x, g.y));',
    '    return (vnoise(q * 140.0) - 0.5) * 0.0005 + (vnoise(vec2(q.x * 12.0, q.y * 48.0)) - 0.5) * 0.0005 - j * 0.002;',
    '  #elif KIND == 4',
    '    float sx = abs(fract(q.x / 0.43 + 0.5) - 0.5) * 0.43;',
    '    return smoothstep(0.014, 0.003, sx) * 0.008 + sin(q.y * 5.5 + floor(q.x / 0.43) * 2.1) * 0.0005;',
    '  #elif KIND == 5 || KIND == 19',
    '    float gx = abs(fract(q.x / 0.095 + 0.5) - 0.5) * 0.095;',
    '    return -smoothstep(0.005, 0.001, gx) * (NOGROOVE == 1 ? 0.0 : 0.0045) + (vnoise(vec2(q.x * 160.0, q.y * 14.0)) - 0.5) * (KIND == 19 ? 0.0022 : 0.0007);',
    '  #elif KIND == 11',
    '    float gx = abs(fract(q.x / 0.165 + 0.5) - 0.5) * 0.165;',
    '    float gy = abs(fract((q.y + floor(q.x / 0.165) * 0.55) / 1.45 + 0.5) - 0.5) * 1.45;',
    '    return -smoothstep(0.004, 0.001, min(gx, gy)) * 0.003 + (vnoise(vec2(q.x * 140.0, q.y * 12.0)) - 0.5) * 0.0005;',
    '  #elif KIND == 6',
    '    float rowP = floor(q.y / 0.6); vec2 pq = vec2(q.x + mod(rowP, 2.0) * 0.45, q.y);',
    '    vec2 g = abs(fract(pq / vec2(0.9, 0.6) + 0.5) - 0.5) * vec2(0.9, 0.6);',
    '    return (vnoise(q * 95.0) - 0.5) * 0.0008 - smoothstep(0.008, 0.002, min(g.x, g.y)) * 0.004;',
    '  #elif KIND == 12',
    '    return (vnoise(q * 32.0) - 0.5) * 0.0004 + (vnoise(q * 150.0) - 0.5) * 0.0003;',
    '  #elif KIND == 14 || KIND == 22',
    '    return (sin(q.x * 260.0) * sin(q.y * 260.0)) * 0.0005 + (vnoise(q * 90.0) - 0.5) * 0.0006;',
    '  #elif KIND == 15',
    '    float bj = smoothstep(0.004, 0.001, abs(fract(q.y / 0.14 + 0.5) - 0.5) * 0.14);',
    '    return (vnoise(vec2(q.x * 8.0, q.y * 160.0)) - 0.5) * 0.0009 - bj * 0.002;',
    '  #elif KIND == 17',
    '    return (vnoise(q * 70.0) * vnoise(q * 150.0 + 7.0)) * 0.006;',
    '  #elif KIND == 16',
    '    return (vnoise(q * 45.0) - 0.5) * 0.004 + (vnoise(vec2(q.x * 130.0, q.y * 50.0)) - 0.5) * 0.003;',
    '  #elif KIND == 20',
    '    return vnoise(vec2(q.x * 11.0, q.y * 2.0)) * 0.012 + vnoise(vec2(q.x * 40.0, q.y * 7.0)) * 0.004;',
    '  #elif KIND == 21',
    '    return (vnoise(q * 300.0) - 0.5) * 0.0005;',
    '  #elif KIND == 18',
    '    float t = uTime * 0.35;',
    '    return (vnoise(q * 2.4 + vec2(t, t * 0.6)) + 0.6 * vnoise(q * 5.5 - vec2(t * 0.8, t)) + 0.3 * vnoise(q * 13.0 + t)) * 0.012;',
    '  #else',
    '    return 0.0;',
    '  #endif',
    '}'
  ].join('\n') + '\n';

  var GLSL_COLOR = [
    '{',
    '  vec2 q = matUV();',
    '  #if KIND == 1',
    '    vec4 b = brickAt(q);',
    '    float fw = max(fwidth(q.x), fwidth(q.y)) * 1.15;',
    '    float brickVis = smoothstep(0.045, 0.015, fw);',
    '    float jointVis = smoothstep(0.013, 0.004, fw);',
    '    float joint = max(1.0 - smoothstep(0.0095 - fw, 0.0095 + fw, b.z), 1.0 - smoothstep(0.0095 - fw, 0.0095 + fw, b.w));',
    '    float h = hash12(b.xy), h2 = hash12(b.xy + 17.3), h3 = hash12(b.xy + 41.7), h4 = hash12(b.xy + 83.9);',
    '    vec3 base = diffuseColor.rgb * (0.95 + 0.09 * (vnoise(q * 0.65) - 0.5)) * (0.96 + 0.04 * smoothstep(0.0, 2.5, q.y));',
    '    float kilnDark = smoothstep(0.80, 0.98, h4) * 0.22;',
    '    vec3 bc = base * (0.85 + 0.26 * h - kilnDark) * vec3(1.0 + 0.08 * (h2 - 0.5), 1.0 - 0.025 * (h3 - 0.5), 1.0 - 0.10 * (h2 - 0.5));',
    '    bc *= 0.92 + 0.16 * vnoise(vec2(q.x * 55.0, q.y * 140.0) + b.xy * 3.1) * jointVis;',
    '    bc *= 1.0 - (1.0 - smoothstep(0.009, 0.015, b.w)) * step(0.009, b.w) * 0.14 * jointVis;',
    '    vec3 mortar = vec3(0.66, 0.63, 0.57) * (0.94 + 0.12 * vnoise(q * 180.0));',
    '    diffuseColor.rgb = mix(mix(mix(base, mortar, 0.13), mix(bc, mortar, 0.13), brickVis), mix(bc, mortar * 0.92, joint), jointVis);',
    '  #elif KIND == 2',
    '    float blockJ = 1.0 - smoothstep(0.0, max(fwidth(q.x) * 1.3, 0.003), abs(fract(q.x / 0.9 + 0.5) - 0.5) * 0.9);',
    '    diffuseColor.rgb *= (0.95 + 0.06 * vnoise(vec2(q.x * 4.0, q.y * 26.0)) + 0.04 * (vnoise(q * 75.0) - 0.5)) * (1.0 - 0.18 * blockJ);',
    '  #elif KIND == 4',
    '    float fwz = max(fwidth(q.x) * 1.4, 0.005);',
    '    float sx = fract(q.x / 0.43 + 0.5) - 0.5;',
    '    float seamDark = 1.0 - smoothstep(0.0, fwz, abs(sx) * 0.43);',
    '    float patina = 0.94 + 0.10 * vnoise(vec2(q.x * 18.0, q.y * 2.2)) + 0.04 * (vnoise(q * 4.0) - 0.5);',
    '    diffuseColor.rgb *= patina * (1.0 - 0.42 * seamDark);',
    '  #elif KIND == 5',
    '    float board = floor(q.x / 0.095);',
    '    float grain = vnoise(vec2(q.x * 95.0, q.y * 4.5 + board * 3.7));',
    '    diffuseColor.rgb *= (0.85 + 0.25 * hash12(vec2(board, 3.0))) * (0.90 + 0.14 * grain + 0.06 * vnoise(vec2(q.x * 260.0, q.y * 16.0)));',
    '    float groove = 1.0 - smoothstep(0.0, max(fwidth(q.x) * 1.2, 0.0025), abs(fract(q.x / 0.095 + 0.5) - 0.5) * 0.095);',
    '    #if NOGROOVE == 0',
    '    diffuseColor.rgb *= 1.0 - 0.48 * groove;',
    '    #endif',
    '  #elif KIND == 19',
    '    float board = floor(q.x / 0.095);',
    '    float crack = vnoise(vec2(q.x * 210.0, q.y * 30.0 + board * 5.1));',
    '    diffuseColor.rgb *= (0.7 + 0.5 * hash12(vec2(board, 5.0))) * (0.55 + 0.9 * crack * crack);',
    '    diffuseColor.rgb += vec3(0.05, 0.05, 0.055) * smoothstep(0.72, 0.95, crack);',
    '    float groove = 1.0 - smoothstep(0.0, max(fwidth(q.x) * 1.2, 0.0025), abs(fract(q.x / 0.095 + 0.5) - 0.5) * 0.095);',
    '    diffuseColor.rgb *= 1.0 - 0.7 * groove;',
    '  #elif KIND == 11',
    '    float pw = 0.165, pl = 1.45;',
    '    float colIdx = floor(q.x / pw);',
    '    float bh = hash12(vec2(colIdx, floor((q.y + colIdx * 0.55) / pl)));',
    '    float grain = vnoise(vec2(q.x * 85.0, q.y * 3.8 + bh * 9.0));',
    '    float cath = vnoise(vec2(q.x * 28.0 + sin(q.y * 2.2) * 0.6, q.y * 2.5));',
    '    diffuseColor.rgb *= (0.88 + 0.20 * bh) * (0.91 + 0.12 * grain + 0.07 * cath);',
    '    float gx = 1.0 - smoothstep(0.0, max(fwidth(q.x) * 1.2, 0.002), abs(fract(q.x / pw + 0.5) - 0.5) * pw);',
    '    float gy = 1.0 - smoothstep(0.0, max(fwidth(q.y) * 1.2, 0.003), abs(fract((q.y + colIdx * 0.55) / pl + 0.5) - 0.5) * pl);',
    '    diffuseColor.rgb *= 1.0 - 0.38 * max(gx, gy * 0.75);',
    '  #elif KIND == 6',
    '    float rowP = floor(q.y / 0.6);',
    '    vec2 pq = vec2(q.x + mod(rowP, 2.0) * 0.45, q.y);',
    '    vec2 cell = floor(pq / vec2(0.9, 0.6));',
    '    vec2 g = abs(fract(pq / vec2(0.9, 0.6) + 0.5) - 0.5) * vec2(0.9, 0.6);',
    '    float j = 1.0 - smoothstep(0.0, max(max(fwidth(q.x), fwidth(q.y)) * 1.2, 0.005), min(g.x, g.y));',
    '    float sh = hash12(cell);',
    '    vec3 flagCol = diffuseColor.rgb * (0.88 + 0.18 * sh) * vec3(1.0 + 0.04 * (sh - 0.5), 1.0, 1.0 - 0.04 * (sh - 0.5));',
    '    flagCol *= 0.95 + 0.09 * vnoise(q * 22.0);',
    '    diffuseColor.rgb = mix(flagCol, vec3(0.50, 0.48, 0.44), j * 0.65);',
    '  #elif KIND == 12',
    '    diffuseColor.rgb *= 0.97 + vnoise(q * 1.8) * 0.04 + vnoise(q * 9.5) * 0.025;',
    '  #elif KIND == 13',
    '    float vein = vnoise(vec2(q.x * 3.5 + sin(q.y * 4.0) * 0.25, q.y * 22.0));',
    '    vec2 cell = floor(q / vec2(1.2, 0.6));',
    '    vec2 g = abs(fract(q / vec2(1.2, 0.6) + 0.5) - 0.5) * vec2(1.2, 0.6);',
    '    float j = 1.0 - smoothstep(0.0, max(max(fwidth(q.x), fwidth(q.y)) * 1.2, 0.003), min(g.x, g.y));',
    '    diffuseColor.rgb *= (0.93 + 0.10 * vein + 0.05 * (vnoise(q * 85.0) - 0.5)) * (0.96 + 0.07 * hash12(cell)) * (1.0 - 0.22 * j);',
    '  #elif KIND == 14',
    '    diffuseColor.rgb *= 0.98 + (vnoise(vec2(q.x * 120.0, q.y * 18.0)) - 0.5) * 0.07 + (vnoise(vec2(q.x * 18.0, q.y * 120.0)) - 0.5) * 0.07;',
    '  #elif KIND == 15',
    '    float board = floor(q.y / 0.14); float bh = hash12(vec2(board, 7.0));',
    '    float gr = vnoise(vec2(q.x * 6.0 + bh * 20.0, q.y * 90.0));',
    '    diffuseColor.rgb *= (0.90 + 0.12 * bh) * (0.93 + 0.10 * gr + 0.06 * (vnoise(q * 40.0) - 0.5));',
    '    float bj = 1.0 - smoothstep(0.0, max(fwidth(q.y) * 1.3, 0.003), abs(fract(q.y / 0.14 + 0.5) - 0.5) * 0.14);',
    '    diffuseColor.rgb *= 1.0 - 0.2 * bj;',
    '    vec2 th = abs(fract(q / vec2(1.2, 0.84) + 0.5) - 0.5) * vec2(1.2, 0.84);',
    '    diffuseColor.rgb *= 1.0 - 0.4 * (1.0 - smoothstep(0.016, 0.026, length(th)));',
    '  #elif KIND == 16',
    '    float g1 = vnoise(q * 0.3), g2 = vnoise(q * 2.3), g3 = vnoise(q * 28.0), g4 = vnoise(vec2(q.x * 90.0, q.y * 30.0));',
    '    float g0 = vnoise(q * 0.07);',
    '    vec3 gc = diffuseColor.rgb * vec3(0.78 + 0.34 * g1, 0.84 + 0.22 * g2, 0.66 + 0.34 * g1) * (0.66 + 0.26 * g3 + 0.2 * g4) * (0.82 + 0.36 * g0);',
    '    gc = mix(gc, gc * vec3(1.18, 1.05, 0.72), smoothstep(0.55, 0.8, vnoise(q * 0.9 + 3.0)) * 0.5);',
    '    float rr = length(vWPos.xz);',
    '    vec2 fc = floor((vWPos.xz + vec2(vnoise(vWPos.xz * 0.01) * 60.0)) / vec2(95.0, 70.0));',
    '    float fh = hash12(fc);',
    '    vec3 field = mix(vec3(0.42, 0.48, 0.22), vec3(0.62, 0.55, 0.30), step(0.55, fh)) * (0.85 + 0.3 * hash12(fc + 3.3));',
    '    float fieldAmt = smoothstep(70.0, 130.0, rr) * (1.0 - smoothstep(-6.0, 3.0, vWPos.y)) * step(0.3, fh);',
    '    vec3 forest = vec3(0.13, 0.22, 0.12) * (0.75 + 0.5 * vnoise(vWPos.xz * 0.08));',
    '    float forestAmt = smoothstep(4.0, 16.0, vWPos.y) * smoothstep(90.0, 160.0, rr);',
    '    diffuseColor.rgb = mix(mix(gc, field, fieldAmt * 0.8), forest, forestAmt);',
    '  #elif KIND == 17',
    '    diffuseColor.rgb *= 0.70 + 0.5 * vnoise(q * 60.0) * vnoise(q * 140.0 + 7.0) + 0.12 * vnoise(q * 3.0);',
    '  #elif KIND == 20',
    '    diffuseColor.rgb *= 0.55 + 0.55 * vnoise(vec2(q.x * 9.0, q.y * 1.6)) * vnoise(vec2(q.x * 38.0, q.y * 6.0)) + 0.2 * vnoise(vec2(q.x * 38.0, q.y * 6.0));',
    '  #elif KIND == 21',
    '    diffuseColor.rgb *= 0.92 + 0.12 * vnoise(q * 260.0) + 0.06 * (vnoise(q * 14.0) - 0.5);',
    '  #elif KIND == 22',
    '    float rw = 0.07; float dir = mod(floor(q.x / rw), 2.0);',
    '    float s = fract((q.y + (dir > 0.5 ? q.x : -q.x)) / (rw * 0.5));',
    '    diffuseColor.rgb *= 0.86 + 0.15 * step(0.5, s) + 0.06 * (vnoise(q * 200.0) - 0.5);',
    '  #elif KIND == 23',
    '    float mv = vnoise(vec2(q.x * 2.2 + vnoise(q * 3.0) * 1.4, q.y * 2.2));',
    '    float veinM = smoothstep(0.45, 0.5, mv) * (1.0 - smoothstep(0.5, 0.57, mv));',
    '    diffuseColor.rgb *= 0.96 + 0.05 * vnoise(q * 30.0) - 0.22 * veinM;',
    '  #elif KIND == 24',
    '    diffuseColor.rgb *= 0.94 + 0.10 * vnoise(q * 45.0);',
    '  #elif KIND == 25',
    '    diffuseColor.rgb *= vec3(0.75 + 0.5 * hash12(floor(vWPos.xz * 3.0)), 0.8 + 0.4 * hash12(floor(vWPos.xy * 3.0) + 2.0), 0.7 + 0.4 * hash12(floor(vWPos.zy * 3.0)));',
    '  #elif KIND == 18',
    '    diffuseColor.rgb *= 0.9 + 0.2 * vnoise(q * 1.5 + uTime * 0.05);',
    '  #endif',
    '}'
  ].join('\n');

  var GLSL_ROUGH = [
    '#if KIND == 1',
    '{ vec4 br = brickAt(matUV()); float jr = max(1.0 - smoothstep(0.008, 0.012, br.z), 1.0 - smoothstep(0.008, 0.012, br.w));',
    '  roughnessFactor = mix(0.76 + 0.14 * hash12(br.xy + 5.1), 0.96, jr); }',
    '#elif KIND == 5 || KIND == 11',
    '{ vec2 qr = matUV(); roughnessFactor = 0.44 + 0.16 * vnoise(vec2(qr.x * 80.0, qr.y * 6.0)); }',
    '#elif KIND == 13 || KIND == 23',
    '{ vec2 qr = matUV(); roughnessFactor *= 0.85 + 0.3 * vnoise(qr * 6.0); }',
    '#endif'
  ].join('\n');

  var GLSL_BUMP = [
    '#if KIND == 1 || KIND == 2 || KIND == 4 || KIND == 5 || KIND == 6 || KIND == 11 || KIND == 12 || KIND == 13 || KIND == 14 || KIND == 15 || KIND == 16 || KIND == 17 || KIND == 18 || KIND == 19 || KIND == 20 || KIND == 21 || KIND == 22',
    '{',
    '  vec2 qb = matUV();',
    '  float nearB = smoothstep(0.03, 0.004, max(fwidth(qb.x), fwidth(qb.y)));',
    '  #if KIND == 18',
    '    nearB = 1.0;',
    '  #endif',
    '  if (nearB > 0.0) {',
    '    float hb = matHeight(qb) * 1.25 * nearB;',
    '    vec3 vp = -vViewPosition;',
    '    vec3 dpx = dFdx(vp), dpy = dFdy(vp);',
    '    vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);',
    '    float det = dot(dpx, r1);',
    '    vec3 grad = sign(det) * (dFdx(hb) * r1 + dFdy(hb) * r2);',
    '    normal = normalize(abs(det) * normal - grad);',
    '  }',
    '}',
    '#endif'
  ].join('\n');

  // Innenräume: etwas Schatten in den Kanten, damit weiße Wände nicht flach wirken
  var GLSL_AO = [
    '#if INTERIOR == 1',
    '{',
    '  float hy = vWPos.y;',
    '  float wallish = 1.0 - step(0.7, abs(normalize(vWN).y));',
    '  float aoI = 1.0 - wallish * (0.20 * smoothstep(0.85, 0.45, hy) + 0.16 * smoothstep(3.05, 3.65, hy));',
    '  reflectedLight.indirectDiffuse *= aoI * 0.92; reflectedLight.indirectSpecular *= aoI;',
    '}',
    '#endif'
  ].join('\n');

  var GLSL_TAIL = [
    '{',
    '  float zm = zoneMask();',
    '  #if REAL_ONLY == 1',
    '    if (zm < 0.5) discard;',
    '  #else',
    '  if (zm < 0.999) {',
    '    vec3 bn = normalize(vWN);',
    '    float up = step(0.6, bn.y);',
    '    float sh = 0.66 + 0.34 * clamp(dot(bn, normalize(vec3(-0.35, 0.85, 0.4))), 0.0, 1.0);',
    '    vec3 bp = uFill * sh;',
    '    float bpA = 1.0;',
    '    #if GROUND == 1',
    '      bp = uPaper;',
    '      vec2 g1 = vWPos.xz; vec2 w1 = fwidth(g1);',
    '      vec2 f1 = abs(fract(g1 - 0.5) - 0.5) / max(w1, vec2(1e-5));',
    '      float l1 = (1.0 - min(min(f1.x, f1.y), 1.0)) * (1.0 - smoothstep(0.12, 0.4, max(w1.x, w1.y)));',
    '      vec2 g5 = vWPos.xz / 5.0; vec2 w5 = fwidth(g5);',
    '      vec2 f5 = abs(fract(g5 - 0.5) - 0.5) / max(w5, vec2(1e-5));',
    '      float l5 = (1.0 - min(min(f5.x, f5.y), 1.0)) * (1.0 - smoothstep(0.12, 0.4, max(w5.x, w5.y)));',
    '      float hc = vWPos.y / 2.0; float wc = max(fwidth(hc), 1e-5);',
    '      float lc = (1.0 - min(abs(fract(hc - 0.5) - 0.5) / wc, 1.0)) * step(0.25, abs(vWPos.y)) * (1.0 - smoothstep(0.3, 0.6, wc));',
    '      bp += uInk * (l1 * 0.04 + l5 * 0.07 + lc * 0.16);',
    '    #endif',
    '    #if KIND == 3',
    '      bp = uInk; bpA = 0.07;',
    '    #endif',
    '    #if KIND != 3',
    '    if (uFloorAnn > 0.01 && up > 0.5 && vWPos.y < 0.52) {',
    '      vec2 suv = vec2((vWPos.x - uSheetC.x) / (2.0 * uSheetHalf) + 0.5, 0.5 - (vWPos.z - uSheetC.y) / (2.0 * uSheetHalf));',
    '      if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0) bp = mix(bp, uInk, texture2D(uSheet, suv).a * uFloorAnn * 0.9);',
    '    }',
    '    #endif',
    '    #if POCHE == 1',
    '    if (up > 0.5 && abs(vWPos.y - uCut) < 0.004 && uCut < uCutMax) {',
    '      float hv = (vWPos.x + vWPos.z) * 6.0; float hw = fwidth(hv);',
    '      float hl = (1.0 - smoothstep(0.10, 0.10 + hw, abs(fract(hv) - 0.5))) * (1.0 - smoothstep(0.25, 0.6, hw));',
    '      bp = mix(uInk * 0.80, uInk * 0.56, hl);',
    '    }',
    '    #endif',
    '    float la = gl_FragColor.a;',
    '    gl_FragColor.rgb = mix(bp, gl_FragColor.rgb, zm);',
    '    gl_FragColor.a = mix(bpA, la, zm);',
    '  }',
    '  #endif',
    '  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uAccent, vec3(1.0, 0.86, 0.6), 0.25), zoneEdge() * 0.85);',
    '}'
  ].join('\n');

  // ------------------------------------------------------------ Materialien
  var MATS = {};
  HE.matList = [];
  function patch(m, kind, zone, o) {
    var K = KIND[kind] || 0;
    var defs = '#define KIND ' + K + '\n#define UVROT ' + (o.rot ? 1 : 0) + '\n#define OBJSPACE ' + (o.obj ? 1 : 0) +
      '\n#define GROUND ' + (o.ground ? 1 : 0) + '\n#define POCHE ' + (o.poche ? 1 : 0) + '\n#define REAL_ONLY ' + (o.realOnly ? 1 : 0) +
      '\n#define INTERIOR ' + (o.interior ? 1 : 0) + '\n#define NOGROOVE ' + (o.nog ? 1 : 0) + '\n';
    m.onBeforeCompile = function (sh) {
      var k;
      for (k in U) sh.uniforms[k] = U[k];
      for (k in zones[zone]) sh.uniforms[k] = zones[zone][k];
      if (o.free) sh.uniforms.uCut = U.uCutFree;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aBase;\nvarying float vBase; varying vec3 vWPos; varying vec3 vWN; varying vec3 vOPos; varying vec3 vON;\nuniform float uCut;\n')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOPos = position; vON = normal;\ntransformed.y = min(transformed.y, uCut);\nvBase = aBase;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * normal);');
      var fs = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + defs + GLSL_COMMON)
        .replace('void main() {', 'void main() {\nif (vBase >= uCut - 0.0005) discard;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + GLSL_TAIL);
      if (m.isMeshStandardMaterial) {
        fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_COLOR)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + GLSL_ROUGH)
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_BUMP)
          .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + GLSL_AO);
      }
      sh.fragmentShader = fs;
    };
    m.customProgramCacheKey = function () { return 'he-' + (m.isMeshStandardMaterial ? 's' : 'b') + defs.replace(/\s+/g, ''); };
  }
  HE.patch = patch;

  // HE.mat('brick', 'ext', { color: 0x.., poche: 1 })
  HE.mat = function (kind, zone, o) {
    o = o || {};
    var key = kind + '@' + zone + JSON.stringify(o);
    if (MATS[key]) return MATS[key];
    var b = BASE[kind] || BASE.plain;
    var m = new T.MeshStandardMaterial({
      color: o.color !== undefined ? o.color : b.color,
      roughness: o.rough !== undefined ? o.rough : b.roughness,
      metalness: o.metal !== undefined ? o.metal : (b.metalness || 0),
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    m.envMapIntensity = (o.env !== undefined ? o.env : (ENV[kind] || 0.45));
    if (o.emissive !== undefined) { m.emissive = new T.Color(o.emissive); m.emissiveIntensity = o.ei || 1; }
    if (kind === 'glass') { m.transparent = true; m.opacity = o.opacity !== undefined ? o.opacity : 0.16; m.depthWrite = false; }
    if (o.double) m.side = T.DoubleSide;
    if (o.flat) m.flatShading = true;
    patch(m, kind, zone, o);
    m.userData = { key: key, zone: zone, kind: kind, o: o };
    MATS[key] = m;
    HE.matList.push(m);
    return m;
  };

  // Linien je Zone
  var LMATS = {};
  HE.lineMat = function (zone, free) {
    var key = zone + (free ? '|f' : '');
    if (LMATS[key]) return LMATS[key];
    var m = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false, fog: false, toneMapped: false });
    m.onBeforeCompile = function (sh) {
      var k;
      for (k in U) sh.uniforms[k] = U[k];
      for (k in zones[zone]) sh.uniforms[k] = zones[zone][k];
      if (free) sh.uniforms.uCut = U.uCutFree;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aBase;\nvarying float vBase;\nvarying vec3 vWPos;\nuniform float uCut;\n')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y = min(transformed.y, uCut);\nvBase = aBase;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vBase; varying vec3 vWPos; uniform float uCut; uniform float uRoll; uniform vec3 uZO; uniform float uZR; uniform float uZW; uniform vec3 uInk;\n')
        .replace('void main() {', 'void main() {\nif (vBase >= uCut - 0.0005) discard;')
        .replace('#include <premultiplied_alpha_fragment>', [
          '{',
          '  float zd = distance(vWPos, uZO);',
          '  float zm = uZR <= 0.001 ? 0.0 : 1.0 - smoothstep(uZR - uZW, uZR, zd);',
          '  zm *= smoothstep(uRoll - 0.25, uRoll + 0.25, vWPos.x);',
          '  gl_FragColor = vec4(uInk, opacity * (1.0 - zm));',
          '  if (gl_FragColor.a < 0.01) discard;',
          '}',
          '#include <premultiplied_alpha_fragment>'
        ].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'he-line'; };
    LMATS[key] = m;
    return m;
  };

  // ------------------------------------------------------------ Geometrie-Sammler
  var buckets = {}, lineB = {};
  HE.footprints = []; // Wand-Grundflächen für den kleinen Lageplan
  function addGeo(geo, mat, o) {
    o = o || {};
    var g = geo.index ? geo.toNonIndexed() : geo;
    if (o.flat || !g.attributes.normal) g.computeVertexNormals();
    var P = g.attributes.position.array, N = g.attributes.normal.array, i;
    var bkey = mat.userData.key + (o.roof ? '|roof' : '');
    var bk = buckets[bkey] || (buckets[bkey] = { p: [], n: [], b: [], mat: mat, roof: !!o.roof, noShadow: !!o.noShadow });
    var base = o.base;
    if (base === undefined) { base = Infinity; for (i = 1; i < P.length; i += 3) if (P[i] < base) base = P[i]; }
    for (i = 0; i < P.length; i += 3) { bk.p.push(P[i], P[i + 1], P[i + 2]); bk.n.push(N[i], N[i + 1], N[i + 2]); bk.b.push(base); }
    if (o.edges !== false) {
      var eg = o.edgeGeo || g;
      var e = new T.EdgesGeometry(eg, o.edgeAngle || 25).attributes.position.array;
      var lkey = mat.userData.zone + (mat.userData.o.free ? '|f' : '') + (o.roof ? '|roof' : '');
      var lb = lineB[lkey] || (lineB[lkey] = { p: [], b: [], zone: mat.userData.zone, free: !!mat.userData.o.free, roof: !!o.roof });
      for (i = 0; i < e.length; i += 3) { lb.p.push(e[i], e[i + 1], e[i + 2]); lb.b.push(base); }
    }
  }
  HE.addGeo = addGeo;
  HE.addLines = function (zone, pts, base, free) {
    var lkey = zone + (free ? '|f' : '');
    var lb = lineB[lkey] || (lineB[lkey] = { p: [], b: [], zone: zone, free: !!free, roof: false });
    for (var i = 0; i < pts.length; i += 3) { lb.p.push(pts[i], pts[i + 1], pts[i + 2]); lb.b.push(base); }
  };
  HE.box = function (mat, x0, y0, z0, x1, y1, z1, o) {
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    var g = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    addGeo(g, mat, o);
  };
  // weiche Kiste für Polster: Kanten gerundet, Linien von der einfachen Kiste
  HE.soft = function (mat, x0, y0, z0, x1, y1, z1, r, o) {
    o = o || {};
    var w = x1 - x0, h = y1 - y0, d = z1 - z0;
    r = Math.min(r || 0.06, w / 2, h / 2, d / 2);
    var g = new T.BoxGeometry(w, h, d, 6, 4, 6).toNonIndexed();
    var P = g.attributes.position.array, i;
    for (i = 0; i < P.length; i += 3) {
      var cx = Math.max(-w / 2 + r, Math.min(w / 2 - r, P[i])), cy = Math.max(-h / 2 + r, Math.min(h / 2 - r, P[i + 1])), cz = Math.max(-d / 2 + r, Math.min(d / 2 - r, P[i + 2]));
      var dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - cz, l = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (l > 1e-6) { P[i] = cx + dx / l * r; P[i + 1] = cy + dy / l * r; P[i + 2] = cz + dz / l * r; }
    }
    g = mergeVerts(g);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    var eg = new T.BoxGeometry(w, h, d); eg.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    o.edgeGeo = eg;
    addGeo(g, mat, o);
  };
  // glatte Normalen: Ecken mit gleicher Position teilen sich die Normale
  function mergeVerts(g) {
    var P = g.attributes.position.array, map = {}, i, k;
    var N = new Float32Array(P.length);
    var a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
    for (i = 0; i < P.length; i += 9) {
      a.set(P[i], P[i + 1], P[i + 2]); b.set(P[i + 3], P[i + 4], P[i + 5]); c.set(P[i + 6], P[i + 7], P[i + 8]);
      n.copy(b).sub(a).cross(c.sub(a));
      for (k = 0; k < 3; k++) {
        var key = Math.round(P[i + k * 3] * 1e4) + '_' + Math.round(P[i + k * 3 + 1] * 1e4) + '_' + Math.round(P[i + k * 3 + 2] * 1e4);
        var acc = map[key] || (map[key] = [0, 0, 0]);
        acc[0] += n.x; acc[1] += n.y; acc[2] += n.z;
      }
    }
    for (i = 0; i < P.length; i += 3) {
      var key2 = Math.round(P[i] * 1e4) + '_' + Math.round(P[i + 1] * 1e4) + '_' + Math.round(P[i + 2] * 1e4);
      var v = map[key2], l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
      N[i] = v[0] / l; N[i + 1] = v[1] / l; N[i + 2] = v[2] / l;
    }
    g.setAttribute('normal', new T.BufferAttribute(N, 3));
    return g;
  }
  HE.cyl = function (mat, x, y0, z, r0, r1, h, seg, o) {
    var g = new T.CylinderGeometry(r1, r0, h, seg || 16); g.translate(x, y0 + h / 2, z);
    o = o || {}; if (!o.edgeAngle) o.edgeAngle = 60;
    addGeo(g, mat, o);
  };
  HE.sphere = function (mat, x, y, z, r, sx, sy, sz, o) {
    var g = new T.SphereGeometry(r, 20, 14); g.scale(sx || 1, sy || 1, sz || 1); g.translate(x, y, z);
    o = o || {}; if (!o.edgeAngle) o.edgeAngle = 80;
    addGeo(g, mat, o);
  };
  HE.tris = function (mat, pts, o) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    addGeo(g, mat, o);
  };

  HE.roofMeshes = [];
  HE.finish = function () {
    Object.keys(buckets).forEach(function (k) {
      var b = buckets[k], g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(b.n, 3));
      g.setAttribute('aBase', new T.Float32BufferAttribute(b.b, 1));
      var m = new T.Mesh(g, b.mat), od = b.mat.userData;
      m.frustumCulled = false;
      m.castShadow = !b.mat.transparent && !od.o.ground && !od.o.realOnly && !od.o.noShadow && od.kind !== 'water';
      m.receiveShadow = !b.mat.transparent;
      if (b.mat.transparent) m.renderOrder = 5;
      if (b.roof) HE.roofMeshes.push(m);
      scene.add(m);
    });
    Object.keys(lineB).forEach(function (k) {
      var lb = lineB[k], g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(lb.p, 3));
      g.setAttribute('aBase', new T.Float32BufferAttribute(lb.b, 1));
      var l = new T.LineSegments(g, HE.lineMat(lb.zone, lb.free));
      l.frustumCulled = false; l.renderOrder = 3;
      scene.add(l);
    });
    buckets = {}; lineB = {};
  };
  // bewegliches Teil (Tür): eigenes Mesh mit Material im Objektraum
  HE.part = function (parent, mat, x0, y0, z0, x1, y1, z1) {
    var g = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    var m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    parent.add(m);
    var l = new T.LineSegments(new T.EdgesGeometry(g, 25), HE.lineMat(mat.userData.zone)); l.frustumCulled = false; l.renderOrder = 3;
    parent.add(l);
    return m;
  };

  var seed = 11;
  HE.rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  HE.reseed = function (s) { seed = s; };
})();
