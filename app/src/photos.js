// Photos: the two free sample photos bundled with the app, plus any photo
// the person adds from their own machine. Nothing is ever uploaded. Uploaded
// photos can be removed again; their object URLs are revoked when they go.

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
    this.urls = new Map();
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
    this.urls.set(id, url);
    try {
      this.images.set(id, await loadImage(url));
    } catch (e) {
      URL.revokeObjectURL(url);
      this.urls.delete(id);
      throw e;
    }
    this.order.push(id);
    return id;
  }

  /**
   * Removes a photo from the store (uploads only; samples stay available).
   * Returns true when something was removed.
   */
  remove(id) {
    if (!this.images.has(id) || SAMPLES.some((s) => s.id === id)) return false;
    this.images.delete(id);
    this.order = this.order.filter((x) => x !== id);
    const url = this.urls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.urls.delete(id);
    }
    return true;
  }

  /** The image for an id, or null. */
  get(id) {
    return this.images.get(id) || null;
  }

  /** Every photo's id, in the order added. */
  ids() {
    return [...this.order];
  }

  /** How many photos the store holds. */
  count() {
    return this.order.length;
  }

  /** A short display name for a thumbnail's tooltip. */
  name(id) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (sample) return sample.name;
    return `Photo ${id.replace('upload-', '')}`;
  }
}
