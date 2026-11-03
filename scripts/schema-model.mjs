/**
 * Reads the JSON Schemas and derives the field model the docs are built from.
 *
 * The schema is the single source of truth for everything factual about a field: its name,
 * type, whether it is required, its allowed values and its examples. Prose that a validator
 * cannot check (why `id` must never change, why a cancelled event stays published) is NOT
 * here — it is hand-written, and marked as such in the docs.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { customKeywords } from "../index.js";

/**
 * Every published spec version, newest last, read from the filesystem rather than hand-kept.
 * There were four separate copies of this list before — two VERSIONS arrays and two hardcoded
 * paths — and the hardcoded ones were still pointing at v0.4 long after v0.5 shipped, so
 * regenerating an enum rewrote a frozen version instead of the one under development. A list
 * that cannot be forgotten is the fix.
 */
export function publishedVersions(specDir = new URL("../spec/", import.meta.url)) {
  return readdirSync(specDir)
    .filter((name) => /^v\d+\.\d+$/.test(name))
    .sort((a, b) => {
      const [aMajor, aMinor] = a.slice(1).split(".").map(Number);
      const [bMajor, bMinor] = b.slice(1).split(".").map(Number);
      return aMajor - bMajor || aMinor - bMinor;
    });
}

/** The version under development: the highest published one. */
export function latestVersion() {
  return publishedVersions().at(-1);
}


/**
 * Object-level rules that live outside JSON Schema entirely — a boolean flag
 * (`"orderedDates": true`) that `index.js`'s `customKeywords` gives real validation logic, not a
 * shape `rulesOfObject` can parse. Their `error.message` is already written for a human (it is
 * what a validator prints), so it is reused here as the rule's English text instead of
 * duplicating a second hand-written sentence that could drift from the one Ajv actually reports.
 */
const CUSTOM_KEYWORD_MESSAGES = new Map(customKeywords.map((k) => [k.keyword, k.error.message]));

/**
 * Adds a trailing period without capitalizing: several of these messages start with a field
 * name (`endDate must not be earlier than startDate`), and capitalizing "endDate" into "EndDate"
 * would misspell it. The existing schema-authored prose in this same Constraints section already
 * does the same — see "startDate and endDate must be of the same form" — so this matches
 * established style, not introduces a new one.
 */
function asSentence(message) {
  return message.endsWith(".") ? message : `${message}.`;
}

/** Resolves a local (#/$defs/x) or remote-by-$id ($id#/$defs/x) reference. */
function resolve(ref, self, registry) {
  const [base, pointer] = ref.split("#");
  const schema = base ? registry[base] : self;
  if (!schema || !pointer) return undefined;
  return pointer
    .split("/")
    .filter(Boolean)
    .reduce((acc, key) => acc?.[key.replace(/~1/g, "/").replace(/~0/g, "~")], schema);
}

/**
 * The document a `$ref` was written from — needed before resolving a SECOND, local ref found
 * inside whatever the first one pointed to. `feed.schema.json`'s `translations` field is a
 * remote ref into `event.schema.json#/$defs/feedTranslations`, and THAT object's own
 * `additionalProperties` is a local ref (`#/$defs/feedTranslation`) written from
 * `event.schema.json`'s perspective — resolving it against `feed.schema.json` (the caller's
 * original `schema`) would look for `$defs.feedTranslation` in the wrong file and silently find
 * nothing. `resolve()` itself gets this right for the first hop (`registry[base]` when `ref` is
 * remote); this mirrors that same base-selection so a second hop inherits the correct home.
 */
function homeOf(ref, fallback, registry) {
  if (!ref) return fallback;
  const [base] = ref.split("#");
  return base ? (registry[base] ?? fallback) : fallback;
}

/**
 * The branches an array item may take. One entry for a plain `items`, several when the item is
 * a `oneOf` — `image` accepts a bare URL string or an object that adds alt text, and a docs
 * table that showed only one of the two would document a form nobody can write.
 */
