// Smart crop: puts the face zone of each photo near the top third of its
// panel, so a face survives even a wide or tall crop. Pure geometry — no
// detection, no network, and it works on any photo. The face zone moves
// with the photo's shape: a portrait's face sits higher than a landscape's,
// and a square's sits between the two.

import { layoutPanels } from './layouts.js';

/**
 * Where a photo's face usually sits, as fractions of the drawn photo.
 * Portraits carry the face higher; landscapes carry it nearer the middle.
 */
export function faceZone(photo) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const aspect = iw / ih;
  if (aspect < 0.85) return { x: 0.55, y: 0.22 }; // tall portrait
  if (aspect > 1.3) return { x: 0.5, y: 0.34 }; // wide landscape
  return { x: 0.55, y: 0.27 }; // near square
}

/**
 * The pan that centres the face zone of `photo` in `rect` at `zoom`.
 * `rect` is a panel rectangle in canvas pixels.
 */
export function faceOffset(rect, photo, zoom) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const drawnW = iw * base;
  const drawnH = ih * base;
  const zone = faceZone(photo);
  const faceX = zone.x * drawnW;
  const faceY = zone.y * drawnH;
  // Where it should sit: the middle across, a third down the panel.
  const wantX = 0.5 * rect.w;
  const wantY = 0.32 * rect.h;
  const offsetX = wantX - faceX;
  const offsetY = wantY - faceY;
  const ox = (offsetX - (rect.w - drawnW) / 2) / rect.w;
  const oy = (offsetY - (rect.h - drawnH) / 2) / rect.h;
  return {
    ox: Math.max(-0.6, Math.min(0.8, ox)),
    oy: Math.max(-0.6, Math.min(0.8, oy)),
  };
}

/**
 * Applies the smart crop to one panel of `state` (`rect` is its rectangle).
 * `photos` maps a photo id to an image element. Panels without a photo are
 * left alone. Returns true when the panel moved.
 */
export function smartCropPanel(state, photos, i, rect) {
  const panel = state.panels[i];
  if (!panel || !panel.photo) return false;
  const photo = photos.get(panel.photo);
  if (!photo) return false;
  panel.zoom = 1.05;
  const { ox, oy } = faceOffset(rect, photo, panel.zoom);
  panel.ox = ox;
  panel.oy = oy;
  return true;
}

/**
 * Applies the smart crop to every panel of `state`, at cover size `w` x `h`.
 * `photos` maps a photo id to an image element. Panels without a photo are
 * left alone. Returns the state, for chaining.
 */
export function smartCropAll(state, photos, w, h) {
  const rects = layoutPanels(state.layout, w, h);
  rects.forEach((rect, i) => smartCropPanel(state, photos, i, rect));
  return state;
}
