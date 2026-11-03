#!/usr/bin/env node
/**
 * Validates every example under spec/<version>/examples/ against the schemas.
 *
 * Naming convention drives what each example is checked against:
 *   event-*.json → event.schema.json   (standalone event: specVersion + license required)
 *   feed*.json   → feed.schema.json
 *
 * Files under spec/<version>/examples/invalid/ MUST fail: they are the guardrails.
 * A schema that only ever accepts is not a schema.
 *
 * Two levels, and they must not be confused. The schemas decide VALIDITY and a failure here is
 * an error. The `*.recommended.schema.json` profiles decide whether the document is any good at
 * the job — findable, filterable, subscribable — and a failure there is a WARNING that never
 * changes the exit code. Turning a recommendation into an error would push whoever imports a
 * bare .ics into inventing data, which is the one thing this spec refuses to cause.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, basename } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { ajvOptions, annotationKeywords, customFormats, customKeywords, specVersion } from "../index.js";
import { fieldsOf, loadSchemas } from "./schema-model.mjs";

const VERSIONS = ["v0.1", "v0.2", "v0.3", "v0.4", "v0.5"];
const SPEC_DIR = "spec";
const LATEST = VERSIONS[VERSIONS.length - 1];

let failures = 0;
let warnings = 0;
const log = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${msg}`);
};
const warn = (msg) => {
  warnings++;
  console.log(`  warn  ${msg}`);
};

function build(version) {
  // `ajvOptions` comes from index.js, the package's own export, rather than being spelled out
  // here: a consumer who follows the published guidance must end up with the SAME compiler this
  // build exercises. Spelling it twice is how the two drifted before — the package documented a
  // bare `strict: true`, under which no version ever compiled, while CI quietly passed on the
  // working set. The options themselves are explained where they are declared.
  const ajv = new Ajv2020({ ...ajvOptions, allErrors: true });
  addFormats(ajv);
  // The schemas carry annotations strict mode would otherwise refuse to compile. They constrain
  // nothing: registering them changes which SCHEMAS load, never which documents pass.
  for (const kw of annotationKeywords) ajv.addKeyword(kw);
  // `ote-local-date-time` covers the one temporal shape ajv-formats doesn't: wall-clock,
  // deliberately without an offset. Strict mode refuses to compile a schema referencing an
  // unregistered format, same as with annotationKeywords above.
  for (const f of customFormats) ajv.addFormat(f.name, f.validate);
  // Unlike annotationKeywords, these restrict which documents pass (e.g. orderedDates).
  for (const kw of customKeywords) ajv.addKeyword(kw);

  const dir = join(SPEC_DIR, version);
  const eventSchema = JSON.parse(readFileSync(join(dir, "event.schema.json"), "utf8"));
  const feedSchema = JSON.parse(readFileSync(join(dir, "feed.schema.json"), "utf8"));
  ajv.addSchema(eventSchema);
  ajv.addSchema(feedSchema); // the profiles reference it by $id, so it must be registered first

  // Recommended profiles arrive in v0.3; v0.1 and v0.2 are frozen without them.
  const profile = (name) => {
    const path = join(dir, `${name}.recommended.schema.json`);
    return existsSync(path) ? ajv.compile(JSON.parse(readFileSync(path, "utf8"))) : null;
  };

  return {
    ajv,
    validateEvent: ajv.compile(eventSchema),
    validateFeed: ajv.compile(feedSchema),
    recommendEvent: profile("event"),
    recommendFeed: profile("feed"),
  };
}

/**
 * A handful of recommended-profile keywords validate the WHOLE object (they compare one field
 * against others — `languagesCoveredByText` checks `languages` against `textLanguage` plus
 * `translations`, P019), the same reason `distinctTranslationLanguages`/`eventsNotNewerThanFeed`
 * live at their object's own root in the base schema. Ajv reports their failure at that object's
 * instancePath (`""`, root), not at the one field a human would say they're "about" — so unlike
 * every other keyword here, they need an explicit label instead of one derived from instancePath.
 */
