# How to contribute

Thanks for dropping by. OTE Spec is in its **design phase**: nothing is settled, which is why an opinion is worth more than a *pull request* right now. If you organise events, run a directory or maintain a tool, you have exactly the context this project is missing.

> ⚠️ **Important notice.** The current specification is **[OTE Spec v0.6](spec/v0.6/README.md)** and it is a **`0.x` draft: it can break without warning**. It was published so that real implementations exist and so they break whatever is wrong. The debate is still open in issues [#5 (event)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) and [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).
>
> The earlier, non-normative sketch that used to live in `spec/data-model.md`, `spec/feed.md` and `spec/examples/` has been removed — see [`spec/README.md`](spec/README.md) for where it went and why. Only `spec/v0.6/` is current; older published versions stay frozen under `spec/v0.*/`.

## What is most needed right now

In this order:

1. **Real cases that break the model.** An event of yours that the current spec cannot describe is extremely valuable information. Tell us about it even if you bring no solution.
2. **People saying they would adopt it.** A "we'll publish this once there is a stable spec" takes two minutes, and it is what makes a directory decide this format is worth reading. See [supporting without publishing anything](#supporting-without-publishing-anything).
3. **Communities willing to publish a feed.** A standard with no real data is theory. See [adopting it](#adopting-it-publishing-your-events-in-ote).
4. **Consumers.** Directories, newsletters or bots that read OTE feeds. Every consumer makes adopting it more worthwhile.
5. **Getting the word out.** Nobody gives feedback on something they have never heard of. See [outreach and ambassadors](#outreach-and-ambassadors).
6. **Ecosystem tools.** The catalogue is in [`docs/data/tools.json`](docs/data/tools.json), rendered at [opentechevents.org#tools](https://opentechevents.org#tools).
7. **Code and documentation.** It will come, but it comes after all of the above.

## Every way to take part

Each row is a different way in, ordered from least to most effort. **None of them is a required step towards the next**: come in wherever you feel like.

| What | How long it takes | Where |
| --- | --- | --- |
| Pledge to adopt it once there is a stable spec | 2 min | [support issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) |
| Tell us on a call instead of in writing | 20 min | [book a slot](https://calendar.app.google/ZQuRkVw53h8nC2uQA) |
| Give a publishable testimonial | 5 min | [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions) |
| Put the badge in your README | 1 min | [`docs/badge/`](docs/badge/README.md) |
| Tell us about an event of yours the spec cannot describe | 10 min | [real-case issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=case.yml) |
| Review the spec when it touches your case | reactive | [support issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) ("advisor") |
| Introduce us to a directory, platform or conference | 1 message | [ambassador issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml) |
| Talk about this (a talk, an article, a podcast, a thread) | varies | [ambassador issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml) |
| Translate the website or the field descriptions | 1-3 h | [translating](#translating) |
| Debate the specification | varies | [issues](https://github.com/OpenTechEvents/opentechevents-spec/issues) |
| Publish a feed | ~1 h | [adopting it](#adopting-it-publishing-your-events-in-ote) |
| Consume feeds (a directory, a bot, a newsletter) | days | [consumer issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=consumer.yml) |
| Build a tool | days | [tool issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=tool.yml) |

Would you rather talk it through than write an issue? **[Book 20 minutes](https://calendar.app.google/ZQuRkVw53h8nC2uQA)** and that's it. People who organise events have better things to do than learn our templates. If none of the slots work for you, open a [thread in Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions) and we'll find one.

## How to take part

### Supporting without publishing anything

You don't have to publish a feed for your support to count. A young standard dies of two things: nobody knowing about it, and nobody believing anyone will ever use it. Against the second there is only one remedy, and that is **saying so in public**.

Open a [support issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) and tick whatever fits:

- **A pledge** — "we will publish (or consume) OTE once there is a stable spec". It is not binding: you withdraw it by commenting on the same issue. It is listed **separately** from those already publishing, because promising and doing are not the same thing and mixing them would be a lie.
- **Support** — you like the idea and want to appear backing it.
- **Advice** — you are not going to implement anything, but you review drafts and bring your real case when the spec touches your territory.
- **Resources** — hosting, a domain, design, illustration, a legal or accessibility review, a dump of historical events to test against, a slot at your event, a room for an adoption workshop. Not everything useful is code.

And if you have a publishable sentence about why this matters in your community, leave it in [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions): testimonials are reviewed **by hand** and moved into [`docs/data/consumers.json`](docs/data/consumers.json) with your explicit permission.

All of this appears at [opentechevents.org#support](https://opentechevents.org#support), from [`docs/data/supporters.json`](docs/data/supporters.json).

### Outreach and ambassadors

Nobody gives feedback on something they have never heard of. Right now **outreach pays off more than code**: [ambassador issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml).

- **Talk about this.** A talk, a lightning talk, an article, a newsletter, a podcast, a thread. **Ask us for the material**: slides, a demo, a diagram, half an hour to get you up to speed, or someone to co-present with you. If you have to build the material yourself, you won't do it, and rightly so.
- **Introduce us to someone.** This is the most valuable thing and the one that costs least. If you know whoever maintains a directory, a calendar, an event platform or a conference website, **one message from you is worth more than fifty cold emails from us**.
- **Open an issue on a third-party project** asking for OTE support. Tell us where and we'll give you the text; it carries far more weight coming from someone who already uses that project than from us.
- **Put the badge** in your README or in your site's footer: [`docs/badge/`](docs/badge/README.md). It is the only thing on this list that keeps working while nobody is looking.
- **Translate** into a third language: it opens up a whole region of communities. See [translating](#translating).

Ambassadors are listed on the website and recognised with [all-contributors](https://allcontributors.org) (`talk`, `blog`, `translation`, `ideas`…). If you have done something and you are not there, say so: it is an oversight.

### Debating the specification

**Open an [issue](https://github.com/OpenTechEvents/opentechevents-spec/issues)** (or comment on an existing one). The proposal does not have to be polished, and you do not have to know about standards. What does help a change move forward:

- **The real case behind it.** "In my community we do X and I don't know how to represent it" carries more weight than "a Y field is missing".
- **What breaks if it isn't fixed.** Is information lost? Does an importer invent a value? Does an event show up wrong in a directory?
- **How others solve it.** If iCalendar, schema.org or RSS already have a solution for that, say so: compatibility is a design principle, not an extra.

**A real case is worth more than a proposed field.** If your event does not fit in the spec, tell us even if you bring no solution: that is exactly what we need, and it has [a template of its own](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=case.yml).

### Changing the specification

A change to the spec is **not just editing a `.md`**. The current version has four pieces that validate against each other, and **they go in the same PR**:

| Piece | File |
| --- | --- |
| The executable schema | `spec/v0.6/event.schema.json` / `feed.schema.json` |
| The normative prose (what a validator cannot check) | `spec/v0.6/README.md` |
| The examples, including those that **must fail** | `spec/v0.6/examples/` and `examples/invalid/` |
| The example's entry in the website gallery (EN + translations) | `spec/<version>/examples/catalog/` → `npm run build-examples` |
| The Spanish reference translation for any new field | `spec/<version>/i18n/es.json` → `npm run build-reference -- --check` |
| The published copies (the `$id`s must resolve) | `docs/schema/` → `npm run publish-schemas` |

Before submitting: `npm run validate`. **If the change does not come with an example demonstrating it, it is not finished** — and if it relaxes a rule, remove the example in `invalid/` that must no longer fail.

**A new field is declared where it belongs.** The order in which the schema declares its `properties` is the canonical field order: the generated reference and the editor's autocompletion inherit it, and the examples must follow it (`npm run validate` fails otherwise). It is explained, with its blocks and the reasoning, in ["Field order"](spec/v0.6/README.md#field-order-is-not-normative-but-there-is-one). Putting it at the end "because it's new" is the one thing that does not work.

**Adding a field does not require changing the schema.** The schemas do not forbid additional fields: if your community needs `tags` or `cfp` today, you add them and your document stays valid. The spec grows with **fields somebody already really uses**, not with fields we imagine will be needed. Bring the real usage and we'll talk about standardising it.

**The candidates already being watched** are on the [suggested extensions page](https://opentechevents.org/extensions/), backed by `docs/data/suggested-extensions.json`. Each has a recommended shape to copy and an adoption count that `npm run scan-extensions` writes from the registered adopter feeds — **the count is never hand-edited**. To propose a new candidate, add an entry (everything except `observedAdoption`) in a PR. A field moves from `gathering-evidence` to `proposed-for` only via a normal spec-change PR, and to `graduated` only when it ships in a version. The maintainer owns the file; CI owns the number.

### Versioning

- **`0.x` can break.** There is no compatibility commitment until 1.0.
- **A published version is not touched.** Breaking changes go into the next directory (`spec/vN.N/`), not on top of the published one. That is what lets a document say `specVersion: "0.6.0"` and lets someone know three years from now what to validate it against.
- Corrections that do **not** change which documents are valid (a typo in the prose, a description) do go on top of the current version.

### Adopting it: publishing your events in OTE

Three steps, explained in detail at [opentechevents.org](https://opentechevents.org#adopt):

1. Publish a JSON file with your events at a URL you control — and serve it with `Access-Control-Allow-Origin: *` so browser-based readers can fetch it too: [how and why](https://opentechevents.org/#serving).
2. Link it from your site's `<head>` so tools discover it on their own.
3. **Register it** with the [form](https://opentechevents.org/register/) — which fills the issue in for you — or directly with the [adopter template](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=adopter.yml), so we can validate it and list you on the website.

**Validate your feed before opening the issue.** Clone this repo and hand it your file:

```bash
npm install
npm run validate -- my-feed.json
```

It detects whether it is a standalone event or a feed, and tells you what is missing (`data/events/0 must have required property 'timezone'`). From code, with the `@opentechevents/schema` package: see [spec/v0.6/README.md](spec/v0.6/README.md#consuming-the-schemas).

> 🗓️ **Already have an `.ics` and don't want to write JSON?** The aggregator — which converts existing calendars to OTE — is one of the catalogue's tools and is **still to be built**. Tell us your calendar's URL in a [support issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) and we'll register it as a source as soon as it exists: it is the cheapest way in and commits you to nothing.

When registering a source that is not yours, bear in mind that the aggregator **will only ingest data with a declared open licence or with the organiser's explicit permission** — and that a public `.ics` is not automatically reusable (many platforms' terms of service restrict it).

### Appearing on the website

The website's lists come from four JSON files. Adding yourself is a one-entry PR:

| File | For |
| --- | --- |
| [`docs/data/adopters.json`](docs/data/adopters.json) | Communities that **already publish** their events in OTE |
| [`docs/data/supporters.json`](docs/data/supporters.json) | Whoever supports the project: adoption pledges, endorsements, ambassadors, advisors, resources |
| [`docs/data/consumers.json`](docs/data/consumers.json) | Whoever consumes OTE feeds (directories, apps, people) and their testimonials |
| [`docs/data/tools.json`](docs/data/tools.json) | Ecosystem tools |

Free-text fields accept `{ "en": "…", "es": "…" }`. Details and examples in [`docs/README.md`](docs/README.md). If you would rather not touch JSON, open the matching issue and we'll add it for you.

### Claiming or proposing a tool

The catalogue is in [`docs/data/tools.json`](docs/data/tools.json) and rendered at [opentechevents.org#tools](https://opentechevents.org#tools). **None of the ideas marked *proposed* has an owner.** If you want to take one on, **[open an issue saying so](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=tool.yml)** before you start: it saves duplicated work and it is how the scope gets agreed.

### Translating

English and Spanish. There are **three separate places**, and they don't mix:

| What | Where |
| --- | --- |
| The website's copy | [`docs/i18n/`](docs/i18n/) — see [`docs/README.md`](docs/README.md) |
| The descriptions of the spec's fields | [`spec/v0.6/i18n/`](spec/v0.6/i18n/) |
| The entries in the example gallery | [`spec/v0.6/examples/catalog/`](spec/v0.6/examples/catalog/) |

The `description`s **inside the schemas stay in English**: they travel in the npm package to implementers all over the world. Translations live apart, indexed by field, and `npm run validate` **fails if any is missing**. After translating: `npm run build-reference` regenerates `reference.<language>.md` and the reference page, and `npm run build-examples` regenerates the gallery at <https://opentechevents.org/examples/>.

**A new language?** It is possible, and it is needed: each language opens up a whole region of communities. Add `docs/i18n/<code>.json`, put the code in `SUPPORTED` in [`docs/app.js`](docs/app.js) and add the button to the `.lang` group. Say so in an issue first: we have to decide whether that language is also maintained in the spec, not only on the website, because a half-finished translation ages worse than not having one.

## Pull requests

For small changes (typos, broken links, an entry in a list, a translation), send the PR straight away.

For anything touching **the specification**, open an issue first. A PR to the data model with no prior debate is very likely to stall, not out of bureaucracy but because agreement is precisely the hard part.

- One branch per change, from `main`.
- Commit messages in the imperative; if you follow [Conventional Commits](https://www.conventionalcommits.org/), even better.
- Explain **the why** in the PR description. The what is already visible in the diff.
- If you **add an example**, catalogue it in `spec/<version>/examples/catalog/en.json` (and translate it): CI fails if an example is not catalogued or is missing a translation. The website gallery reads the JSON **from the validated file itself**, so it cannot show an invalid document.
- If you touch the **schemas or the examples**, run `npm run validate` before submitting. CI does it anyway and **fails if an example stops validating** — that is what stops the spec and its examples from drifting apart (it happened once).
- If you add or change a schema, `npm run publish-schemas` copies the published version into `docs/schema/` (the `$id` URLs must resolve). The validator checks they have not drifted apart.
- If you touch the **website**, run it locally with `npm run dev` (→ <http://localhost:8000>) and check you are not breaking anything.

## Releasing a version (maintainers)

The schemas are published to npm as [`@opentechevents/schema`](https://www.npmjs.com/package/@opentechevents/schema) and served at `https://opentechevents.org/schema/v0.4/…`.

1. `npm run publish-schemas` — syncs the copies the website serves.
2. Bump the version in `package.json`.
3. Tag: `git tag schema-v0.3.1 && git push origin schema-v0.3.1`.

[`publish-schema.yml`](.github/workflows/publish-schema.yml) does the rest, with two deliberate brakes: it **fails if the tag does not match the `package.json` version**, and it **does not publish if the examples do not validate** — a schema that breaks its own examples never reaches npm. There is no token: npm trusts this repo and this workflow (*trusted publishing*, OIDC), and the package is signed with *provenance*.

## Language

The repository is in **English**, and the specification has an international outlook. **Write in whichever language you are comfortable with**: if you open an issue in Spanish, you get an answer in Spanish. The website and the spec's field descriptions are maintained in English and Spanish. The spec's field names are in English, no debate.

## Recognition

We use [all-contributors](https://allcontributors.org): **every kind of contribution** is recognised, not only code — ideas, research, documentation, translation, outreach, talks, introductions that open a door, review. If you have contributed something and you are not there, say so: it is an oversight, not a judgement.

## The licence of your contributions

By contributing you accept that your contribution is published under the project's licences (see [LICENSE](LICENSE)):

- **prose** (spec, docs, website, research) → [CC0-1.0](LICENSES/CC0-1.0.txt), public domain;
- **schemas and code** → [MIT](LICENSES/MIT.txt).

There is no CLA to sign. If this is a problem for you, say so in the issue **before** contributing and we'll talk it through.

## Conduct

There is no formal code of conduct yet (it is missing, and proposals are welcome). In the meantime, the rule is the obvious one: we debate ideas, not people. Anyone who organises communities already knows how this goes.
