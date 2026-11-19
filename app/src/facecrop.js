// Smart crop: puts the face zone of each photo (about a quarter down the
// picture, where a portrait's face usually sits) near the top third of its
// panel, so a face survives even a wide or tall crop. Pure geometry — no
// detection, no network, and it works on any photo.

import { layoutPanels } from './layouts.js';

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
  // Face zone: a quarter down the photo, just right of centre horizontally.
  const faceX = 0.55 * drawnW;
  const faceY = 0.25 * drawnH;
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
 * Applies the smart crop to every panel of `state`, at cover size `w` x `h`.
 * `photos` maps a photo id to an image element. Panels without a photo are
 * left alone. Returns the state, for chaining.
 */
export function smartCropAll(state, photos, w, h) {
  const rects = layoutPanels(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (!panel || !panel.photo) return;
    const photo = photos.get(panel.photo);
    if (!photo) return;
    panel.zoom = 1.05;
    const { ox, oy } = faceOffset(rect, photo, panel.zoom);
    panel.ox = ox;
    panel.oy = oy;
  });
  return state;
}
