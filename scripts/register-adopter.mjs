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
 *   spec=v0.3          the spec version this run measured against — the one the feed
 *                      declares, not necessarily the newest — for the PR body
 *   validator=<url>    the feed's permalink in the online validator, for the PR body
 * A human-readable report is written to $REPORT_PATH (default: adopter-report.md)
 * — that file becomes the comment on the issue, valid or not. It opens with a hidden
 * marker so the workflow can edit one sticky comment instead of stacking a new one on
 * every re-run, and every report carries the online validator link for this feed plus
 * the `/revalidate` command: the usual fix happens on the publisher's server, where
 * editing the issue changes nothing and there is otherwise no way to ask for a retry.
 *
 * An invalid feed is a normal outcome, not a job failure: the script only exits
 * non-zero when it cannot do its work (missing fields, unreadable adopters.json).
 */
import { readFileSync, writeFileSync, appendFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { annotationKeywords, customFormats, customKeywords } from "../index.js";
import { expiringLogoReason, logoSlug } from "./logo-url.mjs";

/* A feed is measured against the version it declares, not against the newest one:
   every published version keeps its schemas here, and telling someone whose valid
   0.3 feed we asked to register that it "does not validate" — because of the
   specVersion const and nothing else — is a rejection at the front door for a feed
   that was never broken. Older than the support window is a different matter: there
   we do ask for a migration, and say so. Same rule as scripts/check-feeds.mjs. */
const SUPPORT_WINDOW = Number(process.env.FEED_SUPPORT_WINDOW || 3);

const versions = readdirSync("spec")
  .filter((d) => /^v\d+\.\d+$/.test(d))
  .map((dir) => ({ dir, minor: dir.slice(1).split(".").map(Number) }))
  .sort((a, b) => a.minor[0] - b.minor[0] || a.minor[1] - b.minor[1]);
const byVersion = new Map(versions.map((v) => [`${v.minor[0]}.${v.minor[1]}.0`, v.dir]));
const LATEST = [...byVersion.keys()].at(-1);
const supported = [...byVersion.keys()].slice(-SUPPORT_WINDOW);

const ADOPTERS = join("docs", "data", "adopters.json");
const LOGOS = join("docs", "logos");
const REPORT = process.env.REPORT_PATH || "adopter-report.md";

/* The sticky comment's identity: the workflow finds its previous comment by this
   prefix and patches it. Changing it orphans the comments already posted. */
const MARKER = "<!-- ote-adopter-check -->";

/* The same verdict this script produces, in a page the publisher can re-run themselves
   while they fix things — with human-readable messages instead of ajv's error text. */
const VALIDATOR = "https://validator.opentechevents.org/";
const validatorLink = (feed) => `${VALIDATOR}?doc=${encodeURIComponent(feed)}`;

/* Closing line of every report. The feed lives on the publisher's server, so a fix
   leaves the issue untouched: without a command there is nothing to re-trigger on. */
const RETRY =
  "Fixed your feed? Comment `/revalidate` on this issue and the check runs again — no edit needed.";

/* ---------- issue-form parsing ----------
   Issue forms render as "### <label>\n\n<value>" blocks; empty optional fields
   come through as "_No response_". Labels must match .github/ISSUE_TEMPLATE/adopter.yml. */

const LABELS = {
  "Community name": "name",
  "Website": "url",
  "OTE feed URL": "feed",
  "What it is": "kind",
  "Also a consumer": "consumes",
  "Logo URL": "logo",
  "Community directory ID": "directory",
};

/* `kind` is what the entity IS; publishing is never declared here, it is derived from the
   feed this run just validated. The closed list is the same one scripts/validate.mjs
   enforces on the registry — an unknown value would fail the build after the PR exists. */
const KINDS = { community: "community", directory: "directory" };

/* Consuming is the one role nothing here can verify, so it is recorded as what it is: a
   claim, with its own distinction between live and merely intended. Keeping "planned" out
   of "live" is what stops the consumers section from counting plans as reach. */
const CONSUMES = {
  "yes, already consuming ote feeds": "live",
  "planned, not yet live": "planned",
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
  writeFileSync(REPORT, [MARKER, "", ...lines].join("\n") + "\n");
  setOutput("valid", String(valid));
  console.log(readFileSync(REPORT, "utf8"));
}

/* ---------- logos ----------
   A logo URL goes into a permanent record, so it has to still answer the same image next
   year. The one people reach for most does not: dropping an image into a GitHub comment and
   copying its address yields a pre-signed S3 URL that 403s after five minutes. #51 stored one
   and the logo was dead before the PR merged. So an expiring URL is never written to the
   registry — it is fetched once, here, and committed to docs/logos/ as a file we serve
   ourselves. If the fetch fails (likely: it may already have expired), the entry gets no logo
   at all and the report says so; initials are a worse logo than the real one and a far better
   one than a broken image. scripts/validate.mjs fails the build if an expiring URL lands in
   adopters.json by any other route. */

const LOGO_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

async function mirrorLogo(url, name) {
  let res;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) });
  } catch (err) {
    return { error: `fetching it failed: ${err.message}` };
  }
  if (!res.ok) {
    return {
      error: `it answered HTTP ${res.status}${res.status === 403 || res.status === 404 ? " — the link had already expired" : ""}`,
    };
  }
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = LOGO_TYPES[type];
  if (!ext) return { error: `it answered \`${type || "no content type"}\`, not an image` };
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > LOGO_MAX_BYTES) {
    return { error: `it is ${Math.round(bytes.length / 1024)} KB, over the ${LOGO_MAX_BYTES / 1024 / 1024} MB limit` };
  }
  const file = `${logoSlug(name)}.${ext}`;
  mkdirSync(LOGOS, { recursive: true });
  writeFileSync(join(LOGOS, file), bytes);
  return { path: `logos/${file}` };
}

