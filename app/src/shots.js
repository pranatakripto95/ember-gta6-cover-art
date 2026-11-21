// Ember Cover Art — screenshot scenes: ?shot=cover|editor|portrait|square.
//
// The app reads one query parameter, `shot`, and stages itself for a
// screenshot: it picks a preset, a size and a caption, and reports when
// the first render is done through window.__emberShotDone. The browser
// test drives these scenes to take the entry's screenshots. In normal
// use there is no parameter and the app opens exactly as the user left
// it, with the sample photos already loaded.

import { PRESETS, presetPatch } from "./state.js";

export const SHOT_SCENES = {
  cover: {
    presetId: "golden-ave", sizeId: "wide",
    title: "NEON SHORE", kicker: "WELCOME TO THE SUNSET",
    subtitle: "a sunset story in three panels",
    chrome: false,
  },
  editor: {
    presetId: "night-drive", sizeId: "wide",
    title: "NIGHT DRIVE", kicker: "AFTER DARK, EVERYTHING GLOWS",
    subtitle: "neon streets, no destination",
    chrome: true,
  },
  portrait: {
    presetId: "rose-hour", sizeId: "portrait",
    title: "ROSE HOUR", kicker: "THE SKY TURNED PINK AT SIX",
    subtitle: "golden hour, kept forever",
    chrome: false,
  },
  square: {
    presetId: "miami-mornings", sizeId: "square",
    title: "MIAMI MORNINGS", kicker: "SALT AIR AND PALM TREES",
    subtitle: "three frames from the coast",
    chrome: false,
  },
};

export function shotFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get("shot");
    return shot && SHOT_SCENES[shot] ? shot : null;
  } catch (err) {
    return null;
  }
}

// Apply a scene to the store. Returns the scene (or null) so the
// caller can hide the editor chrome for cover-only shots.
export function applyShot(store, shotId) {
  const scene = SHOT_SCENES[shotId];
  if (!scene) return null;
  const preset = PRESETS.find((p) => p.id === scene.presetId) || PRESETS[0];
  store.set({
    ...presetPatch(preset),
    sizeId: scene.sizeId,
    title: scene.title,
    kicker: scene.kicker,
    subtitle: scene.subtitle,
  });
  document.body.dataset.shot = shotId;
  if (!scene.chrome) document.body.classList.add("shot-cover");
  return scene;
}
