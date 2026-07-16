#!/usr/bin/env node
/**
 * Turns an adopter-registration issue into an adopters.json entry.
 *
 * Reads the issue-form body from $ISSUE_BODY, fetches the feed, validates it with
 * the real schemas (the browser form only did a best-effort check — this is the
 * authoritative pass), and on success updates docs/data/adopters.json in place.
 * The workflow around it turns that change into a PR.
 *
 * Outputs (to $GITHUB_OUTPUT when set, stdout otherwise):
 *   valid=true|false   whether the feed validated
 *   name=<community>   for commit message / PR title
 * A human-readable report is written to $REPORT_PATH (default: adopter-report.md)
 * — that file becomes the comment on the issue, valid or not.
 *
 * An invalid feed is a normal outcome, not a job failure: the script only exits
 * non-zero when it cannot do its work (missing fields, unreadable adopters.json).
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SPEC = "spec/v0.2";
const ADOPTERS = join("docs", "data", "adopters.json");
const REPORT = process.env.REPORT_PATH || "adopter-report.md";

/* ---------- issue-form parsing ----------
   Issue forms render as "### <label>\n\n<value>" blocks; empty optional fields
   come through as "_No response_". Labels must match .github/ISSUE_TEMPLATE/adopter.yml. */

const LABELS = {
  "Community name": "name",
  "Website": "url",
  "OTE feed URL": "feed",
  "Community directory ID": "directory",
};

function parseIssue(body) {
  const fields = {};
  for (const match of body.matchAll(/^### (.+?)\r?\n+([\s\S]*?)(?=^### |$(?![\r\n]))/gm)) {
    const key = LABELS[match[1].trim()];
    if (!key) continue; // checkboxes and future sections just pass through
    const value = match[2].trim();
    fields[key] = value === "_No response_" ? "" : value;
  }
  return fields;
}

/* ---------- outputs ---------- */

function setOutput(key, value) {
  const line = `${key}=${value}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line);
  else process.stdout.write(line);
}

function report(valid, lines) {
  writeFileSync(REPORT, lines.join("\n") + "\n");
  setOutput("valid", String(valid));
  console.log(readFileSync(REPORT, "utf8"));
}

/* ---------- main ---------- */

const body = process.env.ISSUE_BODY;
if (!body) {
  console.error("ISSUE_BODY is not set");
  process.exit(1);
}

const fields = parseIssue(body);
setOutput("name", fields.name || "");

if (!fields.name || !fields.feed) {
  report(false, [
    "### ❌ Registration incomplete",
    "",
    "Couldn't find the community name and/or the feed URL in the issue. Please edit the issue keeping the form's section headings intact.",
  ]);
  process.exit(0);
}

let doc;
try {
  const res = await fetch(fields.feed, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`the URL answered HTTP ${res.status}`);
  doc = await res.json();
} catch (err) {
  report(false, [
    "### ❌ Feed unreachable or not JSON",
    "",
    `Fetching \`${fields.feed}\` failed: ${err.message}`,
    "",
    "Fix the URL (edit the issue) and the check will run again.",
  ]);
  process.exit(0);
}

// Same Ajv setup as scripts/validate.mjs — see the comment there about strictRequired.
const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync(join(SPEC, "event.schema.json"), "utf8")));
const validateFeed = ajv.compile(JSON.parse(readFileSync(join(SPEC, "feed.schema.json"), "utf8")));

if (!validateFeed(doc)) {
  report(false, [
    "### ❌ The feed does not validate against OTE Spec v0.2",
    "",
    "```",
    ajv.errorsText(validateFeed.errors, { separator: "\n" }),
    "```",
    "",
    "Fix the feed and edit the issue (any edit re-runs the check). The [field reference](https://opentechevents.org/spec/) documents every field.",
  ]);
  process.exit(0);
}

// Valid → upsert into adopters.json, keyed by feed URL: re-registering an
// existing feed updates its entry instead of duplicating it.
const registry = JSON.parse(readFileSync(ADOPTERS, "utf8"));
const entry = { name: fields.name };
if (fields.url) entry.url = fields.url;
entry.feed = fields.feed;
if (fields.directory) entry.directory = fields.directory;

const existing = registry.adopters.findIndex((a) => a.feed === fields.feed);
if (existing === -1) registry.adopters.push(entry);
else registry.adopters[existing] = { ...registry.adopters[existing], ...entry };
writeFileSync(ADOPTERS, JSON.stringify(registry, null, 2) + "\n");

report(true, [
  "### ✅ Feed validates against OTE Spec v0.2",
  "",
  `**${fields.name}** — \`${fields.feed}\` (${doc.events.length} event${doc.events.length === 1 ? "" : "s"})`,
  fields.directory ? `Linked to directory entry \`${fields.directory}\`.` : "No directory link.",
  "",
  "A pull request adding the community to the adopters registry follows; a maintainer will review and merge it.",
]);
