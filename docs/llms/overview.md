# OpenTechEvents — OTE Spec

> 🌐 **[opentechevents.org](https://opentechevents.org)** — the project's website (source in [`docs/`](docs/)).

An open, standard specification to describe, publish and share **tech community events** (meetups, conferences, workshops, online and in-person events).

The goal is to offer a single format any community can adopt, one that fits every kind of event and stays highly compatible with existing standards and tools (RSS, iCalendar, etc.), so that publishing and discovering events stops being manual, repetitive work.

The proposal started at [**Community Builders (ComBuildersES)**](https://github.com/ComBuildersES) and now lives in its own organisation, [**OpenTechEvents**](https://github.com/OpenTechEvents), with an international outlook: although it was first driven from the Spanish-speaking community, the specification is designed to be usable by any community in the world.

---

## The problem

There are **more platforms, more directories and more tools** than ever for creating and announcing events, and building custom tooling keeps getting easier. That is a good thing in principle, but it comes with a serious downside:

- **Events are increasingly diluted and scattered.** The information lives fragmented across Meetup, Eventbrite, LinkedIn, the organisers' own websites, GitHub repositories, third-party forms, and so on.
- **For whoever organises**, getting the word out is increasingly complex: the same event has to be submitted to multiple platforms, in different formats, which multiplies both the effort and the maintenance.
- **For whoever attends**, keeping up means monitoring many different platforms and directories so as not to miss anything.

There is no shortage of information: what is missing is **interoperability**.

## The proposal

A standard specification that makes it possible to:

1. **Describe an event once**, in a single, well-defined format.
2. **Automate its distribution** to multiple directories and platforms at the same time.
3. **Transform that data** into already established standards (RSS, iCalendar…) so it is compatible, with no friction, with the tools people already use.

The idea: a community publishes its data once and an ecosystem of tools takes care of the rest — ingesting, exporting, transforming and publishing to each destination.

## Design principles

- **Universal across formats.** It must work equally well for a recurring meetup, a multi-day conference, an online event or a hybrid one.
- **Compatibility above all.** Designed to coexist with, and map easily onto, existing standards (RSS, iCalendar/ICS, JSON-LD / schema.org `Event`, etc.).
- **Easy to adopt.** A low barrier to entry for small communities; no specific tooling imposed.
- **Reusable and automatable.** Designed from the start to feed an ecosystem of import/export and publishing tools.
- **Open.** No usage restrictions, following the spirit of standards such as RSS or iCalendar.

## Tool ecosystem (the vision)

Once the specification stabilises, the goal is to build an ecosystem that solves the problems above. Expected use cases:

- **Importing / ingesting** events from existing sources into the OTE format.
- **Exporting / transforming** to RSS, iCalendar and other compatible formats.
- **Automating publication** to multiple destinations: Meetup, LinkedIn, Eventbrite, GitHub repositories that accept *pull requests*, websites with submission forms, and so on.

👉 The living tool catalogue is maintained on the [website](https://opentechevents.org/#tools) from [`docs/data/tools.json`](docs/data/tools.json).

## The specification

👉 **[OTE Spec v0.6](spec/v0.6/README.md)** — executable schemas (JSON Schema 2020-12), normative prose and examples validated in CI. [v0.1](spec/v0.1/README.md), [v0.2](spec/v0.2/README.md) and [v0.3](spec/v0.3/README.md) are frozen; what changed is in the [CHANGELOG](CHANGELOG.md).

📄 **[Practical examples](https://opentechevents.org/examples/)** — a whole document for every real case: small and recurring meetups, conferences, online and hybrid events, multi-part events, hackathons, co-organised events and feeds. They all come from [`spec/v0.4/examples/`](spec/v0.4/examples/) and are validated in CI, so they can be copied as they are.

```bash
npm install @opentechevents/schema
```

```text
https://opentechevents.org/schema/v0.6/event.schema.json
https://opentechevents.org/schema/v0.6/feed.schema.json
```

> 🚧 **`0.x` can break without warning.** It is published so that real implementations exist — starting with the `.ics` importer — and so they break whatever is wrong. The debate is still open in issues [#5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) and [#6](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

Got a feed and want to check it? `npm run validate -- my-feed.json`.

🤖 **Would you rather ask an AI?** The *Ask an AI* button on [opentechevents.org](https://opentechevents.org/) opens a conversation in your assistant — in your account, with no API keys and no backend of ours — carrying a message that tells it to read [`/llms.txt`](https://opentechevents.org/llms.txt) (an index of every source) or [`/llms-full.txt`](https://opentechevents.org/llms-full.txt) (the whole repository: spec, schemas, examples, tools and research) before answering. Both are generated by `npm run build-llms` from the repo's own files, so they never say anything the spec does not.

## Project status

🚧 **Early stage.** There is an **implementable v0.6**, and the work is now focused on **building on top of it** (the aggregator and its `.ics` importer) to find out what is wrong. The name, the scope and the governance are all still provisional and open to debate; the [licence](#licence) is already settled.

## Roadmap

1. ✅ **Initial research** — an analysis of existing standards (RSS, iCalendar, schema.org/Event…), platforms and real use cases. → [research/](research/README.md)
2. ✅ **v0.1 of the specification** — a minimal data model, an executable JSON Schema and examples. → [spec/v0.1/](spec/v0.1/README.md)
3. 🔜 **Validation against real implementations** — the [aggregator](https://github.com/OpenTechEvents/opentechevents-data) and its `.ics` importer are the test bench: if the model cannot handle a real ingestion, the model is wrong. That is where [v0.2](CHANGELOG.md) (`tags`, `location.geo`, `updatedAt`) and v0.3 (`organizers`) came from. Still open.
4. 🔜 **Adoption** — communities publishing feeds and directories consuming them. Without real data, a standard is theory.
5. 🔜 **A tool ecosystem** — ingestion, transformation and automated publishing. → [catalogue on the website](https://opentechevents.org/#tools)

## Repository structure

> The repository will grow as the project advances. Expected structure:

- `README.md` — this document.
- `CONTRIBUTING.md` — how to take part in the design of the specification.
- `research/` — the results of the initial research: an analysis of platforms, directories and standards.
- `spec/` — the specification. For now, an **initial draft** of the data model to illustrate the idea.
- `docs/data/` — the data feeding the public website: adopters, consumers and the tool catalogue.

## What success depends on

A standard is not worth anything for being well written, but for **how many people use it**. It is a network effect: every community, tool and mention adds value for all the others. OTE's success depends on:

- **A good specification, defined with support.** One that covers the real needs of different formats and communities, designed openly and with enough hands and points of view. Nobody adopts a poor spec.
- **Adoption by communities and platforms.** That they actually implement it: that they publish their events in this format (exposing the schema/feed) and that platforms and directories accept it as input/output. Without real data, a standard is theory.
- **A broad, versatile tool ecosystem.** The more tools there are — to ingest, export, transform, validate and publish — the easier and more appealing adoption becomes. Both quantity **and** versatility matter: covering more platforms, formats and use cases lowers the barrier to entry.
- **Getting the word out.** That people talk about it: blog posts, talks at meetups and conferences, documentation, examples. One concrete, low-cost route: sites that adopt it can display a **logo/badge** linking to the URL where their **feed can be consumed** (the way RSS buttons once did), making the standard visible and easy for others to discover and reuse.

These pieces reinforce each other: more adoption attracts more tools, more tools make adoption easier, and word of mouth feeds both. That is why the [roadmap](#roadmap) puts a **good specification** first and, on top of it, the **ecosystem** and its **reach**.

## Organisation and governance

This proposal is driven from [Community Builders (ComBuildersES)](https://github.com/ComBuildersES) and already has **a home of its own**: the [OpenTechEvents](https://github.com/OpenTechEvents) organisation on GitHub and the [opentechevents.org](https://opentechevents.org) domain.

The expected structure inside the organisation:

- this repository for **the specification**, the website and the projects/communities that adopt it,
- possibly another one for **the data**,
- and separate repositories for the ecosystem's **different tools**.

The exact split of repos and the long-term governance model are still open: they are part of what we want to agree on with the community.

## Frequently asked questions (FAQ)

**What exactly is OTE?**
A **specification** (a data format), not a platform or an app. It defines how to describe an event so that it is reusable and interoperable.

**Does it compete with Meetup, Eventbrite, Luma…?**
No. The goal is to **interoperate** with them: describe the event once and be able to publish or transform it towards those platforms and directories, not replace them.

**Does it replace RSS or iCalendar?**
No. OTE is designed to be **compatible** with and convertible to those standards. An OTE feed can be exported to RSS, JSON Feed or iCal so it can be consumed with the tools you already use (an RSS reader, a calendar app).

**Do I have to abandon my current tools?**
No. The idea is exactly the opposite: to let your data flow towards the tools and platforms you already use.

**As a community, what do I gain by adopting it?**
Publishing your events **once** and automating their distribution to multiple directories and platforms, instead of submitting each event by hand in each place.

**As an attendee/user, what do I gain?**
Being able to **subscribe to feeds** and filter the events you care about, without watching dozens of platforms and directories separately.

**Is this a Community Builders thing? Is it an official standard yet?**
It is driven by [Community Builders](https://github.com/ComBuildersES) with an international outlook and developed in its own organisation, [OpenTechEvents](https://github.com/OpenTechEvents), but it is **not an official or stable standard yet**: it is in the design phase and everything is provisional.

**Is it ready for production use?**
Not yet. We are designing the specification (version `0.x`, unstable). The [draft model](spec/) is illustrative and will change.

**How does it relate to Community Builders' community directory?**
OTE describes **events**; the directory describes **communities** (organisers). An event *references* its community by a global identifier, without coupling itself to any particular directory. That directory is a reference **compatible registry**, not a requirement.

**How can I take part?**
See [How to contribute](#how-to-contribute).

## How to contribute

The project is in its design phase and **every contribution is welcome**: experiences, your community's needs, references to standards and concrete proposals. What is most needed right now is **real cases that break the model** and **people saying publicly that they would adopt this** — without that, no directory bothers reading the format.

**Publishing a feed is not the only way to help, nor the first one:**

| What | How long it takes | Where |
| --- | --- | --- |
| Pledge to adopt it once it is stable | 2 min | [support issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) |
| Give a publishable testimonial | 5 min | [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions) |
| Tell us about an event the spec cannot describe | 10 min | [real-case issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=case.yml) |
| Spread the word or introduce us to someone | varies | [ambassador issue](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml) |
| Publish a feed / consume feeds / build a tool | ~1 h and up | [CONTRIBUTING.md](CONTRIBUTING.md) |

Would you rather talk it through in a 20-minute call than write an issue? [Book a slot](https://calendar.app.google/ZQuRkVw53h8nC2uQA); and if none of these fit, say so in [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions).

👉 The full list is in [**CONTRIBUTING.md**](CONTRIBUTING.md): how to support it without publishing anything, how to debate the spec, how to adopt it, how to appear on the website, how to translate, and how to claim an ecosystem tool.

## Contributors

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks to everyone who contributes to this project ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hhkaos"><img src="https://avatars.githubusercontent.com/hhkaos?s=100" width="100px;" alt="hhkaos"/><br /><sub><b>hhkaos</b></sub></a><br /><a href="#ideas-hhkaos" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-hhkaos" title="Research">🔬</a> <a href="#doc-hhkaos" title="Documentation">📖</a> <a href="#projectManagement-hhkaos" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification: **every kind of contribution** is recognised, not only code.

## Licence

Two licences, both permissive. The detail and the reasoning are in [LICENSE](LICENSE).

- **The specification** (prose, research, website): [**CC0-1.0**](LICENSES/CC0-1.0.txt) — public domain. Implementing a standard should not require anyone's permission or attribution.
- **The schemas and the code**: [**MIT**](LICENSES/MIT.txt). They are not CC0 because **CC0 grants no explicit patent rights**, and there are corporate policies forbidding the consumption of code under that licence — exactly the barrier we do not want in front of anyone who wants to implement OTE.

**The licence of your data is a separate matter** and you choose it, in the `license` field of each event or feed. The spec recommends **`CC-BY-4.0`** (it covers the EU *sui generis* database right, which 3.0 does not) or **`CC0-1.0`**. It advises against *share-alike* licences (`CC-BY-SA`, `ODbL`): they spread the obligation to any aggregated feed that includes your events and stop other directories from reusing them.
