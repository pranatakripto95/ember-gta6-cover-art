// Ember Cover Art — lettering: kicker ribbons, bold titles, badges.
//
// All lettering is drawn with system fonts, so the app ships no font
// file and copies nothing from any game. The heavy title face is a
// stack that lands on Arial Black on most machines and falls back to a
// bold sans; the subtitle uses an italic serif for contrast. Each
// lettering style is a small table of colours and treatments, and the
// draw functions take a style id, so presets can swap the whole look
// with one field.

export const LETTERING_STYLES = [
  {
    id: "sunset", name: "Sunset Bold", desc: "White type, sunset gradient",
    fill: ["#fff7e6", "#ffd166", "#ff7a2f"], stroke: "#2b1055", shadow: "rgba(43,16,85,0.55)",
    kickerBg: "#ff7a2f", kickerFg: "#2b1055", subtitle: "#ffe9c9",
  },
  {
    id: "neon", name: "Neon Script", desc: "Hot pink glow on dark",
    fill: ["#ffffff", "#ffb3d9", "#ff2d78"], stroke: "#1a0533", shadow: "rgba(255,45,120,0.65)",
    kickerBg: "#ff2d78", kickerFg: "#ffffff", subtitle: "#ffd6e8",
  },
  {
    id: "chrome", name: "Chrome", desc: "Silver metal, dark outline",
    fill: ["#ffffff", "#d7dce3", "#8b939e"], stroke: "#111827", shadow: "rgba(0,0,0,0.6)",
    kickerBg: "#111827", kickerFg: "#f8fafc", subtitle: "#e5e7eb",
  },
  {
    id: "badge", name: "Badge Pop", desc: "Candy colours, thick outline",
    fill: ["#fffbe6", "#fde047", "#f472b6"], stroke: "#3b0764", shadow: "rgba(59,7,100,0.5)",
    kickerBg: "#facc15", kickerFg: "#3b0764", subtitle: "#fef3c7",
  },
  {
    id: "mono", name: "Mono Post", desc: "Typewriter calm, blue night",
    fill: ["#f1f5f9", "#c7d2fe", "#818cf8"], stroke: "#020617", shadow: "rgba(2,6,23,0.6)",
    kickerBg: "#6366f1", kickerFg: "#ffffff", subtitle: "#c7d2fe",
  },
];

export function letteringById(id) {
  return LETTERING_STYLES.find((s) => s.id === id) || LETTERING_STYLES[0];
}

const TITLE_FAMILY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const KICKER_FAMILY = '"Helvetica Neue", Arial, sans-serif';
const SUBTITLE_FAMILY = 'Georgia, "Times New Roman", serif';

// Shrink a font until the text fits maxW, starting from startPx.
// Returns the pixel size that fits (never below 40% of the start).
export function fitFont(ctx, text, maxW, startPx, family, weight) {
  let px = startPx;
  ctx.font = weight + " " + px + "px " + family;
  while (px > startPx * 0.4 && ctx.measureText(text).width > maxW) {
    px = Math.floor(px * 0.92);
    ctx.font = weight + " " + px + "px " + family;
  }
  return px;
}

