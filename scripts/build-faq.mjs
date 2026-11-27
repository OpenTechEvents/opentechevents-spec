/**
 * The FAQ, in the served bytes.
 *
 * Usage:
 *   node scripts/build-faq.mjs            → writes the generated slot in docs/why/index.html
 *   node scripts/build-faq.mjs --check    → fails if that slot is stale (CI)
 *
 * The eleven questions live in docs/i18n/en.json, and until now they existed only after the
 * fetch resolved: curl, a crawler or an agent read a page whose FAQ was an empty <div>. That
 * is the same failure the field reference had (see staticFields in build-reference.mjs) —
 * a browser and a reader of the HTML disagreeing about whether the content exists.
 *
 * English only, deliberately: en.json is the base language, and why.js swaps in the
 * translation on render as it does for every other string. The markup is plain <details>,
 * not why.js's DOM: that script calls replaceChildren() on the container the moment the
 * dictionary lands, so these rows are a fallback, never a hydration contract.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const check = process.argv.includes("--check");
const PAGE = join("docs", "why", "index.html");
const SLOT = /(<!-- generated:faq -->)[\s\S]*?(<!-- \/generated:faq -->)/;

const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const dict = JSON.parse(readFileSync(join("docs", "i18n", "en.json"), "utf8"));
const items = dict.faq?.items ?? [];

if (!items.length) {
  console.log("  FAIL  docs/i18n/en.json has no faq.items — nothing to generate");
  process.exit(1);
}

// The answers carry inline markup (links, <code>) in the dictionary itself, so they are
// emitted as-is; the questions are plain text and are escaped.
const rendered = items
  .map((item) => `<details class="static-faq" lang="en"><summary>${escapeHtml(item.q)}</summary><p>${item.a}</p></details>`)
  .join("\n");

const page = readFileSync(PAGE, "utf8");
if (!SLOT.test(page)) {
  console.log(`  FAIL  ${PAGE} has no <!-- generated:faq --> slot`);
  process.exit(1);
}
const filled = page.replace(SLOT, `$1\n${rendered}\n$2`);

console.log("\ndocs/why/index.html FAQ");
if (check) {
  if (filled !== page) {
    console.log(`  FAIL  ${PAGE} FAQ is stale — run: npm run build-faq`);
    process.exit(1);
  }
  console.log(`  ok    ${items.length} questions are in the served HTML`);
} else {
  writeFileSync(PAGE, filled);
  console.log(`  wrote ${PAGE} (${items.length} questions)`);
}
