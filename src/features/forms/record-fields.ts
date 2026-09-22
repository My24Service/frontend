import * as v from 'valibot'

/**
 * The fields a request schema declares, as a record holds them — what an edit
 * form opens on. The keys come from the schema's own entries, so a read-only
 * companion the record carries (`id`, `created`, a `*_currency`, a rating)
 * never lands on the form; a null on the read is "no value" and does not ride
 * either, so an untouched field stays off the write. A form that treats null
 * as a state of its own (a picker's "none") sets that field after this.
 *
 * Spread it over the form's `empty()` so the required fields keep their
 * blanks when the record leaves them out.
 */
export function fieldsFromRecord<S extends v.GenericSchema & { entries: object }>(
  schema: S,
  record: object,
): Partial<v.InferInput<S>> {
  const fields: Record<string, unknown> = {}
  const source = record as Record<string, unknown>
  for (const key of Object.keys(schema.entries)) {
    if (source[key] != null) fields[key] = source[key]
  }
  return fields
}
