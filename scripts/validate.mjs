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
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { fieldsOf, loadSchemas } from "./schema-model.mjs";

const VERSIONS = ["v0.1"];
const SPEC_DIR = "spec";
const LATEST = VERSIONS[VERSIONS.length - 1];

let failures = 0;
const log = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${msg}`);
};

function build(version) {
  // strictRequired off: `anyOf: [{required: [venue]}, …]` is valid JSON Schema, and it is how
  // "at least one of venue / onlineUrl" is expressed. Ajv's strict mode dislikes required
  // living apart from its properties; the spec does not.
  const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
  addFormats(ajv);

  const dir = join(SPEC_DIR, version);
  const eventSchema = JSON.parse(readFileSync(join(dir, "event.schema.json"), "utf8"));
  const feedSchema = JSON.parse(readFileSync(join(dir, "feed.schema.json"), "utf8"));
  ajv.addSchema(eventSchema);

  return { ajv, validateEvent: ajv.compile(eventSchema), validateFeed: ajv.compile(feedSchema) };
}

// `npm run validate -- my-feed.json` → validate your own documents before opening an issue.
// A document with an `events` array is a feed; anything else is a single event.
const args = process.argv.slice(2);
if (args.length) {
  const { ajv, validateEvent, validateFeed } = build(LATEST);
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
  }
  console.log(failures ? `\n${failures} failure(s)` : "\nValid.");
  process.exit(failures ? 1 : 0);
}

for (const version of VERSIONS) {
  const dir = join(SPEC_DIR, version);
  console.log(`\n${dir}`);

  const { ajv, validateEvent, validateFeed } = build(version);
  const pick = (file) => (basename(file).startsWith("feed") ? validateFeed : validateEvent);

  const examples = join(dir, "examples");
  for (const file of readdirSync(examples).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(examples, file);
    const validate = pick(file);
    const valid = validate(JSON.parse(readFileSync(path, "utf8")));
    log(valid, `${path}${valid ? "" : "\n" + ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }

  // Every `examples` entry must satisfy the very field it illustrates. Without this, the
  // documentation drifts from the schema silently: someone tightens a format, forgets the
  // example, and the docs go on showing a value the validator would now reject.
  const { event: eventSchema, feed: feedSchema, registry } = loadSchemas(version);
  for (const [schemaName, schema] of [
    ["event", eventSchema],
    ["feed", feedSchema],
  ]) {
    for (const [path, , meta] of fieldsOf(schema, registry)) {
      for (const [i, example] of meta.examples.entries()) {
        // By reference, not by copy: an isolated subschema cannot resolve #/$defs/… refs.
        const check = ajv.compile({ $ref: `${schema.$id}#${meta.pointer}` });
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
  }
}

// The schemas' $id points at https://opentechevents.org/schema/<version>/… , so that URL must
// resolve. GitHub Pages only serves docs/, hence the published copies — and hence this check,
// which is the only thing keeping them from drifting apart.
console.log("\npublished copies (docs/schema/)");
for (const version of VERSIONS) {
  for (const schema of ["event.schema.json", "feed.schema.json"]) {
    const src = join(SPEC_DIR, version, schema);
    const published = join("docs", "schema", version, schema);
    const same =
      existsSync(published) && readFileSync(published, "utf8") === readFileSync(src, "utf8");
    log(same, `${published} is in sync with ${src}${same ? "" : " — run: npm run publish-schemas"}`);
  }
}

console.log(failures ? `\n${failures} failure(s)` : "\nAll examples validate.");
process.exit(failures ? 1 : 0);
