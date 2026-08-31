/**
 * TonalEnhancer — portable luminance-masked tonal processing engine (browser copy).
 *
 * THIS FILE MUST STAY IN SYNC with:
 *   storybook-backend/src/services/image/TonalEnhancer.ts
 *
 * It is the exact same algorithm, dependency-free, so that the reduced-
 * resolution preview, the upload-time enhancement, and the server-side
 * fallback all produce identical results. Do not fork the math here.
 */

export interface TonalSettings {
  exposure: number;
  brightness: number;
  contrast: number;
  gamma: number;
  shadows: number;
  shadowRange: number;
  shadowFeather: number;
  highlights: number;
  highlightRange: number;
  highlightFeather: number;
  whites: number;
  blacks: number;
  blackPoint: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  clarity: number;
  sharpness: number;
  faceProtection: number;
}

/** Neutral settings — all controls at their inactive value. */
export const NEUTRAL_SETTINGS: TonalSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  gamma: 1,
  shadows: 0,
  shadowRange: 0.5,
  shadowFeather: 0.5,
  highlights: 0,
  highlightRange: 0.5,
  highlightFeather: 0.5,
  whites: 0,
  blacks: 0,
  blackPoint: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  sharpness: 0,
  faceProtection: 0,
};

const clampNum = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * Normalize arbitrary (possibly partial/legacy) settings into a complete,
 * valid TonalSettings object. Missing fields fall back to neutral defaults so
 * previously-saved enhancement configs migrate safely to the tonal engine.
 */
