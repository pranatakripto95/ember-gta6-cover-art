// Ember Cover Art — layouts: the multi-panel poster grids.
//
// A layout is a table: panel rectangles in unit coordinates (0..1 of
// the canvas), a title zone, and a short description the editor shows.
// Panels are plain rectangles; the renderer adds the poster feel with
// gutters, frames, a sun and a horizon glow. Twelve layouts cover the
// classic poster shapes: a hero with a strip, equal columns, grids,
// a full-bleed frame with an inset, and a split with a title band.

export const LAYOUTS = [
  {
    id: "vice-grid", name: "Vice Grid", desc: "Hero on top, three below",
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 0.34, h: 0.42 },
      { x: 0.34, y: 0.58, w: 0.33, h: 0.42 },
      { x: 0.67, y: 0.58, w: 0.33, h: 0.42 },
    ],
    title: { zone: "hero", align: "left" },
  },
  {
    id: "hero-left", name: "Hero Left", desc: "Big frame left, two right",
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
    title: { zone: "hero", align: "left" },
  },
  {
    id: "hero-right", name: "Hero Right", desc: "Two stacked left, big right",
    panels: [
      { x: 0, y: 0, w: 0.38, h: 0.5 },
      { x: 0, y: 0.5, w: 0.38, h: 0.5 },
      { x: 0.38, y: 0, w: 0.62, h: 1 },
    ],
    title: { zone: "hero", align: "right" },
  },
  {
    id: "triptych", name: "Triptych", desc: "Three equal columns",
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.33, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
    title: { zone: "bottom", align: "center" },
  },
  {
    id: "quad", name: "Quad", desc: "Four equal frames",
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    title: { zone: "center", align: "center" },
  },
  {
    id: "nine", name: "Nine Grid", desc: "Three by three contact sheet",
    panels: [
      { x: 0, y: 0, w: 0.34, h: 0.34 }, { x: 0.34, y: 0, w: 0.33, h: 0.34 }, { x: 0.67, y: 0, w: 0.33, h: 0.34 },
      { x: 0, y: 0.34, w: 0.34, h: 0.33 }, { x: 0.34, y: 0.34, w: 0.33, h: 0.33 }, { x: 0.67, y: 0.34, w: 0.33, h: 0.33 },
      { x: 0, y: 0.67, w: 0.34, h: 0.33 }, { x: 0.34, y: 0.67, w: 0.33, h: 0.33 }, { x: 0.67, y: 0.67, w: 0.33, h: 0.33 },
    ],
    title: { zone: "center", align: "center" },
  },
  {
    id: "spotlight", name: "Spotlight", desc: "Full bleed, one tilted inset",
    panels: [
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 0.62, y: 0.58, w: 0.32, h: 0.36 },
    ],
    title: { zone: "top", align: "left" },
  },
  {
    id: "stripes", name: "Stripes", desc: "Five tall slices",
    panels: [
      { x: 0, y: 0, w: 0.2, h: 1 },
      { x: 0.2, y: 0, w: 0.2, h: 1 },
      { x: 0.4, y: 0, w: 0.2, h: 1 },
      { x: 0.6, y: 0, w: 0.2, h: 1 },
      { x: 0.8, y: 0, w: 0.2, h: 1 },
    ],
    title: { zone: "bottom", align: "center" },
  },
  {
    id: "diagonal", name: "Diagonal", desc: "Two frames, one slanted seam",
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 1 },
    ],
    title: { zone: "bottom", align: "left" },
    seam: "diagonal",
  },
  {
    id: "sunset-band", name: "Sunset Band", desc: "Big sky, three small frames",
    panels: [
      { x: 0, y: 0, w: 1, h: 0.66 },
      { x: 0, y: 0.66, w: 0.34, h: 0.34 },
      { x: 0.34, y: 0.66, w: 0.33, h: 0.34 },
      { x: 0.67, y: 0.66, w: 0.33, h: 0.34 },
    ],
    title: { zone: "hero", align: "center" },
  },
  {
    id: "poster-stack", name: "Poster Stack", desc: "Tall hero, three on the side",
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.34 },
      { x: 0.58, y: 0.34, w: 0.42, h: 0.33 },
      { x: 0.58, y: 0.67, w: 0.42, h: 0.33 },
    ],
    title: { zone: "hero", align: "left" },
  },
  {
    id: "split-band", name: "Split Band", desc: "Two halves, title in the middle",
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    title: { zone: "center", align: "center" },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function panelCount(layout) {
  return layout.panels.length;
}

// Pixel rectangles for a layout on a canvas of w by h, with a gutter
// between panels. The gutter is a fraction of the short side so it
// looks the same at preview size and at export size.
export function panelRects(layout, w, h) {
  const gap = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  return layout.panels.map((p) => {
    const x = Math.round(p.x * w) + (p.x > 0 ? gap / 2 : 0);
    const y = Math.round(p.y * h) + (p.y > 0 ? gap / 2 : 0);
    const rw = Math.round(p.w * w) - (p.x > 0 ? gap / 2 : 0) - (p.x + p.w < 1 ? gap / 2 : 0);
    const rh = Math.round(p.h * h) - (p.y > 0 ? gap / 2 : 0) - (p.y + p.h < 1 ? gap / 2 : 0);
    return { x, y, w: Math.max(1, rw), h: Math.max(1, rh) };
  });
}

// Where the caption block goes for a layout. Zones:
// hero — over the first (largest) panel, bottom-left of it;
// top — a band across the top; bottom — a band across the bottom;
// center — a band across the middle, on top of the panels.
export function titleZone(layout, w, h) {
  const zone = (layout.title && layout.title.zone) || "bottom";
  const align = (layout.title && layout.title.align) || "center";
  const band = Math.round(h * 0.2);
  if (zone === "top") return { x: 0, y: Math.round(h * 0.045), w, h: band, align };
  if (zone === "center") return { x: 0, y: Math.round(h * 0.4), w, h: band, align };
  if (zone === "hero") {
    const first = layout.panels[0];
    return {
      x: Math.round(first.x * w + w * 0.03),
      y: Math.round((first.y + first.h) * h - h * 0.26),
      w: Math.round(first.w * w * 0.94),
      h: Math.round(h * 0.24),
      align,
    };
  }
  return { x: 0, y: Math.round(h * 0.78), w, h: band, align };
}
