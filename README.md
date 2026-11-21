# Ember Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/pranatakripto95/ember-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/pranatakripto95/ember-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

Turn any photo and a caption into a multi-panel sunset poster in the
style of GTA 6's cover art. It runs entirely offline in the browser,
and your photos never leave your machine.

## What it does

- **Any photo:** add your own photos or use the two samples. Fill
  several panels with one photo or several, then crop and position
  each one by dragging on the poster, scrolling to zoom, or with the
  sliders. A smart-crop button finds the busiest, warmest part of a
  photo and centres the crop on it.
- **Twelve layouts:** a hero with a strip, equal columns, grids up to
  3×3, a full-bleed frame with a tilted inset, tall stripes, a
  diagonal split, and a split with a title band.
- **Nine colour grades:** Vice Sunset, Neon Night, Miami Teal, Golden
  Hour, Rose Dusk, Chrome Noir, Palm Green, Candy Pop and Midnight —
  each a tone curve plus a duotone option, with a strength slider.
- **Lettering:** a kicker ribbon, a bold gradient title in five
  styles, an italic subtitle, and a round stamp badge. Everything is
  drawn with system fonts; no font file from any game is used.
- **Effects:** sun rays, horizon glow, film grain, vignette, title
  tilt, and white panel frames.
- **One-tap looks:** eight presets (Golden Ave, Night Drive, Miami
  Mornings, Rose Hour, Chrome Noir, Candy Streets, Palm Shadow,
  Midnight Post) and a "Surprise me" random look. Undo and redo are
  built in.
- **Fast export:** one click downloads a PNG in 1080 × 1080,
  1080 × 1350 or 1920 × 1080.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080/ in desktop Chrome.

## Screenshots

`screenshots/` holds four images taken from the app itself: the wide
cover first, then the editor with a photo loaded, then the portrait
and square covers. The app stages its own screenshot scenes with
`?shot=cover|editor|portrait|square` (see `app/src/shots.js`).

## How it is built

Static files under `app/` — no build step, no network requests.
`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json`
with the kit's `vendor/makefun-app.ts`.

- `app/src/state.js` — state, sizes, presets, undo/redo store
- `app/src/photos.js` — photo loading and cover-fit maths
- `app/src/facecrop.js` — smart-crop focus scoring
- `app/src/grades.js` — the nine colour grades and their LUTs
- `app/src/layouts.js` — the twelve panel grids
- `app/src/lettering.js` — kicker, title, subtitle, badge
- `app/src/cover.js` — the canvas renderer and PNG export
- `app/src/editor.js` — controls, panel picking, drag and zoom
- `app/src/shots.js` — screenshot scenes
- `app/src/main.js` — bootstrap

## Originality

An original design. It uses no Rockstar Games logo, wordmark,
official artwork, character or font. The sample photos under
`app/samples/` are free to use.

## License

MIT — see `LICENSE`.
