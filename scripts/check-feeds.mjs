#!/usr/bin/env node
/**
 * Health check for registered adopter feeds: fetches every feed in
 * docs/data/adopters.json and validates it against the schemas of the spec
 * version the feed itself declares — not against the newest one. A feed that is
 * valid 0.3 is a healthy feed; publishing a new spec version must never turn
 * every adopter that hasn't migrated yet into a daily issue.
 *
 * Three separate signals, deliberately not collapsed into one boolean:
 *   - reachable  — answers with JSON at all
 *   - valid      — conforms to the schemas of its own declared version
 *   - current    — how its version compares to the newest one. Metadata only:
 *                  an old but supported version never opens an issue, it is
 *                  reported in docs/data/feed-health.json for consumers to see.
 *
 * Failures are also classed before they count. A timeout or a 5xx is transient
 * (slow origin, a bad afternoon) and needs to persist across most of a window of
 * runs; a 4xx, non-JSON body or schema error is deterministic and is reported
 * sooner. Both are tracked in .github/feed-health.json (committed by the
 * workflow, not published); the public status lives in docs/data/feed-health.json.
 *
 * Nothing is ever removed from the registry automatically — feeds die over a
 * weekend all the time, and delisting a community is a human call (a PR).
 *
 * With GITHUB_TOKEN + GITHUB_REPOSITORY set it manages the issues itself via the
 * REST API; without them (local run) it prints what it would do.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { annotationKeywords, customFormats, customKeywords } from "../index.js";

const ADOPTERS = join("docs", "data", "adopters.json");
const STATE = join(".github", "feed-health.json");
const PUBLIC_STATE = join("docs", "data", "feed-health.json");
const LABEL = "feed-health";

/* A deterministic failure is the publisher's to fix and won't fix itself: report
   it after two runs. A transient one has to dominate a window of runs before it
   is worth anyone's attention — a single slow morning must not open an issue. */
const HARD_THRESHOLD = Number(process.env.FEED_HARD_THRESHOLD || 2);
const TRANSIENT_THRESHOLD = Number(process.env.FEED_TRANSIENT_THRESHOLD || 5);
const WINDOW = Number(process.env.FEED_WINDOW || 7);

/* Fetching: generous timeout and retries, because the alternative is calling a
   working feed broken. eventos.wiki answers in ~50s with half a megabyte. */
const TIMEOUT_MS = Number(process.env.FEED_TIMEOUT_MS || 60000);
const ATTEMPTS = Number(process.env.FEED_ATTEMPTS || 3);
const BACKOFF_MS = [2000, 6000];

/* How many minor versions back still validate as healthy. Older than this and
   the feed is reported as unsupported in the public status — still not an issue,
   because the schemas are still here and the feed still works for consumers. */
const SUPPORT_WINDOW = Number(process.env.FEED_SUPPORT_WINDOW || 3);

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

/* ---------- GitHub REST (no deps; skipped on local runs) ---------- */

async function gh(method, path, body) {
  if (!token || !repo) {
    console.log(`  (dry-run) ${method} ${path}${body ? " " + JSON.stringify(body).slice(0, 120) : ""}`);
    return method === "GET" ? [] : {};
  }
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // 422 on label creation = already exists; anything else unexpected should fail loudly.
  if (!res.ok && res.status !== 422) throw new Error(`${method} ${path}: HTTP ${res.status}`);
  return res.status === 422 ? {} : res.json();
}

const issueTitle = (name) => `[Feed health] ${name}: feed unreachable or invalid`;

async function openIssues() {
  return gh("GET", `/issues?state=open&labels=${LABEL}&per_page=100`);
}

/* ---------- validators, one per published spec version ---------- */

// spec/v0.3 → "0.3.0". Every published version keeps its schemas in the repo, so
// a feed can always be checked against the rules it was actually written to.
const versions = readdirSync("spec")
  .filter((d) => /^v\d+\.\d+$/.test(d))
  .map((dir) => ({ dir, minor: dir.slice(1).split(".").map(Number) }))
  .sort((a, b) => a.minor[0] - b.minor[0] || a.minor[1] - b.minor[1]);

const byVersion = new Map(versions.map((v) => [`${v.minor[0]}.${v.minor[1]}.0`, v.dir]));
const LATEST = [...byVersion.keys()].at(-1);
const supported = new Set([...byVersion.keys()].slice(-SUPPORT_WINDOW));

const validators = new Map();

