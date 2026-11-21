// Ember Cover Art — central state: sizes, presets, the store with undo.
//
// The whole app reads one plain object. Nothing here touches the DOM or a
// canvas, so the editor, the renderer and the screenshot scenes can all
// share the same shape without importing each other.

export const SIZES = [
  { id: "wide", label: "Widescreen", detail: "1920 × 1080", w: 1920, h: 1080 },
  { id: "square", label: "Square", detail: "1080 × 1080", w: 1080, h: 1080 },
  { id: "portrait", label: "Portrait", detail: "1080 × 1350", w: 1080, h: 1350 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// Every effect slider lives here so presets can set them in one patch.
export const EFFECT_DEFAULTS = {
  grain: 0.45,
  vignette: 0.55,
  rays: 0.75,
  glow: 0.7,
  border: 1,
  tilt: 0,
  gradeStrength: 0.85,
};

function samplePhoto(id, src, label, focusX, focusY) {
  return { id, src, label, zoom: 1.12, panX: 0, panY: 0, focusX, focusY };
}

export function defaultState() {
  return {
    title: "NEON SHORE",
    kicker: "WELCOME TO THE SUNSET",
    subtitle: "a sunset story in three panels",
    layoutId: "vice-grid",
    gradeId: "sunset",
    letteringId: "sunset",
    sizeId: "wide",
    photos: [
      samplePhoto("sample-boulevard", "samples/boulevard.jpg", "Boulevard", 0.46, 0.26),
      samplePhoto("sample-pier", "samples/pier.jpg", "Pier", 0.5, 0.35),
    ],
    // One photo id per panel slot; layouts with fewer panels use a prefix.
    panelPhotos: [
      "sample-boulevard",
      "sample-pier",
      "sample-boulevard",
      "sample-pier",
      "sample-boulevard",
      "sample-pier",
      "sample-boulevard",
      "sample-pier",
      "sample-boulevard",
    ],
    selectedPanel: 0,
    selectedPhotoId: "sample-boulevard",
    effects: { ...EFFECT_DEFAULTS },
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// One-tap looks: a layout, a grade, lettering and effects that belong
// together, plus a caption written for that mood.
export const PRESETS = [
  {
    id: "golden-ave", name: "Golden Ave", layoutId: "vice-grid", gradeId: "sunset",
    letteringId: "sunset", title: "NEON SHORE", kicker: "WELCOME TO THE SUNSET",
    subtitle: "a sunset story in three panels",
    effects: { grain: 0.45, vignette: 0.55, rays: 0.85, glow: 0.8, border: 1, tilt: 0, gradeStrength: 0.85 },
  },
  {
    id: "night-drive", name: "Night Drive", layoutId: "hero-left", gradeId: "neon-night",
    letteringId: "neon", title: "NIGHT DRIVE", kicker: "AFTER DARK, EVERYTHING GLOWS",
    subtitle: "neon streets, no destination",
    effects: { grain: 0.6, vignette: 0.7, rays: 0.25, glow: 0.9, border: 1, tilt: 2, gradeStrength: 0.95 },
  },
  {
    id: "miami-mornings", name: "Miami Mornings", layoutId: "triptych", gradeId: "miami-teal",
    letteringId: "chrome", title: "MIAMI MORNINGS", kicker: "SALT AIR AND PALM TREES",
    subtitle: "three frames from the coast",
    effects: { grain: 0.3, vignette: 0.4, rays: 0.6, glow: 0.65, border: 1, tilt: 0, gradeStrength: 0.8 },
  },
  {
    id: "rose-hour", name: "Rose Hour", layoutId: "sunset-band", gradeId: "rose-dusk",
    letteringId: "sunset", title: "ROSE HOUR", kicker: "THE SKY TURNED PINK AT SIX",
    subtitle: "golden hour, kept forever",
    effects: { grain: 0.5, vignette: 0.6, rays: 0.7, glow: 0.85, border: 1, tilt: 1, gradeStrength: 0.9 },
  },
  {
    id: "chrome-noir", name: "Chrome Noir", layoutId: "quad", gradeId: "chrome-noir",
    letteringId: "chrome", title: "CHROME NOIR", kicker: "BLACK, WHITE AND CHROME",
    subtitle: "four frames, one mood",
    effects: { grain: 0.7, vignette: 0.75, rays: 0.1, glow: 0.3, border: 1, tilt: 0, gradeStrength: 0.9 },
  },
  {
    id: "candy-streets", name: "Candy Streets", layoutId: "stripes", gradeId: "candy-pop",
    letteringId: "badge", title: "CANDY STREETS", kicker: "EVERY COLOUR AT ONCE",
    subtitle: "a loud little poster",
    effects: { grain: 0.35, vignette: 0.35, rays: 0.5, glow: 0.6, border: 1, tilt: 3, gradeStrength: 0.85 },
  },
  {
    id: "palm-shadow", name: "Palm Shadow", layoutId: "spotlight", gradeId: "palm-green",
    letteringId: "neon", title: "PALM SHADOW", kicker: "SOMEWHERE WARM",
    subtitle: "one big frame, one small secret",
    effects: { grain: 0.4, vignette: 0.65, rays: 0.4, glow: 0.5, border: 0, tilt: 0, gradeStrength: 0.8 },
  },
  {
    id: "midnight-post", name: "Midnight Post", layoutId: "nine", gradeId: "midnight",
    letteringId: "mono", title: "MIDNIGHT POST", kicker: "NINE FRAMES PAST MIDNIGHT",
    subtitle: "a grid of small hours",
    effects: { grain: 0.65, vignette: 0.7, rays: 0.15, glow: 0.55, border: 1, tilt: 0, gradeStrength: 0.9 },
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

// Turn a preset into a patch the store can apply. The caption comes with
// it, because a look without words is only half a poster.
export function presetPatch(preset) {
  return {
    layoutId: preset.layoutId,
    gradeId: preset.gradeId,
    letteringId: preset.letteringId,
    title: preset.title,
    kicker: preset.kicker,
    subtitle: preset.subtitle,
    effects: { ...preset.effects },
  };
}

// A random look that still holds together: pick a preset, then nudge one
// or two dials so two random taps never land on the same poster twice.
export function randomLook() {
  const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  const patch = presetPatch(preset);
  patch.effects = { ...patch.effects };
  if (Math.random() < 0.5) patch.effects.tilt = Math.floor(Math.random() * 5);
  if (Math.random() < 0.5) {
    patch.effects.grain = Math.round((0.25 + Math.random() * 0.5) * 100) / 100;
  }
  return patch;
}

// A tiny store: get the state, set a patch, subscribe to changes, and
// undo/redo through JSON snapshots. The editor calls set(); the renderer
// subscribes and redraws. Nothing else needs to know how it works.
export function createStore(initial) {
  let current = cloneState(initial || defaultState());
  const listeners = new Set();
  const past = [];
  const future = [];
  const LIMIT = 48;

  function emit() {
    listeners.forEach((fn) => {
      try { fn(current); } catch (err) { console.warn("store listener failed", err); }
    });
  }

  return {
    get() {
      return current;
    },
    set(patch) {
      if (!patch || typeof patch !== "object") return;
      past.push(JSON.stringify(current));
      if (past.length > LIMIT) past.shift();
      future.length = 0;
      current = { ...current, ...patch };
      if (patch.effects) current.effects = { ...current.effects, ...patch.effects };
      emit();
    },
    update(fn) {
      const next = fn(cloneState(current));
      if (!next) return;
      past.push(JSON.stringify(current));
      if (past.length > LIMIT) past.shift();
      future.length = 0;
      current = next;
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    undo() {
      if (!past.length) return false;
      future.push(JSON.stringify(current));
      current = JSON.parse(past.pop());
      emit();
      return true;
    },
    redo() {
      if (!future.length) return false;
      past.push(JSON.stringify(current));
      current = JSON.parse(future.pop());
      emit();
      return true;
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}
