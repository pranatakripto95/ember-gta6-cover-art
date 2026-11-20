// The cover renderer: paints sky, sun rays, photo panels, grade wash, grain,
// vignette and the title block onto any canvas at any of the three post
// sizes. The title block stacks kicker, script subtitle, big gradient title
// and a gradient bar, anchored from the bottom so it never clips.

import { gradeById } from './grades.js';
import { layoutPanels, titleBandTop } from './layouts.js';
import { wrapTitle, titleFont, drawTitle, drawTitleBar, drawSubtitle, drawKicker, drawStars, drawBadge } from './lettering.js';

/** Deterministic pseudo-random numbers, so grain looks the same every export. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws one photo into a panel rect, cover-fit, with the panel's zoom and
 * pan. `photo` is an image element or null (then a tinted placeholder).
 */
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  const { x, y, w, h } = rect;
  if (!photo) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, grade.sky[1]);
    g.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(2, w * 0.01);
    ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y);
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(w / iw, h / ih) * (panel.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = x + (w - dw) / 2 + (panel.ox || 0) * w;
  const dy = y + (h - dh) / 2 + (panel.oy || 0) * h;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/**
 * Sun rays: translucent wedges fanning out from the sun disc, so the sky
 * reads as a poster sunset even where no panel covers it.
 */
export function drawSunRays(ctx, sunX, sunY, sunR, colour, w, h) {
  const rays = 12;
  ctx.save();
  ctx.fillStyle = colour;
  for (let i = 0; i < rays; i += 1) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2 / rays) * 0.45;
    const len = Math.max(w, h) * 1.2;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.arc(sunX, sunY, len, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Renders the whole cover onto `canvas` at its own size.
 * `state` holds layout, grade, title, subtitle, kicker, badge, stars, grain,
 * vignette, frame and panels; `photos` maps a photo id to an image element.
 */
export function renderCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const panels = layoutPanels(state.layout, w, h);
  const bandTop = titleBandTop(state.layout, h);

  // Sky: the grade's sunset gradient, with a glowing sun (or moon) disc.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sunX = w * 0.76;
  const sunY = h * 0.16;
  const sunR = Math.min(w, h) * 0.085;
  // Rays first, then the glow, then the disc itself on top.
  drawSunRays(ctx, sunX, sunY, sunR, grade.rays || 'rgba(255,255,255,0.10)', w, h);
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 3.2, sunY - sunR * 3.2, sunR * 6.4, sunR * 6.4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Horizon glow: a soft band where the sky meets the title block.
  const horizon = ctx.createLinearGradient(0, bandTop - h * 0.12, 0, bandTop + h * 0.04);
  horizon.addColorStop(0, 'rgba(255,255,255,0)');
  horizon.addColorStop(0.5, grade.horizon || 'rgba(255,255,255,0.20)');
  horizon.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, bandTop - h * 0.12, w, h * 0.16);

  // Photo panels, each clipped to its rect (tilted ones rotated in place).
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = w * 0.02;
  ctx.shadowOffsetY = w * 0.008;
  panels.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo ? photos.get(panel.photo) || null : null;
    ctx.save();
    const cxp = rect.x + rect.w / 2;
    const cyp = rect.y + rect.h / 2;
    ctx.translate(cxp, cyp);
    ctx.rotate((rect.rot || 0) * Math.PI / 180);
    ctx.translate(-cxp, -cyp);
    const pad = rect.snap ? w * 0.012 : 0;
    const bottomPad = rect.snap ? h * 0.045 : 0;
    if (rect.snap) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad + bottomPad);
    }
    ctx.beginPath();
    ctx.rect(rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad + bottomPad);
    ctx.clip();
    drawPanelPhoto(ctx, photo, rect, panel, grade);
    // A bright top edge inside each panel, like light catching the print.
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(rect.x - pad, rect.y - pad, rect.w + pad * 2, Math.max(2, h * 0.006));
    ctx.restore();
    // Panel frame: white edge, thicker polaroid edge for tilted snapshots.
    ctx.save();
    ctx.translate(cxp, cyp);
    ctx.rotate((rect.rot || 0) * Math.PI / 180);
    ctx.translate(-cxp, -cyp);
    ctx.lineWidth = Math.max(3, w * 0.007);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad + bottomPad);
    ctx.lineWidth = Math.max(1, w * 0.0015);
    ctx.strokeStyle = 'rgba(20,5,25,0.55)';
    ctx.strokeRect(rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad + bottomPad);
    ctx.restore();
  });
  ctx.restore();

  // Grade wash over the panels, then a warm lift from the bottom.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const lift = ctx.createLinearGradient(0, h * 0.4, 0, h);
  lift.addColorStop(0, 'rgba(255, 120, 80, 0)');
  lift.addColorStop(1, 'rgba(120, 10, 70, 0.28)');
  ctx.fillStyle = lift;
  ctx.fillRect(0, 0, w, h);

  // Film grain: seeded dots, the same on every export.
  if (state.grain) {
    const rand = mulberry32(20261119);
    const count = Math.floor((w * h) / 900);
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const gx = rand() * w;
      const gy = rand() * h;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(gx, gy, Math.max(1, w / 1080), Math.max(1, w / 1080));
    }
    ctx.restore();
  }

  // Vignette: darkened corners to hold the poster together.
  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      w / 2, h * 0.42, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10,0,15,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // Title block: dark band, then kicker, script subtitle, the big gradient
  // title and a gradient bar — anchored from the bottom so nothing clips.
  const band = ctx.createLinearGradient(0, bandTop - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 20, 0)');
  band.addColorStop(0.35, 'rgba(12, 4, 20, 0.72)');
  band.addColorStop(1, 'rgba(12, 4, 20, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop - h * 0.06, w, h - bandTop + h * 0.06);
  const bandH = h - bandTop;
  const titleStart = Math.min(w * 0.095, h * 0.095);
  ctx.font = titleFont(titleStart);
  const wrapped = wrapTitle(ctx, state.title, w * 0.92, titleStart);
  // Two lines get a smaller face so both baselines stay inside the band.
  const size = wrapped.lines.length > 1 ? Math.min(wrapped.size, bandH * 0.30) : wrapped.size;
  const lines = wrapped.lines;
  const barH = Math.max(4, size * 0.07);
  const barGap = size * 0.28;
  const lastBaseline = h - bandH * 0.14 - barH - barGap;
  const titleY = lastBaseline - (lines.length - 1) * size * 1.04;
  // The subtitle and kicker stack above the title's cap height, never on
  // its baseline: titleTop is where the first line's glyphs actually start.
  const titleTop = titleY - size * 0.78;
  const subSize = Math.max(18, h * 0.038);
  const subY = titleTop - subSize * 0.45;
  const kickSize = Math.max(13, h * 0.021);
  const kickY = subY - subSize * 0.85;
  drawKicker(ctx, state.kicker || '', kickSize, w / 2, kickY, grade.subtitle);
  drawSubtitle(ctx, state.subtitle, subSize, w / 2, subY, grade.subtitle);
  drawTitle(ctx, lines, size, w / 2, titleY, grade.title);
  drawTitleBar(ctx, lines, size, w / 2, lastBaseline + barGap, grade.title);

  // Poster frame first, so its inner line never crosses the badge or stars.
  if (state.frame) {
    const lw = Math.max(4, w * 0.011);
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    ctx.lineWidth = Math.max(1, w * 0.0016);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.strokeRect(lw * 2.2, lw * 2.2, w - lw * 4.4, h - lw * 4.4);
  }

  // Heat stars top right, badge ribbon top left.
  drawStars(ctx, state.stars || 0, w);
  drawBadge(ctx, state.badge, w, h);
}
