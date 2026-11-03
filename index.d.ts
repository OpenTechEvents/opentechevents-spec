/** The spec version these schemas describe. Matches the `specVersion` field of a document. */
export declare const specVersion: "0.5.0";

/** JSON Schema (draft 2020-12) of a single OTE event. */
export declare const eventSchema: Record<string, unknown>;

/** JSON Schema (draft 2020-12) of an OTE feed. */
export declare const feedSchema: Record<string, unknown>;

/**
 * Both schemas, in the order a validator needs them: the feed references the event by $id,
 * so the event schema must be registered first.
 */
export declare const schemas: Record<string, unknown>[];

/**
 * Quality profiles, NOT validity: a document that fails one is still a valid OTE document.
 * They list the fields that decide whether an event can be found, filtered and subscribed to.
 * Report their failures as warnings; never reject a document for them. Both reference the base
 * schemas by $id, so register `schemas` first.
 */
export declare const eventRecommendedSchema: Record<string, unknown>;
export declare const feedRecommendedSchema: Record<string, unknown>;
export declare const recommendedSchemas: Record<string, unknown>[];

/**
 * The ajv options these schemas compile under — the ONE set this package tests against.
 * Pass it whole; a consumer who assembles their own set is on their own:
 *
 *   const ajv = new Ajv2020({ ...ajvOptions, allErrors: true });
 *
 * `strictRequired: false` is not a concession, it is the point: the schemas express three rules
 * (`anyOf` of `required`, an `if` that only triggers on a field, a `required` about a nested
 * object) as valid draft 2020-12 that ajv's strict mode nonetheless refuses to compile. No OTE
 * schema, in any version from v0.1 on, has ever compiled under a bare `strict: true`.
 * Everything else stays strict on purpose: an unknown keyword or an unregistered format is a
 * real mistake, which is what `annotationKeywords`/`customFormats`/`customKeywords` are for.
 */
export declare const ajvOptions: { strict: true; strictRequired: false };

/**
 * Annotation keywords the schemas carry, with the meta-schema each one's value obeys.
 * They constrain nothing — a validator that ignores them accepts exactly the same documents.
 * `x-inheritsFrom` names the FEED field an event field falls back to when it omits its own.
 * Ajv under `ajvOptions` refuses to compile a schema carrying one, so register them first:
 * `for (const kw of annotationKeywords) ajv.addKeyword(kw);`
 */
export declare const annotationKeywords: { keyword: string; metaSchema: Record<string, unknown> }[];

/**
 * Formats the schemas use beyond what ajv-formats provides. Ajv under `ajvOptions` refuses to
 * compile a schema referencing an unregistered format, so register them first:
 * `for (const f of customFormats) ajv.addFormat(f.name, f.validate);`
 */
export declare const customFormats: { name: string; validate: (value: string) => boolean }[];

/**
 * Keywords the schemas use that DO restrict which documents pass — unlike `annotationKeywords`.
 * Ajv under `ajvOptions` refuses to compile a schema referencing an unregistered keyword, so
 * register them first: `for (const kw of customKeywords) ajv.addKeyword(kw);`
 */
export declare const customKeywords: {
  keyword: string;
  type: string;
  schemaType: string;
  validate: (schemaValue: unknown, data: Record<string, unknown>) => boolean;
  error: { message: string };
}[];
