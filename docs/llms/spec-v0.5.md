# OTE Spec v0.5.0

> 🚧 **Draft. Unstable.** `0.x` means it **can break without warning**. It is published so that real implementations exist (starting with the `.ics` importer) and so they break whatever is wrong. Discussion: [#5 (event)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) and [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

A minimal specification for describing tech community events and publishing them in a reusable feed.

| Artefact | What it is |
| --- | --- |
| [`event.schema.json`](event.schema.json) | **Normative, executable.** The JSON Schema (draft 2020-12) of an event. |
| [`feed.schema.json`](feed.schema.json) | **Normative, executable.** The JSON Schema of a collection of events. |
| [`event.recommended.schema.json`](event.recommended.schema.json)<br>[`feed.recommended.schema.json`](feed.recommended.schema.json) | **Normative, executable.** Profiles of **quality, not of validity**: the fields without which the event cannot be discovered or followed. Failing here produces **warnings**, never a rejection. See [Recommended fields](#valid-is-not-the-same-as-useful-the-recommended-fields). |
| This document | **Normative, not executable.** The rules a validator cannot check. |
| [`examples/`](examples/) | Examples, **validated in CI**. If they do not pass the validator, the build fails. |
| [`DECISIONS.md`](DECISIONS.md) | **Not normative.** Why this spec is the way it is: design decisions with the alternatives that were rejected and the condition under which each would be worth reopening. |

The `$id`s are the URLs the schemas are published under:

```text
https://opentechevents.org/schema/v0.5/event.schema.json
https://opentechevents.org/schema/v0.5/feed.schema.json
https://opentechevents.org/schema/v0.5/event.recommended.schema.json
https://opentechevents.org/schema/v0.5/feed.recommended.schema.json
```

**Once published, a version is not touched.** `v0.1`–`v0.4` stay frozen in [`spec/v0.1/`](../v0.1/), [`spec/v0.2/`](../v0.2/), [`spec/v0.3/`](../v0.3/) and [`spec/v0.4/`](../v0.4/); future changes will go to `spec/v0.6/`. That is what lets a document say `specVersion: "0.5.0"` and lets a consumer know three years from now what to validate it against. What changed between versions lives in the [CHANGELOG](../../CHANGELOG.md).

**v0.5 is a deliberately BREAKING release** (`0.x` — "it can break without warning"). It adds six fields (`speakers`, `recordings`, `contributing`, `feed.alternates`, `partOf.offers`, `offers[].scope`) and reshapes how a multi-part event carries a price. If your `0.4.0` documents used none of those key names, changing `specVersion` to `"0.5.0"` is all it takes. See the [CHANGELOG](../../CHANGELOG.md) migration note and [DECISIONS.md D032](DECISIONS.md#d032--multi-part-event-pricing-partofoffers--offersscope-a-deliberate-050-breaking-change).

## Consuming the schemas

**As a package** (recommended for implementations: it ties you to a version, not to whatever is at a URL today):

```bash
npm install @opentechevents/schema
```

```js
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { eventSchema, feedSchema, annotationKeywords } from "@opentechevents/schema";

const ajv = new Ajv2020({ strict: true, strictRequired: false });
addFormats(ajv);
for (const kw of annotationKeywords) ajv.addKeyword(kw); // annotations: they restrict nothing
ajv.addSchema(eventSchema);          // the feed references the event by $id: register it first
const validateFeed = ajv.compile(feedSchema);
```

The schemas carry **annotations** that no standard keyword can express: `x-inheritsFrom` names the feed field an event field inherits from (`event.license` → `feed.license`), because that default is not a literal — it is whatever the enclosing feed declares. They restrict nothing: a validator that ignores them accepts exactly the same documents. JSON Schema allows unknown keywords, so most validators need do nothing; Ajv in `strict: true` refuses to compile a schema carrying them, which is why `annotationKeywords` ships in the package.

The quality profiles come in the same package, and are used **separately** from validation: what they return are warnings, not errors.

```js
import { eventRecommendedSchema } from "@opentechevents/schema";

const validateEvent = ajv.compile(eventSchema);
const checkEvent = ajv.compile(eventRecommendedSchema); // references the event by $id, already registered

if (validateEvent(event) && !checkEvent(event)) {
  warn(checkEvent.errors); // publish it anyway: it is still valid
}
```

**By URL** (for editors, third-party CI, or anyone not using npm):

```text
https://opentechevents.org/schema/v0.5/event.schema.json
https://opentechevents.org/schema/v0.5/feed.schema.json
```

## Validating this repo

```bash
npm install
npm run validate
```

## The event

Required: `id`, `name`, `startDate`, `timezone` — plus, in a standalone document, `specVersion` and `license`.

Everything else is optional. **Deliberately**: most published `.ics` files carry neither a URL nor a description, and a spec that demands them forces the importer either to drop the event or to invent the value. Neither is acceptable.

Optional does **not** mean dispensable, and that is where the second tier comes in: the [recommended fields](#valid-is-not-the-same-as-useful-the-recommended-fields).

A real minimal example, with those six fields and nothing else: [`examples/event-minimal.json`](examples/event-minimal.json) — it is a file validated in CI, so linking to it instead of copying it here is what guarantees this example never drifts from the real schema.

### Valid is not the same as useful: the recommended fields

New in v0.3. An event with only the six required fields is **valid** and, for the problem this spec exists to solve, **almost useless**: it cannot be filtered by topic, there is no telling whether you can attend, and in RSS there is not even a link to click. Lowering the bar for validity was the right decision; leaving the conversation there was not.

That is why there are **two schemas and two different questions**:

| Schema | The question it answers | What happens if it fails |
| --- | --- | --- |
| [`event.schema.json`](event.schema.json) | Is this an OTE event? | **Error.** The document is rejected. |
| [`event.recommended.schema.json`](event.recommended.schema.json) | Is it good for anything? | **Warning.** The document is still valid. |

**Normative rule: a tool MAY warn about a missing recommended field, and MUST NOT reject the document because of it.** Turning a recommendation into an error reintroduces through the back door exactly what permissiveness avoids: whoever imports a bare `.ics` is forced either to invent the value or to throw the event away. That the document cannot be rejected does not oblige anyone to **list** it: that is [a different decision, and it belongs to whoever consumes](#with-no-url-and-no-location-valid-but-discardable).

The profiles are ordinary schemas, published under their own `$id` and distributed in the npm package. They reference the base ones by `$ref`, so the base ones have to be registered first:

```text
https://opentechevents.org/schema/v0.5/event.recommended.schema.json
https://opentechevents.org/schema/v0.5/feed.recommended.schema.json
```

```bash
npm run validate -- my-feed.json     # errors and warnings, in the same pass
```

#### What is recommended, and why that and not something else

The criterion is **not** "it would be nice to have": it is **what breaks in the three destinations if it is missing**, and whether its absence stops the event from being discovered or followed.

| Field | What is lost without it |
| --- | --- |
| `url` | RSS and Atom have nowhere else to carry the link: the entry stops being clickable. It is what turns a piece of data into something you can go to — and without it and without `location`, [an aggregator may discard the event](#with-no-url-and-no-location-valid-but-discardable). |
| `description` | What literally every destination displays: `DESCRIPTION` in iCal, the entry's body in RSS/Atom, the snippet in schema.org. |
| `image` | The image is what makes the event **visible** wherever it is listed: Google asks for it on the `Event` (as recommended), and it is the only thing that fills a card in any interface. The warning is also **actionable**: the five platforms studied already emit one, so whoever does not send it almost always has it and simply has not mapped it. |
| `location` | Google requires it for the `Event`; in iCal it is `LOCATION`. Without it nobody can answer "is it near me?" — and it is [the last fallback when there is no `url`](#with-no-url-and-no-location-valid-but-discardable). |
| `attendanceMode` | The first question anyone searching asks: can I attend from home? It cannot be derived from `location` reliably — [which is why they are separate fields](#location-and-attendancemode-are-not-redundant). |
| `tags` | **The field for discovery by interest.** Without it, filtering by topic means guessing from the title. It goes to `CATEGORIES` in iCal and `keywords` in schema.org. |
| `languages` | An event in a language you don't speak is noise, and it is not the title that says so. |
| `organizers` | Who you follow and who you trust. Without it, an aggregator's feed attributes everything to whoever aggregates. |
| `updatedAt` | It is what makes **subscription** possible: without it, a consumer cannot sync incrementally and has to re-read everything every time. |
| `endDate` | Only if `startDate` carries a time: without it the calendar client invents the duration. In an all-day event its absence already means "it ends the day it starts", and warning there would be noise. |
| `cfp.closesAt` | **Only if there is a `cfp`.** With no deadline, the question the field exists to answer — is it still open? — goes unanswered, and a consumer sees a link that may have closed months ago. Actionable by definition: whoever opens a call knows when it closes. |

`cfp.closesAt` is **the only nested recommendation, and the only conditional one alongside `endDate`**: it is asked for only when the parent field exists, because asking a meetup for a CFP deadline is a warning nobody can act on. The profile expresses this with an `if`/`then`, not with prose, so any checker applies it knowing nothing about this page.

**What is recommended is `location`, not `location.address`.** What you need to know about the place depends on the type of event: a postal address does not apply to an online one, and for a meetup in a bar the bar's name is all there is and all that is needed. `address` is what whoever exports to schema.org needs so Google can validate the address part by part ([detail below](#locationaddress-the-address-that-is-validated-part-by-part)), and it is a real improvement when you have it — but a warning half the events cannot act on is a warning that teaches people to ignore warnings.

**`textLanguage` is not recommended either**, and it came closest: it costs one line per feed and unlocks real things (the HTML `lang`, the screen reader's voice, alphabetical sorting). It stays out by the same criterion as everything else: **whoever imports an `.ics` does not have it** — Google Calendar does not emit the `LANGUAGE` parameter — and the only way to act on the warning would be to guess the language from the text. A warning you can only silence by inventing something is not actionable. For anyone writing their own feed, on the other hand, this page's recommendation stands on its own: **declare it**.

**`offers`, `cfp` and `eligibility` are not recommended either**, and that is not an oversight. `cfp` because the vast majority of events have no call for papers: warning about its absence would mean warning every meetup that it is not a conference. `eligibility` because whoever imports an `.ics` has no way of knowing whether there is a door policy, and a warning there can only be acted on by **inventing** an `open` nobody has asserted — which is exactly what the field exists to prevent. `offers` because the warning is not reliably actionable — an `.ics` exporter has the price nowhere, and none of the five sources studied emits it universally. To recommend is to promise that **whoever publishes can fix it**; where they cannot, a warning only teaches people to ignore warnings.

The feed's profile is deliberately short ([`feed.recommended.schema.json`](feed.recommended.schema.json)): `url` and `description`. Almost all of a feed's quality lives in its events, and a checker applies the event profile to each one separately — **with inheritance already resolved**, or every event in a community feed would warn about `organizers` the feed had already declared.

#### With no `url` and no `location`: valid but discardable

That no tool may **reject** a document over a recommended field does not mean every valid event has a right to be published by others. These are two different decisions, and it is worth saying so plainly:

| Decision | Who makes it | What this spec says |
| --- | --- | --- |
| Is the document valid? | The validator | [`event.schema.json`](event.schema.json) decides, and only it. A missing recommended field **never** invalidates anything. |
| Do I give it visibility? | Whoever consumes: aggregator, directory, calendar, search engine | It is **theirs**. Validity obliges nobody to list an event. |

**Normative rule: a consumer or aggregator MAY discard — or leave unlisted, or list last — an event that carries neither `url`, nor `location`, nor `cfp.url`, and whose feed does not declare a `url` either.** This is not a breach of the spec: it is the consequence of there being **nowhere** to send whoever reads the announcement.

The reason is that such an event answers neither of the two questions that make an announcement useful: **"where do I read more?"** (`url`) and **"where does it happen?"** (`location`). With neither, all that remains is a name and a date. An aggregator that lists it is not giving the event visibility: it is publishing something that frustrates whoever clicks it — because there is nothing to click — and spending a card's slot on data nobody can use. **Announcing an event you can neither attend nor read more about is not promoting it.**

The chain of fallbacks matters, and that is why the rule is so specific:

- **`url` is the normal answer.** It is what turns the data into something you can go to.
- **`location`** saves the bare-`.ics` case: almost every real `.ics` carries `LOCATION` even when it carries no `URL`, and with a place and a time you can already show up. `location.onlineUrl` counts twice: it is both a place **and** a link.
- **`cfp.url`** saves the conference whose only published link, for now, is the call for papers.
- **`feed.url`** saves the rest: an event with no link of its own inside a feed that does have one **is still navigable** — "seen at X" — and discarding it would punish a hierarchy that works. That is why the rule is not limited to the event.

For whoever publishes, the fix is one line: if the event has no page of its own, send a `url` pointing at the community's, or declare a `url` on the feed. Either one is enough.

#### Two absences that are the interesting part

**`status` is not recommended**, and it is the only field in the spec with a default. Writing `"status": "scheduled"` adds no information: it is what its absence already means. What really matters about `status` is an action, not a field — **updating it when the event falls through** — and no schema can check that: a document announcing a cancelled event as if nothing had happened is indistinguishable from a correct one until somebody turns up at a locked door. It is still [the most important rule in this spec](#status-a-cancelled-event-stays-published); it just is not a rule a profile can police.

**`feed.organizers` is not either**, for the opposite reason: an aggregator **must** omit it so that each event declares its own. A warning there would push whoever aggregates into claiming events they do not organise — corrupting exactly the data the field exists to protect. A recommendation that, followed to the letter, makes the data worse is a recommendation in the wrong place.

#### What this tier promises, and what it does not

The list **may grow** in future versions: recommending something costs nobody their compatibility, because nothing stops validating. What it will **not** do is become the route by which an optional field quietly becomes required: promoting a field into the required core is still a breaking change, and it comes with its own version and its own [CHANGELOG](../../CHANGELOG.md) entry. Recommended is a stable tier, not a waiting room.

### Field order: is not normative, but there is one

JSON has no order: a document with its keys shuffled is **exactly as valid**, and no consumer should depend on how they are arranged. Even so, the spec declares the fields in a specific order, and the schema, the examples and the [generated reference](reference.en.md) all respect it:

```text
specVersion                                              ← which version it validates against
id, url, name, description, image, organizers, speakers  ← what it is, who runs it, who is on stage
startDate, endDate, timezone                             ← when
attendanceMode, location, eligibility                    ← can I attend?
tags, languages, textLanguage                            ← am I interested, and what language is it written in?
offers, cfp                                              ← what does it cost, and can I take part?
status, partOf                                           ← what has happened to it, and what it is part of
license, source, updatedAt, recordings, contributing     ← data about the data
translations                                             ← everything above, in another language
```

`speakers` sits next to `organizers` (both answer "who is behind this"); `recordings` and `contributing` sit with the plumbing (both are added or matter after the event is announced). Inside `offers`, `scope` comes first; inside `partOf`, `offers` comes last.

It reads the way it is filled in: first what is needed to **announce** the event, at the end the plumbing that only matters to whoever consumes it. `eligibility` goes with `attendanceMode` and `location` — and not next to `offers`, where it would also fit — because all three answer **the same question**: whether the event is within your reach and whether they will let you in. Price comes afterwards, and only matters if the answer was yes. `textLanguage` sits next to `languages` so the [difference between the two](#textlanguage-and-translations-what-language-this-is-written-in) is visible on the same screen, and `translations` goes **last**, after even the plumbing: it is a bulky block repeating fields already declared above, and putting it in the middle would bury the twenty lines every consumer actually reads. It is not alphabetical, which would separate `startDate` from `endDate` and `id` from `url`; nor by requiredness, which would change with every version that recommends a new field.

It matters because it is what shows up in the three places anyone really looks: the **example they copy**, the **reference table** — generated by reading the schema in declaration order — and the **editor's autocompletion**. Having all three agree is the difference between a shape you memorise and one you have to look up every time. `npm run validate` checks it against this version's examples.

For your feed it is a **suggestion, not a rule**: publishing in a different order breaks nothing and produces no warnings.

### `id` and `url` start out identical, but they are not the same thing

`url` is **where the event is described today**. `id` is **which event this is, forever**.

If a community moves from a platform to its own domain, `url` changes and **`id` cannot change**: it is what lets a consumer *update* the event it already had instead of creating a duplicate. An `id` is minted once, under a domain whoever publishes controls (DNS already guarantees uniqueness: no central registry needed), and it is never rewritten. "Controlling the domain" does not require owning it: a canonical page on a platform you use (Meetup, GitHub Pages, LinkedIn) works just as well — what is needed is for that URL to be stable and for nobody else to be able to end up with the same one. That is why `id`, like `url`, has to be an HTTP(S) URL: an identifier of another kind (`urn:`, `mailto:`) does not give that guarantee of uniqueness without a registry, and the validator rejects it. Detail in [DECISIONS.md, D020](DECISIONS.md#d020--id-and-partofid-must-be-an-https-url-not-any-uri-scheme).

Nobody should be typing an `id` by hand: tools derive it from the event's canonical URL (its own, or the platform's), or mint it as `<domain>/events/<community>/<date>-<slug>` when the event has no page of its own.

No URL field in the schema (`id`, `url`, `location.onlineUrl`, `organizers[].url`, `offers[].url`, etc.) accepts credentials embedded in the authority (`https://user:pass@...`): these are public discovery links, not authenticated channels, and publishing a secret there leaks it to whoever reads the feed. Detail in [DECISIONS.md, D026](DECISIONS.md#d026--https-url-fields-must-not-carry-embedded-userinfo-credentials).

**Within a single feed, two events cannot share an `id`** — the validator checks it (exact string equality, with no URI normalisation). This is not the heuristic deduplication across sources that the spec leaves out of scope ([further down](#what-v03-does-not-solve)): it is a single source contradicting, in the same document, the identity it minted itself. Detail in [DECISIONS.md, D011](DECISIONS.md#d011--no-two-events-in-a-feed-may-share-an-id-compared-by-exact-string-equality).

### Dates: wall clock, not instants

`startDate` and `endDate` carry **the time printed on the poster**, in the event's time zone. They **never carry a UTC offset** (`+02:00` or `Z`): that is what `timezone` provides. The schema rejects an offset inside `startDate`.

Two forms, and **both dates must use the same one**:

- **All day**: `"2026-10-15"`.
- **With a time**: `"2026-10-15T09:00"` — **without seconds**: it is the time on a poster, never a technical instant ([DECISIONS.md, D004](DECISIONS.md#d004--dateTime-has-no-seconds-and-enddate-must-not-precede-startdate)).

Mixing them (`startDate` a date, `endDate` a date-time) is invalid. If `endDate` is missing, the event ends the day it starts. If `endDate` is present, it **cannot precede `startDate`** — an event does not end before it begins; the schema rejects it.

**For an all-day event, `endDate` is INCLUSIVE: it names the last day the event happens, not the day after.** `startDate: "2026-10-16"` + `endDate: "2026-10-17"` is a **two-day** event (the 16th and the 17th), not a one-day one. It is the same convention Google and schema.org use for `endDate` — and the opposite of iCalendar's: RFC 5545 defines `DTEND;VALUE=DATE` as the **non-inclusive** end, with this very example in its own text: an event running from 28 June to 8 July inclusive is encoded as `DTEND;VALUE=DATE:20070709` — the day **after** the last one. That is why converting is not copying the value:

| | OTE `endDate` | iCalendar `DTEND;VALUE=DATE` |
| --- | --- | --- |
| Exporting | `2026-10-17` | add 1 day → `20261018` |
| Importing | subtract 1 day → `2026-10-17` | `20261018` |

Copying the value without this adjustment shortens every multi-day OTE event by one day on the way to iCalendar, and lengthens it by one on the way back. Values with a time carry no such ambiguity — an `endDate` with a time is already an exact instant, with no room for two readings. Detail in [DECISIONS.md, D013](DECISIONS.md#d013--all-day-enddate-is-inclusive-icalendar-dtend-is-not).

`timezone` (IANA, `Europe/Madrid`) is **always required**. With a time, it is what turns the wall clock into an unambiguous instant. In all-day events it **contextualises** the date: it says which region that day belongs to — it **does not shift it**. A consumer **must not** convert an all-day event into another time zone.

**What an importer does when the source has no zone to give.** This is not an edge case: iCalendar's `DATE` type **cannot** carry a `TZID` — by RFC 5545 an all-day `DTSTART;VALUE=DATE` never has a zone, by design. In a real 871-event Google Calendar export, not one all-day `VEVENT` carried one. Since `timezone` is required and has no default, an importer has to put *something* there, and two reasonable implementers were choosing differently. The order is:

1. **A zone the calendar itself declares.** `X-WR-TIMEZONE` is not in RFC 5545, but Google, Outlook and Apple all emit it and it is the publisher's own statement about the calendar — use it when present.
2. **A zone you already know from the publisher**: the community's own zone, the one configured in the tool doing the import, the one the rest of that feed uses.
3. **`UTC`, as the explicitly sanctioned fallback.** It is honest about knowing nothing rather than guessing a region, and for an all-day event it changes no date — `timezone` contextualises the day, it does not shift it.

**Do not geocode `LOCATION` to get there.** "Jakarta, Indonesia" → `Asia/Jakarta` looks obvious and is a guess dressed as data: it needs an external service, it fails silently on ambiguous or poetic venue names, and it asserts a region the source never stated. An importer that resolves the zone by anything other than rule 1 **SHOULD** record what it did in [`source`](#license-and-source-what-can-be-reused-and-where-it-came-from), so the next reader can tell a declared zone from a filled-in one.

**"Unambiguous instant" has one real exception: the two nights a year when the zone changes its clocks.** When the clock goes back (summer→winter), a local time repeats and names two different instants; when it goes forward (winter→summer), there is an hour that never exists. Extremely rare in practice — nobody schedules a talk at 2:30 in the morning on purpose — but it can slip in unnoticed: a script generating the dates of a series of sessions without accounting for that particular night, or an `.ics` imported with the same problem. The resolution is the one RFC 5545 §3.3.5 already uses — any existing iCalendar tool already applies it, unchanged — with its own official examples:

- **Repeated time**: the **first** occurrence counts. `TZID=America/New_York:20071104T013000` is 1:30 on 4 November 2007 in **EDT** (UTC−04:00), not EST.
- **Non-existent time**: it is interpreted with the offset in force **before** the jump. `TZID=America/New_York:20070311T023000` is, in fact, 3:30 EDT (UTC−04:00) — one hour after 1:30 EST.

Detail in [DECISIONS.md, D014](DECISIONS.md#d014--dst-ambiguous-or-nonexistent-local-times-resolve-per-rfc-5545-335).

The only date with an offset in the whole spec is `source.retrievedAt` (and `updatedAt` on the feed): they are metadata, real instants, not things that happen to people in a place.

Every date and time in this spec, in any field, has to be **calendar-real** — no months, days or hours that do not exist — and `timezone` has to be a **real IANA zone**, canonical or a historical alias. The validator checks both; they are not merely a recommendation from this page. Why (and why the first version of the `timezone` check was wrong) is in [DECISIONS.md, D001 and D002](DECISIONS.md#d001--temporal-fields-must-be-calendar-valid-not-just-lexically-shaped).

### Recurrence and multi-part events: `partOf`

New in v0.3, optional. And the first thing to say is what it is **not**: **it is not a recurrence rule**.

**One document = one occurrence. Whoever publishes expands.** A monthly meetup is not one document with a rule: it is twelve documents, each with its own `id`, its own dates and its own `status`. A study jam of three sessions on non-consecutive Saturdays is three documents. A two-day conference with parallel tracks is one document per talk — two talks at the same time are just two documents with overlapping dates and a different `location.venue` ([`examples/feed-conference-tracks.json`](examples/feed-conference-tracks.json)). `partOf` only says **which set they belong to**:

```json
"partOf": {
  "id": "https://rustmadrid.example/meetups",
  "name": "Rust Madrid — meetup mensual",
  "url": "https://rustmadrid.example/meetups"
}
```

Only `id` is required. `name` and `url` save a consumer from having to resolve the `id` in order to group. The `id` follows the same rules as the event's (a URI under a domain of your own, minted once) and **does not have to resolve** to an OTE document. **What it cannot be is the event's own `id`** — an occurrence cannot be the set it belongs to; the validator rejects it. Detail in [DECISIONS.md, D012](DECISIONS.md#d012--an-events-partofid-must-not-equal-its-own-id).

**`type`: `series` or `multipart`** (`series` by default). It is not decoration: it changes the translation.

- **`series`** — independent occurrences sharing an identity: June's meetup and July's. Each is announced, attended and cancelled separately.
- **`multipart`** — parts of **a single event**, published as one document per part because each part has its own date, time or room: a study jam of three sessions on non-consecutive Saturdays, with a single registration — and equally the seventeen talks of a single conference day. The parts are not independent events even though each has its own slot. **The gap between the dates decides nothing**: same day, consecutive days or months apart are all `multipart` when the parts belong to one event and are not attended or cancelled separately.

`multipart` says nothing about time that `series` doesn't; what it changes is **who owns the price** — see "Multi-part event pricing" below. Do not solve pricing by deforming the time field.

⚠️ **A multi-part event is NOT expressed with a `startDate` on the first part and an `endDate` on the last.** `startDate: "2026-03-07"` + `endDate: "2026-03-21"` asserts a continuous fifteen-day event — false in all three destinations, and in a subscriber's calendar it takes up two entire weeks. Three parts, three documents.

#### Multi-part event pricing: `partOf.offers` and `offers[].scope`

New in v0.5, and **a deliberate breaking change** — see [DECISIONS.md D032](DECISIONS.md#d032--multi-part-event-pricing-partofoffers--offersscope-a-deliberate-050-breaking-change) for why `0.x` makes that acceptable.

A conference modelled as `multipart` — each talk its own document, all sharing one `partOf.id` — normally has **one admission price for the whole thing**, and often a **separate fee per workshop on top**. v0.4 could express neither.

**`partOf.offers` is the shared admission.** An `offers` list (same shape as `event.offers`) inside the `partOf` object — the price of attending the whole set, written **identically on every part** that carries it, so a consumer holding a single part document can price it without resolving the parent (`partOf.id` is **never** followed for pricing):

```json
"partOf": {
  "id": "https://trgcon.example/2026",
  "name": "TRG Conf 2026",
  "type": "multipart",
  "offers": [
    { "name": "Early bird", "price": 180, "currency": "EUR", "url": "https://trgcon.example/tickets", "closesAt": "2026-09-01T23:59:59+02:00" },
    { "name": "General",    "price": 240, "currency": "EUR", "url": "https://trgcon.example/tickets" }
  ]
}
```

**`offers[].scope` says what a part's own offer means relative to that admission** — two values, only meaningful when the document has `partOf`:

| `scope` | Meaning | Total to attend this part |
| --- | --- | --- |
| `admission` *(what an absent `scope` is read as)* | A complete way to attend this part — sold standalone, or a restatement of the set admission | this offer's `price` |
| `add-on` | An **additional** charge on top of the set admission | a priced `partOf.offers` entry **+** this offer's `price` when both carry a number; otherwise **"an additional charge, total unknown"** |

An `add-on` offer **requires `partOf` and `partOf.offers` in the same document** — the schema rejects an add-on with nothing to add to. URL-only offers (a `url` with no `price`, which v0.4 already allows) stay valid: the consumer knows *there is an extra charge and where to pay it*, just not the total.

**One meaning changes:** in a document that carries `partOf.offers`, a part that **omits its own `offers`** is **covered by the admission** — its cost is `partOf.offers`, not "unknown". This is the single place in the spec where an absent `offers` list means something other than unknown, and it fires only on `partOf.offers`, which no `0.4.0` document contains.

**Sibling parts must agree.** For every group of events sharing a `partOf.id`, the `partOf.offers` blocks that are present must be **equal by value** — a feed-root validator error (`sharedOffersConsistent`), the same discipline as [D011](DECISIONS.md#d011). Parts that omit `partOf.offers` are allowed.

**`partOf` is no longer *entirely* safely ignorable.** It stays ignorable for grouping and identity; a consumer that needs the **price** of a multi-part event MUST also read `partOf.offers`. Ignoring it yields **incomplete** pricing (a missing price), never **wrong** pricing — the spec's "incomplete is acceptable, false is not" principle.

**Out of scope for v0.5** — still ticketing, the same call the spec makes for discount codes: tier-specific coverage ("this workshop is only for Full tickets"), per-day passes, "pick 3 of 5" bundles, reverse bundles, group rates, coupons. The documented next step ("Model B" — stable offer `id`s + `offers[].dependsOn`) is not proposed; it graduates on a real producer.

**And it can graduate without breaking what is written here**, which is why waiting costs nothing. Model B's two pieces are optional members on an object that already exists, and the meaning of today's documents is the default the later model has to preserve: an `add-on` with no `dependsOn` attaches to **the whole set admission in `partOf.offers`**, which is exactly what `scope: "add-on"` means now. A 0.5 document would therefore keep validating and keep pricing the same under Model B, unchanged. What would be breaking — and so is ruled out in advance — is making `dependsOn` required for add-ons, or giving absent `dependsOn` any meaning other than "the whole admission".

**Translation of the price.** `partOf.offers` → the `superEvent` (`EventSeries`/`Event`)'s `offers`; part `offers` → the part `Event`'s `offers`. **Google follows neither `superEvent` nor `subEvent`**, so a per-talk rich result shows no price — an inherent loss no model here fixes. iCal / RSS carry price only as text, as `offers` already does.

**Translation of the `partOf` relationship itself into the three destination formats, including the loss** — the price travels as described just above; what follows is how the grouping travels:

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `superEvent` → `EventSeries` (`series`) or `Event` (`multipart`, with the parts as its `subEvent`) | None in the model. Google **does not read** `superEvent`, but it does not need to either: it already receives one occurrence per document, which is exactly what it asks for. |
| **iCal** | `RELATED-TO;RELTYPE=PARENT:<id>` on each `VEVENT` | Uneven support across clients: whoever does not understand it sees N correct events. Never `RRULE`: the expansion already happened. |
| **Atom / RSS** | No equivalent — ignored | Total, and **harmless**: the entry still describes an event with its real date. |

That it degrades to *ignored* in all three is precisely the design. A date field that gets ignored produces false data; an identity field that gets ignored produces incomplete data. Only the second is acceptable.

#### Why not schema.org's `eventSchedule`

Replacing `timezone` + `startDate` + `endDate` with a schema.org-style `eventSchedule` (`repeatFrequency`, `byDay`, `scheduleTimezone`…) was considered. It is rejected, for four reasons:

1. **It puts an expansion engine inside a file.** The feed is an interchange format, not an API: the consumer reads, it does not compute. With a rule, every consumer — including the thirty-line script rendering a listing — suddenly needs calendar arithmetic: DST, `exceptDate`, infinite series, the semantics of `"2MO"`. It is the reason every iCal library weighs what it weighs.
2. **RSS/Atom cannot express it.** They do not model recurrence. Whoever exports has to expand anyway: expansion always happens, and the only question is **who** does it. Better that it be whoever publishes — once, with the data in front of them — and not every consumer separately, each with their own bug.
3. **It breaks rules this spec already has.** A stable `id` does not survive N occurrences under one document (you would need an equivalent of `RECURRENCE-ID`), and `status: cancelled` stops being expressible per occurrence without inventing exceptions and overrides. Cancelling **the August session** would become impossible again: exactly the problem `status` exists to solve.
4. **There is no real producer.** Of the five sources studied ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)) — Meetup, Eventbrite, Luma, Guild and Google's canonical example — **none** emits `eventSchedule`. They all emit a flat date per occurrence, including Luma's *weekly* session, which genuinely is recurring. And Google, the entity consuming schema.org at scale, explicitly asks for one `Event` per date. Adopting it would be the speculative design the Extensions section forbids.

#### Rules for whoever expands

- **Infinite series: a bounded horizon.** An `RRULE` with neither `UNTIL` nor `COUNT` cannot be expanded in full. Expand a reasonable horizon — **12 months or the next 12 occurrences** is the recommendation — and republish when you regenerate the feed. A feed is not a perpetual calendar.
- **One `id` per occurrence.** If the occurrence has a page of its own, its URL. If not, `<series-id>/<date>` or `<series-id>#<date>` — which is, literally, what `RECURRENCE-ID` does in iCal. What does not work is reusing the series' `id` across all twelve: a consumer would collapse them into a single event.
- **Exceptions stop being exceptions.** After expanding, `EXDATE` means *not emitting that document* and a moved occurrence is *a document with a different date*. If it was already published and then falls through, `status: cancelled` — do not delete it.
- **Keeping the original rule is optional, and prefixed.** If your importer wants to keep it for round-tripping, `"ics:rrule": "FREQ=MONTHLY;BYDAY=2MO"` is external vocabulary (see [Extensions](#extensions)): informative, and **no OTE consumer is obliged to expand it**. If it survives real use, it will graduate.

### `location` and `attendanceMode` are not redundant

They answer different questions:

- **`location`** is **observable facts**: is there a physical place? is there a URL to connect to? It may be incomplete.
- **`attendanceMode`** is **the organiser's intent**: what kind of event this is. It does not depend on the joining URL being public yet.

Almost always they could be derived from each other, and they agree. The field exists for when **the derivation fails**. **If they contradict each other, `attendanceMode` wins.**

**`attendanceMode` has no default.** Absent means **unknown**, not `in-person`. A default would let any producer that simply *does not have* the data emit a false one without noticing: a blank form, a CMS exporting from a template, an importer reading a format that cannot express it — **iCalendar, the most widely published event format in the world, does not model attendance mode at all**. Staying silent and saying `in-person` are different assertions, and only one of them is honest.

If `location` is present, it must carry at least `venue` or `onlineUrl`. A `location: {}` is invalid: it says nothing, and saying nothing is already done by omitting the field. **`address` and `geo` do not count** towards that rule: they describe the venue `venue` names, they do not replace it.

This independence is deliberate and stays: but the recommended profile does warn (never invalidates) when the specific detail the declared `attendanceMode` needs is missing — `onlineUrl` for `online`, `venue` for `in-person`, both for `hybrid`. See [DECISIONS.md#D025](DECISIONS.md#d025--recommended-tier-warning-when-attendancemode-lacks-its-matching-location-detail).

### `location.address`: the address that is validated part by part

New in v0.3, optional, and **a sibling of `venue`, not a replacement**:

```json
"location": {
  "venue": "Campus Madrid, Calle de Moreno Nieto 2, Madrid",
  "address": {
    "street": "Calle de Moreno Nieto 2",
    "locality": "Madrid",
    "region": "Comunidad de Madrid",
    "postalCode": "28005",
    "country": "ES"
  },
  "geo": { "lat": 40.4081, "lon": -3.7188 }
}
```

**Why it was added.** `venue` is a string, and a string cannot be validated part by part. When translating to schema.org, the venue becomes a `Place`, and a `Place`'s address is a `PostalAddress` with five subfields that **Google checks one by one** for the `Event` rich result. With only `venue`, an exporter has two ways out: emit `address` as loose text — valid in schema.org, not validated by Google — or *guess* where the street ends and the city begins by splitting on commas. The second is inventing data, which is exactly what this spec does not want to cause. Of the five sources studied ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **four emit `PostalAddress`** with its subfields: it is a field that already exists out there, not an idea.

**Why `venue` is still here, and still the one that wins.** Because the other two destinations do not know what to do with a structured address: iCal's `LOCATION` is **a single line of free text**, and RSS/Atom do not model addresses at all. Somebody has to produce that line, and whoever organises writes it better ("Campus Madrid, Calle de Moreno Nieto 2, Madrid") than an exporter joining parts with commas, which is what produces addresses like Meetup's: `"calle de raimundo lulio, 9 28010, madrid, españa, Madrid"`. The two fields say the same place on purpose: **`venue` to read, `address` to process**.

**Every part is optional, and omitting is the correct way of not knowing.** An absent key means unknown. `""` and `null` are **not valid** — each part is a string of at least one character — and that decision has a real case behind it: Guild today emits a `PostalAddress` with all five subfields set to `null`, which is publishing an unknown shaped like data. `"address": {}` is rejected too, for the same reason as `location: {}`.

**`country` is an uppercase ISO 3166-1 alpha-2 code** (`ES`, `US`), and it is the only part with a required format. A country name has one spelling per language — "España", "Spain", "Espagne" — and a consumer grouping events by country would see three countries where there is one. Turning the name into a code is **looking up a table, not inventing**: that is why it is required here and not in `region`, where no universal table works (province, state, county or *Land*, depending on the country). The validator checks the code against the list of currently assigned ones, not just its shape — the same pattern as `timezone` and `currency`: see [DECISIONS.md, D006](DECISIONS.md#d006--locationaddresscountry-must-be-a-real-currently-assigned-iso-3166-1-code). **A frequent mistake: the United Kingdom is `GB`, not `UK`** — "UK" is not an ISO 3166-1 code; it is one of the "indeterminately" reserved ones precisely because of its widespread use outside the standard.

**`locality` and `region` are written ONCE, and are not translated.** "València" and "Valencia", "Girona" and "Gerona", "Donostia" and "San Sebastián" are real spellings of the same place, and here there is no table to consult as there is for `country`. The rule, which is a recommendation and not validation: **write the spelling most recognisable to the event's main audience**, the one those people would type when searching. Do not put both, do not put them in `translations` — [deliberately not covered](#local-translations-the-text-living-inside-an-object) — and remember that anyone needing precision without a language already has it: `location.geo` has no spellings.

**Not modelled**: `addressType`, a second address line, or `postOfficeBoxNumber`. `street` is one line, and floors or door numbers go in it. No real producer emits more, and the [Extensions](#extensions) section forbids speculative design.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `location.address` → `PostalAddress`: `street` → `streetAddress`, `locality` → `addressLocality`, `region` → `addressRegion`, `postalCode` → `postalCode`, `country` → `addressCountry`. `venue` remains `Place.name` | None. It is 1:1 — and it is the only mapping that makes Google validate the address. |
| **iCal** | `LOCATION:<venue>` — the address **does not travel in parts** | **The whole structure.** iCalendar does not model addresses ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) has only `LOCATION`, free text). An exporter may append the parts to `LOCATION` if `venue` does not already include them; what it must not do is duplicate the address behind a name that already carries it. |
| **RSS / Atom** | Nothing native: it goes inside the item's text | **The whole structure**, as in iCal. Neither models places. |

The short names (`street`, `locality`) versus schema.org's (`streetAddress`, `addressLocality`) are the same decision as `geo: { lat, lon }` versus `GeoCoordinates`: **the object is already called `address`**, and repeating the prefix in every key is noise. The mapping is literal and is in the table above.

### `status`: a cancelled event stays published

Six values, aligned with schema.org's `eventStatus` enum plus iCal's `TENTATIVE`:

| Value | What it asserts |
| --- | --- |
| **`scheduled`** *(default)* | Confirmed, at the date and place the document says. |
| **`tentative`** | Announced but **unconfirmed**: the date, the venue or both are still to be settled. |
| **`cancelled`** | It is not happening. Full stop. |
| **`postponed`** | Postponed **with no new date yet**. |
| **`rescheduled`** | Postponed **and already with a new date**, which is the one the document carries. |
| **`moved-online`** | Still happening, but what was in person becomes online. |

A **cancelled, postponed or moved event must stay in the feed**. Deleting it silently leaves whoever subscribed with a dead event in their calendar and no way of finding out. The `status` **is** the way of finding out.

**`postponed` and `rescheduled` are not synonyms, and the difference lies in the document's own dates.** `postponed` keeps the **old dates** — do not invent a new one and do not delete `startDate` (it is required): the event still points at a day that no longer holds, and that is exactly what `postponed` is saying. When the new date is confirmed, `startDate`/`endDate` are **updated** and it becomes `rescheduled`. Because the `id` does not change, a consumer updates the event it already had instead of duplicating it.

> v0.5 **does not model the previous date** (schema.org's `previousStartDate`). No real producer emits it today, and `updatedAt` already says something changed. If you need it, it is a candidate for the core by the usual route: a field with no prefix, in production, and it graduates if it survives.

**`moved-online` should carry `location.onlineUrl` and `attendanceMode: "online"`.** Should, not must: the schema does not require it because the joining link is often not public yet (it arrives by email to whoever registered), and a spec that required it would force whoever imports either to invent it or to discard the event. If `location.venue` stays there as a trace of where it was going to be, that is fine: [`attendanceMode` wins](#location-and-attendancemode-are-not-redundant), and it says `online`.

**Why `tentative`, if schema.org does not have it.** Because `status` is the **only field in the spec with a default**: absent means `scheduled`, not "unknown". Without `tentative`, whoever imports an `.ics` with `STATUS:TENTATIVE` — the status any calendar emits for something not yet settled — can only **promote the event to confirmed**, which is asserting something nobody asserted. It is the same argument by which `attendanceMode` has no default: staying silent and saying `scheduled` are different assertions, and only one of them is honest.

`tentative` describes **the event**, not the quality of the data: it is used when whoever organises has not settled the date or the venue, not when whoever imports is unsure about them. And it is not a permanent state: as soon as it is confirmed, it becomes `scheduled`.

**Translation into the three destination formats, including the loss:**

| OTE | schema.org `eventStatus` | iCal `STATUS` | Loss |
| --- | --- | --- | --- |
| `scheduled` | `EventScheduled` | `CONFIRMED` | None. |
| `tentative` | `EventScheduled` | `TENTATIVE` | **In schema.org.** It has no equivalent: `EventScheduled` is emitted and the nuance is lost. The only one that travels better to iCal than to schema.org. |
| `cancelled` | `EventCancelled` | `CANCELLED` | None. |
| `postponed` | `EventPostponed` | `TENTATIVE` | **In iCal**, which does not distinguish postponed from unconfirmed. Google does read `EventPostponed`. |
| `rescheduled` | `EventRescheduled` | `CONFIRMED` *(with the new date)* | None in the dates; the fact that there was a change is lost in iCal. |
| `moved-online` | `EventMovedOnline` + a `VirtualLocation` `location` | `CONFIRMED` *(with the URL in `LOCATION`/`URL`)* | **In iCal**, which does not distinguish an online venue from a physical one. |

**RSS and Atom have no `status` at all.** There is no field to put it in, so whoever exports must carry it into the entry's **title** (`[CANCELLED] Rust Madrid — June`) or into the first lines of the content. An announcement channel that announces a cancelled event exactly like a confirmed one is worse than not announcing it.

### `license` and `source`: what can be reused, and where it came from

`license` is the licence of **this data**, not of the event. SPDX (`CC0-1.0`, `CC-BY-4.0`) or a URL. It goes in SPDX and not in prose (`CC BY 4.0`) because an importer has to compare it against an allowlist, and for that it needs an identifier, not a phrase — and the validator really does check it against the official [SPDX License List](https://spdx.org/licenses/), not just its shape. *Deprecated* identifiers are still valid, because SPDX itself keeps publishing them as such; what does not work is an invented one. Detail in [DECISIONS.md, D008](DECISIONS.md#d008--license-validates-simple-spdx-identifiers-against-the-real-spdx-license-list).

**The recommended profile warns (without invalidating) if `license` carries a clause that can block a directory or aggregator**: *NonCommercial* rules out any commercial directory outright, *NoDerivatives* blocks the reformatting/translation any aggregator does, and *ShareAlike* (including `ODbL`) is "viral" for a combined database — mixing your event with others could force the entire aggregated feed to adopt your licence. Copyleft software licences (GPL and family) are not in the recommended set either: their mechanics are written for "distributing the Program", which is legally ambiguous applied to a JSON document, and that ambiguity alone is reason enough for a directory's legal team to decline rather than take the risk. None of this invalidates the document — only `CC0-1.0`, `CC-BY-*` (without NC/ND/SA), `PDDL-1.0` and `ODC-By-1.0` escape the warning.

**Compatibility between the licences of different events in the same feed is the responsibility of whoever aggregates**, not something this spec checks or imposes: each event is an independent work, and `license` can be overridden per event precisely because not every community wants the same terms. Anyone building an aggregator who wants to combine or redistribute the whole feed as a single thing has to look at **each event's** licence, not only the feed's — inheritance (`x-inheritsFrom`) gives a default, not a guarantee that every event shares a licence.

`source` is **required when the event was imported or aggregated** from somewhere else (an `.ics`, Meetup, another directory). It is omitted when whoever organises describes their own event: they **are** the source.

**Inside `source`, either `name` or `url` is enough** — ideally both — and the schema rejects a `source` carrying neither: a provenance that points at nothing is not a provenance. Requiring `name` would be worse than accepting `url`: whoever imports an `.ics` always knows the address they downloaded and often has no publisher name to read (iCalendar's `X-WR-CALNAME` is optional), so the requirement would be met by **inventing it**, and an invented source is worse than a source given only as a link. It is the same rule `offers` follows with `price` and `url`, and `location` with `venue` and `onlineUrl`.

`source.license` (what the source allows) and `license` (what this document allows) are different fields and **do not have to match**. But the source's terms **restrict what can be republished**: declaring a `license` grants no rights the source never gave.

#### When the source field carries HTML

`description` is **plain text or Markdown**, and the most widespread producer of `.ics` in the world does not honour that: Google Calendar writes `DESCRIPTION` with `<a href="…">`, `<br>` and HTML entities. In the same real 871-event export, **every** event carried its link that way, because none had a separate `URL` property. So this is the normal shape of the data, not a careless publisher, and an importer meets it immediately.

**Convert it; do not copy it through.** Copying produces a document that validates — `description` has no pattern that could catch it — while breaking what the field promises, and it shows literal `&nbsp;` and unrendered `<a>` to every consumer that treats the field as the text it says it is. The minimum an importer does:

| In the source | In `description` |
| --- | --- |
| `<a href="X">Y</a>` | `[Y](X)`, the Markdown the field already allows |
| `<br>`, `<p>` | a line break |
| `&amp;`, `&nbsp;`, `&#39;` | the character they stand for |
| anything else (`<div>`, `<span>`, attributes) | drop the tag, keep the text |

A converter that meets markup it does not understand **strips the tag and keeps the text**: losing a formatting nuance is acceptable, emitting markup into a field declared not to carry it is not. The same applies to any other free-text field fed from the same source.

**One thing worth rescuing before dropping the tags.** When the source has no `URL` property, the event's real link is often *inside* that HTML — the first `<a href>` pointing outside the calendar host is usually it. An importer **MAY** promote it to `url`; it **MUST NOT** use it as the `id`, which stays the importer's own minted, stable identifier (see [`id` and `url`](#id-and-url-start-out-identical-but-they-are-not-the-same-thing)). Guessing the link wrong costs a bad `url`, which a later import corrects; guessing the `id` wrong costs a duplicate event forever.

### `organizers`: who runs it — and the three things it is not

New in v0.3. Optional, and **a list**, not an object:

```json
"organizers": [
  { "name": "GDG Madrid", "url": "https://gdgmadrid.example", "email": "hola@gdgmadrid.example" },
  { "name": "Python Madrid", "url": "https://www.meetup.com/python-madrid/" },
  { "type": "person", "name": "Ada Lovelace", "url": "https://ada.example" }
]
```

Only `name` is required. `url`, `email` and `type` (`organization` by default, or `person`) are optional. **And nothing else**: no logo, no identifiers. The field describes **who organises it and where to write to them**, not their full profile.

**It is a list because co-organising is the norm**, not the exception: two communities running a joint meetup, a community and its host. Luma already emits `organizer` as an array (organisation plus person) and schema.org accepts it. Widening an object into a list later would have been a breaking change; it is born a list. **Order is significant**: the first one is the main one, and it is the only one that survives into iCal. Repeating exactly the same organiser in the list is invalid: it adds no information, it only forces whoever exports to deduplicate. See [DECISIONS.md, D027](DECISIONS.md#d027--organizers-must-not-carry-exact-duplicate-entries).

Three confusions worth defusing before they happen:

1. **`organizers` is not `source`.** Who runs the event vs. where the data came from. A PyAlmería event picked up from Meetup has `organizers: [PyAlmería]` and `source: { name: "Meetup" }`. They are orthogonal and often both appear.
2. **`organizers` are not speakers.** Whoever gives the talk goes in [`speakers`](#speakers-who-gives-the-talk) (new in v0.5), never here. Putting a speaker in `organizers` corrupts the data for everyone who consumes it.
3. **`feed.organizers` is not `feed.title`/`feed.url`.** `title`/`url` name **whoever publishes** the feed; `organizers`, **whoever organises** the events. In a single-community feed they coincide. In an aggregator's feed they do **not**, and that is precisely where the field earns its place: without it, a consumer has no choice but to fall back on `feed.title` and attribute to the aggregator every event it aggregates.

**Inheritance: replacement, not merging.** Like `license`, `feed.organizers` is the default for every event that does not declare its own. An event that **does** declare it **replaces the entire list**; it is not added to the inherited one. With merging there would be no way to *remove* an inherited organiser, and a guest event inside a community's feed would end up attributed to someone who did not organise it. The practical consequence: in a co-organised event within a community feed you have to **repeat** the feed's community alongside the guest one — see [`examples/feed-community.json`](examples/feed-community.json).

#### `email`: the address that makes iCal's `ORGANIZER` valid

Optional, **a single address**, and without the `mailto:` prefix — whoever exports adds it:

```json
"organizers": [
  { "name": "GDG Madrid", "url": "https://gdgmadrid.example", "email": "hola@gdgmadrid.example" }
]
```

**It gets in because there is a real producer, and it is the usual one: `.ics`.** A published `VEVENT` very frequently carries `ORGANIZER;CN="Rust Madrid":mailto:hola@rustmadrid.example`, and until now the importer **had the data in front of it and nowhere to put it** — the exact same reason `tags`, `location.geo` and `updatedAt` got into v0.2. The consequence was that `.ics` → OTE → `.ics` **lost the `ORGANIZER`**, the only loss this page calls **serious**. A format that cannot round-trip the most published source in the world has a hole, not a decision.

**And it fixes a second destination as a side effect**: RSS 2.0's `<author>` **requires an email**, so without one the only way out was `dc:creator`. With `email` the native element can be emitted.

**What this field does not have has to be said out loud**: none of the five platforms studied ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)) emits an email in its JSON-LD. They hide it behind a form, **and they are right to**. This field's producer is iCalendar, not the events web, and that is why it arrives with more rules than any other field in the spec.

**The price is spam, and it is real.** Publishing an address in an open, crawlable JSON file is handing it to the harvesters, and **what is published cannot be unpublished**: it stays in the caches of whoever read it. Hence the rules:

1. **A role address, not anybody's mailbox.** `info@`, `hola@`, `events@`. With `type: "person"`, think twice: a person's address in a crawlable feed is a problem they suffer, not the project.
2. **An importer MUST NOT fill `email` from a source that is not publicly published.** An `.ics` shared by link, a company calendar or a private export **are not publication**: copying from there into an open feed is not translating a value, it is **changing its level of exposure**. What `source.license` already says about republishing is said separately here, because the data is personal.
3. **A consumer MUST NOT use `email` for anything other than writing about the event.** No mailing lists, no contact directories, no commercial databases. It is a rule no schema can check, like the one about [updating `status`](#status-a-cancelled-event-stays-published), and it is honoured all the same.
4. **Whoever exports to JSON-LD thinks twice.** `Organization.email` exists, and emitting it puts the address on a public page. That is legitimate — it is the organiser's own site — but **Google does not use it** for the `Event` rich result: the email gets into this spec through iCal, not through SEO.

**It is not [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields)**, for two reasons that stack. One, the usual: whoever imports an `.ics` without an `ORGANIZER` cannot act on the warning. And two, a new one that appears only here: **a warning about a missing email is pressuring somebody to publish an address they chose not to publish**. The quality profile exists to flag what the event is missing, not to push anyone into exposing contact details. It is the only field in the spec left out of the profile for a reason that is not technical.

**And it adds no inheritance rule.** It is the question this field raises all on its own — "is it inherited from the feed?" — and the answer was already written: `email` lives **inside** `organizers[]`, and `organizers` is inherited **by replacement, not by merging**. The consequences, which are exactly the ones wanted:

| Case | What happens to the email |
| --- | --- |
| Community feed, event with no `organizers` | It inherits the feed's entire list, email included. **Correct**: it is the same community, and the email *is* the same. One line in the feed, zero repetition. |
| Community feed, event **with** `organizers` | **It inherits nothing.** The declared list replaces the whole thing, so a co-organised event never ends up with the email of someone who does not organise it. |
| **Aggregator** feed | The spec already requires **omitting** `feed.organizers`. With no list there is no email to inherit. |

The feared risk — inheriting somebody else's email — **would only exist if the email were inherited on its own**, with a loose `feed.organizerEmail` or with field-by-field merging. Neither is done, and the [inheritance table](#the-feed) still has the same four rows it had before.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `organizer` (array), `@type` `Organization`/`Person` per `type`, `name`, `url`, `email` | None in the model. Emitting `email` is **optional for whoever exports** (see rule 4): Google does not read it for the `Event`. |
| **Atom** | `<author><name>…</name><uri>…</uri><email>…</email></author>`, repeatable | None. It is the only destination that receives all three fields, and repeated. |
| **RSS 2.0** | `<author>` if there is an `email`; `<dc:creator>` if not | RSS 2.0's `<author>` **requires an email**: without one you still need `dc:creator`, which carries no address. |
| **iCal** | `ORGANIZER;CN="…":mailto:…` if there is an `email` | **Without `email` the loss is still serious**: `ORGANIZER` is a `CAL-ADDRESS`, in practice a `mailto:`, so there is nothing valid to emit → degrade it to `X-OTE-ORGANIZER` or to the `DESCRIPTION`. And `ORGANIZER` is **single-valued** even when there is an email: from the second organiser on there is nowhere to put them. |

**An exporter does not invent the address.** With no `email` there is no `ORGANIZER`, full stop: deriving a `mailto:` from the `url`'s domain (`hola@` plus the domain, or the old `webmaster@`) is fabricating a contact detail nobody published, and on top of that forcing whoever receives it to write to an address that may not exist. It is the rule that governs the whole spec: **staying silent and guessing are different assertions, and only one of them is honest.**

**Why there is no `id` or `communityId`.** An identifier linking the organiser to a community directory, in the style of `combuilders:my-community`, was considered. It is rejected in v0.3 for three reasons: it demands **prefix governance** (who assigns `combuilders`, who resolves collisions) that this project does not have and that would couple OTE to another one; it contradicts the spec's own `id` rule (*a URI under a domain you control*, which needs no central registry because DNS already guarantees uniqueness); and above all **there is no real consumer yet** — the directory does not exist as a specification. Putting it in now would be exactly the speculative design the Extensions section forbids.

You do not have to wait for anyone to use it: it is a prefixed extension field (see below), it works today, and if it survives real use it graduates into the core in whatever shape that use dictates.

### `speakers`: who gives the talk

New in v0.5. Optional, **a list**, and only `name` is required:

```json
"speakers": [
  { "name": "Ada Lovelace", "affiliation": "Analytical Engines", "url": "https://ada.example",
    "sameAs": ["https://fosstodon.org/@ada", "https://www.linkedin.com/in/ada-lovelace"] },
  { "name": "Grace Hopper" },
  { "type": "organization", "name": "The anyio team" }
]
```

**It is not `organizers`, and it is not `source`.** Whoever gives the talk did not organise the event, and is not where the data came from. Putting a speaker in `organizers` — the one thing v0.4 explicitly warned against with no alternative — corrupts the data for everyone downstream.

**A list, because a panel is the norm.** Co-talks, panels, fireside chats. Order is display / preference order: the first is the one that survives to a single-value destination, the same rule `organizers` and `image` follow. Exact duplicates are rejected; two entries are never merged by inferred identity.

**`url` is one canonical page; `sameAs` is the rest.** `url` is the speaker's own site or main profile — one value, so a single-value destination has something unambiguous. `sameAs` is the list of their other profiles (Mastodon, LinkedIn, GitHub), mapping 1:1 to schema.org `Person.sameAs`. Both are **HTTP(S) only**: a Bluesky DID or a Fediverse handle is an identifier, not a Web page — publish the public profile URL instead. `speakers[].name` is a proper noun and is never translated.

**`affiliation` is where the company goes, and that is the point of having it.** Every agenda in the world writes "Martí Cristobal, Bettatech", and with nowhere to put the second half it ends up inside `name` — which buys a correct-looking label today and costs every consumer that later tries to match or de-duplicate that person, because "Martí Cristobal, Bettatech" matches nothing anywhere else. It is the same damage putting a speaker in `organizers` did before v0.5, and the reason it is worth a field rather than a warning.

It is **one display name, as a bare string**: a proper noun, never translated, same discipline as `organizers[].name`. Not an object, deliberately — the shape people reach for next is `{ name, url }`, and a second organisation worth describing is an **organizer or a sponsor**, not a label on a speaker. On `type: "organization"` it is meaningless and ignored: `name` already is the organisation.

**Still kept as small as `organizers` otherwise.** No `bio`, no photo, no `jobTitle`, no identifier — the same "describe who they are and where to find them, not their full profile" discipline. Those stay documented as [suggested extensions](#extensions) so producers converge on one shape, and may graduate later on real adoption; `affiliation` went first because it is the only one with no translation cost and the only one whose absence actively corrupts another field.

**Not [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields).** An `.ics` importer never has speaker data, and most events in a community feed are meetups whose speaker is often the organiser anyway — a warning would fire on the majority for no gain.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `performer` (array): `@type` `Person`/`Organization` from `type`, `name` → `name`, `url` → `url`, `sameAs` → `Person.sameAs`, `affiliation` → `Person.affiliation` as `{ "@type": "Organization", "name": … }` | None in the model. Google reads `performer`/`name`/`url` for the Event rich result; it documents neither a nested `performer.sameAs` nor a `performer.affiliation`, so both reach generic schema.org consumers and OTE directories, not a Google rich result. |
| **iCal** | RFC 5545 core has no speaker term — the normative fallback is `X-OTE-SPEAKER:Ada Lovelace` (repeatable) or a line in `DESCRIPTION`. As an *optional advanced export*, enhanced iCalendar ([RFC 9073](https://www.rfc-editor.org/rfc/rfc9073), *Updates: 5545*) MAY emit one `PARTICIPANT` per speaker: `PARTICIPANT-TYPE:SPEAKER` and `UID` are required by §7.1 (the exporter mints the `UID` from `speakers[].url`, else `<event id>` + a slug of `name`), `SUMMARY` carries `name`, `URL` carries `url`; `affiliation` has no RFC 9073 property and degrades into the `SUMMARY` text or is dropped. `ATTENDEE` stays forbidden — it means a participant/invitee, not a speaker. | Total for a core-5545 client, and harmless. An RFC 9073-aware client gets the speakers, at the cost of a minted `UID` the OTE model does not carry. |
| **RSS / Atom** | Nothing native → the item body ("Speakers: …") | Total, harmless. |

### `recordings`: the video, after the event

New in v0.5. Optional, **a list**. An entry is a bare HTTP(S) IRI or an object that adds a title:

```json
"recordings": [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  { "url": "https://tube.rustmadrid.example/w/abc123", "title": "Q&A",
    "translations": { "en": { "title": "Q&A" } } }
]
```

**It is not `image` and not `location.onlineUrl`.** `image` is the poster; `location.onlineUrl` is the **live** connection link, which stops meaning the same thing once the event is over. `recordings` is the published video, linked **after** the event happened — the document already exists with its stable `id`, only `updatedAt` changes.

**Two entry forms, like `image`.** A bare IRI for the common case; an object when the list has more than one recording and a `title` tells them apart ("Full session", "Q&A"). The `title` is free text in the document's `textLanguage`, translated by the entry's own `translations` map — the same shape as `image[].alt`, and it requires `textLanguage` like every other translations map.

**Not [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields).** Most events have no recording, a live one has none yet, and the spec has no "is in the past" predicate to make the warning conditional on.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `recordedIn` (array of `VideoObject { url, name? }`) — *"The CreativeWork that captured all or part of this Event"* | Structural, and it does **not** reach Google — Google reads no video property for `Event`. A generic schema.org consumer that follows `recordedIn` gets it. |
| **iCal** | No term (RFC 7986 has no recording property; `URL` is the event page). Degrade to `X-OTE-RECORDING` or a `DESCRIPTION` line | Total; harmless. |
| **RSS / Atom** | A watch page is **not** a direct media URL — map it to `<media:player url>` (Media RSS) or an item/body link, **not** `<media:content url>` and not `<enclosure>` | Structural. |

### `tags`, `location.geo`, `updatedAt`: what v0.2 adds

All three are **optional** and got in for the same reason: the `.ics` importer had them in front of it in every `VEVENT` and there was nowhere to put them. None is a speculative idea; all three already have a real producer. Detail in the [CHANGELOG](../../CHANGELOG.md).

- **`tags`** — a free list of topics (`["rust","wasm"]`). Maps to iCal's `CATEGORIES` and schema.org's `keywords`. **Free on purpose**: whoever organises tags however they like. A controlled vocabulary (to keep filter or subscription interfaces clean) could be layered on later **without** closing the field. Absent = unknown, not "no topic". Exact duplicates are rejected (`["rust","rust"]`): that is not vocabulary freedom, it is the same tag asserted twice. `languages` has the same rule, for the same reason — see [DECISIONS.md, D024](DECISIONS.md#d024--tags-and-languages-must-not-carry-exact-duplicate-entries). `languages` additionally rejects the same BCP 47 tag repeated with different capitalisation (`["es","ES"]`): `tags` is free vocabulary with no such precedent, but `languages` shares its type with the keys of `translations`, which are already compared that way — see [DECISIONS.md, D028](DECISIONS.md#d028--languages-must-not-repeat-the-same-bcp-47-tag-under-different-case).
  > **`CATEGORIES` does not travel through Google Calendar** (it neither emits nor reads it). An importer may recover topics from a *hashtag* convention (`#rust`) in the `description` — but that is **importer behaviour, not schema behaviour**: here `tags` is always the structured list.

- **`location.geo`** — a WGS-84 point `{ lat, lon }` in decimal degrees. Maps to iCal's `GEO` and schema.org's `Place.geo`. It is **independent of `venue`** (free text): a point on a map, not a name. It goes **inside `location`** — a sibling of `venue`/`onlineUrl` — just as schema.org nests `geo` inside `Place`; it does not hang off `venue`, because `venue` is a string, not an object. `geo` alone is not enough to satisfy `location`: you still need `venue` or `onlineUrl`.

- **`updatedAt`** — the instant (with an offset/Z) at which **the event's data** last changed. It is the equivalent of iCal's `LAST-MODIFIED`, **not** of `DTSTAMP`: `DTSTAMP` marks *when the file was generated* and changes on every export even when nothing changed, so it is useless for "what changed". Its value is in **incremental synchronisation**: a consumer reading the feed daily filters by `updatedAt > last_read` instead of re-comparing the whole collection. The feed's `updatedAt` says "something changed"; the event's says **what**. Absent = unknown, not "never changed". **No event may have an `updatedAt` later than the feed's own** — a feed cannot contain a revision that, by its own timestamps, did not yet exist when it was generated; the validator checks it by comparing the real instants, not the text. Detail in [DECISIONS.md, D015](DECISIONS.md#d015--no-events-updatedat-may-be-later-than-the-feeds-own-updatedat).

### `image`: the poster, its alt text, and why the list accepts two forms

New in v0.3. Optional — though [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields) — and **a list** whose entries point with HTTP(S) IRIs **at the image file**, never at a page displaying it:

```json
"image": [
  {
    "url": "https://rustmadrid.example/img/2026-06-16x9.png",
    "alt": "Poster on a purple background: Ferris the crab in a hard hat, with the date \"26 June, 19:00\" in large type"
  },
  "https://rustmadrid.example/img/2026-06-4x3.png",
  "https://rustmadrid.example/img/2026-06-1x1.png"
]
```

**Order is significant**: the first one is the main one, and often the only one a destination can use. Whoever can show only one shows the first.

**It is not a gallery.** The usual case is for the entries to be **the same image** in different crops or resolutions — which is exactly what [Google asks for](https://developers.google.com/search/docs/appearance/structured-data/event) (1:1, 4:3 and 16:9) and what Meetup, Luma and Guild already emit. But that is the usual case, **not a guarantee**: nothing stops anyone publishing the poster and a photo of the venue, and a consumer has no way of telling the two apart. That is why the rule that does hold is the one about order, and no interface should render the list as a photo carousel.

It gets in by the usual route — **a field everybody already emits**: of the five sources studied ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **all five** emit `image`, and three of them already as an array.

#### `image[].alt`: accessibility, and the three decisions it drags along

An entry is **either a string or an object** `{ url, alt?, translations? }`. The two forms coexist in the same list on purpose, and every part of that sentence is a decision:

**Why `alt` goes inside the entry and not in a field alongside the event.** An `imageAlt` next to `image` would be simpler to write and would be wrong: it would describe the first image and apply to all three. It only works if the list is always the same poster cropped, and we have just seen that **cannot be guaranteed**. Alt text describes *one* specific image, so it travels attached to its URL.

**Why the two forms coexist instead of migrating the list to objects.** Because an array of objects would break every already-published `0.2` and `0.3` document — v0.3 is announced as backwards-compatible with v0.2, and it still is — and because the extra crops **do not need an `alt`**: describing the same image three times is noise for whoever writes it and whoever listens to it. The string form is the right answer for them. The price is that whoever consumes normalises in one line (`typeof i === "string" ? { url: i } : i`), and that is a low price.

**Why `alt` is translated, and not written in "international English".** An `alt` is read out by a screen reader with the voice and pronunciation of the surrounding language: putting English inside a Catalan document produces mangled audio, which is worse accessibility than the kind it came to fix ([WCAG 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) exists for exactly this). So `alt` is in the document's `textLanguage`, like `name` and `description`, and it is translated with the entry's **own** `translations` map — like `offers[].name`, and for the same reason: [a positional mirror](#textlanguage-and-translations-what-language-this-is-written-in) (`translations.es.image[0]`) would attach the text to the wrong image as soon as somebody reordered the list. See [`examples/event-online.json`](examples/event-online.json).

On what to write: **describe what is visible**, not what the event already says. Repeating the `name` makes a screen reader say it twice in a row, and "image of…" is redundant because the client already announces that it is an image. There is no empty string: HTML's `alt=""` means "decorative", and a decorative image has no business in a feed — an image with nothing to say is an image you leave out.

And a warning in case it gets confused with what follows: this **is not SEO**. Google does not score the `alt` of `Event.image`; it is added because there are people who cannot see the poster.

**It is a [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields) field**, not a required one. Without it nothing stops validating and nothing breaks in the three destinations — but the event gets listed with no face, and in an interface full of cards that decides whether anyone looks at it. The profile's second test weighs more: **the warning is actionable**. The five sources studied already emit an image, so a feed with no `image` is almost never an event with no poster: it is a poster that has not been mapped. A warning whoever publishes can fix in a minute is exactly what the profile exists to give.

The known exception is whoever imports an `.ics`: **iCalendar almost never carries an image** (`IMAGE` dates from 2016 and is barely emitted), so there the warning is not actionable. That is accepted, for the same reason `url` and `description` remain recommended despite being missing from almost every published `.ics`: the profile describes **what the event is missing**, not who to blame for it missing. See [`examples/event-from-ics.json`](examples/event-from-ics.json), which warns about exactly that.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `image`: bare URLs for entries with no `alt`, and `ImageObject { url, caption }` for those that carry one | None in the URLs — OTE's array **is** the one Google asks for, and `Event.image` accepts `ImageObject`, so the rich result is not lost by adding an `alt`. schema.org **has no `alt` property**: `caption` is the closest and it is the one Google uses, so the nuance of "alt text" rather than "caption" is lost. |
| **iCal** | `IMAGE;VALUE=URI;DISPLAY=BADGE:<first>` ([RFC 7986](https://www.rfc-editor.org/rfc/rfc7986)) | **From the second one on**, and **the whole `alt`**: `IMAGE` has no parameter for alt text. `IMAGE` allows several, but the clients that support it show one. A client that ignores the property — most of them — still sees the complete event. |
| **RSS 2.0** | `<enclosure url type length>` with the first one, or `<media:content>` + `<media:description>` for the `alt` | `<enclosure>` **requires `type` and `length`**, which OTE does not model: whoever exports has to infer the MIME type from the extension and issue a `HEAD` for the size, or use `media:content`, which requires neither **and is also the only one of the two that can carry the `alt`**. |
| **Atom** | `<link rel="enclosure" href="…" type="…">`, repeatable; the `alt` goes in the `alt=` of the `<img>` inside `<content type="html">` | None in the number of images; `type` has the same problem as in RSS. |

The MIME type being absent is the **opposite** decision to [`organizers[].email`](#email-the-address-that-makes-icals-organizer-valid), and by the same criterion: a MIME type is **derived** without inventing anything — the file extension, or a `HEAD` — so the exporter resolves it on its own and the schema does not have to ask for it. An email is derived from nowhere, and that is why it is there.

### `textLanguage` and `translations`: what language this is written in

New in v0.3, both optional. They are **two fields because they are two problems**, and only the second has anything to do with multilingual events:

```json
"name": "Sessió setmanal de codificació — Rust Girona",
"description": "Cada setmana ens trobem en línia per picar Rust una estona.",
"languages": ["ca", "es"],
"textLanguage": "ca",
"translations": {
  "es": {
    "name": "Sesión semanal de programación — Rust Girona",
    "description": "Cada semana nos juntamos en línea para picar Rust un rato."
  }
}
```

**`languages` and `textLanguage` are not the same piece of data**, and this example is exactly why: the session **is spoken** in Catalan and Spanish, and the document **is written** only in Catalan. Neither is derived from the other, and confusing them is the real risk of this pair: `languages` answers "will I understand it if I go?", `textLanguage` answers "what language is this text in?". The `languages` description now says so in the schema itself, because that is where somebody will read it. Being valid does not mean being complete: the recommended profile warns (without invalidating) if some language in `languages` has neither a `textLanguage` (its own or inherited from the feed) nor an entry in `translations` covering it — anyone who reads only that language finds not one word they can understand. Detail in [DECISIONS.md, D019](DECISIONS.md#d019--recommended-profile-warns-when-a-spoken-languages-entry-has-no-available-text).

**`textLanguage` is one tag, not a list.** A text is written in one language. Without it, a consumer cannot set `lang="ca"` on the HTML — which decides hyphenation, the screen reader's voice and the spellchecker's dictionary — nor sort alphabetically properly, nor decide whether to machine-translate. None of that can be worked out from the text without guessing.

**"BCP 47 tag" is really validated, not just shape-checked:** the core (language, with optional script/region/variant) is checked subtag by subtag against the real IANA registry. Private use (`x-...`), *grandfathered* tags (`i-klingon`) and extensions are **deliberately out of scope** — with no real use case for "what language is this text in" — and registered codes that do not name a specific language (`und` Undetermined, `mis`, `mul`…) are not accepted either, for the same reason `ZZ` is not accepted as a `country`. Detail and rejected alternatives in [DECISIONS.md, D007](DECISIONS.md#d007--languagetag-validates-the-core-of-bcp-47-against-the-real-iana-registry-not-all-of-it).

**It is inherited from the feed, and that is where it gets cheap.** Like `license` and `organizers`: the feed declares it once and every event that does not declare it inherits it. For anyone publishing in a single language — 99% of cases — this field costs **one line in the whole file**. Absent means **unknown**: not English, not the HTTP header's language, and not the feed's if the feed does not say either.

**`translations` is a map, and the primary text stays a string.** It is the decision holding up everything else:

- **`name` and `description` do not change shape.** A v0.2 consumer reads a document with `translations` and never notices it exists. The alternative — language maps in the field itself, `"name": {"ca": "…", "es": "…"}`, which is JSON-LD's `@container: @language` — is technically cleaner and **breaks `name` for every consumer that exists today**, taxing the monolingual 99% to serve the 1%. Rejected for that.
- **A map and not a list, because the language is the key.** One entry per language, and **no way of publishing two Spanish versions** that contradict each other — not even by writing the tag with different capitalisation: `translations.en-US` and `translations.EN-us` are the same BCP 47 tag and the validator treats them as the same language, exactly as it already does when comparing them against `textLanguage`. Detail in [DECISIONS.md, D023](DECISIONS.md#d023--a-translations-map-must-not-carry-two-keys-naming-the-same-language-in-different-case).
- **Text living inside an object is translated where it lives**, with a `translations` local to that object: `offers[].translations`, `eligibility.translations`, `partOf.translations`. [Detail below](#local-translations-the-text-living-inside-an-object).
- **It is never translated into the language the document is already in.** A `ca` entry in a document with `textLanguage: "ca"` is the same text twice, and two ways of asserting the same thing are two ways of contradicting yourself — the [`isFree`](#offers-what-it-costs-and-where-you-get-the-ticket) argument. **The validator really does check it** (it is not merely a normative rule for whoever publishes to police): a custom Ajv keyword rejects any `translations` repeating `textLanguage`, compared case-insensitively — `ca` and `CA` are the same language. Detail in [DECISIONS.md, D010](DECISIONS.md#d010--a-translations-map-must-not-carry-a-key-equal-to-textlanguage).
- **An empty map is invalid**, just like `location: {}`: saying nothing is already done by omitting the field. And the keys have to be BCP 47 tags — `"spanish"` does not validate, which is exactly the mistake made by hand. **And an entry carrying only unknown fields does not count as a translation either**: it can still carry extensions alongside `name`/`description` (or `title`/`description` on the feed), but as its only content it translates nothing OTE recognises — and it would silently suppress the covered-languages warning ([D019](DECISIONS.md#d019--recommended-profile-warns-when-a-spoken-languages-entry-has-no-available-text)). Detail in [DECISIONS.md, D022](DECISIONS.md#d022--eventfeed-top-level-translations-must-carry-at-least-one-recognized-ote-field).
- **Translating a field the primary text does not have is still valid** — it can be a legitimate editorial decision, not a contradiction — but the recommended profile warns (without invalidating) when that happens in `offers[].name`, `partOf.name` or `eligibility.note`: whoever already wrote the text in another language probably wants it to exist in the primary one too, for whoever does not read `translations`. Detail in [DECISIONS.md, D030](DECISIONS.md#d030--recommended-tier-warning-when-a-translation-exists-for-a-field-the-primary-text-omits).

**Any `translations` in the document requires `textLanguage`.** It is the **only cross-field dependency in the whole spec**, and the schema checks it with an `if`/`then` — **at any depth**: a translation inside an offer triggers it too, because the primary text's language is a property of the entire document, not of each object. Without it, a translations map is useless: nobody can tell which entry duplicates the primary text, nor what they are falling back to when they cannot find their language. A consumer's reading order is: **the language they ask for → `translations` → the primary text**, and that last step needs to know what language it is in.

#### Local translations: the text living inside an object

`name` and `description` are not the only free text in an event. There is more inside objects and lists, and **it is translated where it lives**:

```json
"offers": [
  { "name": "Estudiants", "price": 0, "translations": { "en": { "name": "Students" } } }
],
"eligibility": {
  "type": "members-only",
  "note": "Membres del Discord de Rust Girona",
  "translations": { "en": { "note": "Members of the Rust Girona Discord" } }
},
"image": [
  {
    "url": "https://rustgirona.example/img/sessio-setmanal.png",
    "alt": "Quadrícula de webcams i un editor amb codi Rust compartit",
    "translations": { "en": { "alt": "A grid of webcams and an editor with shared Rust code" } }
  }
]
```

**Never a positional mirror.** `translations.es.offers[0].name` is the shape this spec **rejects**: a list has no stable keys, so it takes only somebody reordering the offers for the translation to end up hanging off the wrong tier — **and nothing would stop validating**. A local map cannot fall out of alignment: it lives inside the object it translates.

**What is translated and what is not**, because an event's free text is not all the same class of string:

| Class | Examples | What the spec does |
| --- | --- | --- |
| **Prose and labels** | `name`, `description`, `offers[].name`, `eligibility.note`, `partOf.name`, `image[].alt` | **Translated**, with `translations` — the event's for the first two, a local one for the rest. `image[].alt` is the case with the most consequence: it is read **aloud** with the pronunciation of the surrounding language. |
| **Proper nouns** | `organizers[].name`, `location.venue` | **Never translated.** "PyAlmería" is "PyAlmería" in every language, and translating a venue's name is inventing a place. |
| **Tags** | `tags` | **Not translated in the data**, and here the spec leaves a rough edge: `tags` is free text, so an event tagged `["aprenentatge-automàtic"]` and another tagged `["machine-learning"]` do not find each other. The practical recommendation is to **tag in the language of the technical ecosystem**, which is in fact what already happens (`rust`, `wasm`, `ai`), and leave presentation to the interface. A controlled vocabulary on top would solve it completely; it remains an [open question](#others). |
| **Closed values** | `eligibility.type`, `status`, `attendanceMode`, `offers[].availability` | **They need no translation**: an enum is **multilingual for free**. `members-only` is rendered in the reader's language, and the data does not change. It is the best argument in favour of enums in the whole spec. |
| **Codes** | `address.country`, `languages`, `textLanguage`, `offers[].currency` | Already solved, and for this very reason: `ES` instead of "España" is [a decision the spec already took](#locationaddress-the-address-that-is-validated-part-by-part). |
| **Identifiers** | `id`, `partOf.id`, every `url` | **Never.** An `id` with two spellings is two events, and a series with two `id`s is two series. |

**`offers[].name` deserves a note**, because it is the case where there was an alternative: a `kind` with an enum (`general`, `early-bird`, `student`) would have been multilingual for free, like `eligibility.type`. **It is rejected**: it would take away whoever organises the right to name their own tickets, which is a real and used freedom. Free text is the decision; translating it is its price, and that is why `offers[].translations` exists.

**What is still not translated, and the recommendation instead:** `location.address.locality` and `region`, where **València/Valencia** or **Girona/Gerona** are two real spellings of the same place and there is no table like the one for countries. It is not modelled: write **the spelling most recognisable to the event's main audience**, and let `geo` resolve the rest — coordinates have no language.

**In the feed, the same with one important difference.** `feed.textLanguage` describes the **feed's** `title` and `description` and is also the default for its events; `feed.translations` translates **the feed's title, never its events**. And **it is not inherited**: a feed's title is not an event's name. A fully bilingual publisher also has the way out any website already uses — **one feed per language** (`/feed.ca.json`, `/feed.es.json`, each with its own `textLanguage`) — and that is still the simplest option when *all* the content is duplicated.

**How it gets in, and what it lacks.** This spec's bar is that a real producer exists, and it has to be said plainly: **`textLanguage` clears it** — iCalendar has `LANGUAGE` as a native parameter since [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), RSS has `<language>` and JSON-LD has `@language`: all three destinations can receive it — and **`translations` does not**: none of the five platforms studied publishes multilingual text per event, because each serves one page per language. It gets in anyway, for one concrete reason: in Catalan, Basque, Galician and Valencian the bilingual event **is the normal case**, and today the only way out is cramming both languages into the same string, which is worse than not having the field. It is this pair's declared debt: if in practice nobody emits it, it is surplus, and it will be surplus out loud.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org / JSON-LD** | `textLanguage` → the context's or the value's `@language`; `translations` → language maps (`{"@language":"es","@value":"…"}` per entry) | **None.** It is the only destination that receives both fields in full, with structure. |
| **iCal** | `textLanguage` → the `LANGUAGE` parameter of each text property (`SUMMARY;LANGUAGE=ca:…`), native in RFC 5545 | **`translations`.** `SUMMARY` is not repeatable: only the primary text survives. The rest goes into the `DESCRIPTION` ("ES: Sesión semanal…") or an `X-OTE-TRANSLATION`. |
| **RSS / Atom** | `textLanguage` → the channel's `<language>` (RSS) or `xml:lang` (Atom, which also allows it per entry) | **`translations` in RSS**, which only has a language at channel level. Atom holds up better because `xml:lang` is per element. |

That only JSON-LD receives it whole is acceptable by the usual rule: whoever ignores both fields **still sees a correct event**, in one specific language. It is a loss of structure, not of information.

### `eligibility`: who can get in — and why it is not a `tag`

New in v0.3. Optional, **an object**, and only `type` is required:

```json
"eligibility": {
  "type": "members-only",
  "note": "Members of the Rust Girona Discord",
  "url": "https://rustgirona.example/join"
}
```

An event with no conditions says so in one line, and it **says something**:

```json
"eligibility": { "type": "open" }
```

**It is the third part of "can I go?".** `attendanceMode` says whether you have to travel and `location` where; both answer whether the event is **within your reach**. Neither answers whether **they will let you in**. They are different questions and they contradict each other quite happily: Rust Girona's weekly session is online, free and open to anyone with a connection — and even so the voice channel sits inside a Discord you have to belong to. Until now that requirement lived only in the prose of `description`, which is exactly where a consumer cannot filter on it.

**Four values, and the enum is the point.** Deliberately short: a consumer who has to handle twenty kinds of door handles none, and the reason this is an enum and not free text is that **"can I go?" is a filter checkbox**, not a paragraph.

| Value | What it asserts | Real example |
| --- | --- | --- |
| `open` | Anyone can attend. It **includes** the event with a paid ticket and the one that runs out of places: a price and a capacity are not conditions about **who you are**. | A meetup with open registration; a conference with tickets on sale. |
| `members-only` | You have to **belong** to something first. | The session that happens inside the community's Discord. |
| `approval-required` | You sign up and **whoever organises decides**. | Luma's "request to approve"; a Meetup group with an admission question; a workshop that selects its attendees. |
| `restricted` | There is a condition and **none of the others names it**. It forces you to write a `note`. | "Students of the University of Almería only"; a speakers-and-sponsors dinner inside a conference. |

**`approval-required` is not capacity, and it is worth saying because the two get confused on their own.** It is about a **judgement on the person**: somebody looks at your request and decides. An event anyone can attend **first come, first served** until the places run out **has no door**: it is `open`, and places running out is said with [`offers[].availability: "sold-out"`](#offers-what-it-costs-and-where-you-get-the-ticket) — or with `capacity`, which is still an extension. It is the distinction holding up the whole field: `eligibility` describes **a condition about who can get in**, not the **state of the box office**. If the answer to "can I go?" changes on its own as time passes, it is not `eligibility`.

**`restricted` is the escape hatch, and it requires `note`.** It is what keeps the enum small and honest: without a catch-all, every condition that does not fit — "University of Almería students only", events with a community identity requirement — ends up hammered into `members-only`, which is asserting something nobody asserted. And `restricted` on its own says nothing, so the schema **rejects the document** if `note` is missing: it is the same conditional that requires `currency` as soon as `price` goes above 0. It plays the role `tentative` plays in `status`: the value that stops whoever imports from having to lie.

**No default: absent means unknown, never `open`.** The same rule as `attendanceMode` and `offers`. Whoever imports an `.ics` does not have the data anywhere, and a default would turn every imported event into an assertion — "open to anyone" — that nobody made. The corollary is that **`"type": "open"` does add information**, unlike `"status": "scheduled"`: here staying silent does not mean the same as saying it. It is the only pair in the spec where that difference is visible from so close up.

**Why there is no `invite-only`.** It was in the draft and **it falls on scope, not on form**. This spec exists so that somebody can find events and communities **they can take part in**; an event you only get into by invitation is not an event to search for, it is a private club, and giving it a value of its own in the enum would be declaring that describing private clubs is part of the job. The real cases near the line — a speakers-and-sponsors dinner, a gathering of an ambassador programme — **remain publishable**, and with more information than before: `restricted` with its mandatory `note` ("Speakers and sponsors only") says **who** can get in, whereas `invite-only` only said "not you". One value fewer, and the one that remains forces you to explain yourself.

**Why they are not `tags`.** That is how it is done today, and that is why the field exists: as soon as `["rust","members-only","beginners"]` is a free list, the consumer has to **guess** which of those strings is an access condition, and no interface can offer a "only events I can get into" checkbox without a vocabulary the free list does not have. `tags` is **what the event is about**; it stays free precisely for that, and its description now says so. The other axis that also sneaks into `tags` today — **audience and level** ("beginners", "students") — is still unsolved: it is an [open question](#others), not this field. The door and the recommendation are not the same thing.

**Why an object and not a string** (`"eligibility": "members-only"`). Because *which* community is data whoever publishes already has today, and in `members-only` without naming it the field stops halfway. Widening string → object later is a breaking change — the price paid when it was declared in [`image`](#image-the-poster-its-alt-text-and-why-the-list-accepts-two-forms) — so it is paid now, when it is free. Only `type` is required: whoever has nothing more writes one line.

**And it does not go inside `offers`.** It was considered, because the per-tier axis really does exist — the student rate asks for a card, the member rate asks for a membership — and it is still rejected: `offers` is **optional and absent from most events** (none of the 24 in the reference feed carries it, and an `.ics` exporter has no price to emit), so the door would disappear exactly where most events are. Besides, "can I go?" is a property **of the event**, not of the price tier: if it lives only in `offers`, every consumer has to fold N offers into one answer, and two ways of asserting the same thing are two ways of contradicting yourself — the argument by which [there is no `isFree`](#offers-what-it-costs-and-where-you-get-the-ticket). If a real producer with a per-tier requirement shows up, `offers[].eligibility` will get in **reusing this very enum**, and until then nothing is paid for a hypothetical case.

**What `eligibility` does not model**: capacity and places left (that is the [box office](#offers-what-it-costs-and-where-you-get-the-ticket)), the state of *your* request, access codes, guest lists, a minimum age as a separate field, or the code of conduct. It describes **the condition, not the process**.

**How it gets in**, because this spec's bar is that somebody really emits it: no platform publishes it **structured** — schema.org has no term for the door — but they all have it **as a feature**: Luma's prior approval, the members-only events of a Meetup group, Eventbrite's private events, the closed Discord channel. It is the same case as [`cfp`](#cfp-the-call-for-papers--and-the-first-field-that-travels-nowhere): the data exists and is published in HTML, and whoever wants it structured today has to guess it. Its value is **inside the OTE ecosystem**, not in the translation.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | No term of its own. The closest is `audience` (`Audience.audienceType`), which is **free text and a different thing** — who it is aimed at, not who has permission; `note` and `url` go inside `description`. | **The structure, not the data.** The text arrives; the filter does not. And beware two false friends: `Offer.eligibleCustomerType` is B2B/B2C, and `isAccessibleForFree` is the price, not the door. |
| **iCal** | Nothing native → `X-OTE-ELIGIBILITY` and the text in `DESCRIPTION` ("Members of the Rust Girona Discord only") | **The structure.** A false friend to avoid: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)'s `CLASS:PRIVATE` is the **visibility of the data in a calendar**, not permission to enter the event. Mapping there would say something else. |
| **RSS / Atom** | Nothing native: it goes inside the item's text | **The structure.** An announcement that does not say you have to be a member sends somebody to a locked door. |

That it only arrives as text is acceptable by the usual rule: a calendar client that ignores `eligibility` **still shows a correct event**. It is a loss of structure, not of information — and the information survives because `note` is written precisely to be read by a person.

### `offers`: what it costs, and where you get the ticket

New in v0.3. Optional, and **a list**:

```json
"offers": [
  { "name": "Early bird", "price": 35, "currency": "EUR", "url": "https://…/tickets", "availability": "sold-out", "closesAt": "2026-06-30T23:59:59+02:00" },
  { "name": "General",    "price": 45, "currency": "EUR", "url": "https://…/tickets", "availability": "in-stock" },
  { "name": "Students",   "price": 0,  "url": "https://…/tickets#students" }
]
```

A free meetup is **a single entry**:

```json
"offers": [{ "price": 0, "url": "https://rustmadrid.example/meetups/2026-06#register" }]
```

**Absent means unknown, not free.** It is the same rule as `attendanceMode`, and it hurts just as much here: a consumer reading "no `offers` = free" turns into free any paid conference whose exporter did not map the price. Saying "free" has a shape, and it is `price: 0`.

**It is a list because an event's price is almost never one number.** Early bird, general, students, corporate: they are different offers, with different dates and different availability. That is why **there are no ranges and no "from €45"**: a price that cannot be written with a single number **is several offers**, and writing it as text breaks the only thing that makes publishing it as data worthwhile — that somebody can **filter and compare**. `price` is a number, with no currency symbol and no thousands separator.

**`currency` is required as soon as `price` goes above 0**, and is surplus when it is 0. Free is free in any currency, and requiring it there is exactly how Luma ends up publishing `"price": 0, "priceCurrency": "usd"` for a weekly Rust session in Girona: an invented currency for a value that does not need one. Conversely, a `45` with no currency is not a price: it is a number every consumer will read in their own. It is the same decision as `country` in `address` — an ISO code (4217 here, uppercase alpha-3), not a name. The validator checks it against the active ISO 4217 list, not just its shape — the same reason and the same pattern as `timezone`: see [DECISIONS.md, D005](DECISIONS.md#d005--offerscurrency-must-be-a-real-iso-4217-code). And the other way round: a `currency` with no `price` at all is not valid either — it is a currency qualifying nothing, orphaned in the `Offer.priceCurrency` it maps to in schema.org. If the price is not known yet, the way to say so already exists and is the usual one: omit the field. See [DECISIONS.md, D021](DECISIONS.md#d021--offerscurrency-requires-offersprice-to-be-present).

**`availability` has two values, `in-stock` and `sold-out`, and no default.** They are the two states an attendee can act on. Absent means unknown, and that is deliberate: **a stale feed that keeps asserting `in-stock` is worse than one that stays quiet**, because it sends somebody to a sold-out ticket page. Whoever does not keep the value up to date should omit it.

**A rule for whoever consumes, and it holds for every enum in the spec: a value you do not know is treated as unknown, never as the permissive value.** Written as `availability !== "sold-out"` ⇒ available — which is how this is written almost every time — any future value becomes "on sale", and that sends somebody off to buy what cannot be bought. It is the same rule as "absent = unknown", applied to the future instead of to the void.

**`waitlistUrl`: sold out with a queue is not the same as sold out.** When the places run out there are two different situations — there is nothing to be done, or you can join the queue — and until now they were the same document:

```json
{ "name": "Students", "price": 0, "availability": "sold-out",
  "waitlistUrl": "https://devfest-levante.example/2026/waitlist" }
```

**And why it is not a third `availability` value.** It was the first idea, and it loses on the only thing that matters here: **how it degrades**. With `availability: "waitlist"`, a consumer that does not know the value has no safe reading, and one parsing it as `availability !== "sold-out"` — the normal case — ends up announcing as available something that is not. With `sold-out` + `waitlistUrl`, **every consumer that exists today still reads "sold out", which is true**: you cannot buy. Whoever knows the field additionally offers the queue. Staying quiet about the queue is an omission; saying "on sale" is a lie, and this spec picks the omission every time.

**`price` does not contradict `sold-out`, nor the queue.** The two axes are orthogonal by design: `price` describes **the deal**, `availability` describes **whether you can act on it right now**. "€45, sold out" was already a normal document in v0.3; with a queue it means what `price` always meant before buying — **what it will cost if you get in**. Joining a queue costs no money, and nothing in the model suggests otherwise. That is why the case that needs it most — the **free event with limited capacity**, a meetup's bread and butter — is written `price: 0` + `sold-out` + `waitlistUrl`, and whoever reads it without understanding queues sees "free, sold out".

**The schema rejects `in-stock` + `waitlistUrl`**, with an `if`/`then` like `currency`'s: a queue for something that is on sale is not a queue. What it **does** allow is `waitlistUrl` without `availability`: whoever knows there is a queue and does not keep the box office state up to date should not be forced to **assert** `sold-out` in order to mention it. The incoherent combination is forbidden, never the incomplete one.

**What was dropped along the way: `last-tickets`.** schema.org has the term (`LimitedAvailability`, and Google reads it), and it still stays out for three reasons that reinforce each other: of the five sources studied, **the three that emit `availability` emit `InStock` and nothing else**; the threshold cannot be defined — five places, 10%, whatever marketing decides? — so nobody could compare or filter, which is the argument by which `price` is a number and not "from €45"; and it is **the most volatile state possible**, incompatible with a file published every night. Above all, **it does not change the action**: you can still buy. It changes the urgency, and urgency is capacity — that is, the box office, which this spec leaves out.

**`opensAt` and `closesAt` are INSTANTS, with an offset or `Z`** — unlike `startDate`, which is a wall clock. It is not an inconsistency: a sale opening is **the moment a button starts working**, not a time on a poster. [Detail below, alongside the same case in the CFP](#deadlines-why-they-carry-an-offset-and-startdate-does-not).

**What `offers` does not model**, and not by oversight: **capacity** (`maximumAttendeeCapacity`, which Guild does emit), **places left**, **how many people are in the queue**, discount codes, team rates, and the **single registration** of a multi-part event. All of that is *ticketing*: state that changes on its own, that expires in minutes and that a JSON file published every night cannot sustain. `offers` describes **the ticket, not the box office**. If you need capacity today, put it in as an unprefixed extension (see [`examples/event-meetup.json`](examples/event-meetup.json)) and say so in the issue.

**Why there is no `isFree`.** It was in the earlier sketch, and it is redundant: `price: 0` already says it. Two ways of asserting the same thing are two ways of contradicting yourself — `{"isFree": true, "price": 45}` is a document that validates and means nothing — and it forces every consumer to decide which one wins. For the same reason, `registrationUrl` is called `url` here: the object is already called an "offer".

It gets in by the usual route: of the five sources studied ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **three emit `offers`** — Luma, Guild and Google's canonical example — with the `price` + `priceCurrency` + `availability` + `url` shape copied here almost as it stands. And it is a field Google **displays** in the `Event` rich result.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | `offers` (an array of `Offer`): `price` → `price`, `currency` → `priceCurrency`, `url` → `url`, `availability` → `https://schema.org/InStock` \| `SoldOut`, `opensAt` → `validFrom`, `closesAt` → `validThrough`, `name` → `name` | **Only `waitlistUrl`.** The rest is 1:1 with the term Google reads today. schema.org **has no term** for a waiting list — `BackOrder` and `PreOrder` mean something else — so `SoldOut` is emitted, which is not false, and the queue degrades to text. An enum value would have lost exactly the same. |
| **iCal** | Nothing native | **Total.** [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) models neither price nor tickets: there is no property to put it in. An exporter can carry it into the `DESCRIPTION` ("General admission: €45") or an `X-OTE-PRICE`, and whoever does not understand it still sees the whole event. |
| **RSS / Atom** | Nothing native: it goes inside the item's text | **The whole structure.** An announcement channel that does not put the price in the body is hiding the first thing anyone asks. |

That only schema.org receives it structured is acceptable because **the loss is harmless**: a calendar client that ignores the price still shows a correct event. It is the same rule as `partOf` — an identity or context field that gets ignored leaves incomplete data; a time field that gets ignored leaves false data.

### `cfp`: the call for papers — and the first field that travels nowhere

New in v0.3. Optional, **an object**, and only `url` is required:

```json
"cfp": {
  "url": "https://devfest-levante.example/2026/cfp",
  "opensAt": "2026-05-01T00:00:00+02:00",
  "closesAt": "2026-07-15T23:59:59+02:00",
  "coversTravel": true,
  "coversAccommodation": true
}
```

**It is the only field in the spec with no equivalent in any of the three destinations.** schema.org has no term for a call for proposals, iCalendar has none either, and RSS/Atom less still. On export it degrades to text, full stop. So why it gets in anyway has to be justified, because this spec's bar is "somebody really emits it" and here no JSON-LD producer emits it.

It gets in from **the other end of the pipe**: the consumer's. "Which conferences are accepting proposals right now?" is one of the questions this project exists to answer, and today it is answered by **scraping**: confs.tech, developers.events, CFP Land and other listings maintain by hand — or by scraping websites — exactly these two values, a link and a deadline. That there is no schema.org `Offer` behind it does not mean there are no producers: it means the producers publish it **in HTML**, and whoever wants it structured has to guess it. OTE is not only a format for exporting to three other formats; it is also the place where data the other three cannot name can live. `cfp` is the first field exercising that, and it is worth saying out loud: **its value is inside the OTE ecosystem, not in the translation**.

**`closesAt` is [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields) as soon as there is a `cfp`.** With no deadline, a consumer sees a link and cannot tell whether it closed in March — and the question the field exists to answer ("is it open?") goes unanswered. The warning is actionable by definition: whoever opened the call knows when it closes. It is the spec's other conditional recommendation, alongside `endDate`.

**An object, not a list** — unlike `organizers` and `image`. The reason is the same in all three cases, applied to the facts: `organizers` is born a list because Luma **already emits** several; here no real producer publishes two calls per event, and the CFP directories that exist model exactly **one link and one date**. If the imagined cases really show up (talks and workshops with different deadlines), widening object → list is a breaking change and will arrive with its own version. Nothing is paid today for a hypothetical case.

**`coversTravel` and `coversAccommodation` are booleans with no default**: absent means **unknown**, never `false`. They are here, and "call for sponsors" or "call for volunteers" are not, because they are **what gets filtered on before deciding whether you can afford to submit a proposal**: for anyone who speaks outside their own city, that checkbox decides whether the call concerns them.

**What `cfp` does not model**: tracks, formats and durations, review status, whether it is blind, diversity quotas or the outcome. An event directory has none of that: the CFP platform does, which is already Sessionize or Pretalx, and which is exactly what `url` points at.

#### Deadlines: why they carry an offset, and `startDate` does not

`cfp.opensAt`, `cfp.closesAt`, `offers[].opensAt` and `offers[].closesAt` are **instants**: they require an offset (`+02:00`) or `Z`. The event's dates do not. It looks like an inconsistency and it is exactly the opposite:

- **An event happens to people in a place.** "16 October at 9:00" is the poster's time, and whoever is there reads it as it stands. That is why it is a wall clock, and why `timezone` contextualises it.
- **A deadline is a button that stops working.** Nobody lives it at a venue: somebody in Madrid and somebody in Bogotá live it at the same moment, and the only thing that matters is the exact instant.

And there is one case that settles the argument: **"anywhere on Earth"**. A CFP closing AoE closes at 23:59 **in UTC-12**, which is neither the event's zone nor that of anyone organising it. With a wall clock plus the event's `timezone` it cannot be expressed; with an offset you write `"2026-07-15T23:59:59-12:00"` and that is that. A bare `"23:59"` is the classic call-for-papers bug — which midnight is literally the entire question.

**Each instant's offset is whichever the writer chooses — UTC is not required.** Forcing it would simplify validation, but it would mean hand-converting a date somebody already thinks about in their own time zone, the same cost already rejected for `startDate`. What the validator does require is that `closesAt` not precede `opensAt` — comparing the real instants, not the text, because with different offsets the order of the strings may not match the real order. Detail in [DECISIONS.md, D009](DECISIONS.md#d009--offers-and-cfp-windows-opensatclosesat-must-not-be-inverted-and-instants-keep-their-own-offset-rather-than-being-forced-to-utc).

The price is that Google, in its canonical example, emits `"validFrom": "2024-05-21T12:00"` **without** an offset. An OTE exporter emits the full instant, which is a superset: nothing is lost, and what arrives is less ambiguous than the example.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | None | **Total.** There is no term. An exporter can mention the call in `description`; Google is not going to understand it in any shape. |
| **iCal** | None | **Total.** Neither `URL` (already taken by the event's) nor anything equivalent. Degrade it to `DESCRIPTION` or an `X-OTE-CFP-URL`. |
| **RSS / Atom** | Nothing native: it goes inside the item's text | **The whole structure**, and here it is worth compensating for it: an announcement feed that does not say "CFP open until 15 July" in the body is keeping quiet about the reason many people read it. |

## The feed

Required: `specVersion`, `title`, `updatedAt`, `events`.

**The feed's `license` is the default for its events**: an event that does not declare its own inherits the feed's. Repeating `"license": "CC-BY-4.0"` across 200 events is noise, not rigour. An event *inside a feed* does not repeat `specVersion` either: it inherits the feed's. A **standalone** event (outside a feed) must declare both — it has nobody to inherit them from.

**`license` is the only one of these inheritances that can end up with no default — and only if nothing breaks because of it.** An aggregator feed whose events carry different licences may **omit** `feed.license`, just as it may already omit `organizers`/`textLanguage` — but with a condition those two do not carry: if the feed does not declare `license`, **every event must declare its own**. No valid OTE document, standalone or inside a feed, may end up with an unknown licence — not knowing the terms under which data may be redistributed is a real legal risk, not merely unclear attribution, and that is why this guarantee is stricter than `organizers`/`textLanguage`'s. Detail in [DECISIONS.md, D029](DECISIONS.md#d029--feedlicense-may-be-omitted-only-if-every-event-then-declares-its-own).

**`organizers` is inherited the same way, with one difference**: the event's list **replaces** the feed's, it is not added to it (the why is above). And an **aggregator** feed must **omit** `organizers`: it does not organise what it publishes, and putting it there would misattribute every event in the feed.

**`textLanguage` is inherited too** — one line in the feed and no event repeats it — and **`translations` is never inherited**: a feed's `title` is not an event's `name`, so `feed.translations` translates the feed and each event carries its own. [Detail above](#textlanguage-and-translations-what-language-this-is-written-in). And, like `organizers`, an **aggregator** feed whose events do not share a language must not make events inherit a single `feed.textLanguage`: that would attribute to every event a language that may not be its own. The recommended profile warns (without invalidating) only when that risk can actually happen: `organizers` is absent, `feed.textLanguage` is present, and at least one event omits its own `textLanguage`. If every event declares its own language, the feed-level value labels only the feed's own `title`/`description`, so it stays useful and warning-free. Detail in [DECISIONS.md, D016](DECISIONS.md#d016--feedtextlanguage-inheritance-is-enforced-against-the-effective-language-computed-at-the-feed-root) and [D031](DECISIONS.md#d031--feedtextlanguage-without-feedorganizers-warns-only-when-an-event-can-inherit-it).

**Summary of what is inherited**, because these are five fields with three different behaviours:

| Feed field | How it reaches the event |
| --- | --- |
| `specVersion`, `license` | **Default.** The event that declares it wins; standalone, declaring it is mandatory. |
| `textLanguage` | **Default.** Same as `license`. |
| `contributing` | **Default.** Same as `license` — a declared scalar replaces the inherited one. |
| `organizers` | **Default by REPLACEMENT**: the event's list substitutes the whole thing, it is not merged. |
| `translations` | **Not inherited.** It translates the feed's text, and nothing else. |

That is why the event schema has two layers: `$defs/event` (the common part) and the top-level document, which adds `specVersion` and `license` as required. The feed references `$defs/event`.

The feed is an **interchange format, not an API**: no pagination, no filtering, no authentication, no federation.

### Discovery: how a feed is found from a website

Settled in v0.5 ([#33](https://github.com/OpenTechEvents/opentechevents-spec/issues/33)); the mechanisms are not mutually exclusive.

**`<link rel="alternate">` in the page `<head>` is the primary mechanism, and a publisher with an HTML page SHOULD provide it:**

```html
<link rel="alternate" type="application/ote+json" href="/events.json" title="Events">
```

It mirrors how RSS has been found for twenty years, and it is the only mechanism available to whoever publishes at a path whose domain they do not control: a project GitHub Pages site (`user.github.io/repo`), a page inside a corporate domain, somebody else's CMS. Everything else here is an addition to it, never a replacement.

**The media type is `application/ote+json`.** The alternative considered was reusing `application/feed+json`, and it was rejected: that type belongs to JSON Feed, and a document claiming it is claiming to be a JSON Feed — which an OTE feed is not. A generic reader following it would fetch something it cannot parse, and the failure would look like a broken feed rather than a different format. A consumer that meets `application/feed+json` on a link that does turn out to be an OTE feed **SHOULD** accept it and **SHOULD** warn: the type is wrong, the document is fine, and refusing it would punish a publisher for a label. Detail in [DECISIONS.md, D036](DECISIONS.md#d036--discovery-settled-linkrelalternate-first-applicationotejson-well-known-optional-embedded-out).

**`/.well-known/ote-feed` is an optional complement (MAY)**, for whoever controls the apex of their domain. It allows discovery without parsing HTML, which is cheap for a crawler, and costs nothing to ignore. It is a **MAY and not a SHOULD** for a concrete reason: a great many publishers — exactly the ones the primary mechanism exists for — cannot write to `/.well-known/` at all, and a SHOULD would warn them for something their hosting forbids. The resource is the feed itself, or a redirect to it.

> 📌 The [IANA registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) **has no entry for feeds at all** — not RSS, not Atom, not JSON Feed. Its registration procedure is *"Specification Required"*, and OTE has a specification, so `ote-feed` can be **formally registered** rather than squatting a path. Tracked separately: it is an external process, not a change to this document.

**JSON-LD `schema.org/Event` embedded in a page is a source for importers, not a feed.** It describes one event, not a collection, so it never answers "where is this community's feed" — it answers "what is on this page".

**A feed embedded in the page is deliberately out of scope.** `<script type="application/ote+json">…</script>` would lower the barrier for whoever uses a CMS and cannot publish a standalone file, and that case is real — but it is not specified here, for a reason that is not merely caution: **the document has no discriminator**. Today a feed is recognised by being the thing at the end of the link, and by carrying `events[]`; sitting inside a page next to other `<script>` blocks, it would need to say what it is, and that is a field this spec does not have. Adding one is a model change, not a serialisation detail. The slot stays reserved: if embedding is adopted later, it will be an **equivalent serialisation of the same document**, announced with that discriminator, and nothing published in the meantime becomes invalid.

#### `feed.alternates`: the same collection, in other formats

New in v0.5. Optional, a feed-level list of `{ mediaType, url }`:

```json
"alternates": [
  { "mediaType": "application/rss+xml", "url": "https://pyalmeria.example/events.rss" },
  { "mediaType": "text/calendar",       "url": "https://pyalmeria.example/events.ics" }
]
```

`<link rel="alternate">` in the `<head>` already lets a page point at its RSS/iCal versions — but it needs an HTML page. `alternates` is the **same thing expressed in JSON**, for a feed served as a bare endpoint, or a client that consumes the JSON and will not parse HTML. It maps outward to `<link rel="alternate" type="…" href="…">` and the `Link: …; rel="alternate"` HTTP header; an importer going the other way populates it from exactly those.

**It is informational.** OTE does **not** guarantee the linked RSS/iCal is generated from this feed or kept in sync with it: a consumer **MUST NOT** assume exact sync, completeness or derivation. The producer duty is a **SHOULD**: generate them from the same source, or otherwise intend them to describe the same collection.

`mediaType` is a bare, lowercase media-type token — no parameters. Two entries MAY share a `mediaType` (RSS mirrors); they SHOULD then be equivalent choices, not different feeds that would need a label — there is deliberately no `title` (a client renders "RSS" / "iCalendar" in the reader's language from the media type, the "an enum is multilingual for free" reasoning). Not recommended: a feed with an HTML page already has `<link rel="alternate">` and does not need this.

### `covers`: what the feed claims to be complete about

New in v0.5. Optional, a feed-level date window over the events' own `startDate`:

```json
"covers": { "from": "2026-01-01" }
```

**It exists to make pruning honest.** The spec's own rule is that [a cancelled event stays published](#status-a-cancelled-event-stays-published), never deleted — which means **absence says something**: if an event was in the feed yesterday and is gone today, it is gone on purpose. That rule collides with the other thing feeds do, which is grow forever. A publisher who drops 2023 to keep the file small is, by the rule as written, asserting that those events never happened. `covers` is how they say what they actually mean.

**Inside the window, the feed is the whole truth.** An event missing from a window it would belong to is not happening — withdrawn, or cancelled and removed — and a consumer **MAY** drop what it no longer finds. **Outside the window the feed asserts nothing**, and a consumer **MUST NOT** infer that a missing event was removed; it is simply not covered.

Both bounds are optional and at least one must be present:

| Written | Means |
| --- | --- |
| `{ "from": "2026-01-01" }` | Complete from that day onwards. The usual shape: trim the past, stay complete into the future. |
| `{ "from": "2026-01-01", "to": "2026-12-31" }` | Complete for that year only — a feed published per year, or an archive document. |
| `{ "to": "2025-12-31" }` | Complete up to that day: an archive that is finished and will not grow. |
| *(omitted)* | **The pre-v0.5 meaning, unchanged**: the feed makes no completeness claim at all. |

`to` is **inclusive**, the same convention as an all-day `endDate`, and it cannot precede `from` — the validator rejects a window that ends before it begins, because every event would fall outside it and the claim would silently switch itself off.

**Omitting it is not a lesser feed.** A community that publishes its meetups and never deletes anything needs no window: it is complete by construction, and saying so adds nothing. The field earns its place only where a publisher is making a choice about what *not* to carry — which is exactly where a consumer currently has to guess.

**Translation into the three destination formats, including the loss:**

| Destination | Mapping | Loss |
| --- | --- | --- |
| **schema.org** | No equivalent — `ItemList` has no notion of a completeness window | Total, and harmless: the events themselves are unaffected. |
| **iCal** | No equivalent. RFC 5545 has no property for "this calendar is complete between these dates" | Total. A subscriber sees the events the file carries, which is what it would have seen anyway. |
| **RSS / Atom** | Nothing native; closest in spirit is [RFC 5005](https://www.rfc-editor.org/rfc/rfc5005)'s archive marker, which answers a different question (is this document immutable?) | Total, harmless. |

Losing it everywhere is expected: `covers` is a statement **about** the document, for whoever syncs against it, not a fact about any event in it.

### Serving the feed: compression, revalidation, CORS, and what happens when it grows

New in v0.5 ([#48](https://github.com/OpenTechEvents/opentechevents-spec/issues/48)). None of this changes the document; it is about the HTTP response that carries it, which the spec had never mentioned and which turns out to decide most of what a consumer experiences.

**Serve it with `Access-Control-Allow-Origin: *`.** The feed is public data meant to be read by other people's tools, and a browser client cannot read it at all without this header — the data is published and unreachable at the same time. Static hosts make it a checkbox; the health check reports feeds that lack it, without calling them broken.

**Serve it compressed, and let consumers revalidate.** A feed is repetitive JSON, which is to say it compresses extremely well, and a subscriber polls it far more often than it changes:

- **`Content-Encoding: gzip` or `br`** — typically a 5× reduction on real feeds.
- **An `ETag` or `Last-Modified`**, so a poll that finds nothing new costs a `304` of a few hundred bytes instead of the whole document. Pair it with a `Cache-Control: max-age` that matches how often the feed is rebuilt.

Both are server configuration, not something the publisher writes into the file, and every static host in common use does them by default or with one switch.

**Why that is stated here rather than left to taste**, measured across the registered adopter feeds on 2026-11-03:

| Feed | Size | Compressed by the server | Revalidation | Time to first byte | Total |
| --- | --- | --- | --- | --- | --- |
| A | 75 KB | gzip | `ETag` + `Last-Modified` | 476 ms | 484 ms |
| B | 321 KB | brotli | `ETag` + `Last-Modified` | 253 ms | 276 ms |
| C | 10 KB | gzip | `ETag` + `Last-Modified` | 386 ms | 387 ms |
| D | 553 KB | **none** | **none** | **23.9 s** | 24.2 s |

Feed D is the one that raised the question "are OTE feeds too big?", and the table answers it: **feed B is 58% of its size and arrives 88 times faster**. D's half-megabyte transfers in about 0.4 s — the other 23.6 s is its origin building the response. Uncompressed, D is 5.2× larger than it needs to be; with no `ETag`, every consumer re-downloads all of it to learn that nothing changed. None of that is a property of the format, and none of it would be improved by splitting the document.

**So the feed does not paginate, and will not.** No `next` link, in this version or a later one. A paged feed quietly breaks the one promise that makes this format cheap to consume — *download the file and you have everything* — because a consumer that ignores the link gets a subset and cannot tell. [RFC 5005](https://www.rfc-editor.org/rfc/rfc5005) made exactly this distinction for Atom twenty years ago and warns against paging for anything meant to be archived; JSON Feed's `next_url` carries the same hazard. A feed that is slow is a server to fix, not a document to split.

**What grows is history, and the answer to that is to publish less of it, not to chop the file up.** In feed D, 473 of 485 events are in the past: 97.5% of the bytes are archive. A feed is a **current view** of what a community publishes, not a permanent record of everything it ever did — and [`covers`](#coverswhat-the-feed-claims-to-be-complete-about) exists so that dropping old events says so out loud instead of silently.

**If splitting ever becomes genuinely necessary, it will be by archiving, not by paging** — RFC 5005's other half: the feed at the published URL stays complete for what it covers, and links to immutable documents holding what it no longer does. That is additive, a consumer that ignores it still gets correct data, and reserving the shape now is what stops somebody inventing a `next` as an extension in the meantime.

### `contributing`: where to report or fix a wrong datum

New in v0.5. Optional, **a single URL**, on the feed and on the event, inherited feed → event like `license`:

```json
"contributing": "https://github.com/pyalmeria/eventos/issues/new"
```

**Why it exists.** A feed reader or aggregator wants a "report an error / suggest a correction" link per event. `organizers[].email` does not fit — a correction channel is not the organiser's inbox — and an **aggregator must leave `organizers` out** ([D016](DECISIONS.md#d016)), so the publisher who most needs the field has none. `source.url` points at *where the data came from*; a mapping bug the aggregator introduced is not fixed upstream. The real producer is the OTE editor's `?repo=` deep links.

**It accepts an HTTP(S) IRI OR a `mailto:` URI** — the latter because directories like [dev.events](https://dev.events/about) point contributors at a `hello@` address, and for a feed with no issue tracker an email is often the only channel. The `mailto:` form is **stricter than RFC 6068**: exactly one bare role address, no `?` headers, no second recipient, no fragment. It is the first field of the spec to accept a non-HTTP scheme — see [DECISIONS.md D033](DECISIONS.md#d033--contributing-accepts-a-mailto-uri--the-first-non-http-scheme-in-the-spec).

**Its own spam discipline** (not just a cross-reference to `organizers[].email`, because `contributing` is inherited and so exposed on every event): a **role/public address only** (`hello@`, `corrections@`), never a personal mailbox; a tool **MUST NOT** populate it from a source that is not itself publicly published; a consumer **MUST** use it only for corrections to this record.

**Not [recommended](#valid-is-not-the-same-as-useful-the-recommended-fields).** An `.ics` importer never has it, and a warning would push a small community to open an issue tracker it does not want. Like `cfp`, it **travels to no destination format** — its value is entirely inside the OTE ecosystem.

## Extensions

The schemas **do not forbid additional fields**. If your community needs `sponsors` or `capacity` today, put them in: your document is still valid. It is the route by which the spec should grow — **fields somebody already really uses**, not fields we imagine will be needed. That is how `tags` got into v0.2, `organizers`/`image`/`offers`/`cfp` into v0.3, and `speakers`/`recordings` into v0.5.

The candidates that are being watched — with a recommended shape to copy and a measured adoption count — live on the **[suggested extensions page](https://opentechevents.org/extensions/)** (`docs/data/suggested-extensions.json` in the repo): `sponsors`, `capacity`, `level`, the `speakers` enrichment block (`affiliation`, `jobTitle`, `bio`, `image`), and `event.sameAs` (an aggregator's "this is the same event as" hint). Using one and finding it useful is the evidence that graduates it.

When a field is standardised, it will be given a normative meaning. Until then, a consumer can ignore them safely.

### Two kinds of extension, and why they are distinguished

Two very different things live under "additional field", and confusing them is paid for later:

| | What it is | How it is written | Example |
| --- | --- | --- | --- |
| **Core candidate** | A generic field that **aspires to be OTE's**. You use it today because you need it; if more people need it, it gets standardised. | **No prefix** | `capacity`, `sponsors`, `speakers` |
| **External vocabulary** | A field whose meaning **is defined by another project** and that will never be OTE's, because it does not belong to it. | **Prefixed `project:field`** | `combuilders:communityId` |

**A commitment from the spec: OTE will never mint a field name containing a `:`.** It is a namespace reservation, and it is what makes the second row safe: a prefixed field **cannot collide** with a core field, today or in v1.0. An unprefixed one can — and the day OTE standardises that name, your local meaning disappears under the normative one. Choose accordingly: with no prefix you are proposing, with a prefix you are integrating.

An OTE consumer safely ignores both kinds. They do not notice the difference: whoever maintains the data two versions later does.

This is what lets OTE **connect** with other specifications without **coupling** to them. A community directory can define its own identifier and publish it inside a valid OTE document, today, without asking permission or waiting for a version:

```json
"organizers": [
  {
    "name": "GDG Madrid",
    "url": "https://gdgmadrid.example",
    "combuilders:communityId": "gdg-madrid"
  }
]
```

OTE does not know what `combuilders:communityId` means and does not need to. The prefix guarantees that the two specifications can evolve separately without treading on each other. See [`examples/event-co-organized.json`](examples/event-co-organized.json).

## What v0.5 does not solve

Deduplication across sources, synchronisation, automatic publishing to platforms, modelling agenda/sponsors, and most of **the box office**: capacity, places left, discount codes, tier-specific coverage and per-day passes. `offers` describes **the ticket**, not the state of the sale; `cfp` describes **the call**, not the review of proposals.

(v0.5 *does* now model **the shared admission of a multi-part event** — see [Multi-part event pricing](#multi-part-event-pricing-partofoffers-and-offersscope) — and **who gives the talk** — see [`speakers`](#speakers-who-gives-the-talk).)

It does not solve **a locality's spellings** either: `location.address.locality` and `region` are written once, in the spelling most recognisable to the event's audience — "València" or "Valencia", not both. Everything else is translated, and [where it lives](#local-translations-the-text-living-inside-an-object).

The goal is to describe **the event**, not the record in a database.

## Open questions

- **Audience and level.** [`eligibility`](#eligibility-who-can-get-in--and-why-it-is-not-a-tag) solves the **door** ("will they let me in?") and takes that axis out of `tags`. What remains is the other one that also sneaks in there today: "is it for me?" — "beginners", "students", "senior". It is a **recommendation, not permission**, and that is why it does not fit in `eligibility`. A `level` with an enum (`beginner` / `intermediate` / `advanced`) would be filterable and real conferences do tag it; a free-text `audience`, copied from schema.org, would only move the problem elsewhere. It does not get in until there is a real producer: in the meantime, `tags` keeps accepting it, with everything that costs.
- **`eligibility` per ticket tier.** The axis exists — the student rate asks for a card — and the slot is reserved: `offers[].eligibility`, reusing the same enum, as soon as somebody really emits it.
- **The `id` of an event imported from an `.ics` with no URL.** Today the examples use `<ics-url>#<UID>`. It works and it is stable, but it ties the `id` to the originating calendar: if the community moves, the `id` the importer minted is no longer under a domain they control.
- **Serialisation.** The schema is JSON. YAML is convenient for writing by hand (the issues use YAML) and maps 1:1. Are both declared normative?
- **`license` required on a standalone event**: is it too high a barrier to entry for somebody who just wants to publish their meetup?