const OBJECT_KEYWORD_FIELD = { languagesCoveredByText: "languages" };

/**
 * Which recommended fields a document falls short on, as dotted paths (`location.address`).
 * Two shapes of shortfall: a field missing entirely (`required`), or a field present but not
 * good enough (any keyword — `anyOf`, `not`, `minLength`, `pattern`, … — failing at that
 * field's own instance path: license being a real but not directory-friendly SPDX identifier,
 * D008; textLanguage set without organizers, D016; description present but empty or
 * whitespace-only, P017). Both are reported the same bare way, field path only: this profile's
 * job is to flag where to look, not to explain why — that lives in the field reference.
 *
 * Every `required` error counts, wherever it sits: this only ever runs on a document that
 * already validated against the base schema, so the base half of the profile ($ref) cannot
 * contribute errors — whatever is left was asked for by the profile itself. Everything else
 * needs a non-root instancePath, with one exception (`OBJECT_KEYWORD_FIELD`, above): a bare
 * property-level check always reports a non-root instancePath, while a structural `if`/`allOf`
 * wrapper failure reports at the root (`""`, falsy) alongside the nested error that actually
 * names the field — keeping only the nested one avoids saying the same thing twice.
 */
function missingRecommended(validate, doc) {
  if (!validate || validate(doc)) return [];
  return [
    ...new Set(
      (validate.errors ?? [])
        .filter(
          (e) => e.keyword === "required" || Boolean(e.instancePath) || e.keyword in OBJECT_KEYWORD_FIELD
        )
        .map((e) =>
          e.keyword === "required"
            ? [...e.instancePath.split("/").filter(Boolean), e.params.missingProperty].join(".")
            : e.keyword in OBJECT_KEYWORD_FIELD
              ? OBJECT_KEYWORD_FIELD[e.keyword]
              : e.instancePath.split("/").filter(Boolean).join(".")
        )
    ),
  ];
}

/**
 * An event inside a feed inherits the feed's organizers (and license, specVersion, and
 * textLanguage), so the profile has to see the event as a consumer will — otherwise every event
 * in a well-formed community feed gets warned for a field the feed already answered.
 */
const asPublished = (feed, event) => ({
  ...(feed.organizers ? { organizers: feed.organizers } : {}),
  ...(feed.license ? { license: feed.license } : {}),
  ...(feed.specVersion ? { specVersion: feed.specVersion } : {}),
  ...(feed.textLanguage ? { textLanguage: feed.textLanguage } : {}),
  ...event,
});

/** Reports the recommended fields a document is missing. Never fails the build. */
function checkRecommended({ recommendEvent, recommendFeed }, path, doc) {
  const isFeed = Array.isArray(doc.events);
  if (isFeed) {
    const missing = missingRecommended(recommendFeed, doc);
    if (missing.length) warn(`${path} — feed missing recommended: ${missing.join(", ")}`);
    doc.events.forEach((event, i) => {
      const gaps = missingRecommended(recommendEvent, asPublished(doc, event));
      if (gaps.length) warn(`${path} — events[${i}] (${event.id ?? "?"}) missing recommended: ${gaps.join(", ")}`);
    });
    return;
  }
  const missing = missingRecommended(recommendEvent, doc);
  if (missing.length) warn(`${path} — missing recommended: ${missing.join(", ")}`);
}

/**
 * The order in which `properties` are declared in the schema is the canonical field order: it is
 * what the generated reference table lists, and what an editor autocompletes. The examples are
 * what people actually copy, so if they order their keys differently they teach a shape the spec
 * does not document. Unknown keys — extensions, `_comment_*` — are ignored: they are not the
 * spec's to order.
 */
function outOfOrder(canonical, doc) {
  const keys = Object.keys(doc).filter((k) => canonical.includes(k));
  const expected = [...keys].sort((a, b) => canonical.indexOf(a) - canonical.indexOf(b));
  return keys.join(" ") === expected.join(" ") ? null : expected.join(", ");
}

