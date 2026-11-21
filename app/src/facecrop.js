// Ember Cover Art — smart crop: find the interesting part of a photo.
//
// A poster crop should keep faces and bright subjects, not the empty sky
// above them. This scores a small downscaled copy of the photo cell by
// cell: busy cells (edges and texture) score high, warm saturated cells
// score a little higher, and cells near the middle score higher than
// cells at the far edges. The best cell becomes the photo's focus point,
// which coverFit() then centres the crop on. It is a heuristic, not face
// detection — it never phones home, and the user can always drag the
// photo to a better spot by hand.

const GRID = 12;
const SAMPLE = 96;

function cellScores(img) {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  const cell = SAMPLE / GRID;
  const scores = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let sum = 0;
      let sumSq = 0;
      let warm = 0;
      let n = 0;
      const x0 = Math.floor(gx * cell);
      const y0 = Math.floor(gy * cell);
      const x1 = Math.min(SAMPLE, Math.ceil((gx + 1) * cell));
      const y1 = Math.min(SAMPLE, Math.ceil((gy + 1) * cell));
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * SAMPLE + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance for texture, and a warm-skin hint from red over blue.
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          sum += lum;
          sumSq += lum * lum;
          if (r > b + 18 && r > 90) warm += 1;
          n++;
        }
      }
      const mean = n ? sum / n : 0;
      const variance = n ? Math.max(0, sumSq / n - mean * mean) : 0;
      // Centre bias: the middle of the frame is usually where the
      // subject is, and the very edges are usually background.
      const cx = (gx + 0.5) / GRID - 0.5;
      const cy = (gy + 0.5) / GRID - 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const centre = Math.max(0, 1 - dist * 1.15);
      const warmth = n ? warm / n : 0;
      // Faces sit in the upper part of a photo far more often than in
      // the lower half, so cells around the upper third get a bonus.
      // Without it, a busy shirt or an arm can outscore a face.
      const upper = Math.max(0, 1 - Math.abs((gy + 0.5) / GRID - 0.3) * 2.0);
      scores.push({
        gx,
        gy,
        score: Math.sqrt(variance) * 0.9 + centre * 20 + warmth * 14 + mean * 0.02 + upper * 16,
      });
    }
  }
  return scores;
}

// Find the focus point of an image, as fractions of its width/height.
// Resolves to {x, y, confidence} where confidence is 0..1.
export async function findFocus(img) {
  try {
    const scores = cellScores(img);
    let best = scores[0];
    for (const s of scores) if (s.score > best.score) best = s;
    const max = Math.max(...scores.map((s) => s.score), 1);
    const x = (best.gx + 0.5) / GRID;
    const y = (best.gy + 0.5) / GRID;
    return { x, y, confidence: Math.min(1, best.score / max) };
  } catch (err) {
    console.warn("smart crop failed, keeping centre", err);
    return { x: 0.5, y: 0.42, confidence: 0 };
  }
}

// Run the smart crop on a photo and write the focus point back onto it.
// Returns the same photo object, so callers can chain it.
export async function applySmartCrop(photo, img) {
  const focus = await findFocus(img);
  photo.focusX = focus.x;
  photo.focusY = focus.y;
  photo.panX = 0;
  photo.panY = 0;
  return photo;
}

// The focus point a photo already carries, or the safe default.
export function focusPoint(photo) {
  if (!photo) return { x: 0.5, y: 0.42 };
  return {
    x: typeof photo.focusX === "number" ? photo.focusX : 0.5,
    y: typeof photo.focusY === "number" ? photo.focusY : 0.42,
  };
}
