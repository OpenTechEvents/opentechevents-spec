# Handoff — read this first

Three friction reports from the same external reporter, reviewed on 2026-11-06 against the repo and
the live site. **Nothing is implemented.** This file is the whole state: each task has its verdict,
its reproducible evidence, its chosen design and its gate. Read a task's section before touching
its code; the verdicts are not restatements of the reports, two of the three reports are partly
wrong, and re-deriving that costs more than reading it.

| Task | What it is | Verdict | Files it will touch |
| --- | --- | --- | --- |
| 1 | `/spec/` renders client-side, so `curl` and agents see zero fields | Symptom real, 3 premises false. Pre-render into a delimited slot | `docs/spec/index.html`, `docs/spec/reference.js`, `scripts/build-reference.mjs`, `scripts/validate.mjs` |
| 2 | No URL means "the v0.6 field reference" (`/spec/v0.6/` 404s today, resolves later) | Report correct as written. Generate the LATEST's page too | `scripts/build-reference.mjs` |
| 3 | `speakers` on a parent document: importer vs prose | Importer correct; small real gap, not the contradiction reported | `spec/v0.7/` (future), new `ERRATA.md`, `spec/README.md`, `.github/workflows/validate-spec.yml` |

## Order, and why it is not arbitrary

**2 → 1 → 3.** Task 2 is a one-line filter change that creates `docs/spec/v0.6/index.html` — the
page task 1 pre-renders into and task 3 links its erratum from. Doing 1 first means doing its slot
work twice, once for five pages and again for six.

## What is settled and must not be re-litigated

- **The anchor id convention is already published**, not an open choice: `<schema>-<path>` with the
  path verbatim, `[]` and dots included. See task 1's naming section for why it stays verbatim.
- **v0.6 is frozen**, decided on the npm evidence in task 3. No byte of `spec/v0.6/` changes, not
  even a `description`, not even a provably false paragraph.
- **The importer is right** and keeps importing what the source asserts. The report says explicitly
  not to "fix" this by dropping parent-level speakers; so does this review, for its own reasons.

## Traps that will bite whoever implements this

1. **The hard rule.** `versionPages()` does a global version-string replace. Pre-rendered field
   descriptions contain "New in v0.5" in ten places — empty the slot, replace, *then* fill. Getting
   this backwards turns `/spec/v0.1/` into a page claiming "New in v0.1", which is the
   `copyleft-next-0.3.0` failure again.
2. **`validate.mjs` will fail on correct work.** `docs/spec/index.html` is in `CURRENT_SPEC_PAGES`,
   which forbids naming any version but the latest. Strip the generated slot in `withoutComments()`;
   do not shorten the list, do not relax the check.
3. **`render()` wipes before it checks.** `dom.reference.replaceChildren()` runs before
   `if (!state.model) return`, so pre-rendered rows vanish for the duration of the fetch. Move the
   guard above the wipe.
4. **CI fetches no tags.** Any freeze check added for task 3 passes vacuously until
   `validate-spec.yml` gets `fetch-depth: 0`.

## Open, needs a human

- Whether `ERRATA.md` is the right mechanism, or erratas belong per-version on the website. The
  argument for a root file is in task 3; it is a preference, not a derivation.
- Whether to also generate `sitemap.xml` / `robots.txt`. Mentioned once in task 2, not required.

## Status of this file

Untracked. Not committed — nothing has been committed in this session, and the working tree was
clean when it started.

---

# /spec/ discoverability — pre-render the field cards

Status: plan, not implemented. Track: website (`docs/`, `scripts/`) — **touches no `spec/` version.**
Raised by: an external agent's report, 2026-11-06, which traces back to [issue #53](https://github.com/OpenTechEvents/opentechevents-spec/issues/53)
(BiznagaFest 2026 session). This file is the reviewed version of that report: what in it is
true, what is false, and the design that survives the repo's own guards.

> Why this file exists at all: the report arrived as a proposal with a deliverable attached
> ("the analysis first, then the change"). Two of its premises are false and its mechanism
> violates the project's hard rule, so the analysis had to be redone before any code. Writing
> it down means the next person — or the next agent — does not re-derive it, and does not
> re-litigate the naming convention, which is already published.
>
> This is the first of three related tasks from the same reporter. The others are reviewed
> separately; the point of keeping them separate is to check that the change below actually
> resolves all three rather than assuming it does.

