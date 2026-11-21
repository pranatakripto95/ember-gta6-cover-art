// Ember Cover Art — bootstrap: store, editor, renderer, and the
// screenshot hook. This is the only file the page loads directly; it
// wires the modules together and exposes a small handle on window for
// the browser test (export, state, and a ready flag).

import { createStore, defaultState, sizeById } from "./state.js";
import { initEditor } from "./editor.js";
import { collectImages, renderCover, exportCover } from "./cover.js";
import { applySmartCrop } from "./facecrop.js";
import { shotFromUrl, applyShot } from "./shots.js";

const canvas = document.getElementById("coverCanvas");
const store = createStore(defaultState());
let images = new Map();
let renderQueued = false;
let lastRects = [];

// The preview canvas follows the export size's aspect ratio, capped
// so it fits the page: 960 px on its long side.
function previewSize() {
  const size = sizeById(store.get().sizeId);
  const scale = 960 / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function renderNow() {
  const box = previewSize();
  if (canvas.width !== box.w || canvas.height !== box.h) {
    canvas.width = box.w;
    canvas.height = box.h;
  }
  lastRects = renderCover(canvas, store.get(), images, {
    // Cover-only screenshot scenes hide the editor's selection mark;
    // in the editor the selected panel keeps its pink frame.
    selectedPanel: document.body.classList.contains("shot-cover")
      ? -1
      : store.get().selectedPanel,
  });
  editor.noteRects(lastRects, box);
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    try {
      renderNow();
    } catch (err) {
      console.error("render failed", err);
    }
  });
}

const editor = initEditor(store, {
  getImage: async (photoId) => {
    if (images.has(photoId)) return images.get(photoId);
    images = await collectImages(store.get());
    return images.get(photoId) || null;
  },
  exportPng: async () => exportCover(store.get(), images),
});

store.subscribe(queueRender);

// Test handle: the browser test uses it to export and to wait for
// the first render after a screenshot scene is applied.
window.__ember = {
  store,
  render: renderNow,
  exportCover: () => exportCover(store.get(), images),
  getRects: () => lastRects,
};

async function boot() {
  const shotId = shotFromUrl();
  if (shotId) applyShot(store, shotId);
  images = await collectImages(store.get());
  // Centre each photo on its busiest, warmest part before the first
  // paint, so a wide hero crop keeps faces instead of foreheads.
  for (const photo of store.get().photos) {
    const img = images.get(photo.id);
    if (!img) continue;
    try {
      await applySmartCrop(photo, img);
    } catch (err) {
      console.warn("smart crop skipped for", photo.label, err);
    }
  }
  renderNow();
  editor.refresh();
  if (shotId) {
    // Let the paint land before the screenshot is taken.
    await new Promise((resolve) => setTimeout(resolve, 350));
    renderNow();
    window.__emberShotDone = true;
  }
}

boot().catch((err) => {
  console.error("boot failed", err);
  const status = document.getElementById("statusLine");
  if (status) status.textContent = "Could not start: " + err.message;
});