/* ---------- main ---------- */

const body = process.env.ISSUE_BODY;
if (!body) {
  console.error("ISSUE_BODY is not set");
  process.exit(1);
}

const fields = parseIssue(body);
setOutput("name", fields.name || "");

const kind = KINDS[(fields.kind || "").trim().toLowerCase()];

if (!fields.name || !fields.feed || !kind) {
  report(false, [
    "### ❌ Registration incomplete",
    "",
    `Couldn't read ${[
      !fields.name && "the community name",
      !fields.feed && "the feed URL",
      !kind && `what it is (\`${Object.keys(KINDS).join("` or `")}\`)`,
    ]
      .filter(Boolean)
      .join(", ")} from the issue. Please edit it keeping the form's section headings intact, or open a fresh one from the [registration form](https://opentechevents.org/register/).`,
  ]);
  process.exit(0);
}

setOutput("validator", validatorLink(fields.feed));

/* Whether a browser could read this feed. Checked here because this is the one moment
   the publisher is listening: the report becomes a comment on their issue. It never
   affects the verdict — a feed without CORS is valid, it just can't be read by
   browser-based clients (readers, widgets, static directories). */
const ORIGIN = "https://opentechevents.org";
let cors = null;

async function fetchFeed(url) {
  try {
    return await fetch(url, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(60000) });
  } catch (err) {
    await new Promise((r) => setTimeout(r, 3000));
    return fetch(url, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(60000) });
  }
}

