// Panel layouts: where each photo sits on the cover. Every layout returns its
// panels as fractions of the content area (the cover above the title band),
// plus how tall that title band is. Tilted panels also carry a rotation.

/** The six layouts, in the order the buttons show them. */
export const LAYOUTS = [
  { id: 'grid4', name: 'Four Panel', panels: 4, band: 0.24 },
  { id: 'hero3', name: 'Hero + Three', panels: 4, band: 0.24 },
  { id: 'fullbleed', name: 'Full Bleed', panels: 1, band: 0.26 },
  { id: 'tilted', name: 'Tilted Snaps', panels: 3, band: 0.26 },
  { id: 'nine', name: 'Nine Panel', panels: 9, band: 0.20 },
  { id: 'trio', name: 'Strip Trio', panels: 3, band: 0.24 },
];

/** Finds a layout by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/**
 * Panel rectangles for a layout, in canvas pixels: { x, y, w, h, rot, snap }.
 * `w` and `h` are the cover size; panels sit inside the content area above
 * the title band. `snap` marks the tilted polaroid-style panels.
 */
export function layoutPanels(layoutId, w, h) {
  const layout = layoutById(layoutId);
  const bandH = h * layout.band;
  const contentH = h - bandH;
  const m = w * 0.02;
  const g = w * 0.015;
  const cx = m;
  // Grid layouts leave a header strip at the top for the badge ribbon and
  // heat stars, so they never sit on a face in the top row. Full-bleed and
  // tilted panels sit over open sky instead, so they keep the plain margin.
  const header = layout.id === 'fullbleed' || layout.id === 'tilted' ? 0 : h * 0.05;
  const cy = m + header;
  const cw = w - m * 2;
  const ch = contentH - m - cy;
  const col = (i, n) => cx + (i * (cw + g)) / n;
  const colW = (n) => (cw - g * (n - 1)) / n;
  const row = (i, n) => cy + (i * (ch + g)) / n;
  const rowH = (n) => (ch - g * (n - 1)) / n;

  switch (layout.id) {
    case 'grid4':
      return [0, 1, 2, 3].map((i) => ({
        x: col(i % 2, 2), y: row(Math.floor(i / 2), 2),
        w: colW(2), h: rowH(2), rot: 0, snap: false,
      }));
    case 'hero3': {
      const heroW = cw * 0.62;
      const sideX = cx + heroW + g;
      const sideW = cw - heroW - g;
      return [
        { x: cx, y: cy, w: heroW, h: ch, rot: 0, snap: false },
        { x: sideX, y: row(0, 3), w: sideW, h: rowH(3), rot: 0, snap: false },
        { x: sideX, y: row(1, 3), w: sideW, h: rowH(3), rot: 0, snap: false },
        { x: sideX, y: row(2, 3), w: sideW, h: rowH(3), rot: 0, snap: false },
      ];
    }
    case 'fullbleed':
      return [{ x: 0, y: 0, w, h: contentH, rot: 0, snap: false }];
    case 'tilted':
      return [
        { x: cx + cw * 0.02, y: cy + ch * 0.02, w: cw * 0.52, h: ch * 0.60, rot: -7, snap: true },
        { x: cx + cw * 0.46, y: cy + ch * 0.0, w: cw * 0.52, h: ch * 0.58, rot: 5, snap: true },
        { x: cx + cw * 0.22, y: cy + ch * 0.40, w: cw * 0.56, h: ch * 0.56, rot: -2, snap: true },
      ];
    case 'nine':
      return [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        x: col(i % 3, 3), y: row(Math.floor(i / 3), 3),
        w: colW(3), h: rowH(3), rot: 0, snap: false,
      }));
    case 'trio':
    default:
      return [0, 1, 2].map((i) => ({
        x: col(i, 3), y: cy, w: colW(3), h: ch, rot: 0, snap: false,
      }));
  }
}

/** The title band's top edge in canvas pixels, for a layout and cover height. */
export function titleBandTop(layoutId, h) {
  return h * (1 - layoutById(layoutId).band);
}
