# Examples — OTE Spec v0.4

All of them **are validated in CI** against [`../event.schema.json`](../event.schema.json) and [`../feed.schema.json`](../feed.schema.json). If they stop validating, the build fails. Copy them with confidence.

| File | What it illustrates |
| --- | --- |
| [`event-minimal.json`](event-minimal.json) | The minimum the spec requires. Nothing else. |
| [`event-from-ics.json`](event-from-ics.json) | An event **imported from an `.ics`**: no `url`, no `image` — iCalendar almost never carries one — with a `source` and **no `attendanceMode`**, because iCalendar cannot express it, and staying silent is more honest than inventing. It shows the fields v0.2 added from iCal: `tags` (← `CATEGORIES`), `location.geo` (← `GEO`) and `updatedAt` (← `LAST-MODIFIED`), plus the one v0.3 adds: **`organizers[].email`** (← `ORGANIZER;CN="…":mailto:…`), which is what allows going back to `.ics` without losing the `ORGANIZER`. |
| [`event-all-day.json`](event-all-day.json) | A **multi-day all-day** event: `startDate`/`endDate` as dates, with no time. |
| [`event-meetup.json`](event-meetup.json) | A hybrid meetup, with `image` (**the same poster in three crops, and an `alt` only on the first** — both entry forms, string and object, in the same list), `offers` with `price: 0` — that is how you say "free" — and one extension (see below). |
| [`event-conference-cfp.json`](event-conference-cfp.json) | A conference with **three ticket types** (`offers`: one sold out, and the free student places sold out **with a `waitlistUrl`**) and an **open CFP** (`cfp`). It also carries `textLanguage` and a translation inside an offer. |
| [`event-co-organized.json`](event-co-organized.json) | **Three organisers** — two communities and a person — with an **`email` only on the main one**, which is the only one that survives into iCal (and a role address, not the person's), and one field of **prefixed external vocabulary** (`combuilders:communityId`). |
| [`event-online.json`](event-online.json) | An **online-only** event: `location` with an `onlineUrl` and no physical venue, a `partOf` for a weekly series, **`eligibility`** — it is within reach of anyone with a connection and there is still a door (`members-only`) — and **bilingual**: `textLanguage: "ca"` with `translations.es` at three levels (the event, `eligibility` and **the image's `alt`**), alongside a `languages: ["ca","es"]` that says something else. |
| [`event-hackathon.json`](event-hackathon.json) | A continuous weekend **hackathon**: it crosses midnight and therefore carries **no** `partOf` — it is one event, not two sessions. |
| [`event-recurring.json`](event-recurring.json) | **One occurrence** of a monthly meetup, with [`partOf`](../README.md#recurrence-and-multi-part-events-partof). Recurrence **is expanded at publishing time**: one document per edition, never a rule inside the feed. |
| [`feed.json`](feed.json) | An **aggregator feed**: its events inherit `specVersion` and `license`, but **not** `organizers` — the aggregator does not organise what it publishes, so it omits it and each event declares its own. |
| [`feed-community.json`](feed-community.json) | A **community feed**: `organizers` and **`textLanguage`** live on the feed and its events inherit them. The second event declares `organizers` and **replaces** the inherited list — which is why it repeats the feed's community, **with its `email`**: replacement is what guarantees the guest community never inherits the host's address. |
| [`feed-multipart.json`](feed-multipart.json) | A **multi-part event**: a study jam across three sessions on non-consecutive Saturdays, as **three documents** with the same `partOf` (`type: multipart`). Not as a fifteen-day event. |
| [`invalid/`](invalid/) | Documents that **must be rejected**. CI fails if the validator accepts them: a schema that only accepts is not a schema. |

## Fields under discussion (extensions)

`event-meetup.json` and `event-recurring.json` use fields that are **NOT part of v0.4**:

| Field | Status |
| --- | --- |
| `capacity` (venue capacity, in `event-meetup.json`) | 🗣️ Under discussion — [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5). It was deliberately kept out of `offers`: it is box-office state, not ticket state. |
| `ics:rrule` (in `event-recurring.json`) | 🔗 **External vocabulary**, prefixed. The original rule from the `.ics`, kept so it can be round-tripped. **Informative**: the occurrences already come expanded, so nobody has to evaluate it. |

> `offers` and `cfp` **are already normative as of v0.3**, and in a different shape from the one they had here as a proposal: `offers` is a **list** (several ticket types) with no `isFree` — free is `price: 0` — and no `capacity`; `cfp` no longer carries a `timezone`, because its deadlines are **instants with an offset**. If you were emitting them in the old shape, migrate: see [`offers`](../README.md#offers-what-it-costs-and-where-you-get-the-ticket) and [`cfp`](../README.md#cfp-the-call-for-papers--and-the-first-field-that-travels-nowhere).
>
> `image` **is also normative as of v0.3**, and as a list (`image[]`, not a string). It got in by this very route: the five sources studied emit it and Google asks for it. If you were emitting it as a bare string, migrate to a list.
>
> `tags` **has been normative since v0.2** (it maps to iCal's `CATEGORIES`). It got in by exactly this route: a field a real consumer — the aggregator — already used. See the [CHANGELOG](../../../CHANGELOG.md).
>
> `community` (`{ uri, name }`) was here until v0.3 and **[`organizers`](../README.md#organizers-who-runs-it--and-the-three-things-it-is-not) replaces it**, now normative. If you were emitting it, migrate.

### Two kinds of extension

The ones in the table carry **no prefix**: they are **core candidates**, generic fields aspiring to be OTE's. `combuilders:communityId`, by contrast, carries a **prefix** because its meaning **is defined by another project** and will never be OTE's.

**OTE commits to never minting a field name containing a `:`**, so a prefixed field cannot collide with a core one. An unprefixed one can: the day OTE standardises that name, your local meaning disappears under the normative one. Detail in the [README's "Extensions" section](../README.md#extensions).

**And those documents are still valid.** That is not an oversight: **OTE's schemas do not forbid additional fields**, on purpose. If your community needs `tags` today, you put them in and your feed keeps validating; a consumer that does not understand them can ignore them without breaking.

That is the route by which the spec should grow: **fields somebody already really uses**, not fields we imagine will be needed. The names and shapes you see here are **a proposal**, not a commitment — they can change when they are standardised.

👉 **If you use them, say so in [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5)**. Real usage is the argument that moves a field forward; a request with no case behind it is not.

## Validating your own

```bash
npm install
npm run validate -- my-feed.json
```