// Wrap a title into at most two lines, breaking on word boundaries and
// keeping words whole. Long single words are split by the fit step.
export function wrapTitle(ctx, text, maxW, px) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    const trial = line ? line + " " + word : word;
    ctx.font = "900 " + px + "px " + TITLE_FAMILY;
    if (ctx.measureText(trial).width <= maxW || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

// The kicker: a short line of small caps on a slanted ribbon bar.
// The ribbon is measured from the text, then placed by alignment
// inside the zone it is given, so centred kickers are truly centred.
export function drawKicker(ctx, text, x, y, maxW, style, scale, align) {
  const label = String(text || "").toUpperCase();
  if (!label) return 0;
  const s = scale || 1;
  const px = Math.max(10, Math.round(15 * s));
  ctx.save();
  ctx.font = "800 " + px + "px " + KICKER_FAMILY;
  const tw = Math.min(maxW, ctx.measureText(label).width + px * 1.6);
  if (align === "center") x = x + (maxW - tw) / 2;
  else if (align === "right") x = x + maxW - tw;
  const h = px * 1.9;
  const slant = h * 0.35;
  ctx.beginPath();
  ctx.moveTo(x + slant, y);
  ctx.lineTo(x + tw, y);
  ctx.lineTo(x + tw - slant, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = style.kickerBg;
  ctx.fill();
  ctx.fillStyle = style.kickerFg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + slant * 0.9, y + h / 2 + 1);
  ctx.restore();
  return h;
}

// The big title, drawn in up to two lines with a gradient fill, a
// dark outline and a soft drop shadow. The box gives the area to fill;
// the text is centred or left-aligned per the zone.
export function drawTitle(ctx, text, box, style, opts) {
  const o = opts || {};
  const scale = o.scale || 1;
  const align = o.align || "center";
  const tilt = o.tilt || 0;
  const label = String(text || "").toUpperCase();
  if (!label) return;
  const maxW = box.w;
  ctx.save();
  // Size the title from the box, not from a fixed fraction of the
  // canvas: start tall, then shrink only until the wrapped lines fit.
  // Measuring the wrapped lines (not the whole unbroken string) keeps
  // two-line titles as bold as one-line ones.
  let px = Math.round(box.h * 0.48);
  let lines = wrapTitle(ctx, label, maxW, px);
  let guard = 0;
  while (lines.length > 2 && px > 14 && guard++ < 40) {
    px = Math.floor(px * 0.92);
    lines = wrapTitle(ctx, label, maxW, px);
  }
  guard = 0;
  while (px > 14 && guard++ < 60) {
    ctx.font = "900 " + px + "px " + TITLE_FAMILY;
    const widest = Math.max.apply(null, lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxW) break;
    px = Math.floor(px * 0.94);
    lines = wrapTitle(ctx, label, maxW, px);
  }
  const lineH = px * 1.04;
  const totalH = lines.length * lineH;
  let startY = box.y + (box.h - totalH) / 2;
  if (tilt) {
    const cx = align === "left" ? box.x : align === "right" ? box.x + box.w : box.x + box.w / 2;
    ctx.translate(cx, startY + totalH / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-cx, -(startY + totalH / 2));
  }
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 2;
    const tx = align === "left" ? box.x : align === "right" ? box.x + box.w : box.x + box.w / 2;
    const grad = ctx.createLinearGradient(box.x, y - px / 2, box.x, y + px / 2);
    const stops = style.fill || ["#ffffff", "#ffd166"];
    stops.forEach((c, j) => grad.addColorStop(j / Math.max(1, stops.length - 1), c));
    ctx.font = "900 " + px + "px " + TITLE_FAMILY;
    ctx.shadowColor = style.shadow || "rgba(0,0,0,0.5)";
    ctx.shadowBlur = Math.round(px * 0.16);
    ctx.shadowOffsetY = Math.round(px * 0.05);
    ctx.lineWidth = Math.max(2, Math.round(px * 0.09));
    ctx.lineJoin = "round";
    ctx.strokeStyle = style.stroke || "#111";
    ctx.strokeText(line, tx, y);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = grad;
    ctx.fillText(line, tx, y);
  });
  ctx.restore();
}

// The subtitle: one italic serif line under the title.
export function drawSubtitle(ctx, text, x, y, maxW, style, scale) {
  const label = String(text || "");
  if (!label) return;
  const s = scale || 1;
  let px = Math.round(19 * s);
  ctx.save();
  px = fitFont(ctx, label, maxW, px, SUBTITLE_FAMILY, "italic 600");
  ctx.font = "italic 600 " + px + "px " + SUBTITLE_FAMILY;
  ctx.fillStyle = style.subtitle || "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.round(px * 0.25);
  ctx.fillText(label, x, y);
  ctx.restore();
}

// A round stamp badge: a ring, a star, and two short lines of text.
// Used in a corner to sign the poster like a postmark.
export function drawBadge(ctx, cx, cy, r, top, bottom) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10,10,25,0.72)";
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = "#ffd166";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.strokeStyle = "rgba(255,209,102,0.7)";
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.font = "900 " + Math.round(r * 0.42) + "px " + TITLE_FAMILY;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", 0, -r * 0.34);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 " + Math.round(r * 0.2) + "px " + KICKER_FAMILY;
  ctx.fillText(String(top || "SUNSET").toUpperCase(), 0, r * 0.08);
  ctx.fillText(String(bottom || "EST. 2026").toUpperCase(), 0, r * 0.36);
  ctx.restore();
}
