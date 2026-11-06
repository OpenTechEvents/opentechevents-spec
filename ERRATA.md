# Errata — OTE Spec

A published version is frozen: once `@opentechevents/schema@X.Y.0` is on npm, no byte under
`spec/vX.Y/` changes again. The rule is in [`spec/README.md`](spec/README.md#a-published-version-is-frozen)
and it has no exception for a `description`, for non-normative prose, or for correcting a
demonstrable error — OTE's `$id` has minor granularity, so a byte change inside a published minor
is invisible to anyone resolving the schema, and a patch release would only put two immutable
tarballs in circulation disagreeing about what that version says.

So this file exists instead. **An erratum does not modify anything**: it records what the published
text says, what it should have said, and where the correction actually lands. It is the only
mechanism this repo has for a published version being wrong, and it is append-only.

What belongs here: a statement in a published version that is false, misleading, or says the
opposite of what the toolchain does. What does not: a field someone wishes existed (that is an
issue), or a change of mind about a design (that is the next version's `DECISIONS.md`).

Newest version first. Within a version, newest entry first.

---

## v0.6

### E-0006-02 — `speakers` reads as forbidding what a valid import produces

*Recorded 2026-11-06.*

**Where:** `spec/v0.6/event.schema.json`, `properties.speakers.description` — and therefore
`spec/v0.6/reference.en.md`, `reference.es.md` and the field reference on the website, all of
which are generated from that string.

**What it says:**

> One document is one occurrence, so in a multi-part conference the speakers of a given talk live
> on that talk's document, not on the parent.

**Why that is a problem:** the sentence is a conditional — *"in a multi-part conference …"* — and
nothing states the complementary positive rule. A reader who has a single document describing a
whole conference, with its speakers at the top level, has no sentence to point at. Deriving "I am
not a parent" requires knowing that parenthood is conferred from outside the document, by *another*
document pointing at you with `partOf`. That is derivable from `partOf`'s own definition, and it
was not derived by the first external integrator to try: an importer fed one schema.org `Event`
with 17 `performer` and no `subEvent` mapped all 17 to `speakers` on the conference document, and
its author could not tell from the spec whether the tool or the rule was wrong.

**What it should say** (the replacement is a candidate for v0.7, filed as **D043**):

> `speakers` describes the occurrence this document describes. Where the parts have documents of
> their own, a talk's speakers live on that talk's document rather than being duplicated onto the
> parent — otherwise nobody can tell who speaks when. A document that covers the whole event
> carries the whole event's speakers: that is what an import from a source asserting them at the
> top level (schema.org `performer` with no `subEvent`) yields, and it is valid, not a modelling
> error.

**In the meantime, for implementers:** the importer behaviour above is correct and must not be
"fixed" by dropping parent-level speakers or by inventing per-talk documents from HTML prose. A
source that publishes no `subEvent` carries no per-talk attribution to import; that is a loss in
the source, and the right thing for a tool to do is declare it ("source publishes no `subEvent`;
per-talk attribution unavailable"), not fabricate it.

### E-0006-01 — the freeze paragraph in `spec/v0.6/README.md` describes v0.5

*Recorded 2026-11-06.*

**Where:** `spec/v0.6/README.md`, the paragraph about frozen versions. It ships inside the
published tarball — `files` includes `spec/v0.6/README.md` — so `npm i @opentechevents/schema`
delivers it, today and permanently.

**What it says:** that `v0.1`–`v0.4` are frozen, that future changes will go to `spec/v0.6/`, and
that this is what lets a document declare `specVersion: "0.5.0"`.

**Why that is a problem:** three things in one paragraph are false in v0.6. `v0.5` is frozen too
and is missing from the list; `spec/v0.6/` is not where future changes go, it is the version the
paragraph is *in*; and the `specVersion` it illustrates is the previous one. It is un-updated
copy-paste from the v0.5 fork, and it is the paragraph a reader looks at precisely when they want
to know what freezing means.

**What it should say:** the list ends at the version before the one being read, future changes go
to the *next* directory, and the `specVersion` example is this version's. The fork procedure in
[`AGENTS.md`](AGENTS.md) is where that has to be enforced, because this is the second time a fork
carried the paragraph over unchanged.
