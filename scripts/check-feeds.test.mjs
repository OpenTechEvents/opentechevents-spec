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
    const withCoverage = {
      ...fixture,
      covers: { from: "2026-01-01", to: "2026-12-31" },
      textLanguage: "fr",
      translations: { "en-GB": { title: "Community events" } },
      events: fixture.events.map((event, index) => index ? event : {
        ...event,
        textLanguage: "ca",
        translations: { es: { name: "Encuentro de Rust" } },
        image: [{ url: event.image[0], alt: "Cartell", translations: { de: { alt: "Plakat" } } }],
      }),
    };
    const measured = run(withCoverage);
    assert.equal(measured.status, "ok");
    assert.equal(measured.eventCount, fixture.events.length);
    assert.match(measured.eventCountCheckedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(measured.metadata.description, fixture.description);
    assert.equal(measured.metadata.updatedAt, fixture.updatedAt);
    assert.deepEqual(measured.metadata.covers, withCoverage.covers);
    assert.deepEqual(measured.metadata.eventLanguages, ["en", "es"]);
    assert.deepEqual(measured.metadata.textLanguages, ["ca", "de", "en-GB", "es", "fr"]);
    /* Coverage counts the event's own prose, never a nested entry's: the first event is
       written in `ca` and translated to `es`, so `de` — which exists only as an image alt —
       is in the list with no events behind it. The rest inherit the feed's `fr`. */
    assert.deepEqual(measured.metadata.textLanguageEvents, {
      ca: 1, es: 1, fr: fixture.events.length - 1,
    });

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
    assert.deepEqual(invalid.metadata, measured.metadata);
    const unavailable = run(null, 503);
    assert.equal(unavailable.status, "failing");
    assert.equal(unavailable.eventCount, measured.eventCount);
    assert.equal(unavailable.eventCountCheckedAt, oldDate);
    assert.deepEqual(unavailable.metadata, measured.metadata);

    const empty = run({ ...fixture, events: [] });
    assert.equal(empty.status, "ok");
    assert.equal(empty.eventCount, 0);
    assert.equal(empty.eventCountCheckedAt, measured.eventCountCheckedAt);
    assert.equal(empty.metadata.covers, undefined);

    const legacy = JSON.parse(readFileSync(join(root, "spec/v0.1/examples/feed.json")));
    const legacyResult = run(legacy);
    assert.equal(legacyResult.supported, false);
    assert.equal(legacyResult.eventCount, legacy.events.length);
    assert.equal(legacyResult.metadata.updatedAt, legacy.updatedAt);

    // An invalid older feed keeps its health status without claiming validated metadata.
    rmSync(join(cwd, "docs/data/feed-health.json"));
    const unsupported = run({ specVersion: "0.1.0", events: [{}, {}] });
    assert.equal(unsupported.supported, false);
    assert.equal(unsupported.eventCount, null);
    assert.equal(unsupported.eventCountCheckedAt, null);
    assert.equal(unsupported.metadata, null);
    const unknown = run({ events: [] });
    assert.equal(unknown.status, "failing");
    assert.equal(unknown.eventCount, null);
    assert.equal(unknown.eventCountCheckedAt, null);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