function itemBranches(items, self, registry) {
  if (!items) return [];
  const branches = items.oneOf ?? items.anyOf ?? [items];
  return branches.map((branch) => (branch.$ref ? resolve(branch.$ref, self, registry) : branch));
}

/** Human-readable type, e.g. "string (uri)", "enum: online | hybrid", "string[]", "(string | object)[]". */
function typeOf(subschema, self, registry) {
  const s = subschema.$ref ? { ...resolve(subschema.$ref, self, registry), ...subschema } : subschema;
  if (s.const !== undefined) return `const: ${JSON.stringify(s.const)}`;
  if (s.enum) return `enum: ${s.enum.join(" | ")}`;
  if (s.type === "array") {
    const kinds = [...new Set(itemBranches(s.items, self, registry).map((b) => b?.type ?? "object"))];
    return kinds.length > 1 ? `(${kinds.join(" | ")})[]` : `${kinds[0] ?? "object"}[]`;
  }
  if (s.anyOf) return s.type ?? "string";
  if (s.type === "object" || s.properties) return "object";
  return s.format ? `${s.type} (${s.format})` : (s.type ?? "—");
}

/**
 * Walks a schema's fields, following local $refs into sub-objects.
 * Yields [dottedPath, subschema, meta] — e.g. ["location.venue", {...}, { required, type }].
 *
 * `homeId` is the `$id` a field's `pointer` should resolve against — normally `schema.$id`, the
 * schema this whole call started from. It only ever changes for a map recursed into via
 * `additionalProperties` whose value shape lives in a DIFFERENT schema than the one currently
 * being walked (`feed.translations.*` points into `event.schema.json`'s `$defs.feedTranslation`,
 * while `schema` here is still `feed.schema.json`) — every `pointer` this function yields is
 * fully qualified with it for exactly that reason: a caller combining it with the WRONG schema's
 * `$id` (as `validate.mjs` used to, before this) resolves nothing and Ajv throws `missingRef`.
 */
