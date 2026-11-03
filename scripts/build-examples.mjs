#!/usr/bin/env node
/**
 * Builds the practical-examples gallery FROM the example documents themselves.
 *
 *   npm run build-examples            → writes docs/data/examples.json
 *   npm run build-examples -- --check → fails if it is stale, or a file/translation is missing (CI)
 *
 * The point: the website must never show an example that the validator has not seen. The JSON
 * you read on the site is byte-for-byte the file under spec/<version>/examples/ — which is
 * validated by `npm run validate` — so the gallery cannot drift into showing invalid documents.
 *
 * What lives where:
 *   spec/<version>/examples/*.json         the documents. The only source of the code shown.
 *   spec/<version>/examples/catalog/en.json  which ones to show, in what order, under which
 *                                            filters, and the English prose explaining each.
 *   spec/<version>/examples/catalog/<lang>.json  the same prose, translated.
 *
 * The `_comment_*` keys inside the documents are stripped here: they are Spanish-only notes for
 * whoever reads the repo. On the site that job belongs to the catalog's `points`, which are
 * translated, and which the reader sees next to the code instead of buried in it.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { latestVersion } from "./schema-model.mjs";

const VERSION = latestVersion();
const BASE_LANG = "en";
const REPO = "https://github.com/OpenTechEvents/opentechevents-spec/blob/main";
const check = process.argv.includes("--check");

const examplesDir = join("spec", VERSION, "examples");
const catalogDir = join(examplesDir, "catalog");

const catalog = JSON.parse(readFileSync(join(catalogDir, `${BASE_LANG}.json`), "utf8"));
const locales = { [BASE_LANG]: null };
for (const file of readdirSync(catalogDir).filter((f) => f.endsWith(".json") && f !== `${BASE_LANG}.json`)) {
  locales[file.replace(".json", "")] = JSON.parse(readFileSync(join(catalogDir, file), "utf8"));
}

const problems = [];

/** Notes for repo readers, not for the site: the catalog says the same thing, in every language. */
function stripComments(value) {
  if (Array.isArray(value)) return value.map(stripComments);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("_comment"))
        .map(([key, val]) => [key, stripComments(val)])
    );
  }
  return value;
}

/**
 * Pretty-prints a document exactly as `JSON.stringify(value, null, 2)` would, while recording
 * which line each field starts on. That index is what lets the field reference show "here is
 * this field, in a real document" without the reader leaving the page — and it is derived from
 * the documents themselves, so it can never claim a field appears where it doesn't.
 */
function layout(value, path, prefix, suffix, depth, out, index) {
  var pad = "  ".repeat(depth);
  var start = out.length + 1; // 1-based: line numbers, not array offsets
  if (Array.isArray(value)) {
    if (!value.length) out.push(pad + prefix + "[]" + suffix);
    else {
      out.push(pad + prefix + "[");
      // Every item of an array shares one path: `organizers[].name` is a field, `organizers[2]`
      // is not — that is how the reference names them, and both sides have to agree.
      value.forEach((item, i) =>
        layout(item, path + "[]", "", i === value.length - 1 ? "" : ",", depth + 1, out, index)
      );
      out.push(pad + "]" + suffix);
    }
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length) out.push(pad + prefix + "{}" + suffix);
    else {
      out.push(pad + prefix + "{");
      keys.forEach((key, i) =>
        layout(
          value[key],
          path ? `${path}.${key}` : key,
          JSON.stringify(key) + ": ",
          i === keys.length - 1 ? "" : ",",
          depth + 1,
          out,
          index
        )
      );
      out.push(pad + "}" + suffix);
    }
  } else {
    out.push(pad + prefix + JSON.stringify(value) + suffix);
  }
  if (path && !path.endsWith("[]")) (index[path] = index[path] || []).push(start);
}

/** Re-keys the raw paths of a document onto the reference's names (`event.x` / `feed.x`). */
function scopePaths(index, kind) {
  const scoped = {};
  for (const [path, lines] of Object.entries(index)) {
    var name;
    if (kind === "event") name = `event.${path}`;
    // A feed's events are events: their fields are documented under `event`, not under `feed`.
    else if (path.startsWith("events[].")) name = `event.${path.slice("events[].".length)}`;
    // Same for the organisers of a feed: `feed.organizers` $refs the event schema, so the
    // reference documents an organiser's own fields once, under `event`.
    else if (path.startsWith("organizers[].")) name = `event.${path}`;
    else name = `feed.${path}`;
    scoped[name] = (scoped[name] || []).concat(lines).sort((a, b) => a - b);
  }
  return scoped;
}