## The symptom, verified

```
curl -sL https://opentechevents.org/spec/      → 200, 7918 bytes
grep -c speaker        → 0
ids served             → site-nav, spec-version, toc-*, field-search, ref-count, reference, extensions
```

120 fields (100 `event` + 20 `feed`) exist only after JavaScript runs. Anything reading the
served HTML — a crawler, an LLM agent, `curl` — sees no fields at all.

The failure mode is worse than "needs JS", because the two halves reinforce each other: a
fragment pointing at a field is never an error. The browser serves the page and stays at the
top. So a human pastes `/spec/#event-speakers` as proof the field exists (it does), an agent
fetches the same URL, finds no `speaker` string, and reports the field does not exist. Both
sides hold evidence; both conclude wrongly.

## What the report got wrong

**"The field reference has no per-field anchors."** False. `docs/spec/reference.js` sets
`card.id = schema.name + "-" + f.path`, so `#event-speakers` resolves and scrolls today in any
browser. `grep -c 'id="event-'` does not measure anchors; it measures server-rendering. The
practical consequence: **the id convention is already published and is not an open decision.**

**"Have reference.js assign the ids and handle the incoming fragment after render" (their
option b).** Already implemented — `reference.js` resolves `location.hash` after the `fetch`
resolves, with a comment saying why. A no-op, not an alternative.

