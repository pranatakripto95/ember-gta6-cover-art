// Fixed scenes for screenshots: ?shot=cover shows the finished cover alone;
// ?shot=editor shows the editor with a sample photo loaded. Query keys:
// photo (boulevard|pier), caption, subtitle, layout, grade, size, stars.
// The panels are smart-cropped so faces survive every layout's crop.
// window.__shotReady is set once the cover is painted.

import { smartCropAll } from './facecrop.js';
import { sizeById } from './state.js';

/**
 * Sets up a screenshot scene. `ctx` carries the state, the photo store and
 * the functions that apply a state and repaint the preview.
 */
export async function runShot(shot, query, ctx) {
  const { getState, applyState, photos, redraw } = ctx;
  const state = getState();
  state.layout = query.get('layout') || state.layout;
  state.grade = query.get('grade') || state.grade;
  state.size = query.get('size') || state.size;
  state.title = query.get('caption') || state.title;
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('stars') !== null) state.stars = Number(query.get('stars'));
  if (query.get('badge') !== null) state.badge = query.get('badge');
  const photo = query.get('photo') || 'boulevard';
  await photos.addSample('boulevard');
  await photos.addSample('pier');
  // Spread the chosen photo and the other sample across the panels.
  const n = state.panels.length;
  const other = photo === 'boulevard' ? 'pier' : 'boulevard';
  for (let i = 0; i < n; i += 1) {
    state.panels[i].photo = i % 2 === 0 ? photo : other;
  }
  state.selectedPanel = 0;
  const size = sizeById(state.size);
  smartCropAll(state, photos, size.w, size.h);
  applyState(state);
  if (shot === 'cover') document.body.classList.add('shot-cover');
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
