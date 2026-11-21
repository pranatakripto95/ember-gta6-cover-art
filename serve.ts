// Ember Cover Art — a tiny static server for trying the app locally.
//
// Serves app/ on http://localhost:8080 (or $PORT). No build step, no
// network requests: every file comes from app/ on this machine.
// Run it with `node serve.ts`, then open the printed address.

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "app");
const port = Number(process.env.PORT || 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const raw = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  const rel = raw === "/" ? "index.html" : raw.replace(/^\/+/, "");
  const file = path.join(appRoot, rel);
  if (!file.startsWith(appRoot) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found: " + raw + "\n");
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log("Ember Cover Art at http://localhost:" + port + "/");
});
