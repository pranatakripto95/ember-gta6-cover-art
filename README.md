[![make.fun gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Ember Cover Art rank](https://make.fun/badge/gta6-cover-art-01/pranatakripto95/ember-gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Ember Cover Art reward](https://make.fun/badge/gta6-cover-art-01/pranatakripto95/ember-gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# Ember Cover Art

Your photo. Your caption. A poster worth posting. Ember Cover Art is an
offline web app, built for the
[make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01),
that turns a person's photo and a caption into multi-panel poster art in the
style of GTA 6's posters — bold lettering, a Vice City sunset or neon grade —
and exports it as a PNG to share.

## What it does

- **Any photo** — add photos from your machine (nothing is ever uploaded) or
  try the two bundled samples. Each panel takes its own photo, and you can
  crop and position each one: drag the photo inside the live preview, scroll
  to zoom, or use the zoom and pan sliders. **Smart-crop faces** centres the
  face zone of every photo in its panel automatically — the face zone moves
  with the photo's shape, so portraits, squares and landscapes all land
  right — and you can smart-crop a single panel too. Uploaded photos can be
  removed again from the thumbnail row.
- **Eight layouts** — Four Panel, Hero + Three, Full Bleed, Tilted Snaps,
  Nine Panel, Strip Trio, Duo and Banner + Three, all with a header strip
  for the badge ribbon and heat stars so they never sit on a face.
- **Seven colour grades** — Vice Sunset, Neon Nights, Golden Hour, Palm Pink,
  Midnight Teal, Candy Rush and Ember Dusk: sky gradients with sun rays and
  a horizon glow, sun disc, grade wash, film grain and vignette, all painted
  on canvas.
- **One-tap looks** — five presets (Golden Hero, Neon Grid, Sunset Snaps,
  Candy Duo, Dusk Banner) set layout, grade, size and caption at once, and
  **Surprise me** rolls a fresh random layout and grade.
- **Lettering** — a kicker line in tracked-out caps, a glowing neon script
  subtitle, a gradient title in heavy poster capitals (one or two lines,
  always fitted) with a gradient bar beneath it, a badge ribbon that shrinks
  long words to fit, and a five-star heat meter.
- **Fast export** — one click saves the PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080, or all three sizes at once. Undo and redo are built in, with
  Ctrl+Z / Ctrl+Y keyboard shortcuts.

## Try it

Serve `app/` with any static server and open `index.html` in desktop Chrome
— for example `node serve.ts`, then http://localhost:8080. No build step, no
network requests: every file the page loads lives under `app/`, and photos
are read on your own machine. Open with `?preset=golden-hero` (or any
preset id) to start on that look.

## Originality

Everything here is original: the layout, lettering and grades are drawn in
code, the sample photos were made with an image model for this app, and no
Rockstar Games logo, artwork, character or font is used anywhere.
