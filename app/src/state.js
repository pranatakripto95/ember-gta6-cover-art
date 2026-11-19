// Cover state: one plain object describes a whole cover, so undo and redo
// are just snapshots of it, and the export is just a render of it.

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
