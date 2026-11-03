import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** The spec version these schemas describe. Matches the `specVersion` field of a document. */
export const specVersion = "0.6.0";

/** JSON Schema (draft 2020-12) of a single OTE event. */
export const eventSchema = require("./spec/v0.6/event.schema.json");

/** JSON Schema (draft 2020-12) of an OTE feed. */
export const feedSchema = require("./spec/v0.6/feed.schema.json");

/**
 * Both schemas, in the order a validator needs them: the feed references the event by $id,
 * so the event schema must be registered first.
 */
export const schemas = [eventSchema, feedSchema];

/**
 * Quality profiles, NOT validity: a document that fails one is still a valid OTE document.
 * They list the fields that decide whether an event can be found, filtered and subscribed to.
 * Report their failures as warnings; never reject a document for them. Both reference the base
 * schemas by $id, so register `schemas` first.
 */
export const eventRecommendedSchema = require("./spec/v0.6/event.recommended.schema.json");
export const feedRecommendedSchema = require("./spec/v0.6/feed.recommended.schema.json");
export const recommendedSchemas = [eventRecommendedSchema, feedRecommendedSchema];

/**
 * The ajv options these schemas compile under — the ONE set this package tests against.
 * Pass it whole; a consumer who assembles their own set is on their own:
 *
 *   const ajv = new Ajv2020({ ...ajvOptions, allErrors: true });
 *
 * `strictRequired: false` is not a concession, it is the point. Ajv's strict mode dislikes
 * `required` living apart from the `properties` that declare the field, and the schemas express
 * three rules exactly that way, because JSON Schema has no other way to say them:
 *
 *   anyOf: [{ required: ["venue"] }, { required: ["onlineUrl"] }]   "at least one of the two"
 *   if: { required: ["translations"] }, then: { required: ["textLanguage"] }   a trigger
 *   then: { properties: { partOf: { required: ["offers"] } } }   a rule about a nested object
 *
 * All three are valid draft 2020-12 and unambiguous. Under a bare `strict: true` ajv refuses to
 * compile them — which is to say no OTE schema, in any version from v0.1 on, has ever compiled
 * under a bare `strict: true`. Everything else here stays strict on purpose: an unknown keyword
 * or an unregistered format is a real mistake, and `annotationKeywords`, `customFormats` and
 * `customKeywords` exist precisely so strict mode can stay on while the schemas keep theirs.
 */
export const ajvOptions = { strict: true, strictRequired: false };

/**
 * Annotation keywords the schemas carry, with the meta-schema each one's value obeys.
 * They constrain nothing — a validator that ignores them accepts exactly the same documents.
 * `x-inheritsFrom` names the FEED field an event field falls back to when it omits its own
 * (`event.license` → `feed.license`), which no standard keyword can say: the default is not a
 * literal, it is whatever the enclosing feed declared.
 *
 * JSON Schema allows unknown keywords, so most validators need nothing. Ajv under `ajvOptions`
 * refuses to compile a schema carrying one, so register them first:
 *
 *   for (const kw of annotationKeywords) ajv.addKeyword(kw);
 */
export const annotationKeywords = [
  { keyword: "x-inheritsFrom", metaSchema: { type: "string" } },
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * `$defs.dateTime`'s own concept — a wall-clock date-time, deliberately without an offset and
 * without seconds (this is the hour on a poster, never a technical instant) — has no standard
 * RFC 3339 format, so ajv-formats cannot validate it. Checks real calendar validity (days per
 * month, leap years) the same way ajv-formats' own `date` format does internally.
 */
function isOteLocalDateTime(value) {
  const match = WALL_CLOCK.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12) return false;
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= maxDay && hour <= 23 && minute <= 59;
}

const languageSubtags = require("./language-subtags.json");
const LANGUAGE = new Set(languageSubtags.language);
const SCRIPT = new Set(languageSubtags.script);
const REGION = new Set(languageSubtags.region);
const VARIANT = new Set(languageSubtags.variant);

