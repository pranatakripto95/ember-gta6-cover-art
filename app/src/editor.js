// Ember Cover Art — the editor: every control on the page, and the
// canvas interactions (click a panel to pick it, drag to move its
// photo, scroll to zoom it). The editor never draws; it only changes
// the store, and the renderer redraws. Controls are built from the
// tables in layouts.js, grades.js, lettering.js and state.js, so adding
// a layout or a grade is a one-line table change, not editor surgery.

import { LAYOUTS } from "./layouts.js";
import { GRADES, gradeSwatch } from "./grades.js";
import { LETTERING_STYLES } from "./lettering.js";
import { SIZES, PRESETS, presetPatch, randomLook } from "./state.js";
import { readUserFile, samplePhotos, photoById, photoForPanel, hitPanel } from "./photos.js";
import { applySmartCrop } from "./facecrop.js";

function el(id) {
  return document.getElementById(id);
}

function button(label, title, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = label;
  if (title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}

function markActive(container, predicate) {
  Array.from(container.children).forEach((child) => {
    child.classList.toggle("active", predicate(child));
  });
}

export function initEditor(store, hooks) {
  let lastRects = [];
  let canvasBox = { w: 1, h: 1 };
  let drag = null;

  const canvas = el("coverCanvas");

  function state() {
    return store.get();
  }

  function selectedPhoto() {
    const s = state();
    const panelPhoto = photoForPanel(s, s.selectedPanel);
    return panelPhoto || s.photos[0];
  }

  // ---- option grids -------------------------------------------------
  function buildGrid(container, items, getId, onPick, decorate) {
    container.innerHTML = "";
    items.forEach((item) => {
      const b = button(item.name, item.desc || item.name, () => onPick(item));
      b.dataset.id = getId(item);
      if (decorate) decorate(b, item);
      container.appendChild(b);
    });
  }

  buildGrid(el("layoutGrid"), LAYOUTS, (l) => l.id, (item) => {
    store.set({ layoutId: item.id });
  });
  buildGrid(el("gradeGrid"), GRADES, (g) => g.id, (item) => {
    store.set({ gradeId: item.id });
  }, (b, item) => {
    b.style.background = gradeSwatch(item);
  });
  buildGrid(el("letteringGrid"), LETTERING_STYLES, (l) => l.id, (item) => {
    store.set({ letteringId: item.id });
  });
  buildGrid(el("presetRow"), PRESETS, (p) => p.id, (item) => {
    store.set(presetPatch(item));
    setStatus("Preset applied: " + item.name);
  });
  buildGrid(el("sizeRow"), SIZES, (s) => s.id, (item) => {
    store.set({ sizeId: item.id });
    setStatus("Export size: " + item.label + " " + item.detail);
  });

  // ---- captions ------------------------------------------------------
  function bindText(id, key) {
    const input = el(id);
    input.addEventListener("input", () => store.set({ [key]: input.value }));
  }
  bindText("titleInput", "title");
  bindText("kickerInput", "kicker");
  bindText("subtitleInput", "subtitle");

  // ---- photos --------------------------------------------------------
  function renderPhotoList() {
    const s = state();
    const list = el("photoList");
    list.innerHTML = "";
    s.photos.forEach((photo) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "photo-chip" + (s.selectedPhotoId === photo.id ? " active" : "");
      const thumb = document.createElement("img");
      thumb.src = photo.src;
      thumb.alt = photo.label;
      const label = document.createElement("span");
      label.textContent = photo.label;
      chip.appendChild(thumb);
      chip.appendChild(label);
      chip.addEventListener("click", () => {
        store.set({ selectedPhotoId: photo.id });
        syncPanelSelect();
      });
      list.appendChild(chip);
    });
  }

  function renderSamples() {
    const row = el("sampleRow");
    row.innerHTML = "";
    samplePhotos().forEach((sample) => {
      const b = button("Use " + sample.label, "Load the " + sample.label + " sample photo", () => {
        store.update((s) => {
          if (!s.photos.find((p) => p.id === sample.id)) {
            s.photos.push({
              id: sample.id, src: sample.src, label: sample.label,
              zoom: 1.12, panX: 0, panY: 0, focusX: 0.5, focusY: 0.42,
            });
          }
          s.selectedPhotoId = sample.id;
          return s;
        });
        setStatus("Sample loaded: " + sample.label);
      });
      row.appendChild(b);
    });
  }

  el("addPhotoBtn").addEventListener("click", () => el("fileInput").click());
  el("fileInput").addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const photo = await readUserFile(file);
      store.update((s) => {
        s.photos.push(photo);
        s.selectedPhotoId = photo.id;
        return s;
      });
      setStatus("Photo added: " + photo.label + " — pick a panel, then drag to frame it.");
    } catch (err) {
      setStatus("Could not add that photo: " + err.message);
    }
  });

  // ---- selected panel -------------------------------------------------
  function syncPanelSelect() {
    const s = state();
    const select = el("panelPhotoSelect");
    select.innerHTML = "";
    s.photos.forEach((photo) => {
      const opt = document.createElement("option");
      opt.value = photo.id;
      opt.textContent = photo.label;
      select.appendChild(opt);
    });
    const current = photoForPanel(s, s.selectedPanel);
    if (current) select.value = current.id;
    el("panelLabel").textContent =
      "Panel " + (s.selectedPanel + 1) + " — " + (current ? current.label : "none");
  }

  el("panelPhotoSelect").addEventListener("change", (ev) => {
    const s = state();
    store.update((next) => {
      next.panelPhotos[s.selectedPanel] = ev.target.value;
      next.selectedPhotoId = ev.target.value;
      return next;
    });
  });

  el("fillAllBtn").addEventListener("click", () => {
    const s = state();
    const id = s.selectedPhotoId;
    store.update((next) => {
      next.panelPhotos = next.panelPhotos.map(() => id);
      return next;
    });
    setStatus("Every panel now uses " + (photoById(s, id) || {}).label + ".");
  });

  el("smartCropBtn").addEventListener("click", async () => {
    const photo = selectedPhoto();
    if (!photo) return;
    setStatus("Finding the best crop for " + photo.label + "…");
    try {
      const img = await hooks.getImage(photo.id);
      if (!img) throw new Error("photo not loaded yet");
      await applySmartCrop(photo, img);
      store.update((s) => s);
      setStatus("Smart crop set for " + photo.label + " — drag to fine-tune it.");
    } catch (err) {
      setStatus("Smart crop failed: " + err.message);
    }
  });

  // ---- crop sliders ---------------------------------------------------
  function bindRange(id, get, apply) {
    const input = el(id);
    input.addEventListener("input", () => {
      const photo = selectedPhoto();
      if (!photo) return;
      const value = parseFloat(input.value);
      store.update((s) => {
        const target = s.photos.find((p) => p.id === photo.id);
        if (target) apply(target, value);
        return s;
      });
    });
    return { input, get };
  }

  const cropRanges = [
    bindRange("zoomRange", null, (p, v) => { p.zoom = v; }),
    bindRange("panXRange", null, (p, v) => { p.panX = v; }),
    bindRange("panYRange", null, (p, v) => { p.panY = v; }),
  ];

  function syncCropRanges() {
    const photo = selectedPhoto();
    if (!photo) return;
    el("zoomRange").value = String(photo.zoom || 1);
    el("panXRange").value = String(photo.panX || 0);
    el("panYRange").value = String(photo.panY || 0);
  }

  // ---- effect sliders ---------------------------------------------------
  function bindEffect(id, key) {
    el(id).addEventListener("input", (ev) => {
      const value = parseFloat(ev.target.value);
      store.set({ effects: { [key]: value } });
    });
  }
  bindEffect("grainRange", "grain");
  bindEffect("vignetteRange", "vignette");
  bindEffect("raysRange", "rays");
  bindEffect("glowRange", "glow");
  bindEffect("gradeRange", "gradeStrength");
  bindEffect("tiltRange", "tilt");
  el("borderToggle").addEventListener("change", (ev) => {
    store.set({ effects: { border: ev.target.checked ? 1 : 0 } });
  });

  function syncEffectRanges() {
    const fx = state().effects || {};
    el("grainRange").value = String(fx.grain ?? 0.45);
    el("vignetteRange").value = String(fx.vignette ?? 0.55);
    el("raysRange").value = String(fx.rays ?? 0.75);
    el("glowRange").value = String(fx.glow ?? 0.7);
    el("gradeRange").value = String(fx.gradeStrength ?? 0.85);
    el("tiltRange").value = String(fx.tilt ?? 0);
    el("borderToggle").checked = fx.border !== 0;
  }

  // ---- presets, random, undo, export ------------------------------------
  el("randomBtn").addEventListener("click", () => {
    store.set(randomLook());
    setStatus("Surprise look applied — tap again for another.");
  });

  function syncUndoRedo() {
    el("undoBtn").disabled = !store.canUndo();
    el("redoBtn").disabled = !store.canRedo();
  }
  el("undoBtn").addEventListener("click", () => { store.undo(); });
  el("redoBtn").addEventListener("click", () => { store.redo(); });

  el("exportBtn").addEventListener("click", async () => {
    setStatus("Exporting PNG…");
    try {
      const blob = await hooks.exportPng();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const s = state();
      a.href = url;
      a.download = "ember-cover-" + s.sizeId + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus("Exported " + a.download + " (" + Math.round(blob.size / 1024) + " KB).");
    } catch (err) {
      setStatus("Export failed: " + err.message);
    }
  });

  // ---- canvas picking, dragging, zooming ---------------------------------
  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvasBox.w,
      y: ((ev.clientY - rect.top) / rect.height) * canvasBox.h,
    };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    const p = canvasPoint(ev);
    const index = hitPanel(lastRects, p.x, p.y);
    if (index < 0) return;
    store.set({ selectedPanel: index });
    const photo = photoForPanel(state(), index);
    if (photo) store.set({ selectedPhotoId: photo.id });
    drag = { x: p.x, y: p.y, moved: false };
    canvas.setPointerCapture(ev.pointerId);
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const p = canvasPoint(ev);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    const s = state();
    const rect = lastRects[s.selectedPanel];
    const photo = photoForPanel(s, s.selectedPanel);
    if (!rect || !photo) return;
    store.update((next) => {
      const target = next.photos.find((x) => x.id === photo.id);
      if (!target) return next;
      target.panX = Math.max(-1, Math.min(1, (target.panX || 0) - dx / rect.w));
      target.panY = Math.max(-1, Math.min(1, (target.panY || 0) - dy / rect.h));
      return next;
    });
    drag.x = p.x;
    drag.y = p.y;
  });

  canvas.addEventListener("pointerup", () => { drag = null; });
  canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const photo = selectedPhoto();
    if (!photo) return;
    const next = Math.max(0.6, Math.min(4, (photo.zoom || 1) * (ev.deltaY < 0 ? 1.08 : 0.93)));
    store.update((s) => {
      const target = s.photos.find((p) => p.id === photo.id);
      if (target) target.zoom = next;
      return s;
    });
  }, { passive: false });

  // ---- status + refresh ---------------------------------------------------
  function setStatus(text) {
    el("statusLine").textContent = text;
  }

  function refresh() {
    const s = state();
    markActive(el("layoutGrid"), (b) => b.dataset.id === s.layoutId);
    markActive(el("gradeGrid"), (b) => b.dataset.id === s.gradeId);
    markActive(el("letteringGrid"), (b) => b.dataset.id === s.letteringId);
    markActive(el("sizeRow"), (b) => b.dataset.id === s.sizeId);
    if (el("titleInput").value !== s.title) el("titleInput").value = s.title;
    if (el("kickerInput").value !== s.kicker) el("kickerInput").value = s.kicker;
    if (el("subtitleInput").value !== s.subtitle) el("subtitleInput").value = s.subtitle;
    renderPhotoList();
    syncPanelSelect();
    syncCropRanges();
    syncEffectRanges();
    syncUndoRedo();
  }

  renderSamples();
  store.subscribe(refresh);
  refresh();

  return {
    refresh,
    setStatus,
    noteRects(rects, box) {
      lastRects = rects || [];
      canvasBox = box || canvasBox;
    },
  };
}