/** Reports every document in an example whose keys stray from the canonical order. */
function checkFieldOrder(path, doc, order) {
  const isFeed = Array.isArray(doc.events);
  const wrong = outOfOrder(isFeed ? order.feed : order.event, doc);
  if (wrong) log(false, `${path} — field order; expected: ${wrong}`);
  if (!isFeed) return;
  doc.events.forEach((event, i) => {
    const gaps = outOfOrder(order.event, event);
    if (gaps) log(false, `${path} — events[${i}] field order; expected: ${gaps}`);
  });
}

// `npm run validate -- my-feed.json` → validate your own documents before opening an issue.
// A document with an `events` array is a feed; anything else is a single event.
const args = process.argv.slice(2);
if (args.length) {
  const built = build(LATEST);
  const { ajv, validateEvent, validateFeed } = built;
  for (const path of args) {
    const doc = JSON.parse(readFileSync(path, "utf8"));
    const isFeed = Array.isArray(doc.events);
    const validate = isFeed ? validateFeed : validateEvent;
    const valid = validate(doc);
    log(
      valid,
      `${path} (${isFeed ? "feed" : "event"}, ${LATEST})` +
        (valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" }))
    );
    if (valid) checkRecommended(built, path, doc);
  }
  console.log(failures ? `\n${failures} failure(s)` : "\nValid.");
  if (warnings) console.log(`${warnings} recommendation(s) — valid either way. See the field reference.`);
  process.exit(failures ? 1 : 0);
}

// What the package PROMISES a consumer, checked against what it ships. The examples below
// already exercise the compiler, but they fail with whatever ajv threw and only ever on the
// path the examples happen to take; these two checks name the broken promise instead.
console.log("\npackage contract");
for (const version of VERSIONS) {
  // All four schemas of every version, compiled under the exported `ajvOptions` — the set
  // index.js tells consumers to use. A schema that only compiles under some other set is
  // unusable to whoever followed the docs, however valid it is on its own.
  try {
    build(version);
    log(true, `${version} schemas compile under the exported ajvOptions`);
  } catch (err) {
    log(false, `${version} schemas do not compile under the exported ajvOptions — ${err.message}`);
  }
}
// The pages that describe the CURRENT spec, and the scripts that render them. Their data is
// generated, their prose and their version-pinned links are hand-written, and the two drift
// silently: /spec/ announced v0.4 while rendering v0.5's 99 fields, /examples/ put "v0.4" in its
// eyebrow above a link to v0.3's README, /developers/ linked v0.4's schema. A reader has no way
// to tell which half is lying, so no file here may name a version other than the latest.
//
// Deliberately NOT in this list: the per-version pages under docs/spec/v0.*/ (generated, and
// naming an old version is their whole job), /prior-art/, and anything under docs/schema|llms|data.
const CURRENT_SPEC_PAGES = [
  join("docs", "index.html"),
  join("docs", "spec", "index.html"),
  join("docs", "spec", "reference.js"),
  join("docs", "examples", "index.html"),
  join("docs", "examples", "examples.js"),
  join("docs", "developers", "index.html"),
  join("docs", "extensions", "index.html"),
  join("docs", "extensions", "extensions.js"),
];
// Comments are stripped before scanning: a version named in a comment is a note about history
// ("this page used to announce v0.4"), not something a reader ever sees. Only what reaches the
// page counts. Crude but sufficient — these are our own files, with no regex literals or
// strings carrying "//" next to a version number.
const withoutComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

for (const page of CURRENT_SPEC_PAGES) {
  const stale = [...new Set(withoutComments(readFileSync(page, "utf8")).match(/v0\.\d+/g) ?? [])].filter(
    (v) => v !== LATEST
  );
  log(stale.length === 0, `${page} speaks only of ${LATEST}${stale.length ? ` — also mentions ${stale.join(", ")}` : ""}`);
}
// index.d.ts types `specVersion` as a literal, so a stale one is a lie TypeScript enforces on
// the consumer. It sat at "0.4.0" through the 0.5.0 release; nothing was checking.
{
  const declared = /export declare const specVersion: "([^"]+)"/.exec(readFileSync("index.d.ts", "utf8"))?.[1];
  const packaged = JSON.parse(readFileSync("package.json", "utf8")).version;
  const agree = declared === specVersion && specVersion === packaged;
  log(
    agree,
    `specVersion agrees across index.js (${specVersion}), index.d.ts (${declared}) and package.json (${packaged})`
  );
}

