// Photos: the two free sample photos bundled with the app, plus any photo
// the person adds from their own machine. Nothing is ever uploaded.

/** The bundled samples (made with an image model for this app, free to use). */
export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/**
 * A small store of loaded photos: id -> image, in the order they were added,
 * plus the thumbnail element each one shows in the editor.
 */
export class PhotoStore {
  constructor() {
    this.images = new Map();
    this.order = [];
    this.uploadCount = 0;
  }

  /** Loads a bundled sample by id and registers it. */
  async addSample(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return null;
    if (!this.images.has(id)) {
      this.images.set(id, await loadImage(sample.src));
      this.order.push(id);
    }
    return id;
  }

  /** Loads a file the person picked and registers it under a fresh id. */
  async addFile(file) {
    const id = `upload-${this.uploadCount += 1}`;
    const url = URL.createObjectURL(file);
    this.images.set(id, await loadImage(url));
    this.order.push(id);
    return id;
  }

  /** The image for an id, or null. */
  get(id) {
    return this.images.get(id) || null;
  }

  /** Every photo's id, in the order added. */
  ids() {
    return [...this.order];
  }

  /** A short display name for a thumbnail's tooltip. */
  name(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (sample) return sample.name;
    return `Photo ${id.replace('upload-', '')}`;
  }
}
