// Lettering: the poster's title block, neon script subtitle, badge ribbon and
// heat stars — all drawn in code, no font files, no game artwork.

/** Splits a title into at most two centred lines that fit `maxWidth`. */
export function wrapTitle(ctx, text, maxWidth, startSize) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], size: startSize };
  let size = startSize;
  const fit = (sz) => {
    ctx.font = titleFont(sz);
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines;
  };
  let lines = fit(size);
  while (lines.length > 2 && size > 24) { size -= 4; lines = fit(size); }
  while (lines.some((l) => ctx.measureText(l).width > maxWidth) && size > 24) {
    size -= 2;
    ctx.font = titleFont(size);
    lines = fit(size);
  }
  return { lines, size };
}

/** The heavy condensed face the title uses (system fonts only). */
export function titleFont(size) {
  return `900 ${size}px "Arial Black", "Arial Narrow", Impact, "Helvetica Neue", sans-serif`;
}

/** The script face for the subtitle (system cursive only). */
export function scriptFont(size) {
  return `italic 700 ${size}px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive`;
}

/**
 * Draws the title lines centred at `cx`, the first line's baseline at `y`,
 * filled with a vertical gradient and edged in white over black.
 */
export function drawTitle(ctx, lines, size, cx, y, colours) {
  const grad = ctx.createLinearGradient(0, y - size, 0, y + size * (lines.length - 0.4));
  colours.forEach((c, i) => grad.addColorStop(i / Math.max(1, colours.length - 1), c));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = '1px'; } catch { /* older canvas: no letter spacing */ }
  lines.forEach((line, i) => {
    const ly = y + i * size * 1.04;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.font = titleFont(size);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 5, 25, 0.9)';
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(line, cx, ly);
    ctx.fillStyle = grad;
    ctx.fillText(line, cx, ly);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, size * 0.02);
    ctx.strokeText(line, cx, ly);
    ctx.restore();
  });
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

/** Draws the glowing script subtitle centred at (`cx`, `y`). */
export function drawSubtitle(ctx, text, size, cx, y, colour) {
  if (!text.trim()) return;
  ctx.save();
  ctx.font = scriptFont(size);
  ctx.textAlign = 'center';
  ctx.shadowColor = colour;
  ctx.shadowBlur = size * 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text.trim(), cx, y);
  ctx.shadowBlur = size * 0.25;
  ctx.fillStyle = colour;
  ctx.fillText(text.trim(), cx, y);
  ctx.restore();
}

/** A five-pointed star path centred at (`cx`, `cy`) with outer radius `r`. */
export function starPath(ctx, cx, cy, r) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws the heat stars (filled gold, empty ones just outlined) at top right. */
export function drawStars(ctx, count, w) {
  const r = Math.max(10, w * 0.024);
  const gap = r * 2.35;
  const y = r * 1.7;
  for (let i = 0; i < 5; i += 1) {
    const cx = w - r * 1.4 - (4 - i) * gap;
    starPath(ctx, cx, y, r);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.strokeStyle = '#ffffff';
    if (i < count) {
      ctx.fillStyle = '#ffd76a';
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
    }
    ctx.stroke();
  }
}

/** Draws the tilted badge ribbon at top left with the badge words on it. */
export function drawBadge(ctx, text, w, h) {
  const label = text.trim().toUpperCase();
  if (!label) return;
  const size = Math.max(13, w * 0.022);
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  const tw = ctx.measureText(label).width;
  const bw = tw + size * 2.2;
  const bh = size * 2.1;
  ctx.translate(w * 0.03, h * 0.018);
  ctx.rotate(-0.07);
  ctx.fillStyle = '#ff2e88';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.12);
  roundRectPath(ctx, 0, 0, bw, bh, bh * 0.28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bw / 2, bh / 2 + size * 0.06);
  ctx.restore();
}

/** A rounded-rectangle path (roundRect is not in every canvas yet). */
export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
