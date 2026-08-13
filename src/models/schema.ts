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
 *   - `XSchema`      - the read shape, mirroring `XSerializer.Meta.fields`,
 *                      made tolerant of partial payloads with `lenient()`
 *   - `XWriteSchema` - what the API accepts, i.e. the read shape minus the
 *                      read-only fields (pk, timestamps, method fields), with
 *                      the serializer's `required` left intact
 *   - `fields`       - the form defaults `BaseModel.getFields()` hands to
 *                      views, built by `formDefaults()`
 *
 * Form defaults are a plain object, never stored in the schema. A default is a
 * UI decision ("a blank form starts here") and a schema is a wire contract
 * ("the API sends this"); the two disagree often enough - a required field the
 * form has not filled in, a non-nullable column the form holds as null - that
 * letting one edit the other made both wrong. `lenient()` and `widenNullable()`
 * are the two deliberate, separately-stated ways a schema may be loosened.
 */

/** An object schema of any shape - the constraint `formDefaults` and the pick/omit helpers need. */
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
 * A reasonable blank-form default for a field, derived from its generated type.
 * A nullable scalar defaults to `null` - its true "no value"; a non-nullable
 * string/number/boolean defaults to `''`/`0`/`false`. Returns a factory (never
 * a shared literal) for anything mutable, so each `v.getDefaults()` call hands
 * back a fresh array/object.
 *
 * Returns `undefined` for types with no obvious single default (`union`,
 * `unknown`, ...) - those have no inferred default and must stay explicit.
 */
function inferDefault(entry: v.GenericSchema): unknown {
  let nullable = false
  let s: v.GenericSchema = entry
  for (;;) {
    const t = s?.type
    // `optional`/`nullable`/`nullish` expose the wrapped schema; a `pipe`
    // reports its wrapped type directly (a pipe around a string has
    // `type: 'string'`), so only the three wrappers need recursing. Only the
    // wrappers carry `wrapped`; it is not on GenericSchema. `optional` is not
    // nullability - the value is just not required - so it does not flip the
    // flag.
    if (t === 'optional' || t === 'nullable' || t === 'nullish') {
      if (t !== 'optional') nullable = true
      s = (s as { wrapped?: v.GenericSchema }).wrapped as v.GenericSchema
      continue
    }
    switch (t) {
      case 'string':
        return nullable ? null : ''
      case 'number':
        return nullable ? null : 0
      case 'boolean':
        return nullable ? null : false
      case 'array':
        return () => []
      case 'object':
      case 'record':
        return () => ({})
      default:
        return undefined
    }
  }
}

/**
 * The blank-form values for a schema's fields, as a plain object.
 *
 * This is what `BaseModel.fields` wants, and deriving it here rather than
 * baking the values into the schema is the point: a form default and a wire
 * contract are different claims, and storing one inside the other forces them
 * to agree when they shouldn't.
 *
 * The concrete case: `OrderCreateSerializer` requires `order_type`, and a blank
 * form has not chosen one. Expressing that as a schema default means
 * `v.optional(entry, null)`, which does not typecheck unless the entry is
 * widened with `v.nullable(...)` - so the form's "not filled in yet" silently
 * became the write schema's "the API accepts null here". It does not, and a
 * write schema that has been pre-weakened this way cannot be used to validate a
 * submission later. Returning a plain object keeps the two apart: a field can
 * default to `null` and still be required.
 *
 * Precedence per field:
 *
 *   1. an explicit value in `overrides` - a country code that starts 'NL', a
 *      count that starts 1, anything the type cannot imply;
 *   2. a default the entry already carries - form-only entries declared with
 *      `v.optional(v.date(), () => nextWorkingDay())` and friends;
 *   3. one inferred from the generated type (see `inferDefault`).
 *
 * Unknown `overrides` keys throw. Note this checks *hand-written source against
 * the generated field list* at module-evaluation time - it never sees an API
 * response or a form payload. A field renamed in the backend therefore fails
 * loudly on import instead of silently defaulting nothing, which is the drift
 * this whole migration exists to prevent.
 */
export function formDefaults(
  schema: AnyObjectSchema,
  overrides: Record<string, unknown> = {},
): Record<string, any> {
  const entries = schema.entries

  for (const key of Object.keys(overrides)) {
    if (!(key in entries)) {
      throw new Error(
        `formDefaults: "${key}" is not a field of the schema. ` +
          'It may have been renamed or removed in the backend serializer.',
      )
    }
  }

  const existing = v.getDefaults(schema) as Record<string, unknown> | undefined
  const result: Record<string, any> = {}

  for (const [key, entry] of Object.entries(entries)) {
    if (key in overrides) {
      result[key] = overrides[key]
      continue
    }

    const own = existing?.[key]
    if (own !== undefined) {
      result[key] = own
      continue
    }

    const inferred = inferDefault(entry as v.GenericSchema)
    // A factory keeps each caller's array/object its own, exactly as it does
    // when stored in the schema - so call it rather than handing back the
    // function.
    result[key] = typeof inferred === 'function' ? (inferred as () => unknown)() : inferred
  }

  return result
}

/**
 * Every field optional, so a partial payload parses.
 *
 * Separate from `formDefaults` on purpose. Optionality is a statement about the
 * payload - DRF omits nothing, but list endpoints and nested views are
 * inconsistent enough that being forgiving on read is worth more than being
 * strict. It says nothing about what a blank form starts with, and unlike the
 * old `withDefaults` it does not smuggle a default in alongside.
 *
 * Read schemas only. A write schema wants the generated `required` intact.
 */
export function lenient<S extends AnyObjectSchema>(schema: S) {
  return v.partial(schema)
}

/**
 * Widen the named fields to accept `null`.
 *
 * For fields the API genuinely renders as null while the generated schema
 * claims otherwise - i.e. a backend annotation that is missing. Every call is a
 * known bug in the OpenAPI schema, so keep the key lists short and name the
 * gap; the fix belongs in the serializer, and this list should shrink to
 * nothing.
 *
 * Do NOT use this to make a blank form parse - that is `formDefaults`, which
 * needs no schema change at all.
 */
export function widenNullable<S extends AnyObjectSchema>(schema: S, keys: readonly string[]) {
  const entries: v.ObjectEntries = { ...schema.entries }

  for (const key of keys) {
    const entry = entries[key]
    if (!entry) {
      throw new Error(
        `widenNullable: "${key}" is not a field of the schema. ` +
          'It may have been renamed or removed in the backend serializer.',
      )
    }
    entries[key] = v.nullable(entry as v.GenericSchema)
  }

  return v.object(entries)
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