/**
 * Parses the CORE of a BCP 47 (RFC 5646) tag — `language ["-" script] ["-" region] *("-" variant)`
 * — checking each subtag against the real IANA Language Subtag Registry, not just its shape.
 * Deliberately does NOT handle `extlang`, extension singletons (`-u-...`, `-t-...`), private use
 * (`x-...`) or the 26 fixed `grandfathered` tags: none has a real use case for "what language is
 * this event's text in", and `grandfathered` tags are relics RFC 5646 itself deprecates in favor
 * of the modern subtag form. See docs/history/CHANGES.log #P006 / DECISIONS.md D007.
 *
 * Returns null if the tag doesn't parse; a well-formed tag with an unregistered subtag also
 * returns null — e.g. "en-12345678" is 8 alphanumeric characters, which the grammar's own
 * `5*8alphanum` variant form permits regardless of leading digit (contrary to a first read of
 * the ABNF, only the SEPARATE 4-character `DIGIT 3alphanum` form is digit-led-and-length-4); it
 * fails only because "12345678" was never registered as an actual variant.
 */
function parseCoreLanguageTag(value) {
  if (typeof value !== "string" || value === "") return null;
  const parts = value.split("-");

  const language = parts[0].toLowerCase();
  if (!/^[a-z]{2,8}$/.test(language) || !LANGUAGE.has(language)) return null;

  let i = 1;
  let script = null;
  if (i < parts.length && /^[A-Za-z]{4}$/.test(parts[i])) {
    const candidate = parts[i].toLowerCase();
    if (!SCRIPT.has(candidate)) return null;
    script = candidate;
    i++;
  }

  let region = null;
  if (i < parts.length && /^([A-Za-z]{2}|\d{3})$/.test(parts[i])) {
    const candidate = parts[i].toLowerCase();
    if (!REGION.has(candidate)) return null;
    region = candidate;
    i++;
  }

  const variants = [];
  while (i < parts.length) {
    if (!/^([A-Za-z0-9]{5,8}|\d[A-Za-z0-9]{3})$/.test(parts[i])) return null;
    const candidate = parts[i].toLowerCase();
    if (!VARIANT.has(candidate) || variants.includes(candidate)) return null;
    variants.push(candidate);
    i++;
  }

  return { language, script, region, variants };
}

function isOteLanguageTag(value) {
  return parseCoreLanguageTag(value) !== null;
}

/**
 * JSON Schema's `iri` format is the Unicode sibling of `uri`: the web address a person actually
 * publishes may carry non-ASCII characters such as `ñ` or `á`. The schemas still pair it with
 * an explicit `^https?://` pattern wherever OTE wants web URLs only.
 */
