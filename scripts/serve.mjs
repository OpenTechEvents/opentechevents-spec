#!/usr/bin/env node
/**
 * Serves docs/ for local development. `npm run dev`
 *
 * Node's http module and nothing else: the site has no build step and no dependencies, and
 * neither should the way you run it. Opening index.html from disk does not work — the pages
 * fetch() their content, which needs HTTP.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = "docs";
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  // normalize() collapses any ../ before it can escape ROOT.
  let path = join(ROOT, normalize(decodeURIComponent(url.pathname)));
  if (url.pathname.endsWith("/")) path = join(path, "index.html");

  try {
    const body = await readFile(path);
    res.writeHead(200, {
      "content-type": TYPES[extname(path)] ?? "application/octet-stream",
      // No caching: you are here to see your edits, not yesterday's stylesheet.
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`404 — ${url.pathname}`);
  }
});

server.listen(PORT, () => {
  console.log(`  OTE site → http://localhost:${PORT}`);
  console.log(`  reference → http://localhost:${PORT}/spec/`);
  console.log("  Ctrl+C to stop");
});
