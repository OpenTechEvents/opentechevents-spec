# Specification — OpenTechEvents (OTE Spec)

> ✅ **The current specification is [`v0.6/`](v0.6/)** — executable schemas, normative prose and examples validated in CI. [`v0.1/`](v0.1/) through [`v0.5/`](v0.5/) are frozen. What changed: [CHANGELOG](../CHANGELOG.md).

Each published version lives frozen in its own folder and under its own `$id`. A document declares which one it adheres to with `specVersion`, so **nothing breaks when a new version is published**.

| Version | Status |
| --- | --- |
| [`v0.6/`](v0.6/README.md) | **Current.** Schemas, normative prose, recommended-field profiles and examples. |
| [`v0.5/`](v0.5/README.md) | Frozen — `schema-v0.5.0`, on npm. |
| [`v0.4/`](v0.4/README.md) | Frozen. |
| [`v0.3/`](v0.3/README.md) | Frozen. |
| [`v0.2/`](v0.2/README.md) | Frozen. |
| [`v0.1/`](v0.1/README.md) | Frozen. |

## The earlier sketch, removed

`data-model.md`, `feed.md` and `examples/` used to live here: an AI-generated sketch, kept for a while for its historical value and never normative. They were removed because they described a model that **no longer validates** against the published schema, and a reader who copied them ended up with a document the validator rejects — which is the opposite of what a spec folder is for.

Nothing is lost: they are in the history, at the last commit that contained them —
[`f8c4ef5`](https://github.com/OpenTechEvents/opentechevents-spec/tree/f8c4ef54be2279767ec82d3502855de08b572e9e/spec).

The ideas they carried that have not made it into the spec yet (speakers, promotion, governance, sponsors) are still open and are tracked in [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5), which is where they belong: a proposal under discussion, not a document that looks like a specification.

The research those documents started from is in [`../research/`](../research/), which is still current.
