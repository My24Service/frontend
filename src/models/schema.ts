import * as v from 'valibot'

/**
 * Shared building blocks for the valibot schemas that back the model files.
 *
 * The source of truth for these schemas is the DRF *serializer* for the model,
 * not the Django model class. Serializers here always declare an explicit
 * `fields = (...)` tuple (there is no `fields = '__all__'` anywhere in the
 * backend), and they add a large number of `SerializerMethodField`s that have
 * no counterpart on the model - so the serializer is what actually describes
 * the wire format.
 *
 * Each model file defines three things from one declaration:
 *
 *   - `XSchema`      - the read shape, mirroring `XSerializer.Meta.fields`
 *   - `XWriteSchema` - what the API accepts, i.e. the read shape minus the
 *                      read-only fields (pk, timestamps, method fields)
 *   - `fields`       - the form defaults `BaseModel.getFields()` hands to
 *                      views, generated from the schema via `formFields()`
 *
 * Every entry is wrapped in `v.optional(..., <default>)` so that a) partial
 * payloads parse (DRF omits nothing, but list endpoints and nested views are
 * inconsistent enough that being forgiving on read is worth more than being
 * strict), and b) `v.getDefaults()` can reconstruct the form defaults.
 */

/** An object schema of any shape - the constraint `formFields` and the pick/omit helpers need. */
export type AnyObjectSchema = v.ObjectSchema<v.ObjectEntries, undefined>

/** Nullable in the database, but seeded as `''` in forms so inputs bind to a string. */
export const nullableStr = (def: string | null = null) =>
  v.optional(v.nullable(v.string()), def)

/** A non-nullable CharField. */
export const str = (def = '') => v.optional(v.string(), def)

/** A foreign key, serialized as its pk. */
export const fk = (def: number | null = null) =>
  v.optional(v.nullable(v.number()), def)

/** An integer field (`PositiveIntegerField`, counts from method fields, ...). */
export const int = (def = 0) => v.optional(v.number(), def)

export const bool = (def = false) => v.optional(v.boolean(), def)

/**
 * `created` / `modified` from `TimeStampedModel`.
 *
 * These are NOT ISO datetimes on the wire. `TransformDatesMixin`
 * (apps/core/rest.py) rewrites them in `to_representation` into the tenant's
 * configured `date_format` setting, so what arrives is a locale-ish display
 * string like `31-12-2025 14:03`. They are read-only in both directions -
 * `BaseModel.preInsert`/`preUpdate` strip them before sending - so they never
 * belong in a write schema.
 */
export const timestamp = () => v.optional(v.nullable(v.string()), null)

/**
 * A DRF `DecimalField`. `COERCE_DECIMAL_TO_STRING` is left at its default, so
 * these are rendered as *strings* ("12.00") on read even though forms tend to
 * seed them with a number. Accepts either rather than lying about one.
 */
export const decimal = (def: string | number = 0) =>
  v.optional(v.union([v.string(), v.number()]), def)

/**
 * A nested object serialized by another serializer (`material_view` and
 * friends). Left loose until the model it mirrors is itself migrated, at which
 * point this should be replaced by that model's schema.
 *
 * The default is a factory so each caller gets its own object rather than
 * sharing one mutable literal.
 */
export const view = () =>
  v.optional(v.record(v.string(), v.unknown()), () => ({}))

/**
 * Build the plain-object form defaults that `BaseModel.fields` expects.
 *
 * This is the whole point of deriving `fields` from the schema: the field list
 * is declared once, and the defaults handed to a form can no longer drift from
 * the shape we claim to parse.
 */
export function formFields(schema: AnyObjectSchema): Record<string, any> {
  return v.getDefaults(schema) as Record<string, any>
}

/**
 * The read shape minus the given read-only keys - the write schema.
 */
export function writeSchema<S extends AnyObjectSchema, const K extends v.ObjectKeys<S>>(
  schema: S,
  readOnly: K,
) {
  return v.omit(schema, readOnly)
}

/**
 * The subset of a schema a form actually binds to, plus any client-only fields
 * that never travel to or from the API.
 *
 * Several existing `fields` dicts carry keys the serializer does not have
 * (`new_status`, `location_name`, ...). Those are genuine UI state, so they are
 * declared explicitly here rather than being quietly smuggled into the read
 * schema and making it wrong.
 */
export function formSchema<S extends AnyObjectSchema, const K extends v.ObjectKeys<S>>(
  schema: S,
  keys: K,
  clientOnly: v.ObjectEntries = {},
) {
  return v.object({ ...v.pick(schema, keys).entries, ...clientOnly })
}

/** Throwing parse - use when a malformed payload should be treated as a bug. */
export function parseModel<S extends AnyObjectSchema>(schema: S, data: unknown): v.InferOutput<S> {
  return v.parse(schema, data)
}

/** Non-throwing parse, for call sites that want to degrade rather than fail. */
export function safeParseModel<S extends AnyObjectSchema>(schema: S, data: unknown) {
  return v.safeParse(schema, data)
}
