// Ember Cover Art — the entry program (Node 22, standard library only).
//
// It hands the app in: it copies app/ and screenshots/ from this
// repository into the output directory and writes dossier.json with
// buildDossier from vendor/makefun-app.ts. It runs twice in grading
// and must write the same bytes both times, so the copy walks entries
// in sorted order and the dossier library does the rest.

import { buildDossier } from "./vendor/makefun-app.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// The gate's caps, from the competition kit: the dossier text is
// capped at 160 KiB, screenshots at 4 files of 256 KiB, and app/ at
// 993 entries and 48 MiB with paths under 1,000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  copyTree(path.join(repoRoot, "app"), path.join(outDir, "app"));
  copyTree(path.join(repoRoot, "screenshots"), path.join(outDir, "screenshots"));
  const dossier = buildDossier(outDir, CAPS);
  fs.writeFileSync(path.join(outDir, "dossier.json"), Buffer.from(dossier));
  console.log("wrote " + outDir + " (dossier " + dossier.length + " bytes)");
}

main();
