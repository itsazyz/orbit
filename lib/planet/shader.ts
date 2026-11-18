/**
 * Procedural planet + space backdrop shaders (WebGL1 / GLSL ES 1.0).
 *
 * The planet shader draws, on one transparent quad and in premultiplied
 * alpha: the halo, rings (with planet shadow), the planet body (one
 * distinct algorithm per surface, bump relief, ring/moon shadows, two
 * lights, atmosphere, effects), moons and satellites — depth-sorted.
 *
 * Surface ids map to SURFACE_INDEX; the shader branches on the uniform,
 * so every pixel takes the same branch (no divergence).
 */

export const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const COMMON = `
const float PI = 3.14159265;
const float TAU = 6.28318531;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm3(vec3 p) {
  float v = 0.5 * noise(p);
  p = p * 2.03 + vec3(1.7, 9.2, 3.1);
  v += 0.25 * noise(p);
  p = p * 2.01 + vec3(4.3, 2.8, 7.4);
  v += 0.125 * noise(p);
  return v / 0.875;
}

float fbm5(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v / 0.96875;
}

float ridged(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
    v += a * n * n;
    p = p * 2.07 + vec3(3.1, 1.3, 7.7);
    a *= 0.5;
  }
  return v / 0.9375;
}

vec2 voronoi(vec3 x, float jit, out vec3 cell, out vec3 fp) {
  vec3 b = floor(x);
  vec3 f = x - b;
  float d1 = 8.0;
  float d2 = 8.0;
  cell = b;
  fp = x;
  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = 0.5 + (hash33(b + g) - 0.5) * jit;
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) {
      d2 = d1;
      d1 = d;
      cell = b + g;
      fp = b + g + o;
    } else if (d < d2) {
      d2 = d;
    }
  }
  return vec2(sqrt(d1), sqrt(d2));
}

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

vec3 hueShift(vec3 c, float a) {
  mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * c;
  float h = atan(yiq.z, yiq.y) + a;
  float ch = length(yiq.yz);
  return max(toRGB * vec3(yiq.x, ch * cos(h), ch * sin(h)), 0.0);
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
`;