for (const version of VERSIONS) {
  const dir = join(SPEC_DIR, version);
  console.log(`\n${dir}`);

  const built = build(version);
  const { ajv, validateEvent, validateFeed } = built;
  const pick = (file) => (basename(file).startsWith("feed") ? validateFeed : validateEvent);

  const { event: eventSchema, feed: feedSchema, registry } = loadSchemas(version);
  const order = {
    event: Object.keys(eventSchema.$defs.event.properties),
    feed: Object.keys(feedSchema.properties),
  };

  const examples = join(dir, "examples");
  for (const file of readdirSync(examples).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(examples, file);
    const validate = pick(file);
    const doc = JSON.parse(readFileSync(path, "utf8"));
    const valid = validate(doc);
    log(valid, `${path}${valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" })}`);
    // event-minimal.json is SUPPOSED to warn: it illustrates the floor of validity, and the
    // warnings are exactly the distance between "valid" and "useful". Do not silence them by
    // fattening that example — the gap is the lesson.
    if (valid) checkRecommended(built, path, doc);
    // Frozen versions keep the order they shipped with: reordering them would rewrite history
    // for a document someone already published against.
    if (valid && version === LATEST) checkFieldOrder(path, doc, order);
  }

  // Every `examples` entry must satisfy the very field it illustrates. Without this, the
  // documentation drifts from the schema silently: someone tightens a format, forgets the
  // example, and the docs go on showing a value the validator would now reject.
  for (const [schemaName, schema] of [
    ["event", eventSchema],
    ["feed", feedSchema],
  ]) {
    for (const [path, , meta] of fieldsOf(schema, registry)) {
      for (const [i, example] of meta.examples.entries()) {
        // By reference, not by copy: an isolated subschema cannot resolve #/$defs/… refs.
        // `meta.pointer` is already fully qualified with the $id of whichever schema actually
        // defines the field — not always this loop's own `schema` (a map recursed into via
        // `additionalProperties`, like `feed.translations.*`, can live in a different schema).
        const check = ajv.compile({ $ref: meta.pointer });
        const valid = check(example);
        log(
          valid,
          `${schemaName}.${path} examples[${i}] = ${JSON.stringify(example)}` +
            (valid ? "" : `\n${ajv.errorsText(check.errors)}`)
        );
      }
    }
  }

  // Negative cases: these must be rejected, and it must be for the stated reason.
  const invalid = join(examples, "invalid");
  if (!existsSync(invalid)) continue;
  for (const file of readdirSync(invalid).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(invalid, file);
    const validate = pick(file);
    const valid = validate(JSON.parse(readFileSync(path, "utf8")));
    log(!valid, `${path} — must be rejected${valid ? " BUT WAS ACCEPTED" : ""}`);
  }
}

