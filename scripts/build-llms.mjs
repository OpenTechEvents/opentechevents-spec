#!/usr/bin/env node
/**
 * Publishes the repo as something a language model can read.
 *
 *   npm run build-llms            → writes the generated files
 *   npm run build-llms -- --check → fails if they are stale (CI, via `npm run validate`)
 *
 * Two shapes, because assistants differ in how much they can swallow in one fetch:
 *
 *   docs/llms.txt       → the index, ~4 KB. Every source with a one-line description and a URL,
 *                         in the llms.txt convention (https://llmstxt.org). An agent that can
 *                         only afford a few fetches reads this and picks.
 *   docs/llms-full.txt  → everything concatenated, for an agent with the context to hold it.
 *   docs/llms/<name>.md → the individual pieces, so the URLs in the index actually resolve.
 *
 * Nothing here is hand-maintained: the sources are the repo's own files, copied verbatim. A
 * paraphrase of the spec is a second spec, and the second one is always the one that goes stale.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { latestVersion, publishedVersions } from "./schema-model.mjs";

const SITE = "https://opentechevents.org";
const VERSION = latestVersion();
const OUT_DIR = join("docs", "llms");
const check = process.argv.includes("--check");

/**
 * A section of the index. `file` is copied as-is; `files` fans a directory out into one entry
 * each. `lead` is what the model reads BEFORE deciding to fetch, so it says what the file
 * answers, not what it is called.
 */
const SECTIONS = [
  {
    title: "Start here",
    entries: [
      { file: "README.md", as: "overview.md", lead: "What OTE is, who it is for, and how a community adopts it." },
      {
        file: join("spec", VERSION, "README.md"),
        as: `spec-${VERSION}.md`,
        lead: `The specification itself for ${VERSION}: every field, and the rules a validator cannot check — why an id must never change, why a cancelled event stays published.`,
      },
      {
        file: join("spec", VERSION, "reference.en.md"),
        as: `reference-${VERSION}.md`,
        lead: "Field reference table generated from the schemas: type, required or recommended, allowed values, examples.",
      },
    ],
  },
  {
    title: "Versions",
    entries: [
      { file: join("spec", "README.md"), as: "spec-versions.md", lead: "Which spec versions exist and what stability each one carries." },
    ],
    // Linked, not copied. Everything above this section describes the CURRENT version only, so an
    // agent reading the index had no way to learn that the older ones are published at all — and
    // a document carries its own specVersion, which is the version it must be read against. The
    // schema is listed first on purpose: validity is decided by the validator against that URL,
    // never by a model reading a table. The page is for the question the schema cannot answer,
    // what a field MEANS, and it is server-rendered, so fetching it returns the fields.
    // Copies of the older reference tables are deliberately NOT published here: they would add
    // ~181KB of near-duplicate prose to llms-full.txt for something these two URLs already give.
    links: publishedVersions().map((version) => ({
      label: version,
      url: `${SITE}/spec/${version}/`,
      lead:
        (version === latestVersion() ? "Current." : "Frozen — published, immutable, and still correct for documents that declare it.") +
        ` Field reference for ${version}. Normative schemas: ${SITE}/schema/${version}/event.schema.json` +
        ` and ${SITE}/schema/${version}/feed.schema.json — validate a document declaring this version against those, not against the current ones.`,
    })),
  },
  {
    title: "Schemas",
    entries: [
      { file: join("spec", VERSION, "event.schema.json"), as: "event.schema.json", lead: "JSON Schema for a single event — the normative source for validity." },
      { file: join("spec", VERSION, "feed.schema.json"), as: "feed.schema.json", lead: "JSON Schema for a feed of events." },
      { file: join("spec", VERSION, "event.recommended.schema.json"), as: "event.recommended.schema.json", lead: "Profile: what makes an event findable and filterable. Failing it is a warning, never an error." },
      { file: join("spec", VERSION, "feed.recommended.schema.json"), as: "feed.recommended.schema.json", lead: "Profile: what makes a feed subscribable." },
    ],
  },
  {
    title: "Examples",
    lead: "Validated documents, one per real case. These pass `npm run validate`.",
    files: join("spec", VERSION, "examples"),
    match: (f) => f.endsWith(".json"),
  },
  {
    title: "Tools and ecosystem",
    entries: [
      { file: join("docs", "data", "tools.json"), as: "tools.json", lead: "The tools listed on the site: validators, generators, importers, and what each one does." },
      // Who consumes OTE has no file of its own: the software is in tools.json (category
      // "Consume") and the organisations are the adopters.json entries declaring `consumes`.
      // The site's /#consumers section is that same join — see docs/app.js.
      { file: join("docs", "data", "adopters.json"), as: "adopters.json", lead: "Communities and directories publishing an OTE feed today; `consumes: true` marks the ones that also ingest other feeds." },
      { file: join("docs", "data", "supporters.json"), as: "supporters.json", lead: "Who backs the spec without necessarily publishing yet: pledges to adopt, endorsements, ambassadors, advisors, offers of resources." },
      { file: "CONTRIBUTING.md", as: "contributing.md", lead: "How to propose a change to the spec, and what gets rejected." },
      { file: "CHANGELOG.md", as: "changelog.md", lead: "What changed between versions, and why." },
    ],
  },
  {
    title: "Research",
    lead: "The prior art the spec was designed against. Read this before proposing a field: the answer to 'why not just use X' is usually already here.",
    entries: [
      { file: join("research", "README.md"), as: "research.md", lead: "How the research was done and what it was looking for." },
      { file: join("research", "findings", "analysis.md"), as: "research-analysis.md", lead: "What the survey concluded and which gaps OTE exists to close." },
      { file: join("research", "findings", "standards.md"), as: "research-standards.md", lead: "iCalendar, RSS and schema.org/Event: what each covers and where each stops." },
      { file: join("research", "findings", "platforms.md"), as: "research-platforms.md", lead: "What Meetup, Luma, Eventbrite and friends expose, and how exportable it is." },
      { file: join("research", "findings", "json-ld-event-platforms.md"), as: "research-json-ld.md", lead: "Which platforms already emit JSON-LD events, and how usable it is in practice." },
      { file: join("research", "findings", "directories.md"), as: "research-directories.md", lead: "Existing event directories and how they ingest data." },
    ],
  },
];

