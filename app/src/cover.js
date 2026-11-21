// Ember Cover Art — the renderer: sky, sun, panels, grade, grain,
// lettering. One function draws the poster, and the same function
// draws both the live preview and the exported PNG, so what the user
// sees is exactly what they share.
//
// Draw order matters: the sky and sun go down first, then the photo
// panels, then the colour grade over the whole canvas, then light
// (rays and horizon glow) over the panels, then grain and vignette,
// then the lettering and the badge on top of everything.

import { coverFit, photoForPanel } from "./photos.js";
import { gradeById, applyGrade } from "./grades.js";
import { layoutById, panelRects, titleZone } from "./layouts.js";
import { letteringById, drawKicker, drawTitle, drawSubtitle, drawBadge } from "./lettering.js";
import { sizeById } from "./state.js";

// Image cache: one <img> per photo source, shared by preview and export.
const imageCache = new Map();

export async function collectImages(state) {
  const out = new Map();
  const jobs = state.photos.map(async (photo) => {
    try {
      let img = imageCache.get(photo.src);
      if (!img) {
        img = await loadOne(photo.src);
        imageCache.set(photo.src, img);
      }
      out.set(photo.id, img);
    } catch (err) {
      console.warn("photo failed to load, panel will use a gradient", photo.label, err);
    }
  });
  await Promise.all(jobs);
  return out;
}

function loadOne(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed: " + src));
    img.src = src;
  });
}

let noiseCanvas = null;

function noiseTile() {
  if (noiseCanvas) return noiseCanvas;
  const c = document.createElement("canvas");
  c.width = 180;
  c.height = 180;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseCanvas = c;
  return c;
}