let doc;
try {
  // Generous, and retried once: a feed that takes 30s to build half a megabyte is slow,
  // not broken, and a timeout here reads to the publisher as "your feed is wrong".
  const res = await fetchFeed(fields.feed);
  if (!res.ok) throw new Error(`the URL answered HTTP ${res.status}`);
  const acao = res.headers.get("access-control-allow-origin");
  if (acao !== "*") cors = acao ? `only allows reads from \`${acao}\`` : "sends no `Access-Control-Allow-Origin`";
  doc = await res.json();
} catch (err) {
  report(false, [
    "### ❌ Feed unreachable or not JSON",
    "",
    `Fetching \`${fields.feed}\` failed: ${err.message}`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})** to see what a client gets when it asks for that URL.`,
    "",
    "If the URL itself is wrong, edit the issue. If the server is what needs fixing, fix it there — nothing in this issue has to change.",
    "",
    RETRY,
  ]);
  process.exit(0);
}

/* Which rules to measure this feed by. Absent or unknown means nobody can judge it:
   there is no schema for a version this project never published. Older than the
   support window is the one case where being behind really is the problem, and the
   report says so instead of dressing it up as a validation error. */
const declared = typeof doc.specVersion === "string" ? doc.specVersion : null;

if (!declared || !byVersion.has(declared)) {
  report(false, [
    "### ❌ Unknown `specVersion`",
    "",
    declared
      ? `The feed declares \`specVersion: "${declared}"\`, which is not a published version of OTE Spec.`
      : "The feed does not declare a `specVersion`, so there are no rules to check it against.",
    "",
    `Published versions: ${[...byVersion.keys()].map((v) => `\`${v}\``).join(", ")}. The current one is \`${LATEST}\`.`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})**. The [field reference](https://opentechevents.org/spec/) documents every field.`,
    "",
    RETRY,
  ]);
  process.exit(0);
}

if (!supported.includes(declared)) {
  report(false, [
    `### ❌ OTE Spec ${declared} is no longer supported`,
    "",
    `The registry tracks the last ${supported.length} versions (${supported.map((v) => `\`${v}\``).join(", ")}); this feed declares \`${declared}\`.`,
    "",
    `Its schemas are still in the repo under [\`spec/${byVersion.get(declared)}\`](https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/${byVersion.get(declared)}), so nothing you publish stops working — but to be listed, please move the feed to \`${LATEST}\`.`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})** once you've migrated.`,
    "",
    RETRY,
  ]);
  process.exit(0);
}

const SPEC = join("spec", byVersion.get(declared));
const SPEC_VERSION = byVersion.get(declared); // "v0.3" — the version every message quotes
setOutput("spec", SPEC_VERSION);

// Same Ajv setup as scripts/validate.mjs — see the comment there about strictRequired.
const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
// The schemas carry annotations strict mode would refuse to compile; they constrain nothing.
for (const kw of annotationKeywords) ajv.addKeyword(kw);
// `ote-local-date-time` covers the one temporal shape ajv-formats doesn't: wall-clock,
// deliberately without an offset. Strict mode refuses to compile a schema referencing an
// unregistered format, same as with annotationKeywords above.
for (const f of customFormats) ajv.addFormat(f.name, f.validate);
// Unlike annotationKeywords, these restrict which documents pass (e.g. distinctTranslationLanguages).
for (const kw of customKeywords) ajv.addKeyword(kw);
ajv.addSchema(JSON.parse(readFileSync(join(SPEC, "event.schema.json"), "utf8")));
const validateFeed = ajv.compile(JSON.parse(readFileSync(join(SPEC, "feed.schema.json"), "utf8")));

if (!validateFeed(doc)) {
  report(false, [
    `### ❌ The feed does not validate against OTE Spec ${SPEC_VERSION}`,
    "",
    `👉 **[Open your feed in the OTE validator](${validatorLink(fields.feed)})** — same verdict as here, with each problem explained in plain language and pointed at the field that caused it. The [field reference](https://opentechevents.org/spec/) documents every field.`,
    "",
    "<details><summary>Raw validator output</summary>",
    "",
    "```",
    ajv.errorsText(validateFeed.errors, { separator: "\n" }),
    "```",
    "",
    "</details>",
    "",
    RETRY,
  ]);
  process.exit(0);
}