export const PLANET_FRAGMENT = `${PRECISION}
varying vec2 vUv;

uniform float uTime;
uniform float uExtent;
uniform float uPx;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uAtmoCol;
uniform vec3 uAmbient;
uniform float uSurf;
uniform float uAtmo;
uniform float uGlow;
uniform float uRing;
uniform vec3 uSeed;
uniform vec3 uVar;
uniform float uDetail;
uniform mat3 uObj;
uniform mat3 uFrame;
uniform vec3 uRingN;
uniform vec3 uRingN2;
uniform float uRingSpin;
uniform vec3 uL1;
uniform vec3 uL2;
uniform vec3 uL1c;
uniform vec3 uL2c;
uniform vec4 uMoon0;
uniform vec4 uMoon1;
uniform vec4 uMoon2;
uniform vec4 uFx;
${COMMON}

struct Surf {
  vec3 alb;
  vec3 emit;
  vec3 nOff;
  float spec;
  float shin;
  float wrap;
  float bump;
  float h;
  float land;
  float selfLit;
  float alpha;
  float lightK;
};

bool isSurf(float id) { return abs(uSurf - id) < 0.5; }

vec3 rotY(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z);
}

vec3 rotAxis(vec3 v, vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

float angDiff(float a, float b) { return mod(a - b + PI, TAU) - PI; }

float craterP(float d) {
  float bowl = d < 1.0 ? d * d - 1.0 : 0.0;
  float rim = exp(-(d - 1.0) * (d - 1.0) * 14.0) * 0.45;
  return bowl * 0.7 + rim;
}

vec3 Pof(vec3 p) { return p * uDetail * 2.0 + uSeed; }

float gridLines(vec3 p, float nLon, float nLat, float w) {
  float lon = atan(p.z, p.x);
  float la = asin(clamp(p.y, -1.0, 1.0));
  float fx = fract(lon / TAU * nLon);
  float fy = fract(la / PI * nLat + 0.5);
  float dx = min(fx, 1.0 - fx) * TAU / nLon * cos(la);
  float dy = min(fy, 1.0 - fy) * PI / nLat;
  dx = mix(dx, 1.0, step(1.3, abs(la)));
  return 1.0 - smoothstep(0.0, w, min(dx, dy));
}

/* Raw height used for colour and (through bumpShape) for relief. */
float surfHeight(vec3 p) {
  vec3 P = Pof(p);
  vec3 cell;
  vec3 fp;
  if (isSurf(1.0)) {
    vec2 v = voronoi(P * 1.5, 0.55, cell, fp);
    float rad = 0.14 + 0.16 * hash13(cell + 3.1);
    float h = craterP(v.x / rad) * rad * smoothstep(0.0, 0.12, v.y - v.x);
    v = voronoi(P * 3.8 + 7.7, 0.55, cell, fp);
    rad = 0.12 + 0.16 * hash13(cell + 1.3);
    h += craterP(v.x / rad) * rad * 0.5 * smoothstep(0.0, 0.12, v.y - v.x);
    return h + noise(P * 6.0) * 0.04;
  }
  if (isSurf(4.0)) return fbm5(P * 0.9);
  if (isSurf(5.0)) return fbm3(P * 2.2) * 0.5 - smoothstep(0.84, 0.97, ridged(P * 1.1)) * 0.25;
  if (isSurf(8.0)) return fbm5(P * 0.8);
  if (isSurf(9.0)) {
    float w = fbm3(P * 0.8) * 5.0;
    float dune = 1.0 - abs(sin(dot(P, vec3(4.0, 1.5, 3.0)) * 2.6 + w));
    dune = dune * dune * dune;
    float c = 1.0 - abs(fbm3(P * 0.7 + 2.0) * 2.0 - 1.0);
    return dune * 0.32 + fbm3(P * 1.3) * 0.25 - smoothstep(0.955, 0.995, c) * 0.4;
  }
  if (isSurf(13.0)) {
    vec2 v = voronoi(P * 0.95, 1.0, cell, fp);
    float e = v.y - v.x;
    return smoothstep(0.04, 0.16, e) * 0.5 + noise(P * 5.0) * 0.06;
  }
  if (isSurf(21.0)) {
    vec2 v = voronoi(P * 1.4 + vec3(uTime * 0.01, 0.0, 0.0), 1.0, cell, fp);
    return 1.0 - smoothstep(0.36, 0.42, v.x + (hash13(cell) - 0.5) * 0.15);
  }
  if (isSurf(25.0)) {
    float n1 = fbm3(P * 1.6);
    return smoothstep(-0.3, 0.9, sin(n1 * 38.0 + fbm3(P * 4.0) * 4.0));
  }
  return 0.0;
}

float bumpShape(float h) {
  if (isSurf(4.0)) return max(h - 0.6, 0.0) * 2.5;
  if (isSurf(8.0)) return max(h - 0.5, 0.0) * 1.8;
  return h;
}

Surf surface(vec3 p, vec3 wn) {
  Surf s;
  s.alb = uC1;
  s.emit = vec3(0.0);
  s.nOff = vec3(0.0);
  s.spec = 0.05;
  s.shin = 16.0;
  s.wrap = 0.08;
  s.bump = 0.0;
  s.h = 0.0;
  s.land = 1.0;
  s.selfLit = 0.0;
  s.alpha = 1.0;
  s.lightK = 1.0;

  vec3 c1 = uC1;
  vec3 c2 = uC2;
  vec3 P = Pof(p);
  float t = uTime;
  float lon = atan(p.z, p.x);
  vec3 cell;
  vec3 fp;

  if (uSurf < 0.5) {
    // Silk — soft two-tone gradient, clear-coat sheen
    float g = p.y * 0.8 + (fbm3(P * 0.55 + vec3(0.0, t * 0.01, 0.0)) - 0.5) * 1.1;
    s.alb = mix(c1, c2, smoothstep(-0.75, 0.75, g)) * (0.94 + 0.1 * noise(P * 1.2));
    s.spec = 0.6;
    s.shin = 46.0;
    s.wrap = 0.18;
    s.land = smoothstep(0.45, 0.6, fbm3(P));
  } else if (uSurf < 1.5) {
    // Cratered — regolith, maria and multi-scale craters
    s.h = surfHeight(p);
    vec3 grey = vec3(luma(c1));
    vec3 reg = mix(grey, c1, 0.4) * (0.72 + 0.4 * fbm3(P * 2.2));
    float maria = smoothstep(0.48, 0.62, fbm3(P * 0.55 + 4.0));
    reg = mix(reg, mix(reg * 0.5, c2 * 0.35, 0.25), maria);
    vec2 v = voronoi(P * 8.5 + 3.3, 0.55, cell, fp);
    float small = craterP(v.x / (0.14 + 0.14 * hash13(cell))) * smoothstep(0.0, 0.1, v.y - v.x);
    s.alb = reg * (0.82 + 0.55 * s.h + 0.12 * small);
    s.bump = 1.0;
    s.spec = 0.02;
    s.wrap = 0.02;
  } else if (uSurf < 2.5) {
    // Gas giant — sheared bands, turbulence and a great spot
    float lat = p.y;
    float shear = sin(lat * 7.0 + uVar.x * 6.0) * sin(t * 0.02) * 1.3;
    vec3 pr = rotY(p, shear);
    vec3 Q = pr * uDetail * 2.0 + uSeed;
    float turb = fbm5(vec3(Q.x * 1.1, Q.y * 5.0, Q.z * 1.1));
    float warp = fbm3(Q * 2.4 + turb * 2.0);
    float b = lat * (4.0 + uVar.y * 4.0) * uDetail + (turb - 0.5) * 1.7 + (warp - 0.5) * 0.6;
    float band = 0.5 + 0.5 * sin(b * PI);
    float fine = 0.5 + 0.5 * sin(b * 9.4 + warp * 3.0);
    vec3 cream = mix(vec3(0.97, 0.9, 0.78), c1, 0.3);
    vec3 dark = c1 * 0.42 + c2 * 0.18;
    vec3 col = mix(dark, cream, band);
    col = mix(col, c2, smoothstep(0.55, 1.0, fine) * 0.4 * (1.0 - band));
    float slon = uVar.z * TAU - PI;
    float slat = -0.3;
    float dl = angDiff(atan(pr.z, pr.x), slon) * 0.95;
    float dy = (lat - slat) * 2.3;
    float e = length(vec2(dl, dy));
    float core = 1.0 - smoothstep(0.06, 0.17, e);
    float swirl = 0.5 + 0.5 * sin(e * 70.0 - atan(dy, dl) * 2.0 + t * 0.4);
    vec3 spotC = mix(c2 * 1.15, vec3(0.95, 0.55, 0.35), 0.35);
    col = mix(col, spotC * (0.8 + 0.25 * swirl), core);
    col = mix(col, spotC * 0.75, (1.0 - smoothstep(0.12, 0.24, e)) * (1.0 - core) * swirl * 0.45);
    s.alb = col;
    s.spec = 0.03;
    s.wrap = 0.14;
  } else if (uSurf < 3.5) {
    // Gemstone — tilted facets, inner glow, sparkle
    vec2 v = voronoi(P * 0.9, 1.0, cell, fp);
    vec3 rnd = hash33(cell * 1.31) - 0.5;
    s.nOff = rnd * 1.1;
    float hs = hash13(cell);
    float edge = 1.0 - smoothstep(0.0, 0.02, v.y - v.x);
    float depth = dot(normalize(p + s.nOff), vec3(0.0, 0.0, 1.0));
    vec3 base = mix(c1, c2, smoothstep(0.2, 0.8, hs + wn.y * 0.3));
    s.alb = base * 0.35;
    s.emit = base * (0.12 + 0.45 * pow(1.0 - v.x, 2.0)) * (0.7 + 0.3 * depth) + mix(base, vec3(1.0), 0.6) * edge * 0.25;
    float tw = step(0.9, hash13(cell + floor(t * 1.4 + hs * 9.0)));
    s.emit += vec3(1.0) * tw * 0.55 * (1.0 - smoothstep(0.0, 0.5, v.x));
    s.spec = 1.6;
    s.shin = 140.0;
    s.wrap = 0.0;
  } else if (uSurf < 4.5) {
    // Ocean world — deep water, archipelagos, foam, sun glint
    float h = surfHeight(p);
    s.h = h;
    float sea = 0.6;
    float land = smoothstep(sea, sea + 0.012, h);
    float depth = clamp((sea - h) / 0.25, 0.0, 1.0);
    vec3 deep = mix(vec3(0.01, 0.04, 0.14), c1 * 0.32, 0.55);
    vec3 shallow = mix(vec3(0.1, 0.62, 0.72), c1, 0.35);
    vec3 ocean = mix(shallow, deep, smoothstep(0.0, 0.45, depth));
    vec3 ground = mix(vec3(0.86, 0.78, 0.56), mix(vec3(0.24, 0.52, 0.24), c2, 0.3), smoothstep(sea + 0.01, sea + 0.06, h));
    ground = mix(ground, vec3(0.5, 0.45, 0.4), smoothstep(sea + 0.1, sea + 0.18, h));
    float foam = exp(-pow((h - sea) / 0.007, 2.0)) * (0.55 + 0.45 * noise(P * 30.0 + t * 0.3));
    s.alb = mix(ocean, ground, land) + foam * 0.55 * (1.0 - land * 0.5);
    s.spec = mix(1.3, 0.04, land);
    s.shin = mix(70.0, 12.0, land);
    vec3 wv = vec3(noise(P * 14.0 + t * 0.35), noise(P * 14.0 + 11.0 - t * 0.3), noise(P * 14.0 + 23.0)) - 0.5;
    s.nOff = wv * 0.12 * (1.0 - land);
    s.land = land;
    s.bump = 0.6;
  } else if (uSurf < 5.5) {
    // Volcanic — black basalt, pulsing lava rivers
    s.h = surfHeight(p);
    float r = ridged(P * 1.1 + vec3(0.0, t * 0.004, 0.0));
    float lava = smoothstep(0.84, 0.97, r);
    float pulse = 0.72 + 0.28 * sin(t * 1.2 + fbm3(P * 3.0) * 6.0);
    vec3 basalt = mix(vec3(0.05, 0.045, 0.05), c1 * 0.2, 0.5) * (0.6 + 0.8 * fbm3(P * 4.0));
    vec3 hot = mix(vec3(1.0, 0.3, 0.04), mix(vec3(1.0, 0.78, 0.3), c2, 0.25), lava);
    s.alb = basalt * (1.0 - lava);
    s.emit = hot * lava * 2.3 * pulse + vec3(0.55, 0.1, 0.02) * smoothstep(0.66, 0.86, r) * 0.35;
    s.bump = 0.8;
    s.spec = 0.18;
    s.shin = 24.0;
    s.wrap = 0.03;
  } else if (uSurf < 6.5) {
    // Glacier — ice sheet, glowing fractures, frost
    vec2 v = voronoi(P * 1.3, 1.0, cell, fp);
    float crack = 1.0 - smoothstep(0.0, 0.022, v.y - v.x);
    vec2 v2 = voronoi(P * 3.7 + 5.0, 1.0, cell, fp);
    float crack2 = 1.0 - smoothstep(0.0, 0.014, v2.y - v2.x);
    vec3 ice = mix(vec3(0.86, 0.94, 1.0), c1, 0.2) * (0.88 + 0.18 * fbm3(P * 2.0));
    vec3 deepIce = mix(vec3(0.12, 0.45, 0.78), c1 * 0.6, 0.3);
    s.alb = mix(ice, deepIce, max(crack * 0.85, crack2 * 0.5));
    s.emit = deepIce * (crack * 0.3 + crack2 * 0.12) + vec3(1.0) * step(0.996, hash13(floor(P * 90.0))) * 0.6;
    s.spec = 1.0;
    s.shin = 64.0;
  } else if (uSurf < 7.5) {
    // Cyclones — swirling storm systems with lightning
    vec3 pw = p;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec3 ctr = normalize(hash33(uSeed + fi * 7.3) - 0.5);
      float d = length(pw - ctr);
      float w = exp(-d * d / 0.07);
      pw = rotAxis(pw, ctr, w * (4.5 + fi) * (0.8 + 0.2 * sin(t * 0.15 + fi)));
    }
    vec3 Q = Pof(pw);
    vec3 q1 = vec3(fbm3(Q * 1.1 + vec3(0.0, 0.0, t * 0.03)), fbm3(Q * 1.1 + vec3(5.2, 1.3, 0.0)), fbm3(Q * 1.1 + vec3(1.7, 9.2, t * 0.02)));
    float f = fbm5(Q * 1.2 + q1 * 2.4);
    vec3 light = mix(c1, vec3(0.86, 0.89, 0.96), 0.45);
    s.alb = mix(c1 * 0.16, light, smoothstep(0.32, 0.76, f));
    s.alb = mix(s.alb, c2 * 0.7, smoothstep(0.45, 0.6, f) * (1.0 - smoothstep(0.6, 0.75, f)) * 0.35);
    float flash = step(0.982, hash13(floor(P * 6.0) + floor(t * 7.0))) * smoothstep(0.5, 0.8, f);
    s.emit = vec3(0.8, 0.86, 1.0) * flash * 2.4 * (0.5 + 0.5 * noise(P * 20.0));
    s.spec = 0.08;
    s.wrap = 0.22;
  } else if (uSurf < 8.5) {
    // Living world — continents, biomes, snow, clouds
    float h = surfHeight(p);
    s.h = h;
    float sea = 0.5;
    float land = smoothstep(sea, sea + 0.01, h);
    float e = clamp((h - sea) / 0.3, 0.0, 1.0);
    float moist = fbm3(P * 1.7 + 9.0);
    float latA = abs(p.y);
    vec3 veg = mix(vec3(0.1, 0.34, 0.11), mix(vec3(0.28, 0.56, 0.2), c1, 0.3), moist);
    vec3 sand = mix(vec3(0.8, 0.66, 0.42), c2 * 0.5 + 0.3, 0.12);
    float arid = (1.0 - smoothstep(0.38, 0.55, moist)) * (1.0 - smoothstep(0.2, 0.5, latA));
    vec3 ground = mix(veg, sand, arid);
    ground = mix(ground, vec3(0.45, 0.4, 0.36), smoothstep(0.45, 0.7, e));
    ground = mix(ground, vec3(0.95), smoothstep(0.78, 0.9, e + latA * 0.45));
    float depth = clamp((sea - h) / 0.2, 0.0, 1.0);
    vec3 ocean = mix(mix(vec3(0.08, 0.35, 0.55), c2 * 0.5, 0.2), mix(vec3(0.02, 0.07, 0.24), c2 * 0.2, 0.25), smoothstep(0.0, 0.4, depth));
    s.alb = mix(ocean, ground, land);
    float cl = smoothstep(0.56, 0.78, fbm3(rotY(P, t * 0.01) * 1.6 + 30.0));
    s.alb = mix(s.alb, vec3(0.97), cl * 0.75);
    s.spec = mix(1.0, 0.03, max(land, cl));
    s.shin = 60.0;
    s.land = land * (1.0 - cl);
    s.bump = 0.7 * (1.0 - cl);
  } else if (uSurf < 9.5) {
    // Dunes — crisp crests, canyons, wind dust
    float h = surfHeight(p);
    s.h = h;
    vec3 sand = mix(c1, vec3(0.9, 0.64, 0.36), 0.7);
    float w = fbm3(P * 0.8) * 5.0;
    float dune = 1.0 - abs(sin(dot(P, vec3(4.0, 1.5, 3.0)) * 2.6 + w));
    float c = 1.0 - abs(fbm3(P * 0.7 + 2.0) * 2.0 - 1.0);
    float canyon = smoothstep(0.955, 0.995, c);
    s.alb = mix(sand * 0.62, sand * 1.2, dune * dune) * (0.86 + 0.28 * fbm3(P * 3.0));
    s.alb = mix(s.alb, mix(c2 * 0.35, vec3(0.35, 0.15, 0.08), 0.5), canyon);
    s.bump = 1.0;
    s.spec = 0.03;
    s.wrap = 0.04;
  } else if (uSurf < 10.5) {
    // Neon grid — dark glass, glowing grid, circuits, pulses
    float lines = gridLines(p, 18.0, 12.0, 0.012);
    vec2 v = voronoi(P * 1.6, 1.0, cell, fp);
    float trace = (1.0 - smoothstep(0.0, 0.03, v.y - v.x)) * step(0.45, hash13(cell));
    float la = asin(clamp(p.y, -1.0, 1.0));
    float lonCell = floor(lon / TAU * 18.0);
    float pulse = smoothstep(0.86, 1.0, fract(la * 1.5 - t * 0.35 + hash13(vec3(lonCell, 1.0, 2.0))));
    s.alb = c1 * 0.035 + vec3(0.01);
    s.emit = c1 * lines * 1.6 + c2 * trace * 1.15 * (0.6 + 0.4 * sin(t * 2.0 + hash13(cell) * 6.28)) + vec3(1.0) * pulse * lines * 1.2;
    s.spec = 0.7;
    s.shin = 60.0;
    s.land = 0.0;
  } else if (uSurf < 11.5) {
    // Marble — polished stone with veins
    float w1 = fbm5(P * 0.9);
    float w2 = fbm3(P * 2.2 + w1 * 3.0);
    float vein = abs(sin((P.x * 1.3 + P.y * 0.7 + w1 * 5.0 + w2 * 2.0) * 2.0));
    float v1 = pow(1.0 - vein, 6.0);
    float v2 = pow(1.0 - abs(sin(P.z * 2.0 + w2 * 6.0)), 12.0);
    vec3 stone = mix(vec3(0.95, 0.94, 0.92), c1, 0.2) * (0.92 + 0.1 * w2);
    s.alb = mix(stone, c1 * 0.35 + c2 * 0.2, v1 * 0.9);
    s.alb = mix(s.alb, vec3(0.92, 0.74, 0.36), v2 * 0.7);
    s.spec = 1.1;
    s.shin = 90.0;
  } else if (uSurf < 12.5) {
    // Stained glass — backlit panes and lead lines
    vec2 v = voronoi(P * 1.9, 0.9, cell, fp);
    float hs = hash13(cell);
    vec3 h3 = hash33(cell + 2.0);
    vec3 tile = hs < 0.33 ? c1 : (hs < 0.66 ? c2 : mix(c1, c2, 0.5));
    tile = hueShift(tile, (h3.x - 0.5) * 2.6) * (0.75 + 0.45 * h3.y);
    float lead = 1.0 - smoothstep(0.04, 0.07, v.y - v.x);
    s.alb = mix(tile * 0.35, vec3(0.02), lead);
    s.emit = tile * (0.5 + 0.18 * sin(t * 0.8 + hs * 6.28)) * (1.0 - lead) * (0.75 + 0.5 * (1.0 - v.x));
    s.nOff = (h3 - 0.5) * 0.3 * (1.0 - lead);
    s.spec = 0.8;
    s.shin = 60.0;
  } else if (uSurf < 13.5) {
    // Shattered — plates split by glowing seams
    s.h = surfHeight(p);
    vec2 v = voronoi(P * 0.95, 1.0, cell, fp);
    float e = v.y - v.x;
    vec3 pt = hash33(cell);
    float gap = 1.0 - smoothstep(0.04, 0.075, e);
    vec3 rock = mix(c1 * 0.5, c1 * 0.95, pt.x) * (0.72 + 0.42 * fbm3(P * 3.0));
    vec3 core = mix(c2, vec3(1.0, 0.82, 0.55), 0.3);
    s.alb = mix(rock, vec3(0.02), gap);
    float glow = 1.0 - smoothstep(0.0, 0.06, e);
    s.emit = core * (glow * glow * 2.4 + exp(-e * 22.0) * 0.35) * (0.85 + 0.15 * sin(t * 1.5 + v.x * 10.0));
    s.nOff = (pt - 0.5) * 0.18 * (1.0 - gap);
    s.bump = 0.7;
    s.spec = 0.12;
    s.shin = 20.0;
    s.wrap = 0.02;
  } else if (uSurf < 14.5) {
    // Little sun — convection granules, spots, self-lit
    vec2 v = voronoi(P * 3.0 + vec3(0.0, t * 0.05, 0.0), 1.0, cell, fp);
    float lane = smoothstep(0.0, 0.09, v.y - v.x);
    vec3 hot = mix(c1, vec3(1.0, 0.86, 0.6), 0.22);
    vec3 base = hot * (0.45 + 0.55 * lane) * (0.9 + 0.2 * hash13(cell + floor(t * 0.5)));
    float spot = smoothstep(0.64, 0.72, fbm3(P * 0.8 + 4.0));
    base *= 1.0 - 0.7 * spot;
    s.alb = vec3(0.0);
    s.emit = base * 0.8;
    s.selfLit = 1.0;
    s.land = 0.0;
  } else if (uSurf < 15.5) {
    // Shadow — black smoke with faint living veins
    vec3 wq = P + 1.5 * vec3(fbm3(P * 0.8 + t * 0.02), fbm3(P * 0.8 + 3.0), fbm3(P * 0.8 + 7.0 - t * 0.02));
    float smoke = fbm5(wq * 1.3);
    s.alb = mix(vec3(0.01), c1 * 0.12, smoke);
    s.emit = mix(c1, c2, smoke) * pow(smoothstep(0.52, 0.85, smoke), 2.0) * 0.45;
    s.lightK = 0.35;
    s.spec = 0.3;
    s.shin = 30.0;
    s.land = 0.0;
  } else if (uSurf < 16.5) {
    // Candy spiral — crisp helical stripes
    float k = 3.0 + floor(uVar.x * 4.0);
    float sp = lon / TAU * k + p.y * (1.5 + uVar.y * 2.5) * uDetail;
    float f = fract(sp);
    float st = smoothstep(0.47, 0.5, f) - smoothstep(0.97, 1.0, f);
    float sep = exp(-pow((f - 0.5) / 0.012, 2.0)) + exp(-pow(min(f, 1.0 - f) / 0.012, 2.0));
    s.alb = mix(c1, c2, st);
    s.alb = mix(s.alb, vec3(1.0), sep * 0.75);
    s.spec = 1.0;
    s.shin = 70.0;
    s.wrap = 0.12;
  } else if (uSurf < 17.5) {
    // Spotted — dots and rosettes
    vec2 v = voronoi(P * 2.3, 0.8, cell, fp);
    vec3 h3 = hash33(cell);
    float rad = 0.2 + 0.16 * h3.x;
    float dotA = 1.0 - smoothstep(rad - 0.02, rad + 0.02, v.x);
    vec3 base = c1 * (0.9 + 0.16 * fbm3(P * 2.0));
    vec3 spotC = mix(c2, c2 * 0.55, h3.z * 0.6);
    if (h3.y > 0.55) {
      float ring = smoothstep(rad * 0.55 - 0.02, rad * 0.55 + 0.02, v.x) * dotA;
      s.alb = mix(base, spotC * 0.55, ring);
      s.alb = mix(s.alb, mix(base, spotC, 0.35), dotA * (1.0 - ring));
    } else {
      s.alb = mix(base, spotC, dotA);
    }
    s.spec = 0.25;
    s.shin = 20.0;
    s.wrap = 0.15;
  } else if (uSurf < 18.5) {
    // Aurora world — dark globe wrapped in light curtains
    s.alb = mix(vec3(0.03, 0.04, 0.07), c1 * 0.22, fbm3(P * 1.5));
    vec3 em = vec3(0.0);
    for (int i = 0; i < 2; i++) {
      float sgn = i == 0 ? 1.0 : -1.0;
      float ctr = sgn * (0.48 + 0.1 * uVar.x) + 0.1 * sin(lon * 3.0 + t * 0.25 + uVar.y * 6.0 + sgn) + 0.05 * sin(lon * 7.0 - t * 0.4);
      float dy = (p.y - ctr) * sgn;
      float body = dy > 0.0 ? exp(-dy / 0.075) : exp(-dy * dy / 0.0012);
      float streak = 0.3 + 0.7 * noise(vec3(lon * 22.0, p.y * 2.0, t * 0.6 + sgn));
      vec3 cc = mix(mix(c1, vec3(0.3, 1.0, 0.65), 0.35), c2, clamp(dy / 0.14, 0.0, 1.0));
      em += cc * body * streak;
    }
    s.emit = em * (0.85 + 0.3 * sin(t * 0.7 + lon * 2.0)) * 1.25;
    s.spec = 0.2;
    s.land = 0.0;
  } else if (uSurf < 19.5) {
    // Chrome — mirror reflections, panel seams, brushed metal
    vec3 R = reflect(vec3(0.0, 0.0, -1.0), wn);
    vec3 sky = mix(mix(c1, vec3(1.0), 0.5), vec3(1.0), smoothstep(0.2, 0.9, R.y));
    vec3 ground = mix(c2 * 0.18, vec3(0.04), 0.4);
    float horizon = exp(-R.y * R.y * 90.0) * 0.8;
    vec3 env = mix(ground, sky, smoothstep(-0.06, 0.06, R.y)) + horizon;
    float fx = fract(lon / TAU * 10.0);
    float fy = fract(asin(clamp(p.y, -1.0, 1.0)) / PI * 8.0 + 0.5);
    float seam = max(1.0 - smoothstep(0.0, 0.012, min(fx, 1.0 - fx)), 1.0 - smoothstep(0.0, 0.02, min(fy, 1.0 - fy)));
    float panel = hash13(vec3(floor(lon / TAU * 10.0), floor(asin(clamp(p.y, -1.0, 1.0)) / PI * 8.0 + 0.5), 4.0));
    float brushed = noise(vec3(lon * 2.0, p.y * 220.0, 0.0));
    s.alb = env * mix(c1, vec3(1.0), 0.35) * (0.84 + 0.16 * brushed) * (0.94 + 0.12 * panel) * (1.0 - seam * 0.65);
    s.selfLit = 0.7;
    s.spec = 2.0;
    s.shin = 180.0;
    s.wrap = 0.0;
  } else if (uSurf < 20.5) {
    // Cloud veil — Venus-like layered cloud deck
    vec3 Q = Pof(rotY(p, t * 0.015));
    float f1 = fbm5(vec3(Q.x, Q.y * 2.6, Q.z) * 0.9);
    float f2 = fbm3(vec3(Q.x, Q.y * 3.5, Q.z) * 1.8 + f1 * 3.0 + vec3(t * 0.02, 0.0, 0.0));
    float chev = 0.5 + 0.5 * sin(p.y * 9.0 + f1 * 6.0 + abs(lon) * 1.5);
    vec3 warm = mix(vec3(0.98, 0.86, 0.62), c1, 0.55);
    s.alb = mix(warm * 0.45, warm * 1.15, smoothstep(0.25, 0.75, f1 * 0.7 + chev * 0.3));
    s.alb = mix(s.alb, mix(c2, vec3(1.0), 0.25), smoothstep(0.58, 0.82, f2) * 0.5) * (0.8 + 0.3 * f2);
    s.wrap = 0.45;
    s.spec = 0.0;
  } else if (uSurf < 21.5) {
    // Molten — flowing lava sea with floating crust
    s.h = surfHeight(p);
    vec3 Q = P + vec3(t * 0.03, 0.0, t * 0.02);
    float f = fbm5(Q * 1.1 + fbm3(Q * 2.0 - t * 0.05) * 1.5);
    vec3 molten = mix(vec3(0.75, 0.12, 0.02), mix(vec3(1.0, 0.62, 0.12), c1, 0.25), smoothstep(0.35, 0.8, f));
    molten = mix(molten, vec3(1.0, 0.9, 0.5), smoothstep(0.72, 0.9, f) * 0.6);
    float crust = s.h;
    float crustTex = 0.06 + 0.07 * fbm3(P * 5.0);
    s.alb = mix(vec3(0.18, 0.05, 0.02), vec3(crustTex), crust);
    s.emit = molten * (1.0 - crust) * 1.15 + molten * 0.8 * crust * smoothstep(0.8, 0.95, noise(P * 12.0));
    s.bump = 0.5;
    s.spec = 0.15;
    s.land = 0.0;
  } else if (uSurf < 22.5) {
    // Pearl — nacre layers with view-dependent iridescence
    vec3 base = mix(vec3(0.97, 0.95, 0.96), c1, 0.28);
    float layers = fbm3(P * 1.2);
    float rings = 0.5 + 0.5 * sin(layers * 24.0);
    float hue = fract(wn.z * 1.3 + layers * 0.8 + t * 0.01 + uVar.x);
    vec3 irid = hsv2rgb(vec3(hue, 0.38, 1.0));
    s.alb = mix(base, irid, 0.38 + 0.15 * rings) * (0.95 + 0.05 * rings);
    s.spec = 1.2;
    s.shin = 40.0;
    s.wrap = 0.22;
  } else if (uSurf < 23.5) {
    // Low-poly — flat facets with a wireframe
    vec2 v = voronoi(P * 1.15, 0.75, cell, fp);
    vec3 fn = normalize(fp / 1.15 - uSeed);
    s.nOff = fn - p;
    float hs = hash13(cell);
    float wire = 1.0 - smoothstep(0.0, 0.03, v.y - v.x);
    s.alb = mix(c1, c2, hs) * (0.82 + 0.3 * hash13(cell + 5.0)) * (1.0 - wire * 0.35);
    s.emit = mix(c1, vec3(1.0), 0.6) * wire * 0.45;
    s.spec = 0.08;
    s.wrap = 0.0;
  } else if (uSurf < 24.5) {
    // Misty — surface lost in drifting fog
    float landM = smoothstep(0.45, 0.6, fbm5(P * 0.8 + 3.0));
    vec3 s0 = mix(c1 * 0.18, c2 * 0.12, landM) * (0.7 + 0.4 * fbm3(P * 2.5));
    float fog1 = fbm5(P * 0.7 + vec3(t * 0.02, 0.0, 0.0));
    float fog2 = fbm3(P * 1.4 - vec3(0.0, t * 0.015, 0.0) + fog1 * 1.5);
    vec3 fogC = mix(c1, vec3(0.82, 0.88, 1.0), 0.6);
    float fogA = smoothstep(0.35, 0.75, fog1 * 0.55 + fog2 * 0.55);
    s.alb = mix(s0, fogC * 0.8, fogA * 0.85);
    s.emit = fogC * fogA * 0.12;
    s.wrap = 0.6;
    s.spec = 0.0;
  } else if (uSurf < 25.5) {
    // Coral reef — labyrinth ridges and polyps
    s.h = surfHeight(p);
    vec2 v = voronoi(P * 7.0, 1.0, cell, fp);
    float polyp = 1.0 - smoothstep(0.12, 0.22, v.x);
    vec3 low = c1 * 0.45;
    vec3 high = mix(c1, vec3(1.0, 0.72, 0.62), 0.3);
    s.alb = mix(low, high, s.h);
    s.alb = mix(s.alb, mix(c2, vec3(1.0), 0.2), polyp * s.h * 0.75);
    s.emit = c2 * polyp * s.h * 0.12;
    s.bump = 0.9;
    s.spec = 0.3;
    s.shin = 22.0;
  } else if (uSurf < 26.5) {
    // Eclipse — nearly black disk, lit from behind
    s.alb = c1 * 0.06 + vec3(0.012) * fbm3(P * 2.0);
    s.spec = 0.2;
    s.land = 0.0;
  } else if (uSurf < 27.5) {
    // Prism — spectral facets
    vec2 v = voronoi(P * 1.2, 1.0, cell, fp);
    float hue = fract(lon / TAU * 2.0 + p.y * 0.35 + t * 0.02 + hash13(cell) * 0.25 + uVar.x);
    vec3 spc = hsv2rgb(vec3(hue, 0.78, 1.0));
    float edge = 1.0 - smoothstep(0.0, 0.03, v.y - v.x);
    s.alb = mix(spc, c1, 0.2) * 0.55;
    s.emit = spc * 0.26 * (1.0 - v.x * 0.8) + vec3(1.0) * edge * 0.35;
    s.nOff = (hash33(cell * 1.7) - 0.5) * 0.5;
    s.spec = 1.5;
    s.shin = 120.0;
    s.land = 0.0;
  } else if (uSurf < 28.5) {
    // Cosmic window — a starfield and nebula inside the sphere
    vec3 dir = normalize(uObj * normalize(vec3(wn.xy * 0.75, 1.0)));
    float neb = fbm5(dir * 2.6 + uSeed);
    float nebMask = pow(smoothstep(0.35, 0.85, neb), 1.6);
    vec3 nebC = mix(c1, c2, fbm3(dir * 1.6 + 7.0));
    vec3 em = nebC * nebMask * 1.5 + vec3(0.01, 0.01, 0.03);
    for (int i = 0; i < 2; i++) {
      float sc = i == 0 ? 26.0 : 60.0;
      vec3 Sp = dir * sc + uSeed * 3.0;
      vec3 id = floor(Sp);
      vec3 fo = hash33(id);
      float d = length(fract(Sp) - fo);
      float on = step(i == 0 ? 0.7 : 0.82, hash13(id + 1.7));
      em += vec3(1.0, 0.97, 0.9) * (1.0 - smoothstep(0.0, i == 0 ? 0.1 : 0.07, d)) * on * (i == 0 ? 1.4 : 0.8);
    }
    vec3 gc = normalize(hash33(uSeed + 2.0) - 0.5);
    em += mix(c2, vec3(1.0), 0.5) * pow(max(dot(dir, gc), 0.0), 40.0) * 1.4;
    s.alb = vec3(0.0);
    s.emit = em;
    s.selfLit = 1.0;
    s.spec = 1.1;
    s.shin = 90.0;
    s.land = 0.0;
  } else if (uSurf < 29.5) {
    // Hologram — translucent wireframe with scan lines
    float lines = gridLines(p, 16.0, 10.0, 0.01);
    float scan = 0.5 + 0.5 * sin(wn.y * 170.0 - t * 6.0);
    float glitch = step(0.9, noise(vec3(floor(wn.y * 18.0), t * 3.0, 0.0)));
    float flick = 0.88 + 0.12 * step(0.4, noise(vec3(t * 18.0, 0.0, 0.0)));
    s.alb = vec3(0.0);
    s.emit = (c1 * (lines * 1.5 + 0.14 + 0.18 * scan) + c2 * glitch * 0.6) * flick;
    s.selfLit = 1.0;
    s.alpha = clamp(0.16 + lines * 0.75 + scan * 0.08 + glitch * 0.2, 0.0, 1.0);
    s.spec = 0.0;
    s.land = 0.0;
  } else if (uSurf < 30.5) {
    // Acid swamp — sludge, glowing pools, popping bubbles
    float f = fbm5(P * 1.0 + vec3(0.0, t * 0.01, 0.0));
    vec3 acid = mix(vec3(0.55, 1.0, 0.18), c1, 0.45);
    vec3 sludge = mix(vec3(0.03, 0.04, 0.02), acid * 0.3, f);
    float pool = smoothstep(0.5, 0.56, fbm3(P * 0.9 + 3.0));
    float vein = 1.0 - smoothstep(0.0, 0.04, abs(fbm3(P * 1.6 + 9.0) - 0.5));
    sludge += acid * vein * 0.25;
    vec2 v = voronoi(P * 4.0, 1.0, cell, fp);
    float ph = fract(t * 0.35 + hash13(cell));
    float bub = exp(-pow((v.x - ph * 0.35) / 0.025, 2.0)) * (1.0 - ph) * pool;
    s.alb = mix(sludge, acid * 0.4, pool);
    s.emit = mix(acid, c2, 0.25) * pool * (0.55 + 0.25 * sin(t + f * 10.0)) + acid * bub * 1.8 + acid * vein * 0.35;
    s.spec = mix(0.2, 1.0, pool);
    s.shin = 50.0;
  } else {
    // Twilight — tidally locked: scorched day, frozen night, living ring
    float ld = dot(wn, uL1);
    vec3 hot = mix(vec3(1.0, 0.48, 0.18), c1, 0.18) * (0.7 + 0.4 * fbm3(P * 2.0));
    vec3 cold = mix(vec3(0.78, 0.88, 1.0), c2, 0.2) * (0.85 + 0.2 * fbm3(P * 3.0));
    float band = exp(-pow((ld - 0.05) / 0.13, 2.0));
    vec3 green = mix(vec3(0.2, 0.5, 0.25), c1, 0.2) * (0.7 + 0.5 * fbm3(P * 4.0));
    float day = smoothstep(-0.1, 0.35, ld);
    s.alb = mix(cold, hot, day);
    s.alb = mix(s.alb, green, band * smoothstep(0.38, 0.6, fbm3(P * 1.5)));
    s.emit = hot * 0.3 * smoothstep(0.65, 1.0, ld) * smoothstep(0.6, 0.85, fbm3(P * 3.0 + 5.0)) + cold * 0.16 * (1.0 - smoothstep(-0.3, 0.0, ld));
    s.spec = mix(0.7, 0.05, day);
    s.shin = 50.0;
  }
  return s;
}

/* ---------------- rings ---------------- */

void ringStyle(float kind, float d, float ang, out vec3 col, out float a, out float emis) {
  col = vec3(0.0);
  a = 0.0;
  emis = 0.0;
  float t = uTime;
  if (kind < 1.5) {
    if (d < 1.28 || d > 2.15) return;
    float bands = 0.35 + 0.65 * (0.6 * noise(vec3(d * 55.0, 1.0, uSeed.x)) + 0.4 * noise(vec3(d * 13.0, 2.0, uSeed.y)));
    a = bands * smoothstep(1.28, 1.36, d) * (1.0 - smoothstep(2.05, 2.15, d));
    a *= 0.12 + 0.88 * smoothstep(0.0, 0.035, abs(d - 1.78));
    a *= 1.0 - 0.7 * exp(-pow((d - 2.0) / 0.008, 2.0));
    a *= mix(0.35, 1.0, smoothstep(1.38, 1.5, d));
    col = mix(mix(uC2, vec3(0.95, 0.88, 0.75), 0.5), mix(uC1, vec3(1.0), 0.3), noise(vec3(d * 7.0, 3.0, 0.0)));
    a *= 0.85;
  } else if (kind < 2.5 || kind > 6.5) {
    float w2 = max(0.006, uPx * 0.8);
    a = exp(-pow((d - 1.62) / max(0.022, uPx), 2.0)) * 0.9 + exp(-pow((d - 1.95) / w2, 2.0)) * 0.5 * min(1.0, 0.006 / w2 * 1.6);
    col = mix(uC2, vec3(1.0), 0.45);
  } else if (kind < 3.5) {
    float inner = smoothstep(1.3, 1.34, d) * (1.0 - smoothstep(1.54, 1.58, d));
    float outer = smoothstep(1.75, 1.79, d) * (1.0 - smoothstep(2.06, 2.12, d));
    float tex = 0.7 + 0.3 * noise(vec3(d * 40.0, 5.0, 0.0));
    a = (inner + outer) * tex * 0.8;
    col = mix(mix(uC1, vec3(1.0), 0.25), mix(uC2, vec3(1.0), 0.2), outer);
  } else if (kind < 4.5) {
    if (d < 1.2 || d > 2.3) return;
    float body = smoothstep(1.2, 1.4, d) * (1.0 - smoothstep(1.9, 2.3, d));
    float cloud = 0.6 + 0.4 * noise(vec3(d * 6.0, ang * 2.0, 1.0));
    float ca = ang + t * 0.08 / (d * d);
    vec3 id = vec3(floor(d * 70.0), floor(ca * 90.0 / TAU), 3.0);
    float spark = step(0.982, hash13(id)) * (0.5 + 0.5 * sin(t * 3.0 + hash13(id + 1.0) * 6.28));
    a = body * cloud * 0.22 + spark * body * 0.8;
    col = mix(mix(uC2, vec3(0.9), 0.35), vec3(1.0), spark);
  } else if (kind < 5.5) {
    float core = exp(-pow((d - 1.7) / max(0.012, uPx * 0.8), 2.0));
    float halo = exp(-pow((d - 1.7) / 0.09, 2.0)) * 0.35;
    float pulse = 0.55 + 0.45 * sin(ang * 6.0 - t * 2.0);
    float second = exp(-pow((d - 1.92) / max(0.006, uPx * 0.8), 2.0)) * 0.6;
    a = (core + halo * pulse) * 0.9 + second;
    col = mix(uC2 * 1.6, vec3(1.0), core * 0.4);
    col = mix(col, uC1 * 1.4, min(second / max(a, 0.001), 1.0));
    emis = 1.0;
  } else {
    if (d < 1.38 || d > 2.05) return;
    float ca = ang + t * 0.25 * pow(d, -1.5);
    float rc = d * 26.0;
    float ac = ca / TAU * 150.0;
    vec3 id = vec3(floor(rc), floor(ac), 7.0);
    vec3 h = hash33(id);
    vec2 f = vec2(fract(rc), fract(ac)) - 0.5 - (h.xy - 0.5) * 0.5;
    float chunk = 1.0 - smoothstep(0.18 + 0.2 * h.z, 0.32 + 0.2 * h.z, length(f));
    float on = step(0.35, h.x);
    float edgeF = smoothstep(1.38, 1.46, d) * (1.0 - smoothstep(1.95, 2.05, d));
    float glint = step(0.93, hash13(id + floor(t * 2.0))) * chunk;
    a = (chunk * on * 0.85 + 0.08) * edgeF;
    col = mix(mix(vec3(0.85, 0.93, 1.0), uC2, 0.25), vec3(1.0), glint);
    emis = glint;
  }
}

float ringAlphaAt(float kind, float d) {
  vec3 c;
  float a;
  float e;
  ringStyle(kind, d, 0.0, c, a, e);
  return a * (1.0 - e * 0.7);
}

vec4 ringLayer(vec2 q, vec3 N, float kind, vec3 L1, out float rz) {
  rz = -99.0;
  if (abs(N.z) < 0.015) return vec4(0.0);
  float z = -(N.x * q.x + N.y * q.y) / N.z;
  vec3 P = vec3(q, z);
  float d = length(P);
  if (d < 1.15 || d > 2.32) return vec4(0.0);
  vec3 u = normalize(cross(N, vec3(0.0, 0.0, 1.0)));
  vec3 v = cross(N, u);
  float ang = atan(dot(P, v), dot(P, u)) + uRingSpin;
  vec3 col;
  float a;
  float emis;
  ringStyle(kind, d, ang, col, a, emis);
  if (a <= 0.002) return vec4(0.0);
  float b1 = dot(P, L1);
  float lit1 = b1 < 0.0 ? smoothstep(0.96, 1.05, sqrt(max(dot(P, P) - b1 * b1, 0.0))) : 1.0;
  float b2 = dot(P, uL2);
  float lit2 = b2 < 0.0 ? smoothstep(0.96, 1.05, sqrt(max(dot(P, P) - b2 * b2, 0.0))) : 1.0;
  vec3 light = uL1c * lit1 * 0.95 + uL2c * lit2 * 0.95 + uAmbient * 2.5;
  col = min(col * mix(light, vec3(1.0), emis), vec3(1.0));
  a = clamp(a, 0.0, 1.0);
  rz = z;
  return vec4(col * a, a);
}

float ringShadowAt(vec3 S, vec3 L) {
  if (uRing < 0.5) return 1.0;
  float sh = 1.0;
  float dn = dot(uRingN, L);
  if (abs(dn) > 0.001) {
    float tt = -dot(uRingN, S) / dn;
    if (tt > 0.0) sh *= 1.0 - 0.85 * clamp(ringAlphaAt(uRing, length(S + tt * L)), 0.0, 1.0);
  }
  if (uRing > 6.5) {
    float dn2 = dot(uRingN2, L);
    if (abs(dn2) > 0.001) {
      float t2 = -dot(uRingN2, S) / dn2;
      if (t2 > 0.0) sh *= 1.0 - 0.85 * clamp(ringAlphaAt(uRing, length(S + t2 * L)), 0.0, 1.0);
    }
  }
  return sh;
}

/* ---------------- moons ---------------- */

float moonShadowAt(vec3 S, vec3 L, vec4 m) {
  if (m.w <= 0.0) return 1.0;
  vec3 toM = m.xyz - S;
  float b = dot(toM, L);
  if (b <= 0.0) return 1.0;
  float dist = length(toM - b * L);
  return 0.22 + 0.78 * smoothstep(m.w * 0.72, m.w * 1.12, dist);
}

vec4 moonLayer(vec2 q, vec4 m, float idx, vec3 L1, out float mz) {
  mz = -99.0;
  if (m.w <= 0.0) return vec4(0.0);
  vec2 dq = q - m.xy;
  float d2 = dot(dq, dq);
  float rr = m.w * m.w;
  if (d2 >= rr) return vec4(0.0);
  float zz = sqrt(rr - d2);
  vec3 ln = vec3(dq, zz) / m.w;
  mz = m.z + zz;
  vec3 mp = ln * 2.6 + vec3(idx * 7.1 + uSeed.x, idx * 3.3, uSeed.z);
  vec3 cell;
  vec3 fp;
  vec2 v = voronoi(mp * 1.4, 0.55, cell, fp);
  float cr = craterP(v.x / (0.16 + 0.14 * hash13(cell))) * smoothstep(0.0, 0.1, v.y - v.x);
  vec3 tint = idx < 0.5 ? mix(vec3(0.64), uC2, 0.3) : (idx < 1.5 ? mix(vec3(0.78, 0.7, 0.62), uC1, 0.22) : mix(vec3(0.5, 0.56, 0.64), uC2, 0.45));
  vec3 alb = tint * (0.72 + 0.36 * fbm3(mp * 2.0)) * (0.86 + 0.3 * cr);
  vec3 W = vec3(q, mz);
  float b = dot(W, L1);
  float ps = b < 0.0 ? smoothstep(0.92, 1.06, sqrt(max(dot(W, W) - b * b, 0.0))) : 1.0;
  float dl1 = max(dot(ln, L1), 0.0) * ps;
  float dl2 = max(dot(ln, uL2), 0.0);
  vec3 col = alb * (uAmbient * 1.5 + uL1c * dl1 + uL2c * dl2);
  col += uAtmoCol * pow(1.0 - ln.z, 3.0) * 0.06;
  col = aces(col * 1.05);
  float a = clamp((m.w - sqrt(d2)) / (uPx * 1.2), 0.0, 1.0);
  return vec4(col * a, a);
}

/* ---------------- halo ---------------- */

vec3 halo(vec2 q, float r, vec3 L1, vec3 glowCol) {
  float rr = r - 1.0;
  float t = uTime;
  float ang = atan(q.y, q.x);
  vec2 ld = L1.xy;
  float lxy = length(ld);
  float side = lxy > 0.08 ? 0.25 + 0.75 * smoothstep(-0.6, 0.9, dot(q / r, ld / lxy)) : 0.85;
  if (L1.z < -0.3) side = max(side, 0.7);
  vec3 c = vec3(0.0);
  float g = exp(-rr * mix(15.0, 3.4, uGlow)) * 0.8 * pow(uGlow, 1.3);
  c += glowCol * g;
  if (uAtmo > 0.5 && uAtmo < 1.5) {
    c += uAtmoCol * (exp(-rr * 30.0) * 0.6 + exp(-rr * 10.0) * 0.12) * side;
  } else if (uAtmo > 1.5 && uAtmo < 2.5) {
    c += uAtmoCol * exp(-rr * 6.0) * 0.62 * (0.35 + 0.65 * side);
  } else if (uAtmo > 2.5 && uAtmo < 3.5) {
    float n = noise(vec3(ang * 3.0, rr * 8.0 - t * 0.6, t * 0.2));
    c += uAtmoCol * exp(-rr * 12.0) * (0.3 + 0.8 * n) * (0.4 + 0.6 * side);
  } else if (uAtmo > 3.5 && uAtmo < 4.5) {
    float arcPos = 0.035 + 0.11 * noise(vec3(ang * 2.5, t * 1.7, 3.0));
    float arc = (1.0 - smoothstep(0.0, 0.01 + 0.012 * rr, abs(rr - arcPos))) * step(0.42, noise(vec3(ang * 1.6, t * 3.0, 9.0)));
    c += uAtmoCol * exp(-rr * 22.0) * 0.6 + mix(uAtmoCol, vec3(1.0), 0.45) * arc * 1.2;
  } else if (uAtmo > 4.5) {
    c += uAtmoCol * exp(-rr * 8.5) * 0.55 * (0.45 + 0.55 * side) * (0.72 + 0.28 * noise(vec3(ang * 6.0, rr * 10.0, t * 0.1)));
  }
  if (isSurf(14.0)) {
    float fl = noise(vec3(ang * 5.0, rr * 4.0 - t * 0.5, t * 0.15));
    c += mix(uC1, vec3(1.0, 0.95, 0.8), 0.4) * (exp(-rr * 7.0) * (0.45 + 0.55 * fl) + exp(-rr * 26.0) * 0.4);
  }
  if (isSurf(26.0)) {
    float st = noise(vec3(ang * 9.0, rr * 2.0, t * 0.05)) * noise(vec3(ang * 3.0 + 1.0, 0.0, t * 0.03));
    vec3 cc = mix(uC1, vec3(1.0), 0.55);
    c += cc * (exp(-rr * 16.0) * 1.3 + exp(-rr * 3.0) * (0.22 + 1.15 * st));
    float da = uVar.x * TAU;
    vec2 dd = q - vec2(cos(da), sin(da)) * 1.004;
    float dl = length(dd);
    c += vec3(1.0) * (exp(-dl * dl * 1100.0) * 2.2 + exp(-dl * 14.0) * 0.22);
    c += vec3(1.0) * (exp(-abs(dd.x) * 130.0) * exp(-abs(dd.y) * 8.0) + exp(-abs(dd.y) * 130.0) * exp(-abs(dd.x) * 8.0)) * 0.55;
  }
  if (isSurf(15.0)) c += uC2 * exp(-rr * 30.0) * 0.85;
  if (isSurf(29.0)) c += uC1 * exp(-rr * 26.0) * 0.5;
  if (uFx.z > 0.5) {
    vec3 ax = uFrame * vec3(0.0, 1.0, 0.0);
    float axl = length(ax.xy);
    float pole = axl > 0.05 ? abs(dot(q / r, ax.xy / axl)) : 0.0;
    c += mix(vec3(0.3, 1.0, 0.6), uC2, 0.4) * exp(-rr * 16.0) * smoothstep(0.8, 0.98, pole) * 0.65 * (0.55 + 0.45 * noise(vec3(ang * 10.0, t * 0.5, 0.0)));
  }
  return c;
}

/* ---------------- satellites ---------------- */

vec3 satellites(vec2 q, float r, float pz) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float ang = uTime * (0.32 + 0.09 * fi) + fi * 1.9 + uSeed.y;
    float rad = 1.1 + 0.07 * fi;
    float inc = -0.6 + fi * 0.33;
    vec3 po = vec3(cos(ang) * rad, sin(ang) * rad * sin(inc), sin(ang) * rad * cos(inc));
    vec3 w = uFrame * po;
    if (r < 1.0 && w.z < pz) continue;
    vec2 dd = q - w.xy;
    float d2 = dot(dd, dd);
    float blink = 0.5 + 0.5 * step(0.5, fract(uTime * 0.9 + fi * 0.37));
    float px2 = uPx * uPx;
    acc += vec3(1.0, 0.95, 0.85) * (exp(-d2 / (px2 * 2.2)) + exp(-d2 / (px2 * 28.0)) * 0.22) * blink;
  }
  return acc;
}

vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

void main() {
  vec2 q = vUv * uExtent;
  float r = length(q);
  float t = uTime;
  vec3 glowCol = mix(uC1, vec3(1.0), 0.2);
  vec3 L1 = uL1;
  if (isSurf(26.0)) L1 = normalize(vec3(0.08, 0.12, -1.0));

  vec4 acc = vec4(0.0);
  if (r > 0.99) {
    vec3 hc = min(halo(q, r, L1, glowCol), vec3(1.0)) * (1.0 - smoothstep(uExtent * 0.8, uExtent * 0.99, r));
    acc = vec4(hc, clamp(max(max(hc.r, hc.g), hc.b), 0.0, 1.0));
  }

  vec4 op = vec4(0.0);
  float opZ = -99.0;
  float pz = -99.0;

  if (r < 1.0) {
    float z = sqrt(max(1.0 - r * r, 0.0));
    pz = z;
    vec3 n = vec3(q, z);
    vec3 p = normalize(uObj * n);
    vec3 P = Pof(p);
    Surf s = surface(p, n);

    // polar caps (before lighting)
    float cap = 0.0;
    if (uFx.y > 0.5) {
      cap = smoothstep(0.8, 0.86, abs(p.y) + 0.06 * (noise(P * 3.0) - 0.5));
      s.alb = mix(s.alb, vec3(0.92, 0.95, 1.0), cap);
      s.emit *= 1.0 - cap;
      s.spec = mix(s.spec, 0.7, cap);
      s.shin = mix(s.shin, 50.0, cap);
      s.selfLit *= 1.0 - cap;
    }

    vec3 No = p;
    if (s.bump > 0.0) {
      vec3 up = abs(p.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 t1 = normalize(cross(up, p));
      vec3 t2 = cross(p, t1);
      float e = 0.012;
      float h0 = bumpShape(s.h);
      float h1 = bumpShape(surfHeight(normalize(p + t1 * e)));
      float h2 = bumpShape(surfHeight(normalize(p + t2 * e)));
      vec3 g = ((h1 - h0) * t1 + (h2 - h0) * t2) / e;
      No = normalize(p - g * s.bump * 0.11 * (1.0 - cap));
    }
    No = normalize(No + s.nOff);

    vec3 L1o = uObj * L1;
    vec3 L2o = uObj * uL2;
    vec3 Vo = uObj * vec3(0.0, 0.0, 1.0);

    float sh1 = ringShadowAt(n, L1) * moonShadowAt(n, L1, uMoon0) * moonShadowAt(n, L1, uMoon1) * moonShadowAt(n, L1, uMoon2);
    float hasL2 = step(0.01, dot(uL2c, vec3(1.0)));
    float sh2 = hasL2 > 0.5 ? ringShadowAt(n, uL2) * moonShadowAt(n, uL2, uMoon0) * moonShadowAt(n, uL2, uMoon1) * moonShadowAt(n, uL2, uMoon2) : 0.0;

    float g1 = dot(p, L1o);
    float g2 = dot(p, L2o);
    float dif1 = clamp((dot(No, L1o) + s.wrap) / (1.0 + s.wrap), 0.0, 1.0) * smoothstep(-0.1 - s.wrap * 0.5, 0.1, g1) * sh1;
    float dif2 = clamp((dot(No, L2o) + s.wrap) / (1.0 + s.wrap), 0.0, 1.0) * smoothstep(-0.1 - s.wrap * 0.5, 0.1, g2) * sh2;
    vec3 lightC = (uL1c * dif1 + uL2c * dif2) * s.lightK;
    float dayAmt = clamp(dif1 + dif2, 0.0, 1.0);
    float night = 1.0 - smoothstep(0.02, 0.3, dayAmt);

    float sp1 = pow(max(dot(No, normalize(L1o + Vo)), 0.0), s.shin) * dif1;
    float sp2 = pow(max(dot(No, normalize(L2o + Vo)), 0.0), s.shin) * dif2;
    vec3 spec = (uL1c * sp1 + uL2c * sp2) * s.spec * (s.shin + 8.0) / 72.0;

    vec3 col = s.alb * mix(uAmbient + lightC, vec3(1.0), s.selfLit) + spec + s.emit;

    if (uFx.x > 0.5) {
      float lights = smoothstep(0.6, 0.82, noise(P * 26.0)) * smoothstep(0.45, 0.62, fbm3(P * 0.9 + 5.0)) * s.land * (1.0 - cap);
      col += mix(vec3(1.0, 0.75, 0.4), uC2, 0.25) * lights * night * 1.4;
    }
    if (uFx.z > 0.5) {
      float lonp = atan(p.z, p.x);
      float ay = abs(p.y) - 0.84 - 0.03 * sin(lonp * 5.0 + t * 0.6);
      float au = ay > 0.0 ? exp(-ay / 0.05) : exp(-ay * ay / 0.0003);
      au *= 0.25 + 0.75 * noise(vec3(lonp * 26.0, abs(p.y) * 6.0, t * 0.7));
      col += mix(vec3(0.3, 1.0, 0.6), uC2, 0.35) * au * (0.25 + 0.8 * night);
    }

    // atmosphere over the disk
    float rim = 1.0 - z;
    float litSide = clamp(dot(n, L1) * 0.6 + 0.5, 0.0, 1.0);
    float l1lum = luma(uL1c);
    if (uAtmo > 0.5 && uAtmo < 1.5) {
      col += uAtmoCol * pow(rim, 3.2) * 0.75 * (0.12 + 0.88 * litSide) * l1lum;
    } else if (uAtmo > 1.5 && uAtmo < 2.5) {
      float haze = 0.12 + 0.55 * pow(rim, 1.5);
      col = mix(col, uAtmoCol * (0.08 + 0.92 * clamp(dot(n, L1) * 0.5 + 0.55, 0.0, 1.0)) * l1lum, haze);
      col += vec3(1.0, 0.5, 0.25) * exp(-pow(dot(n, L1) / 0.32, 2.0)) * 0.1 * haze;
    } else if (uAtmo > 2.5 && uAtmo < 3.5) {
      vec3 cp = rotY(p, t * 0.03);
      float cl = smoothstep(0.48, 0.72, fbm5(cp * 2.4 * uDetail + uSeed + 13.0));
      vec3 cloudLit = vec3(0.92) * (uAmbient + uL1c * dif1 + uL2c * dif2);
      col = mix(col, cloudLit, cl * 0.82);
      float flash = step(0.975, hash13(floor(cp * 6.0) + floor(t * 5.0))) * cl;
      col += vec3(0.75, 0.82, 1.0) * flash * (0.4 + night) * 1.2;
      col += uAtmoCol * pow(rim, 2.6) * 0.6 * (0.3 + 0.7 * litSide);
    } else if (uAtmo > 3.5 && uAtmo < 4.5) {
      col += uAtmoCol * pow(rim, 2.2) * 0.75;
      float arcs = 1.0 - smoothstep(0.0, 0.025, abs(noise(p * 5.0 + vec3(t * 0.9, 0.0, t * 0.6)) - 0.5));
      arcs *= step(0.5, noise(p * 2.0 + vec3(0.0, t * 2.0, 0.0)));
      col += mix(uAtmoCol, vec3(1.0), 0.5) * arcs * (0.3 + 0.7 * pow(rim, 0.8)) * 0.9;
    } else if (uAtmo > 4.5) {
      float lonp = atan(p.z, p.x);
      float streak = noise(vec3(lonp * 1.2 + t * 0.03, p.y * 14.0, 2.0));
      float dust = 0.18 + 0.42 * pow(rim, 1.4) + 0.3 * smoothstep(0.45, 0.8, streak);
      col = mix(col, uAtmoCol * (0.1 + 0.9 * dayAmt) * l1lum, dust);
    }
    col += glowCol * pow(rim, 2.2) * uGlow * 0.4;

    if (isSurf(14.0)) col *= 0.5 + 0.5 * pow(z, 0.55);
    if (isSurf(15.0)) col += uC2 * pow(rim, 4.0) * 1.2;
    if (isSurf(27.0)) col += hsv2rgb(vec3(fract(atan(q.y, q.x) / TAU + t * 0.05), 0.8, 1.0)) * pow(rim, 3.0) * 0.6;
    if (isSurf(26.0)) col += mix(uC1, vec3(1.0), 0.5) * pow(rim, 6.0) * 0.9;

    float alpha = s.alpha;
    if (isSurf(29.0)) {
      vec3 pb = normalize(uObj * vec3(q, -z));
      float back = gridLines(pb, 16.0, 10.0, 0.01);
      col += uC1 * back * 0.45;
      alpha = clamp(alpha + back * 0.3 + pow(rim, 2.0) * 0.6, 0.0, 1.0);
      col += uC1 * pow(rim, 2.0) * 0.6;
    }

    col = aces(col * 0.95);
    float aa = clamp((1.0 - r) / (uPx * 1.25), 0.0, 1.0);
    float a = aa * alpha;
    op = vec4(col * a, a);
    opZ = z;
  }

  // moons — nearest surface wins, farther ones show through edges
  for (int i = 0; i < 3; i++) {
    vec4 m = i == 0 ? uMoon0 : (i == 1 ? uMoon1 : uMoon2);
    float mz;
    vec4 mc = moonLayer(q, m, float(i), L1, mz);
    if (mc.a > 0.0) {
      if (mz > opZ) {
        op = over(mc, op);
        opZ = mz;
      } else {
        op = over(op, mc);
      }
    }
  }

  // rings, depth-sorted against the nearest solid surface
  vec4 rA = vec4(0.0);
  vec4 rB = vec4(0.0);
  float zA = -99.0;
  float zB = -99.0;
  if (uRing > 0.5) {
    rA = ringLayer(q, uRingN, uRing, L1, zA);
    if (uRing > 6.5) rB = ringLayer(q, uRingN2, uRing, L1, zB);
  }
  vec4 rFar = zA < zB ? rA : rB;
  vec4 rNear = zA < zB ? rB : rA;
  float zFar = min(zA, zB);
  float zNear = max(zA, zB);
  if (rFar.a > 0.0 && zFar < opZ) acc = over(rFar, acc);
  if (rNear.a > 0.0 && zNear < opZ) acc = over(rNear, acc);
  acc = over(op, acc);
  if (rFar.a > 0.0 && zFar >= opZ) acc = over(rFar, acc);
  if (rNear.a > 0.0 && zNear >= opZ) acc = over(rNear, acc);

  if (uFx.w > 0.5) {
    vec3 sat = satellites(q, r, pz);
    float sa = clamp(max(max(sat.r, sat.g), sat.b), 0.0, 1.0);
    acc = over(vec4(min(sat, vec3(1.0)), sa), acc);
  }

  gl_FragColor = acc;
}
`;

