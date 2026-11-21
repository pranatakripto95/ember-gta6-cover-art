// Ember Cover Art — photos: loading, user files, and cover-fit maths.
//
// Photos are read on the person's own machine and never uploaded. A photo
// object carries its own crop: a zoom, a pan offset, and a focus point
// (where the interesting part is). The renderer asks coverFit() for the
// source rectangle that fills a panel from that crop.

let photoCounter = 3;

export function newPhotoId() {
  return "photo-" + photoCounter++;
}

export function samplePhotos() {
  return [
    { id: "sample-boulevard", src: "samples/boulevard.jpg", label: "Boulevard" },
    { id: "sample-pier", src: "samples/pier.jpg", label: "Pier" },
  ];
}

export function photoById(state, id) {
  return state.photos.find((p) => p.id === id) || state.photos[0] || null;
}

// Load an image element from a URL or a data: URI. The promise rejects
// with a plain Error so callers can show a friendly message.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image: " + src));
    img.src = src;
  });
}

// Turn a file from <input type=file> into a photo object. The file is
// read as a data: URI, so it stays in the browser and is never sent
// anywhere. Very large photos are kept as-is; the canvas downsamples
// them when it draws, which is fast enough at poster sizes.
export function readUserFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("That file is not an image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: newPhotoId(),
          src: String(reader.result),
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Photo",
          zoom: 1.1,
          panX: 0,
          panY: 0,
          focusX: 0.5,
          focusY: 0.42,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error("Could not read that image file."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

// Cover-fit with a focus point. Given an image, a destination box, and a
// photo's crop settings, return the source rectangle to draw and the
// destination rectangle to draw it into. The focus point is where the
// crop centres itself; panX/panY nudge it afterwards, in fractions of
// the box, and zoom scales the crop around that centre.
export function coverFit(img, box, photo) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const bw = box.w;
  const bh = box.h;
  const zoom = Math.max(0.5, Math.min(4, (photo && photo.zoom) || 1));
  const focusX = photo && typeof photo.focusX === "number" ? photo.focusX : 0.5;
  const focusY = photo && typeof photo.focusY === "number" ? photo.focusY : 0.5;
  const panX = (photo && photo.panX) || 0;
  const panY = (photo && photo.panY) || 0;

  const boxAspect = bw / bh;
  const imgAspect = iw / ih;
  let sw;
  let sh;
  if (imgAspect > boxAspect) {
    sh = ih;
    sw = ih * boxAspect;
  } else {
    sw = iw;
    sh = iw / boxAspect;
  }
  sw /= zoom;
  sh /= zoom;

  // Centre the crop on the focus point, then apply the pan nudge.
  let sx = focusX * iw - sw / 2 + panX * sw;
  let sy = focusY * ih - sh / 2 + panY * sh;
  sx = Math.max(0, Math.min(iw - sw, sx));
  sy = Math.max(0, Math.min(ih - sh, sy));

  return { sx, sy, sw, sh, dx: box.x, dy: box.y, dw: bw, dh: bh };
}

// Which photo fills a panel. Layouts ask for a slot index; the state
// holds one photo id per slot, and slots wrap around the list so a
// two-photo poster can still fill nine panels.
export function photoForPanel(state, index) {
  const slots = state.panelPhotos && state.panelPhotos.length
    ? state.panelPhotos
    : state.photos.map((p) => p.id);
  const id = slots[index % slots.length];
  return photoById(state, id);
}

// Point-in-rect hit test, used when the user clicks the preview canvas
// to pick a panel.
export function hitPanel(rects, x, y) {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
