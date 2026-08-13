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
 * Attach form defaults to a *generated* schema.
 *
 * `src/api/valibot.gen.ts` is generated from the backend's OpenAPI schema, so
 * it already knows every field, its type, and its constraints - but it cannot
 * know what a blank form should start with. A serializer has no notion of a
 * default: `nullableStr('')` (null in the database, but `''` so an input binds
 * to a string) is a UI decision with no counterpart on the wire. Generated
 * entries are therefore bare schemas with no default, and `v.getDefaults()`
 * returns `undefined` for all of them.
 *
 * So the generated schema supplies the shape and the validation, and this
 * supplies the only part that has to stay hand-written. Every entry is given a
 * default: either one inferred from the field's type (a nullable scalar `null`,
 * string `''`, number `0`, boolean `false`, array `[]`, object `{}`), or an
 * explicit one from `defaults`. The `defaults` map therefore only needs to
 * carry the fields whose default differs from what the type would suggest - a
 * country code that should start `'NL'`, a count that should start `1`, a
 * nullable string that is a form text input and must bind to `''` rather than
 * `null`, and so on.
 *
 * A `null` default also makes the entry nullable. A default of `null` is only
 * meaningful if `null` is an accepted value, and DRF sends `null` for a blank
 * nullable column even where the schema says string.
 *
 * Unknown keys are rejected: a typo'd or renamed field would otherwise sit
 * here silently defaulting nothing, which is exactly the drift this is meant
 * to prevent.
 */
export function withDefaults<S extends AnyObjectSchema>(
  schema: S,
  defaults: Record<string, unknown> = {},
): AnyObjectSchema {
  const entries: v.ObjectEntries = { ...schema.entries }

  // Reject override keys the generated schema does not have: a typo'd or
  // renamed field would otherwise sit here silently defaulting nothing, which
  // is exactly the drift this helper exists to prevent.
  for (const key of Object.keys(defaults)) {
    if (!(key in entries)) {
      throw new Error(
        `withDefaults: "${key}" is not a field of the generated schema. ` +
          'It may have been renamed or removed in the backend serializer.',
      )
    }
  }

  for (const [key, entry] of Object.entries(entries)) {
    if (key in defaults) {
      const def = defaults[key]

      entries[key] =
        def === null
          ? v.optional(v.nullable(entry as v.GenericSchema), null)
          : v.optional(entry as v.GenericSchema, def)
      continue
    }

    const inferred = inferDefault(entry as v.GenericSchema)
    if (inferred !== undefined) {
      // A `null` default is only meaningful if the entry accepts null, so an
      // inferred null (a nullable column) also wraps in v.nullable(...).
      entries[key] =
        inferred === null
          ? v.optional(v.nullable(entry as v.GenericSchema), null)
          : v.optional(entry as v.GenericSchema, inferred as never)
    }
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