export const BACKDROP_FRAGMENT = `${PRECISION}
varying vec2 vUv;
uniform float uAspect;
uniform float uBg;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform vec3 uPlanet;
uniform vec3 uPlanet2;
uniform vec3 uSeed;
uniform float uPxB;
${COMMON}

bool isBg(float id) { return abs(uBg - id) < 0.5; }

float starField(vec2 p, float scale, float density) {
  vec2 g = p * scale;
  vec3 id = vec3(floor(g), uSeed.x + scale);
  vec3 h = hash33(id);
  vec2 f = fract(g) - h.xy;
  float d = length(f) / scale;
  float on = step(1.0 - density, h.z);
  float core = 0.05 / scale;
  float rad = max(core, uPxB * 0.9);
  float energy = (core * core) / (rad * rad);
  return on * exp(-d * d / (rad * rad)) * min(1.0, energy * 2.5) * (0.35 + 0.65 * hash13(id + 3.0));
}

void main() {
  vec2 uv = vUv * 0.5 + 0.5;
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  vec3 S = uSeed;
  vec3 col = uBase * (0.55 + 0.7 * (1.0 - smoothstep(0.0, 1.1, length(p))));
  float stars = starField(p, 70.0, 0.16) + starField(p, 130.0, 0.12) * 0.7;

  if (isBg(0.0)) {
    // deep space — faint dust and distant galaxies
    float dust = fbm5(vec3(p * 1.4, 1.0) + S);
    col += mix(vec3(0.05, 0.08, 0.22), uAccent * 0.18, 0.4) * smoothstep(0.4, 0.85, dust) * 0.8;
    for (int i = 0; i < 4; i++) {
      vec3 h = hash33(S + float(i) * 3.7);
      vec2 c = vec2((h.x - 0.5) * uAspect * 0.9, h.y - 0.5);
      vec2 d = p - c;
      float a = h.z * 3.14;
      d = vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y);
      d.y *= 3.0;
      float gl = exp(-dot(d, d) * 2600.0) * 0.5 + exp(-dot(d, d) * 400.0) * 0.08;
      col += mix(vec3(0.85, 0.85, 1.0), uAccent, 0.3) * gl;
    }
  } else if (isBg(1.0)) {
    // nebula — layered gas, dust lanes, bright cores
    vec3 q = vec3(p * 1.5, 0.0) + S;
    float f = fbm5(q + fbm3(q * 1.5) * 1.3);
    float g = fbm5(q * 2.1 + 4.0);
    float dust = smoothstep(0.55, 0.78, fbm5(q * 3.0 + 9.0));
    vec3 neb = mix(uAccent, uPlanet, smoothstep(0.3, 0.7, g));
    neb = mix(neb, vec3(1.0, 0.4, 0.7), smoothstep(0.62, 0.9, f) * 0.35);
    float body = smoothstep(0.38, 0.85, f);
    col += neb * body * body * 1.05 * (1.0 - dust * 0.8);
    col += mix(neb, vec3(1.0), 0.5) * pow(smoothstep(0.72, 0.95, f), 3.0) * 0.45;
    stars *= 0.8 + 0.6 * f;
  } else if (isBg(2.0)) {
    // aurora sky — curtains hanging from the top
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float wave = 0.18 + fi * 0.1 + 0.07 * sin(p.x * 3.0 + S.x + fi * 2.0) + 0.035 * sin(p.x * 7.3 + S.y);
      float dy = p.y - wave;
      float body = dy > 0.0 ? exp(-dy * (3.5 + fi * 2.0)) : exp(-dy * dy * 900.0);
      float streak = 0.45 + 0.55 * noise(vec3(p.x * 34.0 + fi * 9.0, p.y * 1.5, S.z));
      vec3 cc = mix(vec3(0.2, 1.0, 0.62), mix(uAccent, vec3(0.75, 0.35, 1.0), 0.5), clamp(dy * 2.2, 0.0, 1.0));
      col += cc * body * streak * (0.55 - fi * 0.2);
    }
    col += vec3(0.05, 0.2, 0.18) * exp(-(p.y + 0.5) * 3.0) * 0.6;
  } else if (isBg(3.0)) {
    // spiral galaxy
    vec2 gc = vec2(uAspect * 0.22, 0.18);
    vec2 d = p - gc;
    float a = -0.5 + S.x * 0.3;
    d = vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y);
    d.y /= 0.42;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = pow(0.5 + 0.5 * sin(2.0 * (th - log(r + 0.015) * 2.8)), 3.0);
    float n = fbm5(vec3(d * 9.0, 2.0) + S);
    float density = exp(-r * 4.2);
    vec3 armC = mix(uAccent, vec3(0.65, 0.75, 1.0), 0.4);
    col += armC * density * arm * (0.45 + 0.75 * n) * 1.3;
    col *= 1.0 - density * arm * smoothstep(0.55, 0.75, fbm3(vec3(d * 14.0, 5.0) + S)) * 0.6;
    col += vec3(1.0, 0.9, 0.75) * (exp(-r * 22.0) * 1.1 + exp(-r * 8.0) * 0.25);
    vec2 d2 = p - vec2(-uAspect * 0.3, -0.28);
    d2.y *= 2.4;
    col += mix(uPlanet, vec3(1.0), 0.5) * exp(-dot(d2, d2) * 700.0) * 0.35;
    stars *= 0.7 + density * 2.0;
  } else if (isBg(4.0)) {
    // Milky Way — dense band with dust lanes and a warm core
    vec2 dir = normalize(vec2(1.0, 0.42));
    float bd = dot(p, vec2(-dir.y, dir.x)) + 0.04 + 0.05 * (fbm3(vec3(p * 2.0, 1.0) + S) - 0.5);
    float band = exp(-bd * bd * 16.0);
    float glow = fbm5(vec3(p * 5.0, 1.0) + S);
    col += mix(vec3(0.85, 0.82, 1.0), uAccent, 0.3) * band * (0.1 + 0.6 * glow * glow) * 0.6;
    float lane = smoothstep(0.5, 0.72, fbm5(vec3(p * 4.0, 3.0) + S));
    col *= 1.0 - band * lane * 0.85;
    vec2 core = dir * (S.y - 0.5) * 0.6;
    col += vec3(1.0, 0.78, 0.5) * exp(-length(p - core) * 4.5) * band * 0.35;
    stars += band * (starField(p, 220.0, 0.3) * 0.7 + starField(p, 300.0, 0.3) * 0.45);
  } else if (isBg(5.0)) {
    // star rise — a giant star cresting the bottom edge
    vec2 sc = vec2(-uAspect * 0.18, -0.98);
    float d = length(p - sc);
    float R = 0.56;
    vec3 sunC = mix(vec3(1.0, 0.68, 0.36), uAccent, 0.25);
    float ang = atan(p.y - sc.y, p.x - sc.x);
    float rays = pow(noise(vec3(ang * 16.0, 0.0, S.x)), 3.0) * 0.9 + 0.1;
    if (d < R) {
      col = mix(vec3(1.0, 0.96, 0.88), sunC, smoothstep(R * 0.55, R, d));
    } else {
      col += sunC * (exp(-(d - R) * 6.0) * 1.1 + exp(-(d - R) * 1.6) * 0.35 * rays);
    }
    vec2 axis = normalize(-sc);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 gp = sc + axis * (0.9 + fi * 0.32);
      float gd = length(p - gp);
      col += mix(sunC, uPlanet, 0.5) * (1.0 - smoothstep(0.02 + fi * 0.02, 0.05 + fi * 0.03, gd)) * 0.05;
    }
    stars *= smoothstep(0.2, 0.9, d);
  } else {
    // void — almost nothing
    col = uBase * 0.25 + vec3(0.004);
    stars *= 0.35;
  }

  col += vec3(0.9, 0.93, 1.0) * stars * 0.85;
  col *= 1.0 - smoothstep(0.35, 1.25, length(p * vec2(0.75, 1.0))) * 0.55;
  col += (hash13(vec3(gl_FragCoord.xy, 7.0)) - 0.5) / 160.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/** Shader branch for each surface id */
export const SURFACE_INDEX: Record<string, number> = {
  smooth: 0,
  cratered: 1,
  banded: 2,
  crystalline: 3,
  oceanic: 4,
  volcanic: 5,
  frozen: 6,
  stormy_surface: 7,
  forest: 8,
  desert: 9,
  neon: 10,
  marble: 11,
  mosaic: 12,
  cracked: 13,
  luminous: 14,
  shadowy: 15,
  striped: 16,
  spotted: 17,
  aurora: 18,
  metallic: 19,
  cloudy: 20,
  lava_veins: 21,
  pearl: 22,
  geometric: 23,
  misty: 24,
  coral: 25,
  eclipse: 26,
  prism: 27,
  cosmic: 28,
  hologram: 29,
  toxic: 30,
  twilight: 31,
};

export const ATMO_INDEX: Record<string, number> = {
  none: 0,
  thin: 1,
  thick: 2,
  stormy: 3,
  electric: 4,
  dusty: 5,
};

export const RING_INDEX: Record<string, number> = {
  none: 0,
  classic: 1,
  thin: 2,
  double: 3,
  dust: 4,
  neon: 5,
  ice: 6,
  cross: 7,
};

export const BACKDROP_INDEX: Record<string, number> = {
  deep_space: 0,
  nebula: 1,
  aurora: 2,
  galaxy: 3,
  milkyway: 4,
  sunrise: 5,
  void: 6,
};

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.49, 0.55, 1];
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Stable pseudo-random numbers from a string */
export function seedNumbers(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  }
  return out;
}