function validatorFor(version) {
  if (validators.has(version)) return validators.get(version);
  const dir = join("spec", byVersion.get(version));
  const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
  addFormats(ajv);
  // The schemas carry annotations strict mode would refuse to compile; they constrain nothing.
  for (const kw of annotationKeywords) ajv.addKeyword(kw);
  // Same setup as scripts/register-adopter.mjs: without the custom formats and keywords
  // (`ote-local-date-time`, `distinctTranslationLanguages`) strict mode refuses to compile
  // the schema at all, and the health check dies before fetching a single feed.
  for (const f of customFormats) ajv.addFormat(f.name, f.validate);
  for (const kw of customKeywords) ajv.addKeyword(kw);
  ajv.addSchema(JSON.parse(readFileSync(join(dir, "event.schema.json"), "utf8")));
  const validate = ajv.compile(JSON.parse(readFileSync(join(dir, "feed.schema.json"), "utf8")));
  const entry = { ajv, validate };
  validators.set(version, entry);
  return entry;
}

/* ---------- fetching ---------- */

/* A feed nobody can read from a browser is still a valid, healthy feed — this is a
   note, never a failure. `*` is what lets an arbitrary client read it; anything else
   (absent, or a single reflected origin) means only some origins can. See
   https://opentechevents.org/#serving */
const ORIGIN = "https://opentechevents.org";

function corsNote(res) {
  const acao = res.headers.get("access-control-allow-origin");
  if (acao === "*") return null;
  return acao
    ? `only reads from ${acao} (no \`Access-Control-Allow-Origin: *\`)`
    : "no `Access-Control-Allow-Origin`";
}

/**
 * How the feed is SERVED, as opposed to what it says. Recorded because the one question the
 * spec could not answer about large feeds — "is this a real problem, and for how many?" — had
 * exactly one data point and no series behind it. Measuring it here costs nothing: the daily
 * run already downloads every feed.
 *
 * The numbers also keep the diagnosis honest. eventos.wiki is the feed that prompted the
 * question, and measured on 2026-11-03 it was 568 KB served in 23,7 s, of which 23,6 s was time
 * to first byte, uncompressed, with no ETag. Its problem is a slow origin and a missing
 * `Content-Encoding`, not a document that needs splitting — and only the numbers show that.
 */
function transportOf(res, body, startedAt, firstByteAt) {
  return {
    bytes: body.length,
    // What the server actually negotiated. `null` means it sent none: fetch advertises gzip and
    // br on every request, so an absent header is a server that compresses nothing.
    encoding: res.headers.get("content-encoding"),
    // A conditional request needs one of these; with neither, every poll is a full download.
    revalidation:
      [res.headers.get("etag") ? "etag" : null, res.headers.get("last-modified") ? "last-modified" : null]
        .filter(Boolean)
        .join("+") || null,
    cacheControl: res.headers.get("cache-control"),
    // Split on purpose: ttfb is the origin thinking, total − ttfb is the bytes moving. A feed
    // can be big and fast, or small and slow, and the fix is different for each.
    ttfbMs: Math.round(firstByteAt - startedAt),
    totalMs: Math.round(Date.now() - startedAt),
  };
}

const ok = (extra) => ({ error: null, kind: null, ...extra });
const hard = (error, extra) => ({ error, kind: "hard", ...extra });
const transient = (error, extra) => ({ error, kind: "transient", ...extra });

