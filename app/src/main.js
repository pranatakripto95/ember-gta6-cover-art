// Boots Ember Cover Art: loads the samples, wires the editor, paints the
// live preview. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js); the export button saves the cover as a PNG.
// A `?preset=` query opens the app on one of the named presets.

import { defaultState, sizeById, applyPreset, History, copyState } from './state.js';
import { PhotoStore } from './photos.js';
import { wireEditor } from './editor.js';
import { renderCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
let state = defaultState();
const photos = new PhotoStore();
const history = new History(state);

/** Writes a one-line status under the export buttons. */
export function setStatus(text) {
  statusEl.textContent = text;
}

/** Repaints the preview canvas at the state's post size. */
export function redraw() {
  const size = sizeById(state.size);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  renderCover(canvas, state, photos);
  window.__ember = {
    state,
    photos,
    redraw,
    renderCover,
    applyPreset: (id) => {
      state = applyPreset(state, id);
      history.push(copyState(state));
      editor.syncControls();
      redraw();
    },
    exportPng: async () => {
      const off = document.createElement('canvas');
      off.width = size.w;
      off.height = size.h;
      renderCover(off, state, photos);
      return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    },
  };
}

const editor = wireEditor({
  canvas,
  getState: () => state,
  setState: (next) => { state = next; },
  photos,
  history,
  redraw,
  status: setStatus,
});

const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  await runShot(params.get('shot'), params, {
    getState: () => state,
    applyState: (next) => {
      state = next;
      history.push(copyState(next));
      editor.syncControls();
    },
    photos,
    redraw,
  });
} else {
  // A fresh visitor starts with the Boulevard sample already in the panels.
  // A ?preset= opens on that named look instead of the default — and it is
  // recorded in the undo history, so Ctrl+Z after a random look returns to it.
  const preset = params.get('preset');
  if (preset) {
    state = applyPreset(state, preset);
    history.push(copyState(state));
  }
  await photos.addSample('boulevard');
  await photos.addSample('pier');
  editor.syncControls();
  redraw();
}