**"`docs/llms/reference-<version>.md` already has real anchors"** (claimed in #53 itself).
False. That file has `## event`, `## feed`, `### Constraints` and nothing finer — it is a
markdown table, and table rows are not linkable. It does not serve the human who wants to
deep-link a field.

## Options considered

| | Verdict |
| --- | --- |
| **(a)** Pre-render in the generator | Right direction, wrong mechanism as proposed — see the two blockers below. Their own stated objection ("index.html stops being hand-written") is the least of it: `versionPages()` already treats that file as a template and already rewrites generated content into it. |
| **(b)** Client-side ids + fragment handling | Already shipped. Fixes nothing new, and nothing for `curl` or crawlers. |
| **(c)** Server-render a compact index of field names only | **No.** Two sources of truth for "which fields exist" is exactly the class of drift this repo spent 33 audit rounds removing. And it would not have helped the agent in the originating session: it would have seen a name list with no type and no description, and still guessed at `speakers[].affiliation`. |
| **(d)** (a) with a delimited slot, filled per version | **Chosen.** Below. |

## Chosen design

1. `<div id="reference">` gains `<!-- generated:fields -->` … `<!-- /generated:fields -->`.
   Every byte outside the slot stays hand-written; the slot is declared generated. The
   "one hand-written page" property is preserved in the sense that matters.
2. The orchestrator fills the slot of **every** page — `/spec/` and each `/spec/vN.N/` — from
   `docs/data/reference-<version>.json`, which its per-version children already wrote.
   `versionPages()` **empties the slot first**, then applies its three existing replaces, then
   inserts that version's rows. Order is not cosmetic; see blocker (a).
3. The static markup is minimal and deliberately disposable: `id`, field name, type, level,
   English description. It does **not** replicate the rich card's markup — so there is no
   hydration contract between two renderers that could drift. `reference.js` keeps calling
   `replaceChildren()` exactly as it does now.
4. One required one-line fix: `render()` currently calls `dom.reference.replaceChildren()`
   *before* `if (!state.model) return`. As written it would wipe the static rows the moment the
   script runs and leave the region blank for the whole duration of the `fetch`. The guard moves
   above the wipe.
5. Language: ids are schema paths, so they are language-independent by construction. The
   pre-rendered prose is English (the schema's own `description`), marked `lang="en"`; the
   language switch replaces it as it does today.

Cost: ~63KB of English prose. Page goes 8KB → ~71KB, roughly 15KB gzipped. Accepted.

## Two blockers the report did not see

**(a) It violates the project's hard rule.** `versionPages()` does
`.replace(new RegExp(LATEST, "g"), version)` — a mass substitution of the version string. Ten
field descriptions say "New in v0.5": `speakers`, `offers[].scope`, `partOf`, `partOf.offers`,
`partOf.offers[].scope`, `recordings`, `contributing`, `covers`, `alternates`,
`feed.contributing`. Pre-render those and then run the global replace, and `/spec/v0.1/` claims
"New in v0.1". It is the `copyleft-next-0.3.0` → `0.4.0` failure again: a version number inside
a datum is not OTE's version. Hence step 2's ordering — empty the slot, replace, then fill.

**(b) It breaks a gate that already exists.** `scripts/validate.mjs` lists
`docs/spec/index.html` in `CURRENT_SPEC_PAGES`, where no file may name a version other than
`LATEST`. Those same ten descriptions tip it over the moment they are pre-rendered. The correct
fix is to have `withoutComments()` also strip the generated slot, with a comment explaining
why: a version named inside the slot is generated data from that version's schema, the same
reasoning that protects the generated enums. Do not shorten the list and do not relax the check.

On their `--check` constraint: it holds for free. The orchestrator already diffs the
per-version pages; add `docs/spec/index.html` to that same loop and a stale slot fails on its own.

## Naming convention — published, documented here, not chosen here

`<schema>-<path>`, where `path` is the schema-model path **verbatim**: dots and `[]` included.

```
#event-speakers                      #feed-alternates
#event-partOf.offers                 #event-speakers[].affiliation
#event-image[].translations.*.alt
```

47 of the 120 ids contain characters a browser percent-encodes. That works: the code uses
`getElementById` with `decodeURIComponent`, never a CSS selector. Keep them verbatim rather than
sanitising to `event-speakers-affiliation`, for two reasons. The verbatim path is exactly the
cell `reference.<lang>.md` prints, so a reader converts table row → link mechanically. And it is
already live: sanitising now breaks links that already exist.

## Worth doing alongside

- `<link rel="alternate" type="text/markdown" href="/llms/reference-<version>.md">`, plus a
  visible link. Cheap, and already suggested in #53.
- **Fix the silent fragment**, which is the bug that let both sides be right. An unresolved hash
  should say "no field named `X` in v0.6" — and, if another version's model has it, say which.
  That converts a silent failure into an answer.

## Verification

The reporter's single command is correct but insufficient. The full set:

```bash
grep -c 'id="event-speakers"' docs/spec/index.html          # 1
grep -c 'id="feed-alternates"' docs/spec/index.html         # 1
grep -o 'New in v0\.[0-9]' docs/spec/v0.1/index.html        # empty  ← the hard rule
grep -c 'id="event-speakers"' docs/spec/v0.1/index.html     # 0 — did not exist in v0.1
grep -c 'id="event-title"' docs/spec/v0.1/index.html        # 1
npm run build-reference -- --check                          # ok
sed -i '' 's/id="event-speakers"/id="x"/' docs/spec/index.html
npm run build-reference -- --check                          # FAIL (stale)
npm run validate                                            # ok
```

And, once deployed, the one the reporter asked for:

```bash
curl -sL https://opentechevents.org/spec/ | grep -c 'id="event-speakers"'   # 1
```

---

# Task 2 — no URL means "the v0.6 field reference"

Status: plan, not implemented. Same track and same reporter as the task above.
Reviewed 2026-11-06. Verdict: **the report is correct as written** — nothing to correct in its
premises, which is worth saying explicitly given the three false ones in task 1.

## Verified

```
/spec/        200
/spec/v0.1/   200   …   /spec/v0.5/   200
/spec/v0.6/   404
<title> on /spec/ → "OTE Spec v0.6 — field reference"
hosting: GitHub Pages (server: GitHub.com, Fastly edge) — no native redirects,
         no _redirects, no netlify.toml, no vercel.json
```

Deliberate, per `versionPages()`: `VERSIONS.filter((v) => v !== LATEST)`, because `/spec/` is
already the latest.

## Why it is worth re-examining

Not "a page is missing". The sharp point, which the report states and which is the reason to act:
**the same URL 404s today and resolves later**, with nothing about v0.6 having changed. Confirmed
mechanism — when 0.7 forks, `versionPages()` stops filtering v0.6 and generates it from the
then-current template with `.replace(/v0\.7/g, "v0.6")`. Retroactive appearance.

For anyone citing in an issue, a blog post or a skill file, a 404 that heals itself is
indistinguishable from a made-up URL. And citations to "the current version" are precisely the
ones that rot: `/spec/` will silently mean 0.7 for every link already written.

## Options

**(b) redirect `/spec/v0.6/` → `/spec/`** — ruled out by hosting. GitHub Pages has no redirects;
meta-refresh is the hack, and the report already calls it bad for citations. It is worse than it
says: **a meta-refresh drops the fragment**, so `/spec/v0.6/#event-speakers` would land at the top
of `/spec/`. That is task 1's silent-fragment failure, reintroduced through the back door.

**(c) invert — `/spec/` redirects to `/spec/<latest>/`** — cleanest invariant, and the choice if
this were greenfield. It is not. Costs: it needs the same meta-refresh with the same fragment
loss; it breaks the deep link everyone has already written (`/spec/#event-speakers` is the URL
from task 1's report — the one that must start working, not start bouncing); and it gives away
the short URL. Three real costs for an invariant that (a) gets with a one-line filter change.

**(d) document "cite the frozen GitHub path"** — no, for three reasons. The path it proposes,
`blob/main/spec/v0.6/README.md`, is on `main`: a moving ref. What is frozen is the directory's
policy, not the URL. `README.md` is the normative prose, not the field table — someone citing a
field wants `reference.en.md` or the page. And above all it does not change what people paste,
which is `/spec/#event-speakers`.

**(a) generate the latest's page too — chosen.**

## Design

`versionPages()` stops filtering and generates all six. Two rules keyed on `version === LATEST`:

- **canonical** → `https://opentechevents.org/spec/` when LATEST, otherwise self. This settles
  the duplicate-content split the report anticipates, and has a property it does not mention:
  **it self-heals at fork time.** The day 0.7 ships, v0.6 stops being LATEST, is regenerated, and
  its canonical becomes self-referential — exactly when it stops being an alias and becomes the
  original.
- **the global version replace** is the identity for LATEST (`v0.6`→`v0.6`), so it does not touch
  the hard rule. But with task 1's pre-rendered slot in place, task 1's ordering (empty → replace
  → fill) remains mandatory.

Everything else is free: the injected `<meta name="ote-spec-version" content="v0.6">` resolves
`DATA_URL` to `../../data/reference-v0.6.json`, which is already generated for every version. The
version picker keeps offering `/spec/` for the current one, so the friendly URL is untouched.

**Addition not in the report, and the one that actually closes its originating complaint** ("an
agent could not tell which spec version that page described"): a visible, generated permalink next
to the version picker, pointing at `/spec/<LATEST>/`. `/spec/v0.6/` existing does not help if
nobody reading `/spec/` knows it exists. The canonical tells a crawler; a human and an agent need
to see it.

## What happens to existing links the day 0.7 ships

| URL written today | After 0.7 |
| --- | --- |
| `/spec/` | Comes to describe 0.7, silently. **Unchanged from today** — (a) does not fix this, and must not: that is what the URL means. What changes is that there is now an alternative. |
| `/spec/v0.6/` | Still resolves, still means v0.6. Canonical flips to self. A stable citation. |
| `/spec/v0.6/#event-speakers` | Same, and with task 1 the field is in the first byte. |
| `/spec/#event-speakers` | Resolves against 0.7. If 0.7 renames `speakers`, the unresolved-fragment notice from task 1 says "no such field in v0.7" instead of silently sitting at the top. |

## Enforcement in `--check`

Two things — one free, one explicit, because the free one does not cover the real failure mode:

1. Dropping the filter puts `docs/spec/v0.6/index.html` into the diff loop that already exists,
   so a stale or missing page fails on its own.
2. A new assertion: **every version in `model.versions` has a page, and exactly one canonical
   across them points at `/spec/`.** That is what catches a future refactor re-special-casing
   LATEST, or putting the canonical in two places at once.

```bash
test -f docs/spec/v0.6/index.html
grep -l 'canonical" href="https://opentechevents.org/spec/"' docs/spec/*/index.html | wc -l   # 1
grep -o 'canonical[^>]*' docs/spec/v0.5/index.html                 # .../spec/v0.5/
rm docs/spec/v0.6/index.html && npm run build-reference -- --check # FAIL
npm run build-reference && npm run validate                        # ok
# after deploy
curl -sIL -o /dev/null -w '%{http_code}\n' https://opentechevents.org/spec/v0.6/   # 200
```

## Adjacent, mentioned once

There is no `sitemap.xml` and no `robots.txt`. With seven spec pages and canonical rules in play,
a generated sitemap would help task 1's crawler case. Optional, not required by either task.

---

# Task 3 — `speakers` on the parent document: importer vs prose

Status: plan, not implemented. Reviewed 2026-11-06. Same reporter; **different track** — this one
touches `spec/`, the other two do not. Nothing here is applied to a published version; see the
freeze rule below, which is the main output of this review.

## The reported conflict

`spec/v0.6/event.schema.json`, `speakers.description`:

> "One document is one occurrence, so in a multi-part conference the speakers of a given talk live
> on that talk's document, not on the parent."

`@opentechevents/import-jsonld@0.6`, against biznagafest.com (one schema.org `Event`, 17
`performer`, no `subEvent`, agenda in HTML prose), maps all 17 to `speakers` on the conference
document. The reporter asks whether the rule or the tool wins.

## Question 2 first — the importer is right, change nothing

Confirmed, with a stronger argument than the report uses: `spec/v0.6/DECISIONS.md` **D034** is this
exact conference — "each of the 17 talk documents carried a permanent `url`/`image` warning". So
the 17-talk-documents-with-`partOf` shape is already contemplated and already cost a decision,
which means the conference-level document exists as a document in its own right.

An importer handed 17 `performer` and no `subEvent` has no information to distribute them.
Inventing 17 talk documents from HTML prose is fabricating data. The missing per-talk attribution
is a loss in the **source**, not in the importer.

One addition, outside the document: the importer's report should say "source publishes no
`subEvent`; per-talk attribution unavailable". That turns a silent loss into a declared one.

## The contradiction is not one — but the gap is real

Read the sentence precisely: *"in a multi-part conference …"*. It is a conditional, and its
antecedent **does not hold** in the importer's case: a document with no parts is not a parent. In
OTE, parenthood is conferred by *another* document pointing at you with `partOf`; a standalone
whole-conference document is the occurrence, and its speakers are the people on stage. The rule
says nothing about that case.

Against the project's three categories: **mostly category 3** (blind-reader misunderstanding — the
answer is derivable, via `partOf`'s definition), **with a real category-1 residue**: the spec never
states the complementary positive rule, and deriving "I am not a parent" requires knowing that
parenthood comes from outside the document. So the reporter's diagnosis — *a sentence is missing* —
is right, even though its premise — *the importer contradicts the prose* — is not.

The resolution space in the report confirms it: "drop the speakers, or restructure the event" are
the only two exits if the sentence is read as a prohibition. The third, keep them, is the correct
one and no text supports it today.

## Question 1 — the freeze rule, which is the real question

Facts first, because they change the framing:

```
npm @opentechevents/schema@0.6.0 → published 2026-11-03T21:58:58Z
  integrity sha512-3aeCvRm/ERVP+023CKsI2VOIEqkEKM5lqW9wnt82R7WMcEZdyqGdZCTjylJKYTkIu3ne46PnPlXMGUzfa3lyug==
  "files" ships spec/v0.6/*.json AND spec/v0.6/README.md
tag schema-v0.6.0 → f81a190 (= HEAD, 2026-11-03)
package.json      → 0.6.0
docs/schema/v0.6/event.schema.json ↔ spec/v0.6/event.schema.json → byte-identical
commits touching spec/v0.6 after its tag → none (nor spec/v0.5 after its own)
```

**The npm publish is the anchor, not the tag.** A git tag can be force-moved; an npm version can
never be changed and carries an integrity hash. The tag is only the repo-side marker, which must
agree with it. Both artefacts the report worried about — "consumers may hash or cache it" — are
already out.

Two reasons a change to a `description` **does** count as touching the version:

- **The `$id`'s granularity is the minor.** `https://opentechevents.org/schema/v0.6/event.schema.json`
  is one URL per minor, and `docs/schema/v0.6/` is its byte-identical copy. Changing bytes inside a
  published minor means two different files answer to one `$id` — precisely the integrity the
  per-version `$id` exists to provide. There is no patch-level escape either: a `0.6.1` would serve
  different bytes **at the same `$id`**, invisible to anyone resolving the schema.
- **In this repo `description` is not non-normative in practice.** `build-reference.mjs` generates
  `spec/v0.6/reference.en.md`, `reference.es.md` and the website table **from those strings**. The
  `description` *is* the published field reference. The normative/non-normative distinction the
  report proposes is one the toolchain does not make.

A third, design reason: a "clarifications only" carve-out is unenforceable. Every edit looks like a
clarification to its author.

### The rule, written down so nobody re-asks

> **Freeze attaches when the version is published to npm, and is byte-for-byte over the whole
> directory.** The `schema-vX.Y.0` tag is the repo-side marker of that moment and must agree with
> it; the npm version is the part that cannot be undone. There is no exception for `description`,
> for non-normative prose, or for correcting a demonstrable error. OTE's `$id` has minor
> granularity, so no byte change inside a published minor is distinguishable to a consumer: a
> correction goes into the next version, and anything urgent goes into an **erratum**, which is a
> new artefact and modifies no existing one.

**Why a patch release is not the escape hatch.** A `0.6.1` would be a new immutable npm version
shipping different bytes under the same `$id` `/schema/v0.6/`. The outcome is not a correction: it
is two immutable tarballs in circulation disagreeing about what v0.6 says, plus one URL that
matches only one of them. Worse than the error it set out to fix.

### The consequence the report will not like

Its fallback — "an immediate note in the v0.6 README" — **is forbidden by the same rule**.
`spec/v0.6/README.md` is inside the frozen directory. And there is no errata mechanism in the repo:
checked, none exists, and the CHANGELOG has no `## [Unreleased]` section either.

Here is the argument that the mechanism is needed regardless of `speakers`: **`spec/v0.6/README.md:25`
is wrong today, and it is inside the immutable tarball** — `files` publishes
`spec/v0.6/README.md`, so anyone running `npm i @opentechevents/schema` reads it today and always
will. It is un-updated copy-paste from the v0.5 fork — it says `v0.1`–`v0.4` are frozen
(v0.5 missing), that "future changes will go to `spec/v0.6/`" (we are *in* v0.6), and that all this
"lets a document say `specVersion: "0.5.0"`". It is exactly the line the reporter quotes as the
freeze rule. Under the rule above it **does not get fixed either**: it ships as an erratum. That is
uncomfortable and it is correct — a demonstrably false paragraph staying put is what freezing
means, and it is why the mechanism has to exist.

**Proposal:** `ERRATA.md` at the repo root, grouped by version, each entry dated and stating what
the published text says versus what it should say; an `## [Unreleased]` CHANGELOG section
referencing it; and task 2's `/spec/vN.N/` pages linking it. Two opening entries: the `speakers`
sentence and paragraph 25.

## For v0.7 — candidate D043

Replacement for the sentence in the `description`:

> ~~One document is one occurrence, so in a multi-part conference the speakers of a given talk live
> on that talk's document, not on the parent.~~
>
> **`speakers` describes the occurrence this document describes.** Where the parts have documents
> of their own, a talk's speakers live on that talk's document rather than being duplicated onto
> the parent — otherwise nobody can tell who speaks when. A document that covers the whole event
> carries the whole event's speakers: that is what an import from a source asserting them at the
> top level (schema.org `performer` with no `subEvent`) yields, and it is valid, not a modelling
> error.

The distinguishing principle introduces no new concept, which is what makes it cheap: *speakers
belong to the occurrence the document describes.* What the original sentence meant to forbid stays
forbidden.

## Enforcement

The reporter asked for `build-reference -- --check`, but that is not the gate here: freezing is
checked against git, in `validate.mjs`.

```bash
for v in v0.1 v0.2 v0.3 v0.4 v0.5 v0.6; do
  git diff --quiet "schema-${v#v}.0" -- "spec/$v" || echo "FAIL $v drifted from its tag"
done
# plus: every version cited in ERRATA.md exists under spec/
# plus: no published npm version is ever re-released, and no schema-* tag is ever force-moved —
#       the loop above only detects drift while the tag still marks the published bytes.
```

CI detail: `actions/checkout@v4` does not fetch tags by default. `validate-spec.yml` needs
`fetch-depth: 0`, or the check passes vacuously — a gate that always says ok.

## Resolved: is v0.6 frozen?

**Yes.** Decided 2026-11-06 on the evidence above: `@opentechevents/schema@0.6.0` is published and
immutable, and it ships both the schemas and `spec/v0.6/README.md`. So the `speakers` sentence goes
to v0.7 as D043, and `ERRATA.md` is required rather than optional.

One edit this *does* authorise: `spec/README.md` calls v0.6 "Current" while it is published and
immutable, which is the ambiguity that made this question necessary. That file sits outside the
version directories and is not in the npm `files` list, so it is editable — and it is where the
freeze rule above should be written down.
