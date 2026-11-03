# Changelog — OTE Spec

Every relevant change to the specification. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versioning is
[SemVer](https://semver.org/): while the spec is at `0.x` it is considered
**unstable** (it can break between minor versions; `1.0.0` will be the first
stable one).

Each published version lives frozen in its own folder (`spec/v0.1/`, `spec/v0.2/`, `spec/v0.3/`…)
and under its own `$id` (`https://opentechevents.org/schema/vX.Y/…`). A document declares
which one it adheres to with `specVersion`, so **nothing breaks when a new
version is published**: `0.1.0` documents keep validating against `spec/v0.1/`.

## [0.5.0] — 2026-11-03

**BREAKING** (deliberately — the spec is `0.x` and says it can break without
warning). Eight new fields, and one model that reshapes how multi-part events
carry a price.

> The bulk of this version was written on 2026-09-01 and published as files under
> `spec/v0.5/`, but it was never released: no `schema-v0.5.0` tag, nothing on npm,
> and no adopter feed declaring `0.5.0`. On 2026-11-03 it took `feed.covers`,
> `speakers[].affiliation` and the decisions that close #18, #33, #48 and #52,
> and the date moved with the content. From the tag onwards, a published version
> is frozen and the next change opens `0.6.0`.

### Added

- **`speakers[].affiliation`** (`string`) — the organisation a speaker appears as,
  so that "Martí Cristobal, Bettatech" does not end up inside `name` and stop
  matching that person anywhere else. A bare string, never translated; ignored on
  `type: "organization"`. Maps to schema.org `Person.affiliation`. It leaves the
  suggested-extensions registry in the same change. See DECISIONS.md D038.

- **`feed.covers`** (`object`, `{ from?, to? }`, at least one) — the date window a
  feed claims to be **complete** for. Inside it, a missing event is not
  happening; outside it the feed asserts nothing. Omitting it keeps the previous
  meaning exactly, so it is additive. New validator rule `orderedCoverage`:
  `to` must not precede `from`. See DECISIONS.md D037.
- **Discovery is now normative** (DECISIONS.md D036): `<link rel="alternate">` in
  the page `<head>` is the primary mechanism (SHOULD), the media type is
  **`application/ote+json`** (a consumer meeting `application/feed+json` SHOULD
  accept it and warn), `/.well-known/ote-feed` is a MAY, and a feed embedded in
  the page is deliberately out of scope — it would need a document discriminator
  the model does not have. No schema change.
- **A "Serving the feed" section**: `Access-Control-Allow-Origin: *`,
  `Content-Encoding`, and an `ETag`/`Last-Modified` so a poll that finds nothing
  new costs a `304`. **The feed does not paginate and will not** — if splitting
  ever becomes necessary it will be RFC 5005-style archiving, which is additive.
  See DECISIONS.md D037.
- **Importer rules for two things the source cannot give** (closes #18): what to
  put in `timezone` when an all-day `.ics` has no zone to offer — `X-WR-TIMEZONE`,
  then a zone known from the publisher, then `UTC`, and never geocode `LOCATION`
  — and what to do when `DESCRIPTION` arrives as HTML, which is what Google
  Calendar emits: convert it, never copy it through.
- **`speakers`** (`array`, min. 1) on the event — who gives the talk(s), a list
  of `{ name, url?, sameAs?, type? }`, modelled on `organizers`. `url` is one
  canonical page; `sameAs` is the list of other profile URLs, mapping to
  schema.org `Person.sameAs` (HTTP(S) only — not a DID or handle). Not
  recommended-tier.
- **`recordings`** (`array`, min. 1) on the event — published recordings, linked
  after the event (same `id`, new `updatedAt`). A bare HTTP(S) IRI or
  `{ url, title?, translations? }`, the `image[]` string-or-object pattern. Not
  recommended-tier.
- **`contributing`** (`string`) on the **event and the feed** — a URL for
  reporting or proposing a data fix, inherited feed→event like `license`.
  Accepts an HTTP(S) IRI **or a `mailto:` role address** — the first field in the
  spec to accept a non-HTTP scheme. See DECISIONS.md D033.
- **`feed.alternates`** (`array`, min. 1) — where the same collection is
  published in other formats (`{ mediaType, url }`), the JSON form of an HTML
  `<link rel="alternate">`, for feeds with no HTML page. **Informational**: no
  sync guarantee.
- **`partOf.offers`** — the shared admission of a multi-part event, written
  identically on every part (reuses `$defs/offers`).
- **`offers[].scope`** (`enum`: `admission` | `add-on`) — what an offer means
  relative to `partOf.offers`. An `add-on` offer requires `partOf.offers` in the
  same document.

### Changed / breaking

- **Multi-part event pricing (P037 / DECISIONS.md D032).** A part that omits its
  own `offers`, in a document that carries `partOf.offers`, is now **covered by
  the set admission** — the one place an absent `offers` list means something
  other than "unknown". The "a consumer that ignores `partOf` still sees correct
  events" guarantee is **relaxed for pricing**: a consumer that needs the price
  of a multi-part event MUST also read `partOf.offers`. Ignoring it yields
  *incomplete* pricing, never *wrong* pricing.
- **New feed-root validator error `sharedOffersConsistent`**: the parts of one
  multi-part set (same `partOf.id`) that carry `partOf.offers` must carry the
  same block, compared by value.
- **Unprefixed-extension collision.** `speakers`, `recordings`, `contributing`,
  `alternates`, `partOf.offers` and `offers[].scope` now have a normative
  meaning. A producer already shipping any of those exact keys as an unprefixed
  extension with a *different* shape must adjust — this is why `0.5.0` is a MAJOR
  bump within `0.x`. **All three registered adopter feeds have now been checked
  and none carries any of the six keys**, so no registered adopter is affected.
  (`eventos.wiki` was unverified at release time because it timed out; rechecked
  on 2026-11-03 — slow, not unreachable: 568 KB in 23,7 s, of which 23,6 s is
  time to first byte.)

### Migration from 0.4.0

1. Change `specVersion` to `"0.5.0"` and validate against `spec/v0.5/`.
2. If you used none of the six new key names, nothing else changes — the fields
   are additive and the pricing rule only fires on `partOf.offers`, which no
   `0.4.0` document contains.
3. If you shipped `partOf.offers` / `offers[].scope` / `speakers` / `recordings`
   / `contributing` / `alternates` as an unprefixed extension, check your shape
   against the v0.5 `$defs`; adopt it, or move to a prefixed name.
4. Tier-specific coverage, per-day passes, bundles and coupons are still out of
   scope — see DECISIONS.md D032 ("Model B").

## [0.4.0] — 2026-08-28

Compatibility release for real-world web addresses. It **relaxes** validation:
no valid `0.3.0` document becomes invalid, but tools must update because the
schemas now use JSON Schema's `iri` format.

### Changed

- HTTP(S) URL fields now validate as IRIs instead of ASCII-only URIs, so
  published addresses with non-ASCII slugs such as `pycamp-españa` are valid as
  written. This applies to event and feed links, `id`, `partOf.id`, images,
  organizer/source/offer/CFP URLs, and URL-form licenses.
- `image[]` and `image[].url` now accept both `http://` and `https://` image
  IRIs. They still must be absolute HTTP(S) links to the image file itself, and
  the no-userinfo rule still applies.
- The feed recommended-profile warning for `feed.textLanguage` without
  `feed.organizers` now fires only when at least one embedded event omits its own
  `textLanguage` and can actually inherit the feed value. Aggregators whose
  events all declare their own language can keep `feed.textLanguage` for the
  feed's own `title`/`description` without a false-positive warning.

## [0.3.0] — 2026-07-29

Nine new fields and two new `status` values, all **optional and
backwards-compatible** (hence MINOR): a valid `0.2.0` document, by changing only
`specVersion` to `"0.3.0"`, stays valid.

`organizers` gets in — **who runs the event** — because it was the only gap in
the core that shows up in **all four** platforms studied (Meetup, Eventbrite,
Luma, Guild) and in Google's canonical example, and because it has a native
destination in all three output formats: schema.org's `organizer`, iCal's
`ORGANIZER`, Atom's `<author>`.

The hole it plugs is concrete: without it, a consumer can only attribute an
event by falling back on `feed.title` — which makes **an aggregator's feed
attribute to the aggregator every event it aggregates**.

And `partOf` gets in, grouping the occurrences of a series or the parts of a
multi-part event **without** putting a recurrence rule inside the feed.

Plus a **second tier of expectation**: the recommended-field profiles. They do
not change what is valid — not one document stops validating — but they put a
name to the difference between a valid event and one that can really be
discovered and followed.

### Added

- **`organizers`** (`array`, min. 1) on the **event** and on the **feed**. Each
  entry: `name` (required), plus optional `url`, `email` and `type`
  (`organization` by default, or `person`). **Nothing else** — no logo and no
  identifiers: the field describes **who runs it and where to write to them**,
  not their full profile.
  - **It is a list, not an object.** Co-organising is the norm (two communities,
    or a community plus a host); Luma already emits `organizer` as an array.
    Widening object → list later would have broken. **Order is significant**:
    the first one is the main one, and the only one that survives into iCal.
  - **`type` does have a default** (`organization`), unlike `attendanceMode`.
    The reason: when translating you have to pick a schema.org `@type` one way
    or another, and `Organization` is the permissive option.
  - **Feed → event inheritance by REPLACEMENT, not by merging.** Like `license`,
    the feed's `organizers` is the default for its events; but an event that
    declares its own **substitutes the entire list**. With merging there would
    be no way to *remove* an inherited organiser. Practical consequence: in a
    co-organised event inside a community feed you have to **repeat** the feed's
    community.
  - **An aggregator feed must OMIT `organizers`**: it does not organise what it
    publishes.
  - **`email`** (`format: email`, without the `mailto:` prefix) gets in by the
    same route as `tags`, `location.geo` and `updatedAt` in v0.2: **the `.ics`
    importer had it in front of it and there was nowhere to put it**. A published
    `VEVENT` very frequently carries `ORGANIZER;CN="…":mailto:…`, and without
    this field `.ics` → OTE → `.ics` **lost the `ORGANIZER`** — the only loss the
    spec calls serious. It also fixes RSS 2.0's `<author>`, which requires an
    email. None of the five platforms studied emits it in their JSON-LD: **the
    producer is iCalendar, not the events web**, and that is why the field
    arrives with rules. A **role** address (`info@`, `hello@`), not anybody's
    mailbox; an importer **MUST NOT** fill it from a source that is not publicly
    published (copying from a private calendar into an open feed changes the
    level of exposure of an address nobody published); a consumer **MUST NOT**
    use it for anything other than writing about the event; and an exporter
    **does not invent** the `mailto:` from the `url`'s domain — with no `email`
    there is no `ORGANIZER`, full stop.
  - **`email` is NOT a recommended field**, and it is the only one in the spec
    left out of the profile for a reason that is not technical: warning about a
    missing email is pressuring somebody to publish an address they chose not to
    publish. (The technical reason applies too: whoever imports an `.ics` with no
    `ORGANIZER` cannot act on the warning.)
  - **`email` adds no inheritance rule.** It lives inside `organizers[]`, so it
    is inherited with the list and **by replacement**: an event that declares
    `organizers` does not inherit the feed's email, and an aggregator feed —
    which must omit `organizers` — has none to propagate. The risk of inheriting
    somebody else's email would only exist with a loose `feed.organizerEmail` or
    with field-by-field merging, and neither is done.

- **`partOf`** (`object`) on the **event**. The series or multi-part event this
  document is **one occurrence** of. `id` required; `name`, `url` and `type`
  (`series` by default, or `multipart`) optional.
  - **It is a reference, not a recurrence rule.** The rule that comes with it:
    **one document = one occurrence, and whoever publishes expands**. A monthly
    meetup is twelve documents, each with its own `id`, its own dates and its own
    `status`; a study jam across three sessions, three. `partOf` only says which
    set they belong to.
  - **`type` changes the translation**, it is not decoration: `series` →
    schema.org's `EventSeries`; `multipart` → an `Event` whose parts are its
    `subEvent`. In iCal, `RELATED-TO;RELTYPE=PARENT` in both cases. In Atom/RSS
    there is no equivalent and **it is ignored, harmlessly**: the entry still
    describes an event with its real date. An identity field that gets ignored
    leaves incomplete data; a date field that gets ignored leaves **false** data.
    Only the first is acceptable.
  - **A multi-part event is not expressed by stretching the dates.** `startDate`
    on the first part + `endDate` on the last asserts a continuous fifteen-day
    event and takes up two weeks in a subscriber's calendar.
  - Rules for whoever expands: a bounded horizon for infinite series (12 months
    or 12 occurrences), one `id` per occurrence (`<series-id>#<date>` if it has
    no page of its own — the equivalent of `RECURRENCE-ID`), and `EXDATE` stops
    existing: it is *not emitting* that document, or `status: cancelled` if it
    had already been published.

- **`image`** (`array`, min. 1) on the **event**. Promotional images: poster,
  cover, card. Each entry is **either a bare `https` URL or an object
  `{ url, alt?, translations? }`**. **Order is significant** — the first one is
  the main one, and often the only one a destination can use.
  - **It is not a gallery.** The usual case is for the entries to be **the same
    image** in different crops or resolutions, which is what Google asks for
    (1:1, 4:3, 16:9) and what Meetup, Luma and Guild already emit. But that is
    the usual case, **not a guarantee**: nothing stops anyone publishing the
    poster and a photo of the venue, and a consumer cannot tell the two apart.
    The rule that holds is the one about order; no interface should render it as
    a carousel.
  - **`image[].alt`** (`string`, non-empty, ≤ 250) — alt text, for accessibility.
    It describes **what is visible**, not what `name` and `description` already
    say: repeating them makes a screen reader say them twice. No empty string:
    HTML's `alt=""` means "decorative", and a decorative image has no business in
    a feed.
    - **It goes inside the entry, not in an `imageAlt` alongside the event.** A
      single `alt` for the whole list would describe the first image and apply to
      all three; it would only be correct if the list were always the same poster
      cropped, and that **cannot be guaranteed**.
    - **The two entry forms coexist** instead of migrating the list to objects:
      that way **no already-published `0.2` or `0.3` document stops validating** —
      this version stays backwards-compatible — and the extra crops, which need
      no `alt`, stay strings. Whoever consumes normalises in one line
      (`typeof i === "string" ? { url: i } : i`).
    - **It is translated, and not written in "international English".** An `alt`
      is read aloud with the pronunciation of the surrounding language, so it
      lives in the document's `textLanguage` and is translated with the entry's
      **own** `translations` (never a positional mirror, like `offers[].name`).
      Always writing it in English would be worse accessibility than not having
      it —[WCAG 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)
      exists for exactly this — and it would make it the only free text in the
      spec that does not follow `textLanguage`.
    - **It is not SEO**: Google does not score the `alt` of `Event.image`. It
      gets in for the people who cannot see the poster, and that is why it does
      **not** wait for a producer that already emits it — it is the only
      criterion in this spec that yields to accessibility.
  - Translation: in schema.org, bare URLs for entries with no `alt` and
    `ImageObject { url, caption }` for those that carry one (`Event.image`
    accepts `ImageObject`, so the rich result is preserved; schema.org **has no
    `alt` property**, and `caption` — the one Google uses — loses the nuance);
    `IMAGE;VALUE=URI` (RFC 7986) in iCal, in practice only the first one and
    **without the `alt`, which has nowhere to go**; `<enclosure>` or
    `<media:content>` + `<media:description>` in RSS and
    `<link rel="enclosure">` in Atom — where the `type` (MIME) has to be
    inferred, because OTE does not model it.
  - **It enters the recommended profile.** It breaks nothing in the three
    destinations, but the warning is **actionable**: the five sources studied
    already emit an image, so a feed with no `image` is almost never an event
    with no poster — it is an unmapped poster. It is still a warning: nothing
    stops validating.
  - It had been an **unprefixed extension** in the examples since v0.1 (as a bare
    string). It graduates into the core **as a list**: if you were emitting it as
    a string, migrate.

- **`location.address`** (`object`) on the **event**: the physical venue's postal
  address **in parts** — `street`, `locality`, `region`, `postalCode` and
  `country`, all optional, with at least one present.
  - **It complements `venue`, it does not replace it.** `venue` remains the
    human-readable string printed by iCal's `LOCATION` and by an RSS item's text
    — the two formats that **do not model addresses** — and by schema.org's
    `Place.name`. `address` is what the translator needs in order to emit a
    `PostalAddress` whose subfields **Google validates one by one** in the
    `Event` rich result. `venue` to read, `address` to process.
  - **It gets in because it already exists out there**: four of the five sources
    studied (Meetup, Eventbrite, Guild and Google's canonical example) emit
    `PostalAddress` with its subfields. Without the field, an exporter could only
    emit the address as loose text or **split `venue` on commas**, which is
    inventing data.
  - **`country` is an uppercase ISO 3166-1 alpha-2 code** (`ES`, `US`), the only
    part with a required format: a country's name has one spelling per language,
    and anyone grouping by country would see "España", "Spain" and "Espagne" as
    three countries. Turning a name into a code is looking up a table, not
    inventing. `region` is left free: there is no universal table (province,
    state, county, *Land*).
  - **Omitting is the correct way of not knowing**: `""` and `null` are rejected
    (each part is a string of length ≥ 1), and so is `"address": {}`, just like
    `location: {}`. With a real case behind it: Guild today emits all five
    subfields as `null`.
  - **It does not satisfy `location` on its own**: you still need `venue` or
    `onlineUrl`, the same rule as `geo`.
  - **It does not enter the recommended profile**: what is recommended is
    `location`. What you need to know about the place depends on the type of
    event — a postal address does not apply to an online one, and a meetup in a
    bar only needs the bar's name — so the warning would not be actionable for a
    good share of events. It is a real improvement when you have it, not a
    quality floor.

- **`offers`** (`array`, min. 1) on the **event**: what attending costs and where
  to register. Each entry: `name`, `price`, `currency`, `url`, `availability`
  (`in-stock` \| `sold-out`), `opensAt` and `closesAt`, with at least `price` or
  `url` present.
  - **Absent means UNKNOWN, never free.** Saying "free" has a shape, and it is
    `price: 0`. A consumer reading "no `offers` = free" turns into free every
    paid conference whose exporter did not map the price.
  - **It is a list** because an event's price is almost never one number: early
    bird, general, students. That is why **there are no ranges and no "from
    €45"** — `price` is a **number**, with no symbol and no thousands separator:
    a price that does not fit in one number **is several offers**, and as text it
    can be neither filtered nor compared, which is the only thing that makes
    publishing it as data worthwhile.
  - **`currency` (ISO 4217 alpha-3) is required as soon as `price` goes above
    0**, and is surplus when it is 0 — free is free in any currency. It is
    exactly how Luma ends up emitting `"price": 0, "priceCurrency": "usd"` for a
    session that costs nothing. The schema expresses it with an `if`/`then`.
  - **`availability` has no default**: absent = unknown. A stale feed that keeps
    asserting `in-stock` is worse than a quiet one, because it sends somebody to
    a closed box office.
  - **`waitlistUrl`**: where to join the queue once the offer has sold out.
    "Sold out and nothing to be done" and "sold out, but you can queue" stop
    being the same document.
    - **It is not a third `availability` value**, and the reason is **how it
      degrades**: with `sold-out` + `waitlistUrl`, every consumer that already
      exists still reads "sold out", which is **true**. With
      `availability: "waitlist"`, whoever does not know the value has no safe
      reading, and whoever parses `availability !== "sold-out"` ⇒ available — the
      normal case — would announce as buyable something that is not. Omitting the
      queue is an omission; saying "on sale" is a lie.
    - **`price` contradicts neither `sold-out` nor the queue**: `price` describes
      the deal, `availability` whether you can act on it right now. The case that
      needs it most — a **free event with limited capacity** — is `price: 0` +
      `sold-out` + `waitlistUrl`. Joining a queue costs no money.
    - **The schema rejects `in-stock` + `waitlistUrl`** with an `if`/`then`: a
      queue for something that is on sale is not a queue. It **allows**
      `waitlistUrl` without `availability`: whoever does not keep the box office
      state up to date should not be forced to *assert* `sold-out` in order to
      mention the queue. The incoherent is forbidden, never the incomplete.
    - Translation: schema.org **has no term** for a waiting list (`BackOrder` and
      `PreOrder` mean something else) → `SoldOut` is emitted, which is not false,
      and the queue degrades to text. An enum value would have lost the same.
    - **`last-tickets` rejected** (schema.org's `LimitedAvailability`, which
      Google reads): of the five sources studied, the three that emit
      `availability` emit `InStock` and nothing else; the threshold cannot be
      defined — five places, 10%, whatever marketing says — so nobody could
      filter or compare; it is the most volatile state possible; and above all it
      **does not change the action**: you can still buy. That is urgency, and
      urgency is capacity — the box office, which the spec leaves out.

- **A forward-compatibility rule for consumers** (not a field, it is normative):
  **an enum value you do not know is treated as unknown, never as the permissive
  value.** It is "absent = unknown" applied to the future instead of to the void,
  and without it any value added in a later version becomes "available" or
  "in person" for whoever parses with inequalities.
  - **It gets in because it already exists out there**: three of the five sources
    studied (Luma, Guild and Google's canonical example) emit `offers` in this
    very shape, and Google **displays** it in the `Event` rich result.
  - **No `isFree`** (it was in the earlier sketch): redundant with `price: 0`,
    and two ways of asserting the same thing are two ways of contradicting
    yourself. No `capacity` and no places left: that is the **box office**, not
    the ticket. `registrationUrl` is renamed `url` — the object is already called
    an offer.
  - Translation: schema.org's `Offer` **1:1** (`currency` → `priceCurrency`,
    `opensAt`/`closesAt` → `validFrom`/`validThrough`, `availability` → the
    `InStock`/`SoldOut` URLs). In **iCal and RSS/Atom there is nothing**: RFC
    5545 does not model price. It goes into the `DESCRIPTION` or the item's body.

- **`cfp`** (`object`) on the **event**: the call for proposals. `url` required;
  `opensAt`, `closesAt`, `coversTravel` and `coversAccommodation` optional.
  - **It is the only field in the spec with no equivalent in any of the three
    destinations**, and it gets in anyway — from the other end of the pipe.
    "Which conferences are accepting proposals right now?" is one of the
    questions this project exists to answer, and today it is answered by
    **scraping**: confs.tech, developers.events or CFP Land maintain by hand
    exactly these two values, a link and a deadline. The producer exists; it
    publishes in HTML, not in JSON-LD. OTE is not only an export format: it is
    also where data the other three cannot name can live.
  - **An object, not a list**, unlike `organizers`: there Luma **already emits**
    several, here no real producer publishes two calls per event. If the case
    shows up, widening object → list breaks and will arrive with its own version;
    nothing is paid today for a hypothetical case.
  - **`coversTravel` and `coversAccommodation` have no default**: absent =
    unknown, never `false`. They are here because they are what gets filtered on
    before deciding whether one can afford to submit a proposal.
  - **`closesAt` enters the recommended profile, conditionally** (only if there
    is a `cfp`): with no deadline, a consumer sees a link and cannot tell whether
    it closed in March. `offers` and `cfp` are **not** recommended in themselves:
    most events have no call for papers, and the price cannot always be recovered
    from the source.
  - **No `timezone` of its own** (the earlier sketch had one): its dates are
    instants with an offset, see below.
  - Translation: **nothing in schema.org, nothing in iCal, nothing in RSS/Atom.**
    It degrades to text in the `DESCRIPTION` or the item's body, or to an
    `X-OTE-CFP-URL`.

- **`eligibility`** (`object`) on the **event**: who can get in, when the answer
  is not "anyone". `type` required (`open` \| `members-only` \|
  `approval-required` \| `restricted`); `note` and `url` optional.
  - **It is the third part of "can I go?"**, alongside `attendanceMode` and
    `location`: those two say whether the event is **within your reach**, this
    one whether **they will let you in**. They contradict each other quite
    happily — an online session, free and open to anyone with a connection, whose
    voice channel sits inside a Discord you have to belong to.
  - **It replaces the practice of putting this in `tags`.** In a free list,
    `["rust","members-only"]` forces the consumer to **guess** which of those
    strings is an access condition, and no interface can offer an "only events I
    can get into" filter. The `tags` description now says explicitly that it is
    **what the event is about**, not who can get in. The other axis that also
    sneaks in there — **audience and level** — is still unsolved: that is an open
    question, not this field.
  - **`approval-required` is a judgement on the person, not capacity.** Somebody
    looks at your request and decides (Luma's "request to approve", a Meetup
    group with an admission question). An event you get into **first come, first
    served** until the places run out **has no door**: it is `open`, and running
    out is `offers[].availability: "sold-out"` (or `capacity`, which is still an
    extension). The rule that holds the field up: if the answer to "can I go?"
    changes on its own over time, **it is not `eligibility`** — it is the box
    office.
  - **No `invite-only`**, and it falls **on scope, not on form**: this spec
    exists to find events and communities **you can take part in**, and an event
    you only get into by invitation is a private club. The cases near the line —
    a speakers-and-sponsors dinner, a gathering of an ambassador programme —
    remain publishable with `restricted`, and with **more** information: its
    mandatory `note` says **who** can get in, where `invite-only` only said
    "not you".
  - **`restricted` requires `note`**, with an `if`/`then` like `currency`'s: it
    is the escape hatch that keeps the enum small ("University of Almería
    students only") without anyone having to hammer their condition into
    `members-only`. And `restricted` on its own says nothing.
  - **No default**: absent = unknown, **never `open`**. Whoever imports an `.ics`
    does not have the data, and a default would turn every imported event into an
    assertion nobody made. Corollary: `"type": "open"` **does add information**,
    unlike `"status": "scheduled"`.
  - **An object, not a string**: *which* community is data whoever publishes
    already has, and widening string → object later breaks. Only `type` is
    required.
  - **It does not go inside `offers`**, even though the per-tier axis exists (the
    student rate asks for a card): `offers` is absent from most events and never
    arrives from an `.ics`, so the door would disappear where most events are.
    `offers[].eligibility` is **reserved**, with this very enum, for when there is
    a real producer.
  - **It does not model** capacity or places (that is the box office), the state
    of *your* request, access codes, guest lists or the code of conduct: it
    describes **the condition, not the process**.
  - Translation: **nothing structured in any of the three destinations** — the
    `cfp` case. It degrades to text (`DESCRIPTION`, the item's body,
    `description`), which is what `note` is for, or to an `X-OTE-ELIGIBILITY`.
    Three false friends to avoid: iCal's `CLASS:PRIVATE` is the **visibility of
    the data**, schema.org's `Offer.eligibleCustomerType` is B2B/B2C, and
    `isAccessibleForFree` is the price. None of them is the door.

- **`textLanguage`** (a BCP 47 tag) on the **event** and on the **feed**: the
  language the document's **free text** is written in.
  - **It is not `languages`, and they are not derived from each other.**
    `languages` are the languages **spoken** at the event; `textLanguage` is the
    language this text is **written** in. A bilingual session described only in
    Catalan is `languages: ["ca","es"]` + `textLanguage: "ca"`. The `languages`
    description now says so in the schema, which is where somebody will read it.
  - **One tag, not a list**: a text is written in one language.
  - **It is inherited from the feed**, like `license` and `organizers`: whoever
    publishes in a single language declares it **once in the whole file**. Absent
    = unknown, never English and never the language of the HTTP response.
  - **It unlocks concrete things** that today cannot even be guessed: the HTML
    `lang` — which hyphenation, the screen reader and the spellchecker all depend
    on — correct alphabetical sorting, and the decision whether to
    machine-translate.
  - Translation: **all three destinations receive it**. `LANGUAGE` is a native
    iCal parameter (`SUMMARY;LANGUAGE=ca:…`, RFC 5545), RSS has `<language>`,
    Atom `xml:lang` and JSON-LD `@language`.

- **`translations`** (`object` indexed by BCP 47 tag) on the **event** (`name`,
  `description`) and on the **feed** (`title`, `description`): the same text in
  other languages.
  - **Additive: `name` and `description` stay strings.** A v0.2 consumer reads a
    document with `translations` without noticing it exists. The alternative —
    language maps in the field itself, `"name": {"ca":…,"es":…}`, JSON-LD's
    `@container: @language` — is cleaner and **breaks `name` for every current
    consumer**, taxing the monolingual 99% to serve the 1%. Rejected for that.
  - **A map, not a list**, because the language **is** the key: one entry per
    language and no way of publishing two Spanish versions that contradict each
    other. BCP 47 keys (`"spanish"` does not validate) and an **empty map is
    invalid**, like `location: {}`.
  - **Text living inside an object is translated where it lives**, with a local
    `translations`: `offers[].translations` (`name`),
    `eligibility.translations` (`note`) and `partOf.translations` (`name`).
    **Never a positional mirror** (`translations.es.offers[0].name`): a list has
    no stable keys, so reordering the offers would hang the translation off the
    wrong tier **without anything stopping validating**.
  - **What is NOT translated, and why.** Proper nouns (`organizers[].name`,
    `location.venue`): "PyAlmería" is "PyAlmería" in every language. Identifiers
    (`id`, `partOf.id`, the `url`s): two spellings would be two events. Codes
    (`country`, `currency`, `languages`) and **enums** (`eligibility.type`,
    `status`, `attendanceMode`, `availability`): a closed value is **multilingual
    for free** — it is rendered in the reader's language and the data does not
    change. And `tags`, which being free text leaves a real rough edge —
    `["aprenentatge-automàtic"]` and `["machine-learning"]` do not find each
    other: the recommendation is to tag in the language of the technical
    ecosystem.
  - **`offers[].name` stays free text**: a `kind` with an enum was considered,
    which would have been multilingual for free, and it is rejected because it
    would take away whoever organises the right to name their own tickets.
    Freedom now, and `offers[].translations` is its price.
  - **`locality` and `region` are not translated**: "València"/"Valencia" are
    spellings of the same place and there is no table like the one for countries.
    A rule, not validation: **the spelling most recognisable to the event's main
    audience**. Anyone needing precision without a language has `location.geo`,
    which has no spellings.
  - **Any `translations` in the document requires `textLanguage`**, with an
    `if`/`then` and **at any depth**: a translation inside an offer triggers it
    too. It is the **only cross-field dependency in the spec**. Without knowing
    what language the primary text is in, nobody can tell which entry duplicates
    it nor what they are falling back to.
  - **It is never translated into the language `textLanguage` already declares** —
    that would be the same text twice. A **normative rule the schema cannot
    check**: comparing a field's value against a key's name is outside JSON
    Schema.
  - **In the feed it is not inherited**: `feed.translations` translates the
    FEED's title, never the names of its events. `feed.textLanguage` is
    inherited.
  - **A declared debt**: unlike every other field in this version, **no real
    producer emits it** — each platform serves one page per language. It gets in
    because in Catalan, Basque, Galician and Valencian the bilingual event **is
    the normal case**, and today the only way out is cramming two languages into
    the same string, which is worse. The alternative of **one feed per language**
    (`/feed.ca.json`, `/feed.es.json`) still stands. If nobody emits it, it will
    be withdrawn just as out loud.
  - Translation: **only JSON-LD receives it whole** (language maps). In iCal
    there is nowhere — `SUMMARY` is not repeatable — and in RSS the language
    belongs to the channel; Atom holds up a little better because `xml:lang` is
    per element.

- **Deadlines as INSTANTS** (`cfp.opensAt`, `cfp.closesAt`,
  `offers[].opensAt`, `offers[].closesAt`): they require an offset or `Z`, unlike
  `startDate`/`endDate`, which are wall clocks. It is not an inconsistency: an
  event happens to people **in a place**, and a deadline is **a button that stops
  working**, which happens at the same moment in Madrid and in Bogotá. The case
  that settles it is *anywhere on Earth*: a CFP closing AoE does so in
  **UTC-12**, which is neither the event's zone nor that of anyone organising it,
  and with a wall clock plus `timezone` it cannot be expressed. A bare `"23:59"`
  is the classic call-for-papers bug.

- **Two new `status` values: `moved-online` and `tentative`.** The enum becomes
  `scheduled` (default), `tentative`, `cancelled`, `postponed`, `rescheduled`,
  `moved-online`. Adding values to an enum invalidates no earlier document.
  - **`moved-online`** completes schema.org's `eventStatus` enum
    (`EventMovedOnline`), which is the one Google consumes. It **should** — not
    must — come with `location.onlineUrl` and `attendanceMode: "online"`: the
    schema does not require it because the joining link is often not public yet,
    and requiring it would force whoever imports either to invent it or to
    discard the event. In iCal there is no way to distinguish it: `CONFIRMED` is
    emitted with the URL in `LOCATION`.
  - **`tentative`** does not come from schema.org but from iCal
    (`STATUS:TENTATIVE`), which is what any calendar emits for something not yet
    settled. It gets in because `status` is **the only field in the spec with a
    default**: without `tentative`, whoever imports an `.ics` can only **promote
    the event to `scheduled`**, asserting something nobody asserted. The same
    argument as `attendanceMode` having no default. Translating to schema.org
    loses it (`EventScheduled` is emitted): it is the only value that travels
    better to iCal.
  - The difference between **`postponed`** (postponed, **with no** new date: the
    document keeps the old dates) and **`rescheduled`** (already with a new date,
    which is the one the document carries) is documented too. And that
    **RSS/Atom have no `status`**: whoever exports must carry it into the entry's
    title (`[CANCELLED] …`).

- **Recommended fields**, as two new published schemas:
  [`event.recommended.schema.json`](spec/v0.3/event.recommended.schema.json) and
  [`feed.recommended.schema.json`](spec/v0.3/feed.recommended.schema.json).
  - **They are profiles of quality, not of validity.** `event.schema.json`
    answers "is this an OTE event?"; the profile answers "is it good for
    anything?". A normative rule: a tool **may warn** about a missing recommended
    field and **must not reject** the document because of it. The opposite would
    reintroduce through the back door what permissiveness avoids: whoever imports
    a bare `.ics` would have to invent the value or throw the event away.
  - **Recommended on the event**: `url`, `description`, `organizers`,
    `location`, `attendanceMode`, `tags`, `languages`, `updatedAt` — and
    `endDate` **only if `startDate` carries a time** (in an all-day event its
    absence already means "it ends the day it starts", so warning would be
    noise). The criterion is not "it would be nice to have" but **what breaks in
    the three destinations if it is missing**: with no `url` there is no link in
    RSS/Atom, with no `tags` there is no filtering by interest, with no
    `updatedAt` there is no incremental synchronisation — which is what makes
    *subscribing* possible instead of re-reading everything.
  - **Recommended on the feed**: only `url` and `description`. Almost all of a
    feed's quality lives in its events, and a checker applies the event profile to
    each one **with inheritance already resolved**.
  - **`status` is NOT recommended**: it is the only field with a default, and
    writing `"scheduled"` adds nothing to its absence. What matters about
    `status` is *updating it when the event falls through*, and no schema can
    check that.
  - **`feed.organizers` is NOT recommended**: an aggregator **must** omit it. A
    warning there would push it into claiming events it does not organise,
    corrupting the very data the field exists to protect.
  - The field reference now has three tiers (`required`, `recommended`,
    `optional`), read **from the profiles**, not written by hand. In the
    website's index, an orange dot marks the recommended ones alongside the
    accent dot that already marked the required ones.
    `npm run validate` reports them as warnings and **never** changes the exit
    code.

- **A prefixed extension policy**, in the spec's README. Two kinds of additional
  field are distinguished: **core candidate** (no prefix: `capacity`,
  `sponsors`) and **external vocabulary** (prefixed:
  `combuilders:communityId`).
  - **A normative commitment: OTE will never mint a field name containing a
    `:`.** It is a namespace reservation — a prefixed field cannot collide with a
    core one, today or in v1.0.
  - It is what lets OTE **connect** with other specifications (a community
    directory, for instance) without **coupling** to them.

### Decided NOT to include

- **`eventSchedule` (schema.org's `Schedule`), replacing
  `timezone`/`startDate`/`endDate`.** It would be more expressive —
  `repeatFrequency`, `byDay`, `exceptDate` — and it is rejected for four reasons:
  1. **It puts an expansion engine in a file.** The feed is an interchange
     format, not an API: the consumer reads, it does not compute. With a rule,
     even the thirty-line script rendering a listing needs calendar arithmetic
     (DST, exceptions, infinite series, the semantics of `"2MO"`).
  2. **RSS/Atom cannot express it.** Whoever exports has to expand anyway:
     expansion always happens, and the only question is **who** does it. Better
     whoever publishes — once, with the data in front of them — than every
     consumer separately, each with their own bug.
  3. **It breaks rules the spec already has.** A stable `id` does not survive N
     occurrences in one document (you would need a `RECURRENCE-ID`), and
     `status: cancelled` stops being expressible per occurrence: cancelling *the
     August session* would become impossible again.
  4. **There is no real producer.** Of the five sources studied (Meetup,
     Eventbrite, Luma, Guild and Google's canonical example), **none** emits
     `eventSchedule` — they all emit a flat date per occurrence, including Luma's
     *weekly* session. And Google, which consumes schema.org at scale,
     explicitly asks for one `Event` per date.
- **`RRULE` as a core field.** Same reason. An importer wanting a lossless
  round-trip keeps it as prefixed external vocabulary
  (`"ics:rrule": "FREQ=MONTHLY;BYDAY=2MO"`): informative, and no OTE consumer is
  obliged to evaluate it.
- **`organizers[].email` as a recommended field.** The field **does get in** (see
  *Added*): without it there is no valid iCal `ORGANIZER` to emit. What is
  rejected is **recommending it**. Publishing an address in an open, crawlable
  feed is handing it to the spam harvesters, and what is published cannot be
  unpublished; a warning about its absence would be the quality profile pushing
  somebody into exposing contact details. It stays optional, and whoever leaves
  it out degrades the `ORGANIZER` to `X-OTE-ORGANIZER` or to the `DESCRIPTION`.
- **An inheritable `email` at feed level** (`feed.organizerEmail`, or
  field-by-field inheritance inside `organizers`). It would be the way for an
  aggregator feed to end up attributing **its** address to events it does not
  organise, or for a guest event to inherit the host community's. The list
  replacement `organizers` already has solves the community case without opening
  either: the email travels inside its object and never on its own.
- **`previousStartDate`** (schema.org), the date a `rescheduled` event had before
  it moved. None of the sources studied emits it, and `updatedAt` already says
  the data changed. It gets in as a core candidate (an unprefixed field) the day
  somebody really uses it.
- **Capacity and sale state** (`maximumAttendeeCapacity`, places left, discount
  codes, the single registration of a multi-part event). Guild does emit
  capacity, so it is a reasonable candidate — but the rest is **box-office
  state**: it changes on its own, expires in minutes and a JSON file regenerated
  every night cannot sustain it. `offers` describes **the ticket**, not the sale.
  Capacity gets in today as an unprefixed extension (see
  [`event-meetup.json`](spec/v0.3/examples/event-meetup.json)).
- **Speakers (`speakers` / `performer`) and the agenda.** Still out: `cfp` models
  the call, not what comes out of it. Putting a speaker in `organizers` corrupts
  the data for everyone who consumes it.
- **`organizers[].logo`, `organizers[].sameAs`.** They overload the field without
  any consumer asking for them yet.
- **`organizers[].id` / `linking.communityId`.** An identifier
  (`combuilders:my-community`) linking to a community directory was considered.
  Rejected: it demands **prefix governance** this project does not have and that
  would couple OTE to another one; it contradicts the spec's own `id` rule (*a
  URI under a domain you control*, which needs no central registry because DNS
  already guarantees uniqueness); and **there is no real consumer yet** — the
  directory does not exist as a specification. It gets in today as a prefixed
  extension, and will graduate into the core if it survives real use, in whatever
  shape that use dictates.

### Changed

- The extension field **`community`** (`{ uri, name }`) that appeared in the
  examples as a field *under discussion* is **superseded by `organizers`** and is
  withdrawn from them. It was never normative, so this breaks nothing: whoever
  emits it will keep validating.
- The npm package exported only the `v0.1` subpaths. It now exposes `v0.1`,
  `v0.2` and `v0.3`.
- **Fields are declared in a canonical order** — identity, when, where, filters,
  status, provenance — and the schema, the examples and the generated reference
  all follow it. **It changes nothing about what is valid**: JSON has no order
  and no consumer should depend on it. What it changes is what people read: the
  reference table, the editor's autocompletion and the example somebody copies
  now show the same shape. `npm run validate` checks it against the `v0.3`
  examples; the frozen versions keep their own. The order and the reasoning, in
  ["Field order"](spec/v0.3/README.md#field-order-is-not-normative-but-there-is-one).
- **`source` no longer requires `name`: it asks for `name` **or** `url`** (ideally
  both). It **relaxes** what was valid, so no `0.3.0` document stops validating —
  and an empty `source`, or one with only `license`/`retrievedAt`, is still
  rejected. The reason: whoever imports an `.ics` always knows the address they
  downloaded and often has no publisher name to read (iCalendar's `X-WR-CALNAME`
  is optional), so the previous rule was met by **inventing** the name, and an
  invented source is worse than a source given only as a link. The same rule as
  `offers` (`price` or `url`) and `location` (`venue` or `onlineUrl`). For
  consumers: do not assume `source.name` is there — when it is missing, derive
  the label from the host of `source.url`.
- **The generated reference now publishes the object constraints** the validator
  applies and that no "Tier" column could express: `location` with `venue` or
  `onlineUrl`, `currency` as soon as `price` goes above 0, `alt` when an image
  carries `translations`, `textLanguage` when there are translations… They are
  extracted from the schemas' `anyOf`, `if`/`then`, `dependentRequired` and
  `minProperties`, like the rest of the reference. And a required field **inside
  an optional object** (`source.name`, `cfp.url`, `location.geo.lat`) is marked
  as such — `required within X` — instead of plain `required`: the word meant two
  different things on the same page.
- **A new normative consumption rule, with no schema change:** a consumer or
  aggregator **MAY discard** an event that carries neither `url`, nor `location`,
  nor `cfp.url`, and whose feed does not declare a `url` either. No document
  stops validating — validity is still decided by `event.schema.json` — but it is
  now stated that validity and visibility are different decisions: an event with
  nowhere to send whoever reads it obliges nobody to list it. The detail and the
  chain of fallbacks (`url` → `location` → `cfp.url` → `feed.url`), in
  ["With no `url` and no `location`"](spec/v0.3/README.md#with-no-url-and-no-location-valid-but-discardable).

### Migration — how to update a tool

- **Consumers:** the field is optional; v0.2 code ignores it without breaking. To
  take advantage of it: read `event.organizers` and, if missing, fall back to
  `feed.organizers` — **never** to `feed.title`. Absent in both = unknown. If you
  were using the `community` extension field, migrate to `organizers`.
- **Package-based validators:** `npm install @opentechevents/schema@0.3.0`. The
  package now exports the `v0.3` schemas and `specVersion === "0.3.0"`.
- **URL-based validators:** point at
  `https://opentechevents.org/schema/v0.3/{event,feed}.schema.json`. The `v0.1`
  and `v0.2` URLs keep being served unchanged.
- **schema.org exporters:** `organizers` → `organizer` (array), with `@type`
  `Organization` or `Person` per `type`; `email` → `Organization.email`, and
  emitting it is **optional** — it puts the address on a public page and Google
  does not read it for the `Event` rich result. `offers` → `offers` (an array of
  `Offer`), with `currency` → `priceCurrency` and `availability` → the
  `https://schema.org/InStock` or `SoldOut` URL. `cfp` has no destination:
  mention it in `description` if you want a human to see it.
- **Whoever was emitting `cfp` or `offers` as an extension** (they were in the
  examples from v0.1 onwards): they are now normative, and in a different shape.
  `offers` becomes a **list**, with no `isFree` (use `price: 0`) and no
  `capacity` (an extension); `registrationUrl` is now called `url`. `cfp` loses
  its `timezone`: deadlines carry an offset.
- **Atom / RSS exporters:** Atom → one `<author>` per entry, with `<name>`,
  `<uri>` and `<email>` if there is one. RSS 2.0 → `<author>` **if** the
  organiser carries an `email` (the element requires it), and `<dc:creator>` if
  not. `textLanguage` → the channel's `<language>` (RSS) or `xml:lang` (Atom,
  which also allows it per entry).
- **iCal exporters:** only `organizers[0]`, and only if it carries an `email`:
  `ORGANIZER;CN="…":mailto:…`. With no `email`, `X-OTE-ORGANIZER` — **not** a
  `mailto:` derived from the `url`'s domain. The other organisers have nowhere to
  go.
  `textLanguage` → the `LANGUAGE` parameter of each text property
  (`SUMMARY;LANGUAGE=ca:…`); of `translations` only the primary text survives,
  because `SUMMARY` is not repeatable.
- **Consumers with a multilingual interface:** the resolution order is **the
  language the reader asks for → `translations[language]` → the primary text**,
  and that last step needs `textLanguage` to know what language what it is
  showing is in. Absent = unknown: do not assume it from the feed or from
  `Accept-Language`.
- **Importers (`.ics` → OTE):** `ORGANIZER;CN="…"` → `organizers[0].name`. The
  `mailto:` is discarded. **`RRULE`/`RDATE` → expand**: one document per
  occurrence, all with the same `partOf.id`; `EXDATE` → do not emit that
  document; `RECURRENCE-ID` → that occurrence's `id`. The original rule, if you
  want to keep it, in `ics:rrule`.
- **iCal exporters:** `partOf` → `RELATED-TO;RELTYPE=PARENT:<id>`. **Never
  reconstruct an `RRULE`**: you emit the occurrences you have.

## [0.2.0] — 2026-07-15

The first extension of the core. All three fields are **optional and
backwards-compatible** (hence MINOR, not MAJOR): a valid `0.1.0` document, by
changing only `specVersion` to `"0.2.0"`, stays valid. All three got in by the
same route — the first real implementation, the `.ics` aggregator
([`opentechevents-data`](https://github.com/OpenTechEvents/opentechevents-data)),
had them in front of it in every `VEVENT` and there was nowhere to put them — not
by speculative design.

### Added

- **`tags`** (`string[]`) on the event. Free-form topical tags. Maps to iCal's
  `CATEGORIES` and schema.org's `keywords`. It is kept free on purpose; a
  controlled vocabulary could be layered on later without closing the field. It
  graduated from the "under discussion" state of v0.1.
- **`location.geo`** (`{ lat, lon }`, WGS-84 decimal degrees) on the event. Maps
  to iCal's `GEO` and schema.org's `Place.geo`. It goes **inside `location`**, a
  sibling of `venue`/`onlineUrl` (it does not hang off `venue`, which is a
  string). It is not enough on its own to satisfy `location`.
- **`updatedAt`** (an ISO 8601 instant with an offset/Z, the same `$defs/instant`
  as `Feed.updatedAt`) on the event. The instant at which **the event's data**
  last changed — equivalent to iCal's `LAST-MODIFIED`, **not** to `DTSTAMP`. It
  enables per-event incremental synchronisation (`updatedAt > last_read`).

### Migration — how to update a tool

- **Consumers:** all three fields are optional; v0.1 code ignores them without
  breaking. To take advantage of them, read `tags`, `location.geo` and
  `updatedAt` when present; absent means *unknown*, never a default value.
- **Package-based validators:** `npm install @opentechevents/schema@0.2.0`. The
  package now exports the `v0.2` schemas and `specVersion === "0.2.0"`.
- **URL-based validators:** point at
  `https://opentechevents.org/schema/v0.2/{event,feed}.schema.json`. The `v0.1`
  URLs keep being served unchanged.
- **Producers / importers (`.ics` → OTE):**
  - `CATEGORIES` → `tags` (split on commas, `trim`, dedupe).
  - `GEO` → `location.geo` (parse `"lat;lon"`, separator `;`, into `number`s).
    ⚠️ It is `location.geo`, **not** `location.venue.geo`: in OTE `venue` is a
    string.
  - `LAST-MODIFIED` → `updatedAt` (if missing, `DTSTAMP` as a last resort, but it
    is noisy: it marks generation, not editing).
  - `CATEGORIES` does not travel through Google Calendar (it neither emits nor
    reads it). An importer may recover topics from *hashtags* (`#rust`) in the
    `description`; that is an importer convention, not a schema one.

## [0.1.0] — 2026-07

The first published version. A minimal core for describing a tech community event
and publishing it in a reusable feed: `id`, `name`, `startDate`, `timezone`
required (plus `specVersion` and `license` in a standalone document); `url`,
`description`, `endDate`, `location` (`venue`/`onlineUrl`), `attendanceMode`,
`languages`, `status`, `source` optional. A feed with `specVersion`, `title`,
`license`, `updatedAt`, `events`. Frozen in [`spec/v0.1/`](spec/v0.1/).

[0.3.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.3
[0.4.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.4
[0.2.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.2
[0.1.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.1