function isIri(value) {
  if (typeof value !== "string" || /[\u0000-\u0020<>"]/.test(value)) return false;
  try {
    new URL(encodeURI(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats the schemas use beyond what ajv-formats provides. Ajv under `ajvOptions` refuses to
 * compile a schema referencing an unregistered format, so register these before compiling —
 * the same requirement `annotationKeywords` already has, for the same reason:
 *
 *   for (const f of customFormats) ajv.addFormat(f.name, f.validate);
 */
export const customFormats = [
  { name: "iri", validate: isIri },
  { name: "ote-local-date-time", validate: isOteLocalDateTime },
  { name: "ote-language-tag", validate: isOteLanguageTag },
];

/**
 * `$defs.event`'s own constraint: `endDate`, when present, must not be earlier than `startDate`.
 * Both are wall-clock strings of the same form (the schema's own `oneOf` already guarantees
 * that) and, since `dateTime` forbids seconds, always the same fixed width — so ordinary string
 * comparison already matches chronological order, no timezone conversion needed.
 *
 * Unlike `annotationKeywords`, this keyword DOES restrict which documents pass — register it
 * the same way, before compiling:
 *
 *   for (const kw of customKeywords) ajv.addKeyword(kw);
 */
/**
 * `$defs.offer` and `$defs.cfp` share this constraint: `closesAt`, when both it and `opensAt`
 * exist, must not be an instant earlier than `opensAt`. Unlike `orderedDates`, these are
 * `$defs.instant` values — real points in time WITH a mandatory offset, and deliberately not
 * forced to a single one (UTC or otherwise): the offset is whatever the producing system or
 * organiser naturally writes, and forcing a conversion would repeat the exact authoring burden
 * D003 already rejected for `startDate`. Two instants with different offsets can have a string
 * order that disagrees with their real chronological order, so — unlike `orderedDates`, where
 * the fixed-width wall-clock form makes string comparison safe — this parses both values and
 * compares the actual instants.
 */
function parseInstant(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * A `translations` map's own constraint, shared by every keyword that walks the same seven nested
 * locations — the event's own map, plus `eligibility`, `partOf`, `offers[]`, `image[]`, and the two
 * v0.5 added, `recordings[]` and `partOf.offers[]`
 * (`distinctTranslationLanguages`, `eventsRespectInheritedTextLanguage`; P009/P015/P026):
 * no key may equal the primary language, and no two keys of the SAME map may be that language
 * written with different case. RFC 5646 §2.1.1 compares BCP 47 tags case-insensitively, so
 * "en-US" and "EN-us" are one language wearing two keys — the same contradiction the
 * key-equals-primary check already forbids, just between two translation entries instead of one
 * translation entry and the primary text. `primary` may be `null` (no effective language to
 * compare against yet — a different keyword's job to require one where needed); the
 * within-a-map duplicate check still applies regardless.
 */
function translationMapsAreDistinct(maps, primary) {
  return maps.every((map) => {
    const keys = Object.keys(map).map((k) => k.toLowerCase());
    if (primary !== null && keys.includes(primary)) return false;
    return new Set(keys).size === keys.length;
  });
}

/**
 * Value equality for the P037 `sharedOffersConsistent` keyword: array order significant, object
 * member order NOT significant, numbers compared as JSON values (so `45` and `45.0` collapse the
 * same way once parsed), strings exact, `null` treated as absent. Both inputs are already-parsed
 * JSON — no functions, dates or cycles to worry about.
 */
function deepEqualJson(a, b) {
  if (a === null || a === undefined) a = undefined;
  if (b === null || b === undefined) b = undefined;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((item, i) => deepEqualJson(item, b[i]));
  }
  const keysA = Object.keys(a).filter((k) => a[k] !== null && a[k] !== undefined).sort();
  const keysB = Object.keys(b).filter((k) => b[k] !== null && b[k] !== undefined).sort();
  return keysA.length === keysB.length && keysA.every((k, i) => k === keysB[i] && deepEqualJson(a[k], b[k]));
}

export const customKeywords = [
  {
    keyword: "orderedDates",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) =>
      !schemaValue || typeof data.endDate !== "string" || data.endDate >= data.startDate,
    error: { message: "endDate must not be earlier than startDate" },
  },
  {
    /**
     * `feed.covers`' own constraint: `to`, when both bounds exist, must not be earlier than
     * `from`. A window that ends before it begins covers nothing, and the field's whole purpose
     * is to tell a consumer what the feed is complete about — an impossible window would make
     * every event in the feed "outside the window", silently turning the claim off. Both are
     * `$defs.date` values, fixed-width and zero-padded, so string comparison is already
     * chronological, the same reasoning `orderedDates` uses.
     */
    keyword: "orderedCoverage",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) =>
      !schemaValue ||
      typeof data.from !== "string" ||
      typeof data.to !== "string" ||
      data.to >= data.from,
    error: { message: "covers.to must not be earlier than covers.from" },
  },
  {
    keyword: "orderedInstants",
    type: "object",
    schemaType: "boolean",
    validate: (schemaValue, data) => {
      if (!schemaValue || typeof data.opensAt !== "string" || typeof data.closesAt !== "string") {
        return true;
      }
      const opensAt = parseInstant(data.opensAt);
      const closesAt = parseInstant(data.closesAt);
      return opensAt === null || closesAt === null || closesAt >= opensAt;
    },
    error: { message: "closesAt must not be earlier than opensAt" },
  },
  {
    keyword: "distinctTranslationLanguages",
    type: "object",
    schemaType: "boolean",
    /**
     * No `translations` map — the event's own, or one nested in `eligibility`, `partOf`, each
     * `offers[]` or each `image[]` — may carry a key equal to `textLanguage`, the document's own
     * language: that would be a second, possibly contradictory version of the same text under
     * the same language tag, which the field's own description already promises cannot happen.
     * Same set of nested locations already enumerated by the sibling rule that REQUIRES
     * textLanguage wherever any of these maps exists (see `$defs.event`'s own `allOf`) — this
     * adds two things: that the language it requires can't also be a translation key, and (P026)
     * that no SINGLE map can carry two keys naming that same language in different case
     * ("en-US" and "EN-us") — JSON sees distinct object keys, RFC 5646 §2.1.1 sees one language
     * claimed twice, contradicting itself with no way for a consumer to know which entry to trust.
     * `translationMapsAreDistinct` covers both; a map missing entirely is filtered out first, same
     * as before.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue) return true;
      const primary = typeof data.textLanguage === "string" ? data.textLanguage.toLowerCase() : null;
      const maps = [
        data.translations,
        data.eligibility?.translations,
        data.partOf?.translations,
        ...(Array.isArray(data.offers) ? data.offers.map((o) => o?.translations) : []),
        ...(Array.isArray(data.image) ? data.image.map((i) => i?.translations) : []),
        ...(Array.isArray(data.recordings) ? data.recordings.map((r) => r?.translations) : []),
        ...(Array.isArray(data.partOf?.offers) ? data.partOf.offers.map((o) => o?.translations) : []),
      ].filter((map) => map && typeof map === "object");
      return translationMapsAreDistinct(maps, primary);
    },
    error: {
      message:
        "a translations map must not repeat textLanguage's own language, or any of its own keys, twice",
    },
  },
  {
    keyword: "uniqueEventIds",
    type: "object",
    schemaType: "boolean",
    /**
     * `feed.events`' own constraint: no two events in the same feed may share an `id`. `id` is
     * "minted once, never rewritten — this is what lets consumers update an event instead of
     * duplicating it"; two events under the same `id` in one document is that promise broken by
     * the very document that made it, not the cross-source deduplication this spec deliberately
     * leaves unsolved (a different feed reusing a URL is not this keyword's problem). Compares
     * `id` by exact string equality only — no URI normalization, no inferring that two different
     * identifiers name the same event. `uniqueItems` can't express this: it compares whole event
     * objects, and two events sharing an `id` typically differ in every other field too.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data.events)) return true;
      const ids = data.events.map((e) => e?.id).filter((id) => typeof id === "string");
      return new Set(ids).size === ids.length;
    },
    error: { message: "events must not repeat the same id" },
  },
  {
    keyword: "distinctPartOfId",
    type: "object",
    schemaType: "boolean",
    /**
     * `$defs.event`'s own constraint: `partOf.id`, when present, must not equal the event's own
     * `id` — an occurrence cannot be the series it belongs to. Same exact-string-equality scope
     * as `uniqueEventIds` (D011): no URI normalization, no inferring equivalence between
     * differently-written identifiers. Deliberately narrower than "no event's partOf.id may
     * equal another event's id in the feed" — that would forbid a legitimate cross-reference (an
     * occurrence pointing at the real event that IS its series); this only forbids an entity
     * being its own parent, which is incoherent by construction, not a judgment call.
     */
    validate: (schemaValue, data) =>
      !schemaValue || typeof data.partOf?.id !== "string" || data.partOf.id !== data.id,
    error: { message: "partOf.id must not equal the event's own id" },
  },
  {
    keyword: "eventsNotNewerThanFeed",
    type: "object",
    schemaType: "boolean",
    /**
     * `feed`'s own constraint: no event's `updatedAt` may be a later instant than the feed's own
     * `updatedAt` — "when this feed was generated" cannot be earlier than a revision it already
     * contains. Reuses `parseInstant` (same as `orderedInstants`, P008): RFC 3339 §5.1 only
     * guarantees string comparison matches chronological order when zone, offset representation
     * and fractional-second precision all match, none of which `$defs.instant` requires — so this
     * compares real instants, never the serialized text. Events without `updatedAt` are
     * unconstrained (absence means unknown, not "unchanged"); equality is allowed.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || typeof data.updatedAt !== "string" || !Array.isArray(data.events)) {
        return true;
      }
      const feedUpdatedAt = parseInstant(data.updatedAt);
      if (feedUpdatedAt === null) return true;
      return data.events.every((e) => {
        if (typeof e?.updatedAt !== "string") return true;
        const eventUpdatedAt = parseInstant(e.updatedAt);
        return eventUpdatedAt === null || eventUpdatedAt <= feedUpdatedAt;
      });
    },
    error: { message: "no event may be updated after the feed itself was generated" },
  },
  {
    keyword: "eventsRespectInheritedTextLanguage",
    type: "object",
    schemaType: "boolean",
    /**
     * `feed`'s own constraint: `$defs.event`'s shared schema evaluates each event against its own
     * instance location only, with no visibility into the enclosing feed — the same reason
     * `uniqueEventIds` and `eventsNotNewerThanFeed` (P010/P014) had to live here instead of in
     * `$defs.event`. That schema's `required: ["textLanguage"]` when any translations map exists
     * is therefore only enforced for a STANDALONE event document (moved to event.schema.json's
     * root `allOf`, which has no feed to inherit from); an event embedded in a feed must be judged
     * against its EFFECTIVE language, `event.textLanguage ?? feed.textLanguage`
     * (`x-inheritsFrom`), which only the feed root can compute. This single keyword covers both
     * halves of that check for every embedded event: the effective language must exist wherever a
     * translations map does (the event's own, or nested in eligibility, partOf, offers[], image[],
     * recordings[] or partOf.offers[] — the same seven locations `distinctTranslationLanguages`
     * walks), and no such map's key may
     * equal it, case-insensitively (RFC 5646 §2.1.1) — nor may two keys of the SAME map name that
     * effective language in different case (P026): the inherited case is exactly as capable of
     * this contradiction as the local one `distinctTranslationLanguages` already covers, and
     * without this an event that omits its own textLanguage was the one shape where it slipped
     * through. See docs/history/CHANGES.log #P015 / DECISIONS.md D016.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data.events)) return true;
      return data.events.every((event) => {
        if (!event || typeof event !== "object") return true;
        const effectiveTextLanguage =
          typeof event.textLanguage === "string" ? event.textLanguage : data.textLanguage;
        const maps = [
          event.translations,
          event.eligibility?.translations,
          event.partOf?.translations,
          ...(Array.isArray(event.offers) ? event.offers.map((o) => o?.translations) : []),
          ...(Array.isArray(event.image) ? event.image.map((i) => i?.translations) : []),
          ...(Array.isArray(event.recordings) ? event.recordings.map((r) => r?.translations) : []),
          ...(Array.isArray(event.partOf?.offers) ? event.partOf.offers.map((o) => o?.translations) : []),
        ].filter((map) => map && typeof map === "object");

        if (maps.length === 0) return true;
        if (typeof effectiveTextLanguage !== "string") return false;

        return translationMapsAreDistinct(maps, effectiveTextLanguage.toLowerCase());
      });
    },
    error: {
      message:
        "every event's translations must have an effective textLanguage (own or inherited from the feed) and must not repeat it",
    },
  },
  {
    keyword: "sharedOffersConsistent",
    type: "object",
    schemaType: "boolean",
    /**
     * `feed`'s own constraint (P037, new in v0.5): `partOf.offers` is the shared admission of a
     * multi-part event, written identically on every part that carries it — so a consumer holding
     * one part document can price it without resolving the parent. If the parts of one set (same
     * `partOf.id`) disagreed on that block, a consumer would price the same admission differently
     * depending on which part it read. Same structural reason as `uniqueEventIds`/D011: only the
     * feed root can see two sibling events at once.
     *
     * Compared by VALUE, not by serialized text (`deepEqualJson`): array order is significant
     * (offers are an ordered list, like `image[]`/`organizers`), object member order is not,
     * numbers compare as JSON values (`45` === `45.0` after parse), strings compare exactly (no
     * case folding, no URI normalization — D011's discipline), and `null` is treated as absent.
     * Parts that OMIT `partOf.offers` are allowed (a part may be described before its price is
     * set); the recommended profile flags the "some carry it, some don't" case, this keyword only
     * forbids an outright contradiction between the ones that DO carry it.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data.events)) return true;
      const bySet = new Map();
      for (const event of data.events) {
        const setId = event?.partOf?.id;
        const offers = event?.partOf?.offers;
        if (typeof setId !== "string" || offers === undefined) continue;
        if (!bySet.has(setId)) bySet.set(setId, offers);
        else if (!deepEqualJson(bySet.get(setId), offers)) return false;
      }
      return true;
    },
    error: {
      message:
        "every part of a multi-part set (same partOf.id) that carries partOf.offers must carry the same block",
    },
  },
  {
    keyword: "languagesCoveredByText",
    type: "object",
    schemaType: "boolean",
    /**
     * `event.recommended.schema.json`'s own constraint: `languages` (what is SPOKEN at the event)
     * says nothing about whether the event's own text is available in each of those languages —
     * a bilingual session described in only one of them is valid by design (`$defs.event`'s own
     * `languages` description gives exactly that example). But it is a discoverability gap worth
     * a warning: someone who only reads a language in `languages` with no matching text has
     * nothing to read. "Available text" is the effective `textLanguage` (own, or the feed's via
     * `asPublished` in `scripts/validate.mjs` — this keyword itself only ever sees whichever value
     * is already on `data`, exactly like `distinctTranslationLanguages`) plus every key of the
     * event's own `translations` — never a nested translations map (`offers[]`, `image[]`, …),
     * which translates a different piece of text, not the event's main name/description.
     * Comparison is case-insensitive, exact BCP 47 tags only (RFC 5646 §2.1.1) — no attempt to
     * treat a region- or script-qualified tag as covering its bare language, matching the same
     * mechanical, explainable precision D007 already chose for tag validation itself. If there is
     * no available text at all (no effective `textLanguage`, no `translations`), this stays
     * silent rather than warn: `README.md`'s own reasoning for why `textLanguage` is not
     * recommended on its own (an `.ics` importer never has it, and inventing one is worse than
     * omitting it) would otherwise be defeated by the back door. See docs/history/CHANGES.log #P019 /
     * DECISIONS.md D019.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data.languages)) return true;
      const available = new Set();
      if (typeof data.textLanguage === "string") available.add(data.textLanguage.toLowerCase());
      if (data.translations && typeof data.translations === "object") {
        for (const key of Object.keys(data.translations)) available.add(key.toLowerCase());
      }
      if (available.size === 0) return true;
      return data.languages.every(
        (lang) => typeof lang !== "string" || available.has(lang.toLowerCase())
      );
    },
    error: { message: "languages should be covered by the effective textLanguage or a translations key" },
  },
  {
    keyword: "distinctLanguageTags",
    type: "array",
    schemaType: "boolean",
    /**
     * `languages`' own constraint: `uniqueItems` already rejects a byte-identical repeat, but RFC
     * 5646 §2.1.1 compares BCP 47 tags case-insensitively, so ["es","ES"] names the same spoken
     * language twice under a JSON-distinct pair of strings — the same contradiction
     * `distinctTranslationLanguages`/D010 and its D023 extension already treat as invalid for
     * `translations` keys, applied here to the other field sharing `$defs.languageTag`. Deliberately
     * narrow, same boundary as D010/D023: detects only the same tag written with different case,
     * never infers that two DIFFERENT tags (a regional variant, an alias, a macrolanguage) name the
     * same language — "pt" and "pt-BR" stay distinct. Lives on the `languages` property itself, not
     * the whole event object, so a failure reports at `/languages` without needing the
     * `OBJECT_KEYWORD_FIELD` lookup `languagesCoveredByText` needed. See docs/history/CHANGES.log #P031 /
     * DECISIONS.md D028.
     */
    validate: (schemaValue, data) => {
      if (!schemaValue || !Array.isArray(data)) return true;
      const tags = data.filter((lang) => typeof lang === "string").map((lang) => lang.toLowerCase());
      return new Set(tags).size === tags.length;
    },
    error: { message: "languages must not repeat the same language tag under different case" },
  },
];
