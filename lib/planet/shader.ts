/**
 * Procedural planet shader (WebGL1 / GLSL ES 1.0 for widest support).
 * Draws sphere + atmosphere glow + optional ring on a transparent quad,
 * output is premultiplied alpha.
 */

export const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uType;
uniform float uAtmo;
uniform float uGlow;
uniform float uRing;
uniform float uSeed;
uniform float uClouds;
uniform float uScale;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}

vec2 voronoi(vec3 p) {
  vec3 b = floor(p);
  vec3 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = vec3(hash(b + g), hash(b + g + 17.1), hash(b + g + 31.7));
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return vec2(sqrt(d1), sqrt(d2));
}

mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotZ(float a) { float c = cos(a); float s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

vec3 surface(vec3 n, out float spec, out float emit) {
  spec = 0.0;
  emit = 0.0;
  vec3 base = uColor;
  vec3 p = n * 2.0 + vec3(uSeed);
  float t = uType;
  vec3 col;

  if (t < 0.5) {
    float v = fbm(p * 1.4);
    col = base * (0.82 + 0.34 * v);
  } else if (t < 1.5) {
    float turb = fbm(p * 2.0) * 0.35;
    float b = sin((n.y + turb) * 14.0) * 0.5 + 0.5;
    float b2 = sin((n.y + turb * 0.5) * 33.0) * 0.5 + 0.5;
    col = mix(base * 0.5, base * 1.25, b) * (0.85 + 0.25 * b2);
  } else if (t < 2.5) {
    float v = fbm(p * 2.5);
    vec2 c = voronoi(p * 3.0);
    float bowl = smoothstep(0.05, 0.28, c.x);
    col = base * (0.55 + 0.5 * v) * mix(0.55, 1.0, bowl);
    col += 0.14 * (1.0 - smoothstep(0.0, 0.05, abs(c.x - 0.24)));
  } else if (t < 3.5) {
    float h = fbm(p * 1.8);
    float land = smoothstep(0.49, 0.52, h);
    vec3 ocean = mix(vec3(0.02, 0.06, 0.18), base * 0.55, 0.45);
    vec3 ground = mix(base, vec3(0.32, 0.55, 0.26), 0.35) * (0.7 + 0.5 * fbm(p * 6.0));
    col = mix(ocean, ground, land);
    spec = (1.0 - land) * 0.9;
  } else if (t < 4.5) {
    vec2 c = voronoi(p * 2.4);
    float edge = smoothstep(0.0, 0.07, c.y - c.x);
    float facet = hash(floor(p * 2.4 + 0.5));
    col = base * (0.55 + 0.8 * facet);
    col = mix(vec3(1.0), col, edge);
    spec = 0.6;
  } else if (t < 5.5) {
    float v = fbm(p * 2.2);
    float cracks = 1.0 - smoothstep(0.0, 0.07, abs(fbm(p * 3.0 + 3.1) - 0.5));
    col = mix(vec3(0.07, 0.04, 0.04), base * 0.35, v);
    emit = cracks;
    col += cracks * mix(vec3(1.0, 0.45, 0.1), base, 0.35) * 1.6;
  } else if (t < 6.5) {
    float v = fbm(p * 1.7);
    float cr = 1.0 - smoothstep(0.0, 0.03, abs(fbm(p * 4.0) - 0.5));
    col = mix(vec3(0.86, 0.93, 1.0), base, 0.35) * (0.85 + 0.2 * v) - cr * 0.22;
    spec = 0.5;
  } else if (t < 7.5) {
    float s = sin(n.y * 10.0 + fbm(p * 2.0 + vec3(uTime * 0.05)) * 4.0);
    col = mix(base * 0.5, base * 1.3, s * 0.5 + 0.5);
    float spot = smoothstep(0.26, 0.0, length(vec2(n.x - 0.3, (n.y + 0.25) * 1.6)));
    col = mix(col, base * 1.6, spot);
  } else if (t < 8.5) {
    float v = fbm(p * 2.0 + vec3(uTime * 0.03));
    float lines = 1.0 - smoothstep(0.0, 0.06, abs(fract(v * 6.0) - 0.5));
    col = base * 0.3;
    emit = lines;
    col += base * lines * 1.5;
  } else if (t < 9.5) {
    float v = fbm(p * vec3(1.0, 7.0, 1.0));
    col = mix(base * 0.6, vec3(0.92), 0.25) * (0.78 + 0.45 * v);
    spec = 1.0;
  } else if (t < 10.5) {
    vec2 c = voronoi(p * 2.0);
    float spot = smoothstep(0.36, 0.2, c.x);
    col = mix(base, base * 0.42, spot) * (0.9 + 0.2 * fbm(p * 3.0));
  } else {
    col = base * 0.1 + vec3(fbm(p * 2.0) * 0.05);
  }
  return col;
}

void main() {
  vec2 q = vUv / uScale;
  float r = length(q);
  vec3 L = normalize(vec3(-0.55, 0.5, 0.72));
  vec3 glowCol = mix(uColor, vec3(1.0), 0.18);

  // Premultiplied accumulator
  vec4 acc = vec4(0.0);

  // Outer atmosphere glow
  if (r >= 0.98) {
    float falloff = mix(10.0, 3.6, clamp(uAtmo * 0.6 + uGlow * 0.6, 0.0, 1.0));
    float g = exp(-(r - 1.0) * falloff) * (0.28 + 0.62 * uGlow) * smoothstep(0.98, 1.01, r);
    acc = vec4(glowCol * g, g);
  }

  // Ring geometry
  float ringA = 0.0;
  vec3 ringC = vec3(0.0);
  bool ringFront = true;
  if (uRing > 0.5) {
    vec3 N = rotZ(-0.4) * rotX(1.22) * vec3(0.0, 0.0, 1.0);
    if (abs(N.z) > 0.001) {
      float z = -(N.x * q.x + N.y * q.y) / N.z;
      float d = length(vec3(q, z));
      if (d > 1.32 && d < 2.12) {
        float bands = 0.55 + 0.3 * sin(d * 42.0) + 0.15 * sin(d * 13.0);
        float edge = smoothstep(1.32, 1.42, d) * (1.0 - smoothstep(1.98, 2.12, d));
        float gap = 1.0 - 0.75 * (1.0 - smoothstep(0.0, 0.03, abs(d - 1.72)));
        ringA = clamp(bands * edge * gap, 0.0, 1.0) * 0.82;
        ringC = mix(uColor, vec3(1.0), 0.35) * (0.75 + 0.35 * bands);
        ringFront = z > 0.0;
        float zs = r < 1.0 ? sqrt(1.0 - r * r) : -1.0;
        if (!ringFront && r < 1.0) ringA = 0.0;
        if (ringFront && r < 1.0 && z < zs) ringA = 0.0;
      }
    }
  }

  // Ring behind the planet
  if (!ringFront && ringA > 0.0) {
    acc = vec4(ringC * ringA, ringA) + acc * (1.0 - ringA);
  }

  // Planet body
  if (r < 1.0) {
    float z = sqrt(1.0 - r * r);
    vec3 n = vec3(q, z);
    vec3 nn = rotY(uTime * 0.11) * rotX(0.32) * n;
    float spec;
    float emit;
    vec3 col = surface(nn, spec, emit);

    float ndl = dot(n, L);
    float diff = smoothstep(-0.25, 1.0, ndl);
    vec3 lit = col * (0.1 + 0.98 * diff);
    vec3 h = normalize(L + vec3(0.0, 0.0, 1.0));
    lit += spec * pow(max(dot(n, h), 0.0), 36.0) * 0.55 * diff;
    lit += emit * col * 0.45;

    if (uClouds > 0.0) {
      float c = smoothstep(0.52, 0.78, fbm(nn * 3.2 + vec3(uTime * 0.025, 0.0, 0.0)));
      lit = mix(lit, vec3(1.0) * (0.18 + 0.95 * diff), c * 0.8 * uClouds);
    }

    float fres = pow(1.0 - z, 2.4);
    lit += glowCol * fres * (0.18 + 0.75 * uAtmo) * (0.35 + 0.65 * diff);

    float a = 1.0 - smoothstep(0.985, 1.0, r);
    acc = vec4(lit * a, a) + acc * (1.0 - a);
  }

  // Ring in front
  if (ringFront && ringA > 0.0) {
    acc = vec4(ringC * ringA, ringA) + acc * (1.0 - ringA);
  }

  gl_FragColor = acc;
}
`;

const SURFACE_TYPES: Record<string, number> = {
  smooth: 0,
  misty: 0,
  banded: 1,
  striped: 1,
  cratered: 2,
  desert: 2,
  cracked: 2,
  oceanic: 3,
  forest: 3,
  coral: 3,
  crystalline: 4,
  mosaic: 4,
  geometric: 4,
  prism: 4,
  volcanic: 5,
  lava_veins: 5,
  frozen: 6,
  marble: 6,
  pearl: 6,
  stormy_surface: 7,
  cloudy: 7,
  neon: 8,
  luminous: 8,
  aurora: 8,
  metallic: 9,
  spotted: 10,
  shadowy: 11,
  eclipse: 11,
};

export function surfaceType(surface: string): number {
  return SURFACE_TYPES[surface] ?? 0;
}

export function atmosphereParams(atmosphere: string, surface: string): { atmo: number; clouds: number } {
  const atmo = atmosphere === 'none' ? 0 : atmosphere === 'thick' ? 0.75 : atmosphere === 'stormy' ? 0.9 : 0.35;
  let clouds = atmosphere === 'stormy' ? 0.85 : atmosphere === 'thick' ? 0.45 : 0;
  if (surface === 'misty' || surface === 'cloudy') clouds = Math.max(clouds, 0.6);
  return { atmo, clouds };
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.49, 0.55, 1];
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function seedFromString(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 37;
}
