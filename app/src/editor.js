// Editor wiring: buttons, sliders, thumbnails and dragging on the preview,
// all of it driving one state object and re-rendering the live preview.

import { GRADES } from './grades.js';
import { LAYOUTS, layoutById, layoutPanels } from './layouts.js';
import { SIZES, sizeById, panelCount, clampSelection, copyState } from './state.js';
import { SAMPLES } from './photos.js';
import { renderCover } from './cover.js';
import { smartCropAll } from './facecrop.js';

/** Builds a button that picks one value from a list and marks itself active. */
export function choiceButtons(container, items, current, onPick, labelOf) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = labelOf(item);
    btn.dataset.id = item.id;
    if (item.id === current) btn.classList.add('active');
    btn.addEventListener('click', () => onPick(item.id));
    container.appendChild(btn);
  });
}

/**
 * Wires the whole editor. `deps` carries the canvas, the state, the photo
 * store, the history and a `redraw` that repaints the preview.
 */
export function wireEditor(deps) {
  const { canvas, getState, setState, photos, history, redraw, status } = deps;
  const $ = (id) => document.getElementById(id);
  const els = {
    filePhotos: $('filePhotos'), thumbs: $('thumbs'),
    layoutBtns: $('layoutBtns'), gradeBtns: $('gradeBtns'), sizeBtns: $('sizeBtns'),
    panelBtns: $('panelBtns'), panelName: $('panelName'),
    zoom: $('zoom'), zoomVal: $('zoomVal'), panX: $('panX'), panY: $('panY'),
    title: $('title'), subtitle: $('subtitle'), badge: $('badge'),
    stars: $('stars'), starsVal: $('starsVal'),
    grain: $('grain'), vignette: $('vignette'), frame: $('frame'),
  };

  /** Re-renders every control from the current state. */
  function syncControls() {
    const s = getState();
    clampSelection(s);
    choiceButtons(els.layoutBtns, LAYOUTS, s.layout, (id) => change({ layout: id }), (l) => l.name);
    choiceButtons(els.gradeBtns, GRADES, s.grade, (id) => change({ grade: id }), (g) =>
      `<span class="swatch" style="background:linear-gradient(90deg, ${g.sky.join(',')})"></span>${g.name}`);
    choiceButtons(els.sizeBtns, SIZES, s.size, (id) => change({ size: id }), (z) => z.name);
    const n = panelCount(s);
    els.panelBtns.innerHTML = '';
    for (let i = 0; i < n; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(i + 1);
      if (i === s.selectedPanel) btn.classList.add('active');
      btn.addEventListener('click', () => change({ selectedPanel: i }));
      els.panelBtns.appendChild(btn);
    }
    els.panelName.textContent = String(s.selectedPanel + 1);
    const panel = s.panels[s.selectedPanel];
    els.zoom.value = String(panel.zoom);
    els.zoomVal.textContent = `${panel.zoom.toFixed(2)}×`;
    els.panX.value = String(panel.ox);
    els.panY.value = String(panel.oy);
    els.title.value = s.title;
    els.subtitle.value = s.subtitle;
    els.badge.value = s.badge;
    els.stars.value = String(s.stars);
    els.starsVal.textContent = `${s.stars} / 5`;
    els.grain.checked = s.grain;
    els.vignette.checked = s.vignette;
    els.frame.checked = s.frame;
    syncThumbs();
  }

  /** Rebuilds the photo thumbnails, marking the selected panel's photo. */
  function syncThumbs() {
    const s = getState();
    const activePhoto = s.panels[s.selectedPanel]?.photo;
    els.thumbs.innerHTML = '';
    photos.ids().forEach((id) => {
      const img = photos.get(id);
      if (!img) return;
      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.alt = photos.name(id);
      thumb.title = `${photos.name(id)} — click to use in panel ${s.selectedPanel + 1}`;
      if (id === activePhoto) thumb.classList.add('selected');
      thumb.addEventListener('click', () => {
        const next = getState();
        next.panels[next.selectedPanel].photo = id;
        change(next);
      });
      els.thumbs.appendChild(thumb);
    });
  }

  /** Applies a partial state change, records it, and repaints. */
  function change(patch) {
    const next = { ...getState(), ...patch };
    clampSelection(next);
    history.push(next);
    setState(next);
    syncControls();
    redraw();
  }

  /** Records the current state after a slider settles (one history step). */
  function commit() {
    history.push(copyState(getState()));
  }

  // Photos: files from the machine, and the two bundled samples.
  els.filePhotos.addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])];
    for (const file of files) {
      try { await photos.addFile(file); } catch { /* unreadable file: skip it */ }
    }
    const s = getState();
    const last = photos.ids()[photos.ids().length - 1];
    if (last && files.length) {
      s.panels[s.selectedPanel].photo = last;
      change(s);
    }
    syncThumbs();
    status(`Added ${files.length} photo${files.length === 1 ? '' : 's'}.`);
  });
  $('sampleBoulevard').addEventListener('click', () => useSample('boulevard'));
  $('samplePier').addEventListener('click', () => useSample('pier'));
  async function useSample(id) {
    await photos.addSample(id);
    const s = getState();
    s.panels[s.selectedPanel].photo = id;
    change(s);
    status(`Sample “${SAMPLES.find((x) => x.id === id).name}” in panel ${s.selectedPanel + 1}.`);
  }
  $('fillAll').addEventListener('click', () => {
    const s = getState();
    const photo = s.panels[s.selectedPanel].photo;
    s.panels.forEach((p) => { p.photo = photo; });
    change(s);
    status('Every panel now shows that photo.');
  });
  $('shufflePhotos').addEventListener('click', () => {
    const s = getState();
    const ids = photos.ids();
    if (!ids.length) return;
    const n = panelCount(s);
    for (let i = 0; i < n; i += 1) s.panels[i].photo = ids[(i + 1) % ids.length];
    change(s);
    status('Panels shuffled.');
  });
  $('smartCrop').addEventListener('click', () => {
    const s = getState();
    const size = sizeById(s.size);
    smartCropAll(s, photos, size.w, size.h);
    change(s);
    status('Faces centred in every panel.');
  });

  // Selected panel: zoom and pan sliders.
  els.zoom.addEventListener('input', () => {
    const s = getState();
    s.panels[s.selectedPanel].zoom = Number(els.zoom.value);
    els.zoomVal.textContent = `${s.panels[s.selectedPanel].zoom.toFixed(2)}×`;
    setState(s);
    redraw();
  });
  els.zoom.addEventListener('change', commit);
  els.panX.addEventListener('input', () => {
    const s = getState();
    s.panels[s.selectedPanel].ox = Number(els.panX.value);
    setState(s);
    redraw();
  });
  els.panX.addEventListener('change', commit);
  els.panY.addEventListener('input', () => {
    const s = getState();
    s.panels[s.selectedPanel].oy = Number(els.panY.value);
    setState(s);
    redraw();
  });
  els.panY.addEventListener('change', commit);
  $('centrePanel').addEventListener('click', () => {
    const s = getState();
    const p = s.panels[s.selectedPanel];
    p.ox = 0; p.oy = 0; p.zoom = 1.15;
    change(s);
  });
  $('undoBtn').addEventListener('click', () => {
    const prev = history.undo();
    if (prev) { setState(prev); syncControls(); redraw(); }
  });
  $('redoBtn').addEventListener('click', () => {
    const next = history.redo();
    if (next) { setState(next); syncControls(); redraw(); }
  });

  // Caption fields and toggles.
  els.title.addEventListener('input', () => { const s = getState(); s.title = els.title.value; setState(s); redraw(); });
  els.title.addEventListener('change', commit);
  els.subtitle.addEventListener('input', () => { const s = getState(); s.subtitle = els.subtitle.value; setState(s); redraw(); });
  els.subtitle.addEventListener('change', commit);
  els.badge.addEventListener('input', () => { const s = getState(); s.badge = els.badge.value; setState(s); redraw(); });
  els.badge.addEventListener('change', commit);
  els.stars.addEventListener('input', () => {
    const s = getState();
    s.stars = Number(els.stars.value);
    els.starsVal.textContent = `${s.stars} / 5`;
    setState(s); redraw();
  });
  els.stars.addEventListener('change', commit);
  [['grain', els.grain], ['vignette', els.vignette], ['frame', els.frame]].forEach(([key, box]) => {
    box.addEventListener('change', () => change({ [key]: box.checked }));
  });

  // Drag to pan, scroll to zoom, click to pick a panel — on the preview.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const s = getState();
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const panels = layoutPanels(s.layout, canvas.width, canvas.height);
    let hit = -1;
    panels.forEach((r, i) => {
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) hit = i;
    });
    if (hit < 0) return;
    if (hit !== s.selectedPanel) {
      const next = { ...s, selectedPanel: hit };
      history.push(next);
      setState(next);
      syncControls();
    }
    drag = { x: e.clientX, y: e.clientY, ox: s.panels[hit].ox, oy: s.panels[hit].oy, panel: hit, rect };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const s = getState();
    const p = s.panels[drag.panel];
    p.ox = drag.ox + ((e.clientX - drag.x) / rect.width) * (canvas.width / drag.rect.w);
    p.oy = drag.oy + ((e.clientY - drag.y) / rect.height) * (canvas.height / drag.rect.h);
    p.ox = Math.max(-1, Math.min(1, p.ox));
    p.oy = Math.max(-1, Math.min(1, p.oy));
    setState(s);
    syncControls();
    redraw();
  });
  const endDrag = () => { if (drag) { drag = null; commit(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const s = getState();
    const p = s.panels[s.selectedPanel];
    p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    setState(s);
    syncControls();
    redraw();
  }, { passive: false });

  // Export: this size, or all three sizes one after another.
  $('exportBtn').addEventListener('click', async () => {
    await exportSize(sizeById(getState().size), false);
  });
  $('exportAllBtn').addEventListener('click', async () => {
    for (const size of SIZES) await exportSize(size, true);
    status('Saved all 3 sizes.');
  });

  /** Renders one size off-screen and downloads it as a PNG. */
  async function exportSize(size, quiet) {
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    renderCover(off, getState(), photos);
    const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ember-cover-${size.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    if (!quiet) status(`Saved ember-cover-${size.id}.png (${size.w} × ${size.h}).`);
    return blob;
  }

  syncControls();
  return { syncControls, change, exportSize };
}
