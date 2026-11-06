# Specification — OpenTechEvents (OTE Spec)

> ✅ **The current specification is [`v0.6/`](v0.6/)** — executable schemas, normative prose and examples validated in CI. [`v0.1/`](v0.1/) through [`v0.5/`](v0.5/) are frozen. What changed: [CHANGELOG](../CHANGELOG.md).

Each published version lives frozen in its own folder and under its own `$id`. A document declares which one it adheres to with `specVersion`, so **nothing breaks when a new version is published**.

| Version | Status |
| --- | --- |
| [`v0.6/`](v0.6/README.md) | **Current** — and frozen: `schema-v0.6.0`, on npm. Schemas, normative prose, recommended-field profiles and examples. |
| [`v0.5/`](v0.5/README.md) | Frozen — `schema-v0.5.0`, on npm. |
| [`v0.4/`](v0.4/README.md) | Frozen. |
| [`v0.3/`](v0.3/README.md) | Frozen. |
| [`v0.2/`](v0.2/README.md) | Frozen. |
| [`v0.1/`](v0.1/README.md) | Frozen. |

## A published version is frozen

**Freeze attaches when the version is published to npm, and it covers the whole directory, byte for
byte.** The `schema-vX.Y.0` tag is the repo-side marker of that moment and must agree with it; the
npm version is the part that cannot be undone, because an npm version is immutable and carries an
integrity hash. "Current" and "frozen" are not opposites, and the current version is both: it is
what new documents should declare, and it is already published.

There is **no exception** — not for a `description`, not for prose a reader might call
non-normative, not for correcting a demonstrable error. Two reasons:

- **The `$id` has minor granularity.** `https://opentechevents.org/schema/v0.6/event.schema.json`
  is one URL per minor, and `docs/schema/v0.6/` is its byte-identical copy. Change bytes inside a
  published minor and two different files answer to one `$id`, which is the exact integrity the
  per-version `$id` exists to provide. A patch release is not an escape hatch either: `0.6.1` would
  be a second immutable tarball serving different bytes under the *same* `$id`, so instead of one
  correction there are two published versions disagreeing about what v0.6 says, and one URL that
  matches only one of them.
- **`description` is not non-normative in practice.** `scripts/build-reference.mjs` generates
  `reference.en.md`, `reference.es.md` and the website's field table from those strings. The
  `description` *is* the published field reference, whatever a reader calls it.

A "clarifications only" carve-out would not survive contact with reality: every edit looks like a
clarification to whoever is making it.

`npm run validate` enforces this from **v0.4** onward: each of those directories must be
byte-identical to its `schema-vX.Y.0` tag, and a published version with no tag fails too. The
earlier ones predate the rule and are not reconciled: nothing in production declares them that the
rule would protect, and the time is better spent making sure it cannot happen again.

So a correction goes into the **next** version, and anything that cannot wait goes into
[`../ERRATA.md`](../ERRATA.md) — a new file that states what the published text says and what it
should say, and modifies nothing. That is what it means for a demonstrably wrong paragraph to stay
where it is.

## The earlier sketch, removed

`data-model.md`, `feed.md` and `examples/` used to live here: an AI-generated sketch, kept for a while for its historical value and never normative. They were removed because they described a model that **no longer validates** against the published schema, and a reader who copied them ended up with a document the validator rejects — which is the opposite of what a spec folder is for.

Nothing is lost: they are in the history, at the last commit that contained them —
[`f8c4ef5`](https://github.com/OpenTechEvents/opentechevents-spec/tree/f8c4ef54be2279767ec82d3502855de08b572e9e/spec).

The ideas they carried that have not made it into the spec yet (speakers, promotion, governance, sponsors) are still open and are tracked in [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5), which is where they belong: a proposal under discussion, not a document that looks like a specification.

The research those documents started from is in [`../research/`](../research/), which is still current.