export function* fieldsOf(schema, registry = {}, node = null, prefix = "", basePointer = null, homeId = schema.$id) {
  const isEvent = Boolean(schema.$defs?.event);
  const root = node ?? schema.$defs?.event ?? schema;
  const pointer = basePointer ?? (isEvent ? "/$defs/event" : "");
  const required = new Set([
    ...(root.required ?? []),
    // The top-level allOf adds what a standalone document must carry (specVersion, license).
    ...(prefix ? [] : (schema.allOf ?? []).flatMap((branch) => branch.required ?? [])),
  ]);

  for (const [name, raw] of Object.entries(root.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const target = raw.$ref ? resolve(raw.$ref, schema, registry) : raw;
    const subschema = { ...target, ...raw };

    yield [
      path,
      subschema,
      {
        required: required.has(name),
        type: typeOf(raw, schema, registry),
        description: subschema.description ?? "",
        examples: subschema.examples ?? [],
        enum: subschema.enum,
        // The value a consumer must assume when the field is absent. Read from the schema so the
        // description never has to say it: a default written in prose is a default a renderer
        // cannot show, cannot translate consistently, and cannot be trusted to match the schema.
        // `undefined` is the honest answer for most fields — absent means unknown, not a value.
        default: subschema.default,
        // The feed field this one falls back to inside a feed (`event.license` → `feed.license`).
        // A default that is not a literal: no standard keyword can say it, so the schemas carry
        // it as an annotation and the renderers read it from there instead of from prose.
        inheritsFrom: subschema["x-inheritsFrom"],
        // Fully-qualified pointer ($id + fragment) into the schema that actually defines this
        // field, so a validator can compile it by reference instead of in isolation (an isolated
        // copy cannot resolve #/$defs/… refs, and a bare fragment resolved against the wrong
        // schema's $id resolves nothing at all — see `homeId` above).
        pointer: `${homeId}#${pointer}/properties/${name}`,
      },
    ];

    const targetPointer = raw.$ref?.startsWith("#") ? raw.$ref.slice(1) : `${pointer}/properties/${name}`;

    // Recurse into sub-objects (location, source) so their fields are documented too.
    if (target?.properties) {
      yield* fieldsOf(schema, registry, target, path, targetPointer, homeId);
    }

    // Same for arrays of objects (organizers): `organizers[].name` is a field people need
    // documented, and it is the schema — not prose — that knows it exists.
    // Only within the owning schema: `feed.events[]` and `feed.organizers[]` point at the
    // EVENT schema, and inlining them here would document the whole event twice — once as
    // itself, once nested under the feed. Each field is documented where it is defined.
    // An item may also be a `oneOf` of forms (image: a bare URL, or an object with alt); the
    // object branch is the one that carries fields, and it is the one that gets documented.
    if (target?.type === "array") {
      const forms = target.items?.oneOf ?? target.items?.anyOf ?? [target.items];
      for (const [index, form] of forms.entries()) {
        const itemRef = form?.$ref;
        const isLocal = !itemRef || itemRef.startsWith("#");
        const items = itemRef ? resolve(itemRef, schema, registry) : form;
        if (!isLocal || !items?.properties) continue;
        const branch = target.items?.oneOf || target.items?.anyOf ? `/${index}` : "";
        const itemPointer = itemRef
          ? itemRef.slice(1)
          : `${targetPointer}/items${branch ? `/oneOf${branch}` : ""}`;
        yield* fieldsOf(schema, registry, items, `${path}[]`, itemPointer, homeId);
      }
    }

    // Same for maps of objects (every `translations` shape in the schema): each entry is keyed
    // by a language tag, never a fixed name, so `.* ` is the stable path its OWN fields get
    // documented under — distinct from `[]`'s "any array index", the same distinction the wire
    // format itself makes (a map's key is data an event/feed chooses; an array's index is not).
    // Unlike the array branch above, a remote `target` (`feed.translations` points into
    // event.schema.json) is still expanded: nothing else documents a translation entry's own
    // fields, so there is no "already shown elsewhere" reason to stop at the map itself.
    if (target?.additionalProperties && typeof target.additionalProperties === "object") {
      const apRef = target.additionalProperties.$ref;
      const apHome = homeOf(raw.$ref, schema, registry);
      const values = apRef ? resolve(apRef, apHome, registry) : target.additionalProperties;
      if (values?.properties) {
        const apPointer = apRef ? apRef.slice(1) : `${targetPointer}/additionalProperties`;
        // `apHome`, not `schema`: any further local refs inside the map's value shape (and the
        // pointer this yields) belong to the schema that actually defines it, which may not be
        // the one this call started from.
        yield* fieldsOf(apHome, registry, values, `${path}.*`, apPointer, apHome.$id);
      }
    }
  }
}

/* ---------- the constraints that are not a plain `required` ---------- */

/**
 * A schema enforces more than "this field must be there": `location` needs a venue OR an
 * onlineUrl, a non-zero `price` drags `currency` in with it, an `image` that carries
 * translations must carry the `alt` they translate. Those rules are as normative as
 * `required` and were invisible in the docs — a reference that shows every field as
 * "optional" while the validator rejects the document is worse than no reference.
 *
 * Each rule is yielded STRUCTURED (a kind plus the field names it talks about), never as a
 * sentence: the phrasing belongs to whoever renders it, in whichever language. The branch's
 * own `description`, when the schema author wrote one, travels along as `note` — it is the
 * rationale, and no generated sentence can replace it.
 */

/** What an `if` looks at, as far as we can name it: a value, a bound, or mere presence. */
function conditionOf(when) {
  const required = when?.required ?? [];
  if (required.length !== 1) return null; // more than one antecedent: not phrasable, skip
  const field = required[0];
  const sub = when?.properties?.[field];
  if (sub?.const !== undefined) return { field, equals: sub.const };
  if (sub?.exclusiveMinimum !== undefined) return { field, above: sub.exclusiveMinimum };
  if (sub?.minimum !== undefined) return { field, atLeast: sub.minimum };
  return { field, present: true };
}

/** The rules an `if`/`then` branch states, if we can name them. */
function conditionalRules(branch) {
  const when = conditionOf(branch.if);
  if (!when) return [];
  const rules = [];
  for (const name of branch.then?.required ?? []) {
    rules.push({ kind: "conditional", when, field: name, note: branch.description });
  }
  for (const [name, sub] of Object.entries(branch.then?.properties ?? {})) {
    if (sub?.not?.const !== undefined) {
      rules.push({ kind: "conditionalNot", when, field: name, value: sub.not.const, note: branch.description });
    }
  }
  return rules;
}

/** The rules one object states about itself. `node` is already $ref-resolved. */
function rulesOfObject(node) {
  const rules = [];

  // `anyOf` whose every branch is a bare `required`: "at least one of these".
  const branches = node.anyOf ?? [];
  const asRequired = branches.every((b) => Object.keys(b).every((k) => k === "required" || k === "description"));
  if (branches.length && asRequired) {
    const fields = [...new Set(branches.flatMap((b) => b.required ?? []))];
    if (fields.length) {
      rules.push({
        kind: "anyOfRequired",
        fields,
        note: branches.map((b) => b.description).find(Boolean),
      });
    }
  }

  for (const [when, then] of Object.entries(node.dependentRequired ?? {})) {
    rules.push({ kind: "dependent", when: { field: when, present: true }, fields: then });
  }

  if (node.minProperties) rules.push({ kind: "minProperties", min: node.minProperties });

  // Custom keywords (`"orderedDates": true`, `"uniqueEventIds": true`, …) are real validity
  // rules with no JSON Schema shape at all — a boolean flag `rulesOfObject` could otherwise only
  // ignore. Emit one for each that this object actually declares, reusing the message the
  // validator itself reports rather than a second hand-written sentence that could drift from it.
  for (const [name, message] of CUSTOM_KEYWORD_MESSAGES) {
    if (node[name] === true) rules.push({ kind: "prose", note: asSentence(message) });
  }

  for (const branch of [node, ...(node.allOf ?? [])]) {
    if (branch?.if) rules.push(...conditionalRules(branch));
  }

  // A branch we cannot phrase still has to be readable: if its author explained it, the
  // explanation IS the rule. Silently dropping it is how the docs drifted in the first place.
  // `node` itself only joins this set when IT is a conditional block (has its own `if`), the
  // same criterion the `conditionalRules` loop above uses — `constraintsOf`'s "wrapping"
  // branches (the standalone document's own top-level `allOf`, outside `$defs.event`) pass an
  // if/then block straight in as `node`, never nested inside some other object's `allOf`. An
  // ordinary object (no `if` of its own) must NOT be swept in here: its plain `description` is
  // already shown in the field table and is not a "rule".
  for (const branch of [...(node.if ? [node] : []), ...(node.allOf ?? [])]) {
    const named = branch.if ? conditionalRules(branch).length : 0;
    if (!named && branch.description) rules.push({ kind: "prose", note: branch.description });
  }
  for (const key of ["oneOf", "anyOf"]) {
    if (key === "anyOf" && asRequired) continue;
    for (const branch of node[key] ?? []) {
      if (branch.description) rules.push({ kind: "prose", note: branch.description });
    }
  }

  return rules;
}

/**
 * Walks a schema the way `fieldsOf` does, yielding [ownerPath, rule] — the owner being the
 * object the rule constrains, `""` for the document itself. Same traversal, so a rule cannot
 * end up hanging off an object the field table does not show.
 */
export function* constraintsOf(schema, registry = {}, node = null, prefix = "") {
  const root = node ?? schema.$defs?.event ?? schema;
  // The document itself: its own rules, plus the ones the wrapping allOf adds ($ref branches
  // carry no rules of their own, and their `required` is already the field table's business).
  const wrapping = prefix || root === schema ? [] : (schema.allOf ?? []).filter((b) => !b.$ref);
  const own = [...rulesOfObject(root), ...wrapping.flatMap(rulesOfObject)];
  for (const rule of own) yield [prefix, rule];

  for (const [name, raw] of Object.entries(root.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    const target = raw.$ref ? resolve(raw.$ref, schema, registry) : raw;
    if (target?.properties) yield* constraintsOf(schema, registry, target, path);
    if (target?.type === "array") {
      // A custom keyword can sit directly on the array property itself (P031's
      // `distinctLanguageTags` on `languages`), not just on its item shape — `rulesOfObject`
      // already checks generically for `node[name] === true`, so it works unchanged on an array
      // node too (arrays never have `anyOf`/`dependentRequired`/`minProperties`/`if`, so every
      // other branch inside it is a no-op here by construction, not by a second special case).
      for (const rule of rulesOfObject(target)) yield [path, rule];
      const forms = target.items?.oneOf ?? target.items?.anyOf ?? [target.items];
      for (const form of forms) {
        const itemRef = form?.$ref;
        if (itemRef && !itemRef.startsWith("#")) continue;
        const items = itemRef ? resolve(itemRef, schema, registry) : form;
        if (!items?.properties) continue;
        yield* constraintsOf(schema, registry, items, `${path}[]`);
      }
    }
    // Same set as `fieldsOf`'s map branch, same reason: a map's value shape can carry its own
    // rules (P024's `anyOf` on a translation entry) that must not go missing just because the
    // map's keys are language tags instead of fixed names. Same cross-schema fix too — see
    // `homeOf`'s own comment.
    if (target?.additionalProperties && typeof target.additionalProperties === "object") {
      const apRef = target.additionalProperties.$ref;
      const apHome = homeOf(raw.$ref, schema, registry);
      const values = apRef ? resolve(apRef, apHome, registry) : target.additionalProperties;
      if (values?.properties) yield* constraintsOf(apHome, registry, values, `${path}.*`);
    }
  }
}

/**
 * The fields a recommended profile asks for, as a Set of dotted paths.
 *
 * The profile is a plain JSON Schema whose `allOf` branches carry `required` — including the
 * conditional ones (`if`/`then`), which are recommendations too: `endDate` is recommended for a
 * timed event and pointless for an all-day one, and the docs must still show it as recommended.
 * A branch may also ask for a field one level down (`location.address`), so `required` nested
 * under `properties` counts the same. Read from the profile, never re-typed: a list of field
 * names written twice is a list that drifts.
 */
export function recommendedOf(profile) {
  if (!profile) return new Set();
  // A conditional recommendation can also live one level deeper, inside an array property's own
  // `items` (P033's `offers[].name`, recommended only once `offers[].translations` exists) —
  // same `${parent}[].${name}` path fieldsOf() already uses for these fields' own table rows.
  const nested = (branch) =>
    Object.entries(branch?.properties ?? {}).flatMap(([parent, sub]) => [
      ...(sub?.required ?? []).map((name) => `${parent}.${name}`),
      ...(sub?.items?.then?.required ?? []).map((name) => `${parent}[].${name}`),
    ]);
  const names = (branch) => [
    ...(branch?.required ?? []),
    ...nested(branch),
    ...(branch?.then?.required ?? []),
    ...nested(branch?.then),
  ];
  return new Set([...names(profile), ...(profile.allOf ?? []).flatMap(names)]);
}

export function loadSchemas(version = "v0.1", dir = "spec") {
  const event = JSON.parse(readFileSync(join(dir, version, "event.schema.json"), "utf8"));
  const feed = JSON.parse(readFileSync(join(dir, version, "feed.schema.json"), "utf8"));
  const registry = { [event.$id]: event, [feed.$id]: feed };

  // Recommended profiles arrive in v0.3; v0.1 and v0.2 are frozen without them.
  const profile = (name) => {
    const path = join(dir, version, `${name}.recommended.schema.json`);
    if (!existsSync(path)) return null;
    const schema = JSON.parse(readFileSync(path, "utf8"));
    registry[schema.$id] = schema;
    return schema;
  };
  const profiles = { event: profile("event"), feed: profile("feed") };

  return { event, feed, profiles, registry };
}