export function normalizeTonalSettings(
  input?: Partial<TonalSettings> | null,
): TonalSettings {
  const s = { ...NEUTRAL_SETTINGS, ...(input || {}) };

  // Convert a value to a number, falling back to `fallback` when the value is
  // null/undefined/NaN. The `??` operator does NOT catch NaN, so `NaN ?? 0.5`
  // stays NaN — which collapses the shadow/highlight range masks and turns the
  // whole image black. Legacy configs that only carry the pre-tonal fields
  // (brightness/contrast/exposure/gamma/highlights/saturation/sharpness) hit
  // this path because toTonalSettings() passes explicit `undefined` for the
  // missing optional controls.
  const num = (v: unknown, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    brightness: clampNum(num(s.brightness, 0), -0.3, 0.3),
    contrast: clampNum(num(s.contrast, 0), -0.3, 0.3),
    exposure: clampNum(num(s.exposure, 0), -0.5, 0.5),
    gamma: clampNum(num(s.gamma, 1), 0.7, 1.3),
    shadows: clampNum(num(s.shadows, 0), -0.5, 0.5),
    shadowRange: clampNum(num(s.shadowRange, 0.5), 0.15, 0.85),
    shadowFeather: clampNum(num(s.shadowFeather, 0.5), 0, 1),
    highlights: clampNum(num(s.highlights, 0), -0.5, 0.5),
    highlightRange: clampNum(num(s.highlightRange, 0.5), 0.15, 0.85),
    highlightFeather: clampNum(num(s.highlightFeather, 0.5), 0, 1),
    whites: clampNum(num(s.whites, 0), -0.5, 0.5),
    blacks: clampNum(num(s.blacks, 0), -0.5, 0.5),
    blackPoint: clampNum(num(s.blackPoint, 0), 0, 1),
    saturation: clampNum(num(s.saturation, 0), -0.5, 0.5),
    vibrance: clampNum(num(s.vibrance, 0), -0.5, 0.5),
    temperature: clampNum(num(s.temperature, 0), -0.25, 0.25),
    tint: clampNum(num(s.tint, 0), -0.25, 0.25),
    clarity: clampNum(num(s.clarity, 0), 0, 1),
    sharpness: clampNum(num(s.sharpness, 0), 0, 1),
    faceProtection: clampNum(num(s.faceProtection, 0), 0, 1),
  };
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const clampByte = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const lumAt = (data: Uint8Array | Uint8ClampedArray, i: number): number =>
  0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

function buildToneLUT(s: TonalSettings): Uint8Array {
  const lut = new Uint8Array(256);
  const expGain = Math.pow(2, s.exposure);
  const gamma = Math.max(0.01, s.gamma);
  const sRange = clamp01(s.shadowRange);
  // Feather controls the smoothstep transition width around the shadow boundary.
  // Higher feather = wider S-curve = smoother shadow/midtone transition.
  const sFeatherWidth = sRange * clamp01(s.shadowFeather) * 0.5;
  const hRange = clamp01(s.highlightRange);
  const hExp = lerp(5, 1.3, clamp01(s.highlightFeather));
  const bp = clamp01(s.blackPoint);

  for (let L = 0; L < 256; L++) {
    const t = L / 255;
    // Shadow mask: smoothstep S-curve centered on sRange threshold.
    // Produces a proper sigmoid falloff — no hard knee at the shadow/midtone
    // boundary. At t=0 mask=1 (full lift), at t=sRange mask=0.5, above that
    // it falls smoothly to 0. sFeatherWidth controls transition width.
    const shadowMask = smoothstep(
      sRange + sFeatherWidth,
      Math.max(0, sRange - sFeatherWidth),
      t,
    );
    const highlightMask = Math.pow(
      Math.max(0, (t - (1 - hRange)) / hRange),
      hExp,
    );
    const blackKnee = lerp(0.05, 1, smoothstep(0, 0.08, t));
    const blackProtect = 1 - bp * (1 - smoothstep(0, 0.15, t));

    let d = 0;
    d += s.shadows * 255 * shadowMask * blackKnee * blackProtect;
    d += s.highlights * 255 * highlightMask;
    d += s.blacks * 255 * Math.pow(1 - t, 2);
    d += s.whites * 255 * Math.pow(t, 2);

    let L1 = clampByte(L + d);

    if (s.exposure !== 0) {
      L1 = 255 * Math.pow(Math.pow(clamp01(L1 / 255), 2.2) * expGain, 1 / 2.2);
    }

    // Brightness offset: softened near highlights (prevent blowing out whites)
    // and also reduced in pure shadows (prevent shadow floor lifting).
    const brightHighProtect = 1 - 0.7 * highlightMask;
    const brightShadowProtect = smoothstep(0, 0.08, t); // ramps from 0 at black to 1
    L1 += s.brightness * 255 * brightHighProtect * brightShadowProtect;
    L1 = clampByte(L1);

    if (s.gamma !== 1) {
      L1 = 255 * Math.pow(clamp01(L1 / 255), gamma);
    }

    if (s.contrast !== 0) {
      const c = clamp01(L1 / 255);
      const diff = (c - 0.5) * (s.contrast * 1.5);
      const endProtect = smoothstep(0, 0.12, c) * (1 - smoothstep(0.88, 1, c));
      L1 = 255 * clamp01(c + diff * lerp(0.2, 1, endProtect));
    }

    lut[L] = Math.round(clamp01(L1 / 255) * 255);
  }
  return lut;
}

function boxBlurPass(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
  horizontal: boolean,
): Float32Array {
  const out = new Float32Array(w * h);
  const r = Math.max(1, radius);
  const denom = 2 * r + 1;

  if (horizontal) {
    for (let y = 0; y < h; y++) {
      const base = y * w;
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const x = k < 0 ? 0 : k >= w ? w - 1 : k;
        sum += src[base + x];
      }
      for (let x = 0; x < w; x++) {
        out[base + x] = sum / denom;
        const xIn = x + r + 1;
        const xOut = x - r;
        sum += src[base + (xIn >= w ? w - 1 : xIn)];
        sum -= src[base + (xOut < 0 ? 0 : xOut)];
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const y = k < 0 ? 0 : k >= h ? h - 1 : k;
        sum += src[y * w + x];
      }
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / denom;
        const yIn = y + r + 1;
        const yOut = y - r;
        sum += src[(yIn >= h ? h - 1 : yIn) * w + x];
        sum -= src[(yOut < 0 ? 0 : yOut) * w + x];
      }
    }
  }
  return out;
}

function boxBlur(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
): Float32Array {
  return boxBlurPass(boxBlurPass(src, w, h, radius, true), w, h, radius, false);
}

function downsampleLuminance(
  data: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  channels: number,
  qw: number,
  qh: number,
): Float32Array {
  const map = new Float32Array(qw * qh);
  for (let qy = 0; qy < qh; qy++) {
    const y = Math.min(h - 1, Math.floor(((qy + 0.5) * h) / qh));
    const row = y * w;
    for (let qx = 0; qx < qw; qx++) {
      const x = Math.min(w - 1, Math.floor(((qx + 0.5) * w) / qw));
      map[qy * qw + qx] = lumAt(data, (row + x) * channels);
    }
  }
  return map;
}