/** Expands a section's `files` directory into entries, so a new example needs no edit here. */
function entriesOf(section) {
  if (section.entries) return section.entries;
  return readdirSync(section.files)
    .filter(section.match)
    .sort()
    .map((f) => ({ file: join(section.files, f), as: f, lead: section.lead }));
}

const sections = SECTIONS.map((s) => ({ ...s, entries: entriesOf(s) }));
const all = sections.flatMap((s) => s.entries);

const missing = all.filter((e) => !existsSync(e.file));
if (missing.length) {
  for (const e of missing) console.log(`  FAIL  ${e.file} is listed in build-llms.mjs but does not exist`);
  process.exit(1);
}

const read = (path) => readFileSync(path, "utf8").replace(/\s+$/, "") + "\n";
const fence = (path) => (path.endsWith(".json") ? "json" : "markdown");

/* ---------- docs/llms.txt — the index ---------- */

const index = [
  "# OpenTechEvents (OTE Spec)",
  "",
  "> An open specification to describe, publish and share tech community events — meetups,",
  "> conferences, workshops, online or in person — in one format that directories, calendars and",
  `> tools can read automatically. It is compatible with iCalendar, RSS and schema.org/Event.`,
  "",
  `The spec is a draft (0.x): fields can still change. Current version: ${VERSION}.`,
  "",
  `Everything below in a single file: ${SITE}/llms-full.txt (large — fetch it only if you can hold it,`,
  "otherwise fetch the pieces you need from the list).",
  "",
];

for (const section of sections) {
  index.push(`## ${section.title}`, "");
  for (const e of section.entries) {
    index.push(`- [${e.as}](${SITE}/llms/${e.as}): ${e.lead}`);
  }
  // Links point at the site rather than at a copy under /llms/, so they appear in the index and
  // nowhere else: there is no file to copy, and nothing to add to llms-full.txt.
  for (const link of section.links ?? []) {
    index.push(`- [${link.label}](${link.url}): ${link.lead}`);
  }
  index.push("");
}

index.push(
  "## Optional",
  "",
  `- [Website](${SITE}/): the same material as pages, with the field reference rendered in English and Spanish.`,
  `- [Prior art](${SITE}/prior-art/): which standards and projects already solve part of this, what OTE reuses from each, and which claims are still unproven. Editorial layer over the research files above; the ActivityPub/FEP-8a8e and IndieWeb material exists only here.`,
  `- [Repository](https://github.com/OpenTechEvents/opentechevents-spec): issues, discussion and the validator.`,
  ""
);

/* ---------- docs/llms-full.txt — everything ---------- */

const full = [
  "# OpenTechEvents (OTE Spec) — full corpus",
  "",
  `Generated from the repository. Source of truth: https://github.com/OpenTechEvents/opentechevents-spec`,
  `Spec version: ${VERSION}. The spec is a draft (0.x) and fields can still change.`,
  "",
  "Each section below is a verbatim file from the repo, in the order a reader new to OTE should",
  "meet them. Answer from these files and say which one you used; if something is not here, say so",
  "rather than inventing a field.",
  "",
];

for (const section of sections) {
  full.push(`${"=".repeat(78)}`, `SECTION: ${section.title}`, `${"=".repeat(78)}`, "");
  for (const e of section.entries) {
    full.push(`## ${e.as}`, "", `Source: ${e.file} — ${e.lead}`, "", "```" + fence(e.file), read(e.file).trimEnd(), "```", "");
  }
}

/* ---------- write / check ---------- */

const outputs = [
  [join("docs", "llms.txt"), index.join("\n")],
  [join("docs", "llms-full.txt"), full.join("\n")],
  ...all.map((e) => [join(OUT_DIR, e.as), read(e.file)]),
];

if (check) {
  const expected = new Set(outputs.map(([path]) => basename(path)));
  const orphans = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((f) => !expected.has(f)) : [];
  const stale = outputs.filter(([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content);
  for (const [path] of stale) console.log(`  FAIL  ${path} is stale — run: npm run build-llms`);
  for (const f of orphans) console.log(`  FAIL  ${join(OUT_DIR, f)} is no longer generated — run: npm run build-llms`);
  if (stale.length || orphans.length) process.exit(1);
  console.log(`  ok    llms.txt, llms-full.txt and ${all.length} sources are in sync with the repo`);
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  const expected = new Set(outputs.map(([path]) => basename(path)));
  // A file that stops being listed must stop being served: a stale copy is worse than no copy,
  // because a model cannot tell the difference.
  for (const f of readdirSync(OUT_DIR).filter((f) => !expected.has(f))) rmSync(join(OUT_DIR, f));
  for (const [path, content] of outputs) writeFileSync(path, content);
  console.log(`  wrote docs/llms.txt, docs/llms-full.txt and ${all.length} files in ${OUT_DIR}/`);
}
