import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(readFileSync(join(root, "package.json"))).version;
const minor = "v" + version.split(".").slice(0, 2).join(".");
const fixture = JSON.parse(readFileSync(join(root, "spec", minor, "examples/feed.json")));

test("feed inventory measures validated entries and preserves the dated snapshot on failure", () => {
  const cwd = mkdtempSync(join(tmpdir(), "ote-feed-count-"));
  const json = (path, value) => writeFileSync(join(cwd, path), JSON.stringify(value));
  try {
    mkdirSync(join(cwd, "docs/data"), { recursive: true });
    mkdirSync(join(cwd, ".github"));
    symlinkSync(join(root, "spec"), join(cwd, "spec"), "dir");
    json("docs/data/adopters.json", { adopters: [{ name: "Fixture", feed: "https://feed.example/events.json" }] });
    // Run the actual checker offline, without credentials or writes to the checkout.
    writeFileSync(join(cwd, "fetch.mjs"), `
      import { readFileSync } from 'node:fs';
      globalThis.fetch = async () => {
        const { status, body } = JSON.parse(readFileSync('response.json'));
        return new Response(JSON.stringify(body), { status, headers: { 'Access-Control-Allow-Origin': '*' } });
      };
    `);
    const env = { ...process.env, FEED_ATTEMPTS: "1", FEED_SUPPORT_WINDOW: "3" };
    delete env.GITHUB_TOKEN;
    delete env.GITHUB_REPOSITORY;
    function run(body, status = 200) {
      json("response.json", { body, status });
      const result = spawnSync(process.execPath, [
        "--import", pathToFileURL(join(cwd, "fetch.mjs")).href,
        join(root, "scripts/check-feeds.mjs"),
      ], { cwd, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      return { ...JSON.parse(readFileSync(join(cwd, "docs/data/feed-health.json"))).feeds[0], output: result.stdout };
    }
    const measured = run(fixture);
    assert.equal(measured.status, "ok");
    assert.equal(measured.eventCount, fixture.events.length);
    assert.match(measured.eventCountCheckedAt, /^\d{4}-\d{2}-\d{2}$/);

    // A stale count must retain its original date, not the date of the failed check.
    const oldDate = "2000-01-01";
    const snapshot = JSON.parse(readFileSync(join(cwd, "docs/data/feed-health.json")));
    snapshot.feeds[0].eventCountCheckedAt = oldDate;
    json("docs/data/feed-health.json", snapshot);
    const invalid = run({ ...fixture, events: [{ name: "Invalid event" }] });
    assert.equal(invalid.status, "failing");
    assert.match(invalid.output, /FAIL.*schema errors/);
    assert.equal(invalid.eventCount, measured.eventCount);
    assert.equal(invalid.eventCountCheckedAt, oldDate);
    const unavailable = run(null, 503);
    assert.equal(unavailable.status, "failing");
    assert.equal(unavailable.eventCount, measured.eventCount);
    assert.equal(unavailable.eventCountCheckedAt, oldDate);

    const empty = run({ ...fixture, events: [] });
    assert.equal(empty.status, "ok");
    assert.equal(empty.eventCount, 0);
    assert.equal(empty.eventCountCheckedAt, measured.eventCountCheckedAt);

    // Unsupported responses are not validated; never infer inventory from their shape.
    rmSync(join(cwd, "docs/data/feed-health.json"));
    const unsupported = run({ specVersion: "0.1.0", events: [{}, {}] });
    assert.equal(unsupported.supported, false);
    assert.equal(unsupported.eventCount, null);
    assert.equal(unsupported.eventCountCheckedAt, null);
    const unknown = run({ events: [] });
    assert.equal(unknown.status, "failing");
    assert.equal(unknown.eventCount, null);
    assert.equal(unknown.eventCountCheckedAt, null);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