// Every example on disk must be catalogued, and every catalogued file must exist. Without both
// halves, adding an example silently leaves it off the site — or leaves a dead card on it.
const onDisk = readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort();
const catalogued = new Set(catalog.examples.map((e) => e.file));
for (const file of onDisk) {
  if (!catalogued.has(file)) problems.push(`${file} exists but is not in catalog/${BASE_LANG}.json`);
}

const model = {
  specVersion: catalog.specVersion,
  languages: Object.keys(locales),
  cases: catalog.cases.map((c) => ({ id: c.id, label: { [BASE_LANG]: c.label } })),
  examples: catalog.examples.map((entry) => {
    const path = join(examplesDir, entry.file);
    if (!existsSync(path)) {
      problems.push(`catalog names ${entry.file}, which does not exist`);
      return null;
    }
    for (const id of entry.cases) {
      if (!catalog.cases.some((c) => c.id === id)) problems.push(`${entry.file}: unknown case "${id}"`);
    }
    // Same convention the validator uses to pick a schema: feed*.json is a feed.
    const kind = entry.file.startsWith("feed") ? "feed" : "event";
    const document = stripComments(JSON.parse(readFileSync(path, "utf8")));
    const lines = [];
    const index = {};
    layout(document, "", "", "", 0, lines, index);
    // The line index is only trustworthy if the text it indexes is the text we ship. Nothing
    // subtle should be able to creep between the two representations unnoticed.
    if (lines.join("\n") !== JSON.stringify(document, null, 2)) {
      problems.push(`${entry.file}: the line index does not match the rendered document`);
    }

    return {
      file: entry.file,
      kind,
      repoUrl: `${REPO}/${examplesDir}/${entry.file}`,
      cases: entry.cases,
      fields: entry.fields ?? [],
      title: { [BASE_LANG]: entry.title },
      summary: { [BASE_LANG]: entry.summary },
      points: { [BASE_LANG]: entry.points },
      source: lines.join("\n"),
      // Where each field sits in `source`, so the reference can point at the exact lines.
      lines: scopePaths(index, kind),
    };
  }).filter(Boolean),
};

// The same relation read the other way round: for a given field, which examples use it. It is
// what lets the field reference show a field in context without sending the reader elsewhere.
// Derived, never hand-written — a field cannot end up pointing at an example that dropped it.
model.usage = {};
for (const example of model.examples) {
  for (const [path, lines] of Object.entries(example.lines)) {
    (model.usage[path] = model.usage[path] || []).push({ file: example.file, lines });
  }
}

// Merge translations, and refuse to ship a half-translated gallery — same rule as the reference.
for (const [lang, dict] of Object.entries(locales)) {
  if (!dict) continue;
  for (const c of model.cases) {
    c.label[lang] = dict.cases?.[c.id];
    if (!c.label[lang]) problems.push(`${lang}: cases["${c.id}"]`);
  }
  for (const example of model.examples) {
    const t = dict.examples?.[example.file];
    for (const key of ["title", "summary"]) {
      if (!t?.[key]) problems.push(`${lang}: examples["${example.file}"].${key}`);
      example[key][lang] = t?.[key] ?? example[key][BASE_LANG];
    }
    if (!Array.isArray(t?.points) || t.points.length !== example.points[BASE_LANG].length) {
      problems.push(`${lang}: examples["${example.file}"].points must have ${example.points[BASE_LANG].length} entries`);
    }
    example.points[lang] = t?.points ?? example.points[BASE_LANG];
  }
}

const out = [join("docs", "data", "examples.json"), JSON.stringify(model, null, 2) + "\n"];

if (check) {
  const [path, content] = out;
  const stale = !existsSync(path) || readFileSync(path, "utf8") !== content;
  if (stale) console.log(`  FAIL  ${path} is stale — run: npm run build-examples`);
  for (const problem of problems) console.log(`  FAIL  ${problem}`);
  if (stale || problems.length) process.exit(1);
  console.log(`  ok    examples gallery is built from the validated documents (${model.languages.join(", ")})`);
} else {
  writeFileSync(...out);
  console.log(`  wrote ${out[0]} — ${model.examples.length} examples, ${model.cases.length} filters`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exit(1);
  }
}