export function applyTonalEnhancement(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
  settings: TonalSettings,
): void {
  const stride = channels;
  const pixelCount = width * height;
  const toneLUT = buildToneLUT(settings);

  const satFactor = 1 + settings.saturation;
  const vib = settings.vibrance;
  const tempDelta = settings.temperature * 255 * 0.5;
  const tintDelta = settings.tint * 255 * 0.45;
  const faceP = settings.faceProtection;

  for (let p = 0; p < pixelCount; p++) {
    const i = p * stride;
    const or = data[i];
    const og = data[i + 1];
    const ob = data[i + 2];
    if (stride < 3) continue;

    const L = lumAt(data, i);
    // lumAt returns a float in 0-255; Uint8Array only returns a value for
    // integer indices — a float index gives `undefined` which propagates NaN
    // and turns the whole image black. Round to the nearest integer first.
    const Lint = Math.round(L);
    const L2 = toneLUT[Lint];

    let r: number;
    let g: number;
    let b: number;
    if (L > 0) {
      const scale = L2 / L;
      r = or * scale;
      g = og * scale;
      b = ob * scale;
    } else {
      r = L2 ?? 0;
      g = L2 ?? 0;
      b = L2 ?? 0;
    }

    const Lc = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    const sat = (maxc - minc) / 255;
    const vibGain = 1 + vib * (1 - sat);

    r = Lc + (r - Lc) * satFactor * vibGain;
    g = Lc + (g - Lc) * satFactor * vibGain;
    b = Lc + (b - Lc) * satFactor * vibGain;

    r += tempDelta;
    b -= tempDelta;
    g += tintDelta;

    r = clampByte(r);
    g = clampByte(g);
    b = clampByte(b);

    if (faceP > 0) {
      const t = (or * 0.2126 + og * 0.7152 + ob * 0.0722) / 255;
      const warm = or > ob ? clamp01(((or - ob) / 255) * 2.2) : 0;
      // Wider band: protects luminance range 0.16..1.0 (centred at 0.58, half-width 0.42)
      // so mid-tones and faces at diverse skin tones are all covered.
      const lumBand = Math.max(0, 1 - Math.abs(t - 0.58) / 0.42);
      const skin = warm * lumBand * (1 - sat * 0.65);
      // Stronger composite signal (0.6 lumBand + 1.3 skin) relative to old (0.45 + 1.1)
      const faceMask = clamp01(faceP * (0.6 * lumBand + 1.3 * skin));
      const keep = 1 - faceMask * 0.9; // stronger protection, slightly more rollback
      r = or + (r - or) * keep;
      g = og + (g - og) * keep;
      b = ob + (b - ob) * keep;
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  if (settings.clarity > 0 || settings.sharpness > 0) {
    const qw = Math.max(1, width >> 2);
    const qh = Math.max(1, height >> 2);
    const qL = downsampleLuminance(data, width, height, stride, qw, qh);
    const minQ = Math.min(qw, qh);
    const clarityR =
      settings.clarity > 0 ? Math.max(1, Math.round(minQ * 0.08)) : 0;
    const sharpR =
      settings.sharpness > 0 ? Math.max(1, Math.round(minQ * 0.02)) : 0;
    const blurWide = clarityR > 0 ? boxBlur(qL, qw, qh, clarityR) : null;
    const blurNarrow = sharpR > 0 ? boxBlur(qL, qw, qh, sharpR) : null;

    for (let y = 0; y < height; y++) {
      const qy = Math.min(qh - 1, ((y * qh) / height) | 0);
      for (let x = 0; x < width; x++) {
        const qx = Math.min(qw - 1, ((x * qw) / width) | 0);
        const qIdx = qy * qw + qx;
        const i = (y * width + x) * stride;
        const Lp = lumAt(data, i);
        // Lp is in the 0-255 range (raw luminance from lumAt). Only skip
        // pure-black pixels to avoid divide-by-zero on the scale below.
        if (Lp <= 0) continue;

        let Ladj = Lp;
        if (blurWide && settings.clarity > 0) {
          const t = clamp01(Lp / 255);
          // Correct midtone mask for clarity: smoothstep-based mask that
          // genuinely peaks at midtone (~0.5) instead of the old mShadow2*mHigh2
          // product which cancelled to near-zero at midtone.
          const clarityMask = smoothstep(0, 0.15, t) * smoothstep(1.0, 0.85, t);
          Ladj +=
            (Lp - blurWide[qIdx]) * settings.clarity * 0.85 * clarityMask;
        }
        if (blurNarrow && settings.sharpness > 0) {
          Ladj += (Lp - blurNarrow[qIdx]) * settings.sharpness * 0.6;
        }

        const scale = Ladj / Lp;
        data[i] = clampByte(data[i] * scale);
        data[i + 1] = clampByte(data[i + 1] * scale);
        data[i + 2] = clampByte(data[i + 2] * scale);
      }
    }
  }
}