// One attempt. Transport errors, 429 and 5xx are transient; everything the origin
// answers deliberately is not, and retrying it only wastes the publisher's bandwidth.
async function attempt(url) {
  let res;
  const startedAt = Date.now();
  try {
    res = await fetch(url, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    return transient(`fetch failed: ${err.message}`);
  }
  // fetch resolves on headers, so this is the origin's own thinking time, before any body.
  const firstByteAt = Date.now();
  const cors = corsNote(res);
  if (res.status === 429 || res.status >= 500) return transient(`HTTP ${res.status}`, { cors });
  if (!res.ok) return hard(`HTTP ${res.status}`, { cors });

  // Read as text, not .json(): the byte count is half the measurement, and parsing afterwards
  // costs nothing a 500 KB download has not already paid.
  let body;
  try {
    body = await res.text();
  } catch (err) {
    return transient(`fetch failed while reading the body: ${err.message}`);
  }
  const transport = transportOf(res, body, startedAt, firstByteAt);

  let doc;
  try {
    doc = JSON.parse(body);
  } catch {
    return hard("response is not JSON", { cors, transport });
  }

  const version = typeof doc.specVersion === "string" ? doc.specVersion : null;
  if (!version || !byVersion.has(version)) {
    // Not a version this repo has ever published: there is no schema to judge it by.
    return hard(`unknown specVersion: ${JSON.stringify(doc.specVersion ?? null)}`, { cors, transport });
  }

  // Older than the support window: reachable, and that is all we claim. Judging it
  // against rules we no longer support would report a failure nobody agreed to fix.
  if (!supported.has(version)) return ok({ cors, transport, version, licenses: licensesIn(doc) });

  const { ajv, validate } = validatorFor(version);
  if (!validate(doc)) {
    return hard("schema errors:\n" + ajv.errorsText(validate.errors, { separator: "\n" }), { cors, transport, version });
  }
  return ok({ cors, transport, version, licenses: licensesIn(doc) });
}

/* Every licence a consumer would actually end up with, inheritance resolved. An event
   that declares its own replaces the feed's, and an aggregator may omit `feed.license`
   entirely as long as every event carries one — so reporting `feed.license` alone would
   be wrong precisely for the mixed feeds where the answer matters most. See the spec's
   "license and source" section. */
function licensesIn(doc) {
  const events = Array.isArray(doc.events) ? doc.events : [];
  const effective = events.map((e) => (e && typeof e.license === "string" ? e.license : doc.license));
  const all = (effective.length ? effective : [doc.license]).filter((l) => typeof l === "string");
  return [...new Set(all)].sort();
}

async function checkFeed(url) {
  for (let i = 0; i < ATTEMPTS; i++) {
    const result = await attempt(url);
    if (result.kind !== "transient" || i === ATTEMPTS - 1) return result;
    await new Promise((r) => setTimeout(r, BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)]));
  }
}

/* ---------- window bookkeeping ---------- */

// Last WINDOW runs, oldest first: "." healthy, "x" failed.
const push = (window, char) => (String(window || "") + char).slice(-WINDOW);
const count = (window, char) => [...String(window || "")].filter((c) => c === char).length;

function shouldAlert(entry) {
  return entry.kind === "hard"
    ? entry.failures >= HARD_THRESHOLD
    : count(entry.window, "x") >= TRANSIENT_THRESHOLD;
}

/* ---------- main ---------- */

const adopters = JSON.parse(readFileSync(ADOPTERS, "utf8")).adopters.filter((a) => a.feed);
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const previous = existsSync(PUBLIC_STATE) ? JSON.parse(readFileSync(PUBLIC_STATE, "utf8")) : {};
// A feed that times out tells us nothing about its version: keep the last one we saw
// rather than blanking it, so the public status stays useful through an outage.
const lastKnown = new Map((previous.feeds || []).map((f) => [f.feed, { specVersion: f.specVersion, licenses: f.licenses, transport: f.transport }]));
const today = new Date().toISOString().slice(0, 10);
const next = {};
const status = [];
let failing = 0;
const noCors = [];

