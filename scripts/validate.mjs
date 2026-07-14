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
