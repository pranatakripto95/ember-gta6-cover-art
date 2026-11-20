// Cover state: one plain object describes a whole cover, so undo and redo
// are just snapshots of it, and the export is just a render of it. Presets
// are named starting points — a layout, a grade and a caption in one tap.

import { LAYOUTS, layoutById } from './layouts.js';

/** The three post sizes the app exports, in the order the buttons show them. */
export const SIZES = [
  { id: '1080x1080', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

/** Finds a size by id, falling back to the square. */
export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

/** One panel's photo, zoom and pan. */
export function defaultPanel(photo) {
  return { photo, zoom: 1.15, ox: 0, oy: 0 };
}

/** The cover a fresh visitor starts from: two samples across four panels. */
export function defaultState() {
  return {
    layout: 'grid4',
    grade: 'sunset',
    size: '1080x1080',
    title: 'NEON SHORE',
    subtitle: 'a sunset coast story',
    kicker: 'VICE CITY • 2026',
    badge: 'SUNSET COAST',
    stars: 4,
    grain: true,
    vignette: true,
    frame: true,
    selectedPanel: 0,
    panels: [
      defaultPanel('boulevard'),
      defaultPanel('pier'),
      defaultPanel('pier'),
      defaultPanel('boulevard'),
      defaultPanel('boulevard'),
      defaultPanel('pier'),
      defaultPanel('boulevard'),
      defaultPanel('pier'),
      defaultPanel('boulevard'),
    ],
  };
}

/** One-tap starting points: layout + grade + caption, photos untouched. */
export const PRESETS = [
  {
    id: 'golden-hero', name: 'Golden Hero',
    layout: 'hero3', grade: 'golden', size: '1080x1350',
    title: 'GOLDEN HOUR', subtitle: 'one last cast at dusk',
    kicker: 'VICE CITY • 2026', badge: 'GOLDEN HOUR', stars: 5,
  },
  {
    id: 'neon-grid', name: 'Neon Grid',
    layout: 'grid4', grade: 'neon', size: '1080x1080',
    title: 'NEON SHORE', subtitle: 'a sunset coast story',
    kicker: 'AFTER DARK', badge: 'NEON NIGHTS', stars: 4,
  },
  {
    id: 'sunset-tilt', name: 'Sunset Snaps',
    layout: 'tilted', grade: 'sunset', size: '1920x1080',
    title: 'BOULEVARD QUEEN', subtitle: 'golden hour on the strip',
    kicker: 'VICE CITY • 2026', badge: 'SUNSET COAST', stars: 4,
  },
  {
    id: 'candy-duo', name: 'Candy Duo',
    layout: 'duo', grade: 'candy', size: '1080x1080',
    title: 'CANDY RUSH', subtitle: 'sweet like the strip at night',
    kicker: 'VICE CITY • 2026', badge: 'CANDY RUSH', stars: 5,
  },
  {
    id: 'dusk-banner', name: 'Dusk Banner',
    layout: 'banner', grade: 'dusk', size: '1920x1080',
    title: 'EMBER DUSK', subtitle: 'the coast burns pink tonight',
    kicker: 'VICE CITY • 2026', badge: 'EMBER DUSK', stars: 3,
  },
];

/** Finds a preset by id, or null. */
export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || null;
}

/** Returns a state with a preset applied; the photos stay exactly as they are. */
export function applyPreset(state, id) {
  const preset = presetById(id);
  if (!preset) return state;
  const next = copyState(state);
  next.layout = preset.layout;
  next.grade = preset.grade;
  next.size = preset.size;
  next.title = preset.title;
  next.subtitle = preset.subtitle;
  next.kicker = preset.kicker;
  next.badge = preset.badge;
  next.stars = preset.stars;
  clampSelection(next);
  return next;
}

/** How many panels the current layout actually shows. */
export function panelCount(state) {
  return layoutById(state.layout).panels;
}

/** Keeps the selected panel inside the layout's panels. */
export function clampSelection(state) {
  const n = panelCount(state);
  if (state.selectedPanel >= n) state.selectedPanel = 0;
}

/** A deep copy of a state, for the undo history. */
export function copyState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Undo/redo over state snapshots. `push` records a new state after a change;
 * `undo` / `redo` return the state to show, or null when there is none.
 */
export class History {
  constructor(first) {
    this.past = [];
    this.future = [];
    this.current = copyState(first);
  }

  push(state) {
    this.past.push(this.current);
    if (this.past.length > 60) this.past.shift();
    this.future = [];
    this.current = copyState(state);
  }

  undo() {
    if (!this.past.length) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return copyState(this.current);
  }

  redo() {
    if (!this.future.length) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return copyState(this.current);
  }
}

export { LAYOUTS };