for (const adopter of adopters) {
  const { error, kind, cors, transport, version, licenses } = await checkFeed(adopter.feed);
  const prev = state[adopter.feed];
  const last = lastKnown.get(adopter.feed) || {};
  const stale = version && !supported.has(version);
  const seen = version || last.specVersion || null;

  status.push({
    name: adopter.name,
    url: adopter.url || null,
    feed: adopter.feed,
    status: error ? "failing" : "ok",
    specVersion: seen,
    // Old but still checkable against its own schemas: information for consumers,
    // never a health failure. See the support window at the top of this file.
    supported: seen ? supported.has(seen) : null,
    // Inheritance resolved, so a feed whose events carry different licences reports all
    // of them: whoever aggregates has to look at each event, not only at feed.license.
    licenses: licenses && licenses.length ? licenses : last.licenses || null,
    cors: error ? null : cors === null,
    // How it is served, not what it says: size, whether the server compressed it, whether a
    // consumer can revalidate instead of re-downloading, and where the time went. Kept through
    // an outage like specVersion and licenses — a feed that times out today was still this
    // size yesterday, and losing the series would defeat the point of recording it.
    transport: transport || last.transport || null,
    failureKind: kind,
    failingSince: error ? (prev ? prev.since : today) : null,
    error: error ? error.split("\n")[0] : null,
  });

  if (!error) {
    const age = stale ? ` (spec ${version}, older than the supported window)` : ` (spec ${version})`;
    console.log(`  ok    ${adopter.name} — ${adopter.feed}${age}`);
    // Only worth saying about a feed that otherwise works: a broken one has a bigger problem.
    if (cors) {
      noCors.push(adopter);
      console.log(`        ${cors} — browser-based clients can't read this feed`);
    }
    if (prev && prev.alerted) {
      // Recovered after having been reported: close the alert.
      const issues = await openIssues();
      const open = issues.find((i) => i.title === issueTitle(adopter.name));
      if (open) {
        await gh("POST", `/issues/${open.number}/comments`, {
          body: `The feed answers and validates against OTE ${version} again as of ${today}. Closing.`,
        });
        await gh("PATCH", `/issues/${open.number}`, { state: "closed" });
        console.log(`        recovered — closed #${open.number}`);
      }
    }
    // A window with no failure left in it carries no information: drop the entry
    // so a healthy registry produces no daily commit.
    const window = push(prev && prev.window, ".");
    if (count(window, "x")) next[adopter.feed] = { failures: 0, since: null, window, kind: null, alerted: false };
    continue;
  }

  failing++;
  const entry = {
    failures: (prev ? prev.failures : 0) + 1,
    since: prev && prev.since ? prev.since : today,
    lastError: error.split("\n")[0],
    kind,
    window: push(prev && prev.window, "x"),
    alerted: Boolean(prev && prev.alerted),
  };
  next[adopter.feed] = entry;
  console.log(
    `  FAIL  ${adopter.name} — ${adopter.feed} (${kind}, ${entry.failures} consecutive, window ${entry.window}): ${entry.lastError}`
  );

  // Alert once. After that the issue exists (or a human who knows better closed
  // it — don't reopen it every day); `alerted` clears only on recovery.
  if (!entry.alerted && shouldAlert(entry)) {
    entry.alerted = true;
    await gh("POST", "/labels", { name: LABEL, color: "d93f0b", description: "Registered adopter feed failing its health check" });
    const issues = await openIssues();
    if (!issues.some((i) => i.title === issueTitle(adopter.name))) {
      const how =
        kind === "hard"
          ? `${entry.failures} consecutive daily checks`
          : `${count(entry.window, "x")} of the last ${entry.window.length} daily checks (transient errors: timeouts, 5xx)`;
      await gh("POST", "/issues", {
        title: issueTitle(adopter.name),
        labels: [LABEL],
        body: [
          `The feed of **${adopter.name}** has failed ${how}, since ${entry.since}.`,
          "",
          `- Feed: ${adopter.feed}`,
          adopter.url ? `- Website: ${adopter.url}` : null,
          version ? `- Declared spec version: \`${version}\` (checked against \`spec/${byVersion.get(version)}\`)` : null,
          `- Last error:`,
          "```",
          error,
          "```",
          "",
          "Feeds are validated against the spec version they declare, so this is not about being on an older version.",
          "",
          "If the feed is gone for good, delist the community with a PR removing its entry from `docs/data/adopters.json`. If it's temporary, this issue closes itself when the feed recovers.",
        ].filter((l) => l !== null).join("\n"),
      });
      console.log("        opened health issue");
    }
  }
}

writeFileSync(STATE, JSON.stringify(next, null, 2) + "\n");

/* Public status: what a consumer wants before subscribing — is it up, and which
   version does it speak. `updated` is the date this content last *changed*, not
   the date of the last run: a daily timestamp would commit a new file every
   morning for no new information. */
const unchanged = JSON.stringify(previous.feeds) === JSON.stringify(status);
writeFileSync(
  PUBLIC_STATE,
  JSON.stringify(
    {
      _comment:
        "Health of the registered adopter feeds, refreshed daily by scripts/check-feeds.mjs. Feeds are validated against the spec version they declare; `supported` false means older than the supported window, which is information, not a failure. `specVersion` and `licenses` are the last values seen, kept through an outage; `licenses` lists every licence a consumer ends up with, feed-level inheritance already resolved. `updated` is when this status last changed.",
      updated: unchanged && previous.updated ? previous.updated : today,
      latestSpecVersion: LATEST,
      feeds: status,
    },
    null,
    2
  ) + "\n"
);

console.log(`\n${adopters.length} feed(s), ${failing} failing.`);
const outdated = status.filter((s) => s.supported === false);
if (outdated.length) {
  console.log(`${outdated.length} on an unsupported spec version (reported, not an issue): ${outdated.map((s) => `${s.name} ${s.specVersion}`).join(", ")}`);
}
if (noCors.length) {
  // Deliberately not an issue and not part of the failure count: these feeds are healthy.
  console.log(
    `${noCors.length} readable only from a server (no CORS): ${noCors.map((a) => a.name).join(", ")}` +
      ` — https://opentechevents.org/#serving`
  );
}
