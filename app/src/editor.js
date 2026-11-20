// Editor wiring: buttons, sliders, thumbnails and dragging on the preview,
// all of it driving one state object and re-rendering the live preview.
// Presets apply a whole look in one tap; Randomize rolls a fresh layout
// and grade; Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes.

import { GRADES } from './grades.js';
import { LAYOUTS, layoutById, layoutPanels } from './layouts.js';
import { SIZES, sizeById, PRESETS, presetById, applyPreset, panelCount, clampSelection, copyState } from './state.js';
import { SAMPLES } from './photos.js';
import { renderCover } from './cover.js';
import { smartCropAll, smartCropPanel } from './facecrop.js';

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

/** A random layout and grade, different from the ones the state already has. */
export function randomLook(state) {
  const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  let grade = GRADES[Math.floor(Math.random() * GRADES.length)];
  if (grade.id === state.grade && GRADES.length > 1) {
    grade = GRADES[(GRADES.indexOf(grade) + 1) % GRADES.length];
  }
  return { layout: layout.id, grade: grade.id };
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
    presetBtns: $('presetBtns'),
    panelBtns: $('panelBtns'), panelName: $('panelName'),
    zoom: $('zoom'), zoomVal: $('zoomVal'), panX: $('panX'), panY: $('panY'),
    title: $('title'), subtitle: $('subtitle'), kicker: $('kicker'), badge: $('badge'),
    stars: $('stars'), starsVal: $('starsVal'),
    grain: $('grain'), vignette: $('vignette'), frame: $('frame'),
  };

  /** Re-renders every control from the current state. */
  function syncControls() {
    const s = getState();
    clampSelection(s);
    choiceButtons(els.presetBtns, PRESETS, null, (id) => usePreset(id), (p) => p.name);
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
    els.kicker.value = s.kicker || '';
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
      const wrap = document.createElement('span');
      wrap.className = 'thumb';
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
      wrap.appendChild(thumb);
      const isSample = SAMPLES.some((x) => x.id === id);
      if (!isSample) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'thumb-remove';
        rm.textContent = '×';
        rm.title = `Remove ${photos.name(id)}`;
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          photos.remove(id);
          const next = getState();
          next.panels.forEach((p) => { if (p.photo === id) p.photo = null; });
          change(next);
          status(`Removed ${photos.name(id)}.`);
        });
        wrap.appendChild(rm);
      }
      els.thumbs.appendChild(wrap);
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

  /** Applies a named preset: layout, grade, size and caption in one tap. */
  function usePreset(id) {
    const preset = presetById(id);
    if (!preset) return;
    const next = applyPreset(getState(), id);
    history.push(next);
    setState(next);
    syncControls();
    redraw();
    status(`Preset “${preset.name}” applied.`);
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
  $('randomLook').addEventListener('click', () => {
    const s = getState();
    const look = randomLook(s);
    change(look);
    status(`New look: ${layoutById(look.layout).name} + ${GRADES.find((g) => g.id === look.grade).name}.`);
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
  $('cropPanel').addEventListener('click', () => {
    const s = getState();
    const size = sizeById(s.size);
    const rects = layoutPanels(s.layout, size.w, size.h);
    smartCropPanel(s, photos, s.selectedPanel, rects[s.selectedPanel]);
    change(s);
    status(`Face centred in panel ${s.selectedPanel + 1}.`);
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  function undo() {
    const prev = history.undo();
    if (prev) { setState(prev); syncControls(); redraw(); }
  }
  function redo() {
    const next = history.redo();
    if (next) { setState(next); syncControls(); redraw(); }
  }
  // Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo.
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  // Caption fields and toggles.
  els.title.addEventListener('input', () => { const s = getState(); s.title = els.title.value; setState(s); redraw(); });
  els.title.addEventListener('change', commit);
  els.subtitle.addEventListener('input', () => { const s = getState(); s.subtitle = els.subtitle.value; setState(s); redraw(); });
  els.subtitle.addEventListener('change', commit);
  els.kicker.addEventListener('input', () => { const s = getState(); s.kicker = els.kicker.value; setState(s); redraw(); });
  els.kicker.addEventListener('change', commit);
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
  return { syncControls, change, exportSize, usePreset };
}
