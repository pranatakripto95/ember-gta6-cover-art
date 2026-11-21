// Ember Cover Art — colour grades: Vice City sunsets and neon nights.
//
// A grade is a table, not code per grade: a warm/cool tint, a lift and a
// contrast curve, a saturation shift, an optional duotone pair, and the
// colours of the sky glow it paints. The renderer applies a grade in two
// passes — a lookup-table pass that remaps every pixel's tones, then
// soft coloured overlays — so every grade is cheap and consistent
// between the live preview and the exported PNG.

export const GRADES = [
  {
    id: "sunset", name: "Vice Sunset", desc: "Orange sky, pink shadows",
    tint: [255, 122, 48], lift: 6, gamma: 1.04, sat: 1.18, contrast: 1.06,
    duotone: null, glow: "#ff7a2f", sky: ["#2b1055", "#ff7a2f", "#ffd166"],
  },
  {
    id: "neon-night", name: "Neon Night", desc: "Pink and teal after dark",
    tint: [255, 45, 120], lift: 2, gamma: 1.08, sat: 1.3, contrast: 1.12,
    duotone: [[16, 10, 38], [255, 120, 190]], glow: "#ff2d78", sky: ["#0b0620", "#3b0f66", "#ff2d78"],
  },
  {
    id: "miami-teal", name: "Miami Teal", desc: "Turquoise water, warm sand",
    tint: [32, 190, 178], lift: 8, gamma: 0.98, sat: 1.22, contrast: 1.04,
    duotone: null, glow: "#19e3d6", sky: ["#083b4d", "#19a7b8", "#ffe08a"],
  },
  {
    id: "golden-hour", name: "Golden Hour", desc: "Honey light, soft shadows",
    tint: [255, 176, 66], lift: 10, gamma: 0.96, sat: 1.12, contrast: 1.02,
    duotone: null, glow: "#ffb042", sky: ["#3a1c5e", "#e2703a", "#ffd166"],
  },
  {
    id: "rose-dusk", name: "Rose Dusk", desc: "Pink hour, violet shade",
    tint: [244, 114, 182], lift: 4, gamma: 1.05, sat: 1.24, contrast: 1.07,
    duotone: [[38, 12, 52], [255, 150, 190]], glow: "#f472b6", sky: ["#2a0a44", "#a83a7a", "#ffb3c8"],
  },
  {
    id: "chrome-noir", name: "Chrome Noir", desc: "Silver, black and chrome",
    tint: [200, 205, 215], lift: 0, gamma: 1.1, sat: 0.25, contrast: 1.18,
    duotone: [[8, 8, 12], [232, 236, 242]], glow: "#cbd5e1", sky: ["#0a0a0f", "#3f3f46", "#a1a1aa"],
  },
  {
    id: "palm-green", name: "Palm Green", desc: "Deep leaves, lime light",
    tint: [74, 222, 128], lift: 6, gamma: 1.0, sat: 1.2, contrast: 1.05,
    duotone: null, glow: "#4ade80", sky: ["#052e1b", "#166534", "#bef264"],
  },
  {
    id: "candy-pop", name: "Candy Pop", desc: "Every colour turned up",
    tint: [255, 92, 168], lift: 8, gamma: 1.0, sat: 1.45, contrast: 1.1,
    duotone: null, glow: "#ff5ca8", sky: ["#3b0764", "#db2777", "#facc15"],
  },
  {
    id: "midnight", name: "Midnight", desc: "Blue dark, one warm lamp",
    tint: [96, 120, 220], lift: -4, gamma: 1.12, sat: 1.05, contrast: 1.14,
    duotone: [[6, 10, 34], [180, 200, 255]], glow: "#818cf8", sky: ["#020617", "#1e1b4b", "#6366f1"],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// A CSS gradient for the grade's swatch button in the editor.
export function gradeSwatch(grade) {
  const sky = grade.sky || ["#222", "#888"];
  return "linear-gradient(135deg, " + sky.join(", ") + ")";
}

// Build the per-channel lookup tables for a grade: three arrays of 256
// entries, one per channel, packed into a single Uint8Array. The table
// folds lift, gamma and contrast into one pass, and a duotone pair
// remaps the result onto a two-colour ramp.
export function buildLut(grade) {
  const lut = new Uint8Array(256 * 3);
  const lift = grade.lift || 0;
  const gamma = grade.gamma || 1;
  const contrast = grade.contrast || 1;
  const duo = grade.duotone;
  for (let v = 0; v < 256; v++) {
    let t = v / 255;
    t = Math.pow(t, gamma);
    t = (t - 0.5) * contrast + 0.5;
    t = Math.min(1, Math.max(0, t + lift / 255));
    for (let c = 0; c < 3; c++) {
      let out = Math.round(t * 255);
      if (duo) {
        const lo = duo[0][c];
        const hi = duo[1][c];
        out = Math.round(lo + (hi - lo) * t);
      }
      lut[v * 3 + c] = Math.min(255, Math.max(0, out));
    }
  }
  return lut;
}

// Apply a grade to the whole canvas. Step one is the lookup table over
// the pixels; step two is a soft tint wash and a sky-coloured glow at
// low opacity. Strength 0 leaves the photo alone, 1 applies the grade
// in full, and the editor's slider blends between the two.
export function applyGrade(ctx, w, h, grade, strength) {
  const s = Math.max(0, Math.min(1, strength == null ? 0.85 : strength));
  if (s <= 0.01) return;
  const lut = buildLut(grade);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const sat = grade.sat == null ? 1 : grade.sat;
  const satMix = 1 + (sat - 1) * s;
  for (let i = 0; i < d.length; i += 4) {
    const oR = d[i];
    const oG = d[i + 1];
    const oB = d[i + 2];
    let r = lut[oR * 3];
    let g = lut[oG * 3 + 1];
    let b = lut[oB * 3 + 2];
    if (satMix !== 1) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.min(255, Math.max(0, lum + (r - lum) * satMix));
      g = Math.min(255, Math.max(0, lum + (g - lum) * satMix));
      b = Math.min(255, Math.max(0, lum + (b - lum) * satMix));
    }
    // Blend the graded pixel with the original by strength, so the
    // slider fades the whole grade in and out instead of only the wash.
    d[i] = Math.round(oR + (r - oR) * s);
    d[i + 1] = Math.round(oG + (g - oG) * s);
    d[i + 2] = Math.round(oB + (b - oB) * s);
  }
  ctx.putImageData(img, 0, 0);

  // A wash of the grade's tint, soft-light so it stains without hiding.
  const tint = grade.tint || [255, 122, 48];
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.55 * s;
  ctx.fillStyle = "rgb(" + tint[0] + "," + tint[1] + "," + tint[2] + ")";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