// The code samples on the landing page are a promise: "this is what an OTE event looks like".
// They were the first thing to go stale when v0.1 landed (they still showed the old draft's
// shape), so they are validated too. Mark a sample with `<pre data-ote="event|feed">`.
console.log("\ndocs/index.html code samples");
{
  const { ajv, validateEvent, validateFeed } = build(LATEST);
  const { event: eventSchema, feed: feedSchema } = loadSchemas(LATEST);
  const order = {
    event: Object.keys(eventSchema.$defs.event.properties),
    feed: Object.keys(feedSchema.properties),
  };
  const html = readFileSync(join("docs", "index.html"), "utf8");
  const samples = [...html.matchAll(/<pre data-ote="(event|feed)"><code>([\s\S]*?)<\/code><\/pre>/g)];

  if (!samples.length) log(false, "no samples found — did the markup change?");
  for (const [, kind, raw] of samples) {
    // Strip the syntax-highlighting tags and decode the entities the browser would.
    const json = raw
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    let doc;
    try {
      doc = JSON.parse(json);
    } catch (err) {
      log(false, `${kind} sample is not valid JSON — ${err.message}`);
      continue;
    }
    const validate = kind === "feed" ? validateFeed : validateEvent;
    const valid = validate(doc);
    log(valid, `${kind} sample${valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" })}`);
    if (valid) checkFieldOrder(`${kind} sample`, doc, order);
  }
}

// The suggested-extensions registry, which /extensions/ renders. Whether the adoption counts
// are STALE can only be answered by fetching the real feeds, so that check lives in the daily
// job (scripts/scan-extensions.mjs, wired into check-feeds.yml) — putting it here would make
// every pull request depend on four third-party servers staying up, which is the failure mode
// ote-tools#70 already documents. What a PR can check offline is the shape: a hand-edited entry
// that the page cannot render, or a Spanish translation that quietly lost a field.
console.log("\nsuggested extensions (docs/data/)");
{
  const registry = JSON.parse(readFileSync(join("docs", "data", "suggested-extensions.json"), "utf8"));
  const PROSE = ["purpose", "shape", "graduationQuestion"];
  for (const ext of registry.extensions) {
    const missing = [
      ...["name", "scope", "status", ...PROSE].filter((key) => !ext[key]),
      ...(ext.observedAdoption && typeof ext.observedAdoption.feeds === "number" ? [] : ["observedAdoption.feeds"]),
    ];
    log(missing.length === 0, `${ext.name ?? "(unnamed)"} is complete${missing.length ? ` — missing ${missing.join(", ")}` : ""}`);
    // A partial translation is worse than none: the card would render half in each language.
    for (const [lang, translated] of Object.entries(ext.translations ?? {})) {
      const gaps = PROSE.filter((key) => !translated[key]);
      log(gaps.length === 0, `${ext.name} translation (${lang}) is complete${gaps.length ? ` — missing ${gaps.join(", ")}` : ""}`);
    }
  }
}

// The schemas' $id points at https://opentechevents.org/schema/<version>/… , so that URL must
// resolve. GitHub Pages only serves docs/, hence the published copies — and hence this check,
// which is the only thing keeping them from drifting apart.
console.log("\npublished copies (docs/schema/)");
for (const version of VERSIONS) {
  // Every schema in the version's directory, profiles included: whatever has an $id under
  // opentechevents.org/schema/ has to be reachable there.
  for (const schema of readdirSync(join(SPEC_DIR, version)).filter((f) => f.endsWith(".schema.json")).sort()) {
    const src = join(SPEC_DIR, version, schema);
    const published = join("docs", "schema", version, schema);
    const same =
      existsSync(published) && readFileSync(published, "utf8") === readFileSync(src, "utf8");
    log(same, `${published} is in sync with ${src}${same ? "" : " — run: npm run publish-schemas"}`);
  }
}

// Chaining these in package.json would break `npm run validate -- my-feed.json`: npm appends the
// arguments to the END of the script string, so they would land on the wrong command.
const generated = ["scripts/build-reference.mjs", "scripts/build-examples.mjs", "scripts/build-llms.mjs"]
  .map((script) => spawnSync(process.execPath, [script, "--check"], { stdio: "inherit" }))
  .filter((run) => run.status).length;

console.log(failures || generated ? `\n${failures + generated} failure(s)` : "\nAll examples validate.");
if (warnings) console.log(`${warnings} recommendation(s) — warnings only, they never fail the build.`);
process.exit(failures || generated ? 1 : 0);