export function drawGrain(ctx, w, h, amount) {
  if (amount <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = amount * 0.34;
  ctx.globalCompositeOperation = "overlay";
  const pattern = ctx.createPattern(noiseTile(), "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx, w, h, amount) {
  if (amount <= 0.01) return;
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, r * 0.42,
    w / 2, h / 2, r * 1.02,
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0," + (0.62 * amount).toFixed(3) + ")");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawSunRays(ctx, cx, cy, radius, count, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const spread = 0.045 + (i % 3) * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a - spread, a + spread);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawHorizonGlow(ctx, w, h, color, amount) {
  if (amount <= 0.01) return;
  const cy = h * 0.6;
  const grad = ctx.createRadialGradient(
    w * 0.5, cy, 0,
    w * 0.5, cy, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.34 * amount;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawPanel(ctx, rect, img, photo, frame, isSelected, index, tiltDeg) {
  ctx.save();
  if (tiltDeg) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((tiltDeg * Math.PI) / 180);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const fit = coverFit(img, rect, photo);
    ctx.drawImage(img, fit.sx, fit.sy, fit.sw, fit.sh, fit.dx, fit.dy, fit.dw, fit.dh);
  } else {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, "#3b0764");
    grad.addColorStop(1, "#ff7a2f");
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
  if (frame) {
    ctx.save();
    ctx.lineWidth = Math.max(2, Math.round(Math.min(rect.w, rect.h) * 0.012));
    ctx.strokeStyle = isSelected ? "#ff2d78" : "rgba(255,255,255,0.92)";
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  if (isSelected) {
    ctx.save();
    ctx.fillStyle = "rgba(255,45,120,0.92)";
    ctx.font = "800 " + Math.max(11, Math.round(rect.w * 0.028)) + "px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("PANEL " + (index + 1), rect.x + 8, rect.y + 8);
    ctx.restore();
  }
}

// The poster. canvas is sized by the caller (preview or export size);
// opts may carry selectedPanel for the editor's highlight.
export function renderCover(canvas, state, images, opts) {
  const o = opts || {};
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const style = letteringById(state.letteringId);
  const fx = state.effects || {};
  const scale = Math.min(w, h) / 900;

  // 1. Sky.
  const sky = grade.sky || ["#2b1055", "#ff7a2f", "#ffd166"];
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  sky.forEach((c, i) => skyGrad.addColorStop(i / Math.max(1, sky.length - 1), c));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Panels.
  const rects = panelRects(layout, w, h);
  rects.forEach((rect, i) => {
    const photo = photoForPanel(state, i);
    const img = photo ? images.get(photo.id) : null;
    const isInset = layout.id === "spotlight" && i === 1;
    drawPanel(
      ctx, rect, img, photo,
      fx.border !== 0,
      o.selectedPanel === i,
      i,
      isInset ? -3 : 0,
    );
  });

  // A slanted seam for the diagonal layout.
  if (layout.seam === "diagonal") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.012));
    ctx.beginPath();
    ctx.moveTo(w * 0.58, -10);
    ctx.lineTo(w * 0.5, h + 10);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Colour grade over everything so far.
  applyGrade(ctx, w, h, grade, fx.gradeStrength == null ? 0.85 : fx.gradeStrength);

  // 4. Light: sun disc, rays, horizon glow.
  const sunX = w * 0.5;
  const sunY = h * 0.3;
  const sunR = Math.min(w, h) * 0.17;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.4);
  sunGrad.addColorStop(0, "rgba(255,244,214,0.95)");
  sunGrad.addColorStop(0.35, grade.glow || "#ff7a2f");
  sunGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.38 * (fx.glow == null ? 0.7 : fx.glow);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  drawSunRays(ctx, sunX, sunY, Math.max(w, h), 12, "#ffd166", 0.09 * (fx.rays == null ? 0.75 : fx.rays));
  drawHorizonGlow(ctx, w, h, grade.glow || "#ff7a2f", fx.glow == null ? 0.7 : fx.glow);

  // 5. Grain and vignette.
  drawGrain(ctx, w, h, fx.grain == null ? 0.45 : fx.grain);
  drawVignette(ctx, w, h, fx.vignette == null ? 0.55 : fx.vignette);

  // 6. Lettering.
  const zone = titleZone(layout, w, h);
  if (layout.title.zone === "center") {
    ctx.save();
    ctx.fillStyle = "rgba(8,8,20,0.42)";
    ctx.fillRect(0, zone.y - h * 0.02, w, zone.h + h * 0.04);
    ctx.restore();
  }
  const scrimH = Math.round(h * 0.3);
  if (layout.title.zone === "hero" || layout.title.zone === "bottom") {
    const scrim = ctx.createLinearGradient(0, zone.y - scrimH * 0.4, 0, zone.y + zone.h);
    scrim.addColorStop(0, "rgba(0,0,0,0)");
    scrim.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.save();
    ctx.fillStyle = scrim;
    ctx.fillRect(zone.x - w * 0.03, zone.y - scrimH * 0.4, zone.w + w * 0.06, zone.h + scrimH * 0.4);
    ctx.restore();
  }
  const kickerH = drawKicker(
    ctx, state.kicker, zone.x, zone.y, zone.w, style, scale, zone.align,
  );
  const titleBox = { x: zone.x, y: zone.y + kickerH + h * 0.012, w: zone.w, h: zone.h - kickerH - h * 0.05 };
  drawTitle(ctx, state.title, titleBox, style, { align: zone.align, tilt: fx.tilt || 0, scale });
  drawSubtitle(
    ctx, state.subtitle,
    zone.x + zone.w / 2, zone.y + zone.h - h * 0.022, zone.w, style, scale,
  );

  // 7. Badge in the corner away from the title.
  const badgeR = Math.max(26, Math.round(Math.min(w, h) * 0.052));
  const badgeX = zone.align === "right" ? w * 0.07 : w * 0.93;
  const badgeY = layout.title.zone === "top" ? h * 0.9 : h * 0.09;
  drawBadge(ctx, badgeX, badgeY, badgeR, "SUNSET", "EST. 2026");

  // 8. Outer frame.
  ctx.save();
  ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.008));
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.strokeRect(
    ctx.lineWidth / 2, ctx.lineWidth / 2,
    w - ctx.lineWidth, h - ctx.lineWidth,
  );
  ctx.restore();
  return rects;
}

// Export the poster as a PNG blob at the state's size.
export async function exportCover(state, images) {
  const size = sizeById(state.sizeId);
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const imgs = images || (await collectImages(state));
  renderCover(canvas, state, imgs, {});
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Export failed: the canvas produced no image."));
    }, "image/png");
  });
}