// Valid → upsert into adopters.json, keyed by feed URL: re-registering an
// existing feed updates its entry instead of duplicating it.
const registry = JSON.parse(readFileSync(ADOPTERS, "utf8"));
const entry = { name: fields.name, kind };
if (fields.url) entry.url = fields.url;
entry.feed = fields.feed;
if (fields.logo) entry.logo = fields.logo;
if (fields.directory) entry.directory = fields.directory;
// Self-declared, and the only role that can be: nothing here can check that a site really
// ingests OTE. Written only when true so an unticked box doesn't litter the registry.
const consumes = CONSUMES[(fields.consumes || "").trim().toLowerCase()];
if (consumes) entry.consumes = consumes;

/* Resolved before the entry is written: `logoNote` carries whatever the report has to say
   about it — nothing, in the normal case of a logo hosted on the publisher's own site. */
let logoNote = [];
if (fields.logo) {
  const expiring = expiringLogoReason(fields.logo);
  if (expiring) {
    const mirrored = await mirrorLogo(fields.logo, fields.name);
    if (mirrored.path) {
      entry.logo = mirrored.path;
      logoNote = [
        "",
        `> ℹ️ The logo URL you gave expires — ${expiring} — so the image was copied into the repository as \`docs/${mirrored.path}\` and the registry points there. Nothing for you to do; if you'd rather we linked your own copy, re-register with a permanent URL on your site.`,
      ];
    } else {
      delete entry.logo;
      logoNote = [
        "",
        `> ⚠️ **The logo was left out:** that URL expires — ${expiring} — and ${mirrored.error}. Your community will show its initials. To get the image in, re-register with a logo URL hosted on your own site (a link you can open tomorrow in a private window).`,
      ];
    }
  }
}

const existing = registry.adopters.findIndex((a) => a.feed === fields.feed);
if (existing === -1) registry.adopters.push(entry);
else {
  const merged = { ...registry.adopters[existing], ...entry };
  // The spread keeps an old value when this run has none — which, for a logo that was
  // dropped above, would restore the very URL we refused to write.
  if (!entry.logo && fields.logo) delete merged.logo;
  // Same for the consumer flag: unticking the box has to mean something.
  if (!entry.consumes) delete merged.consumes;
  registry.adopters[existing] = merged;
}
writeFileSync(ADOPTERS, JSON.stringify(registry, null, 2) + "\n");

report(true, [
  `### ✅ Feed validates against OTE Spec ${SPEC_VERSION}`,
  "",
  `**${fields.name}** — \`${fields.feed}\` (${doc.events.length} event${doc.events.length === 1 ? "" : "s"})`,
  `Listed as a ${kind}${
    consumes === "live"
      ? ', and under "Who consumes OTE data" too'
      : consumes === "planned"
        ? ', and under "Who consumes OTE data" as coming soon'
        : ""
  }.`,
  fields.directory ? `Linked to directory entry \`${fields.directory}\`.` : "No directory link.",
  ...logoNote,
  "",
  "A pull request adding the community to the adopters registry follows; a maintainer will review and merge it.",
  "",
  `Keep this link to re-check the feed whenever you change it: [validator.opentechevents.org](${validatorLink(fields.feed)}).`,
  // Being behind is not a defect and does not hold up the registration: said once, as a
  // note, so nobody reads a supported version as a problem they have to fix today.
  ...(declared !== LATEST
    ? [
        "",
        `> ℹ️ This feed declares \`${declared}\` and the current version is \`${LATEST}\`. Both are supported and it changes nothing here — whenever you feel like migrating, the [changelog](https://opentechevents.org/history/) lists what moved.`,
      ]
    : []),
  ...(cors
    ? [
        "",
        `> ⚠️ **One thing worth fixing:** the server ${cors}, so clients that run in a browser — the [OTE Reader](https://reader.opentechevents.org/), embeddable widgets, static directories — can't fetch your feed. It doesn't block anything here (your feed is valid and server-side consumers read it fine), but adding \`Access-Control-Allow-Origin: *\` to the feed response takes one line of server config: [how and why](https://opentechevents.org/#serving).`,
      ]
    : []),
]);
