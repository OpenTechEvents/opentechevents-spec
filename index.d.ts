/** The spec version these schemas describe. Matches the `specVersion` field of a document. */
export declare const specVersion: "0.1.0";

/** JSON Schema (draft 2020-12) of a single OTE event. */
export declare const eventSchema: Record<string, unknown>;

/** JSON Schema (draft 2020-12) of an OTE feed. */
export declare const feedSchema: Record<string, unknown>;

/**
 * Both schemas, in the order a validator needs them: the feed references the event by $id,
 * so the event schema must be registered first.
 */
export declare const schemas: Record<string, unknown>[];
