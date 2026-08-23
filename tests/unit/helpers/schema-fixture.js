import { faker } from '@faker-js/faker'

/**
 * Build an object that satisfies a generated valibot schema, with faker
 * filling in the values.
 *
 * Needed because the generated SDK validates responses. A fake backend can no
 * longer answer with the four fields a test happens to assert on — the whole
 * envelope is parsed against the generated component first, and a fixture
 * missing `user_order_available_set_count` fails before the component under
 * test sees anything. That is the validation doing its job (a fixture that
 * would not come out of DRF is not a fixture), but hand-writing 45 fields per
 * test is not the way to pay for it.
 *
 * The two halves come from different places, deliberately:
 *
 *   which fields, and of what type   the generated schema, walked here
 *   what value goes in them          faker
 *
 * So a field added to a serializer appears in every fixture at the next
 * `npm run codegen`, with no test edited; and the values look like data rather
 * than like `''`, which makes a failure message readable. Tests override only
 * the fields they assert on.
 *
 * Faker is seeded per fixture-building call, so a test run is reproducible: a
 * failure can be re-run and gives the same fixture. Bump `seed()` only
 * deliberately.
 */

/** Strip `optional`/`nullable`/`nullish` wrappers to the schema underneath. */
function unwrap(schema) {
  let current = schema
  while (current?.wrapped) current = current.wrapped
  return current
}

/** A value satisfying `schema`, or `undefined` if the field need not be present. */
function valueFor(schema, key = '') {
  if (!schema || typeof schema !== 'object') return null

  switch (schema.type) {
    case 'optional':
    case 'exact_optional':
      return undefined
    case 'nullable':
    case 'nullish':
      // A nullable field is legal as null, and null is the honest default for
      // a fixture that has not been told what belongs there.
      return null
    case 'string':
      return stringFor(schema, key)
    case 'number':
      return faker.number.int({ min: 1, max: 1000 })
    case 'boolean':
      return faker.datatype.boolean()
    case 'array':
      // Empty: a nested list is its own fixture, and generating rows nobody
      // asked for would make every assertion depend on faker's output.
      return []
    case 'object':
    case 'strict_object':
    case 'loose_object':
      return fixtureFor(schema)
    case 'literal':
      return schema.literal
    case 'picklist':
      return faker.helpers.arrayElement(schema.options)
    case 'enum':
      return faker.helpers.arrayElement(Object.values(schema.enum))
    case 'union':
    case 'variant':
      return valueFor(schema.options[0], key)
    case 'intersect':
      return schema.options.reduce((all, option) => ({ ...all, ...(valueFor(option, key) ?? {}) }), {})
    case 'record':
      return {}
    case 'unknown':
    case 'any':
    case 'null':
      return null
    default:
      return null
  }
}

/**
 * A string satisfying whatever format the pipe declares, and otherwise looking
 * like whatever the field name suggests.
 *
 * The pipes nest — the generator emits
 * `v.pipe(v.pipe(v.string(), v.isoTimestamp()), v.readonly())` — so the format
 * action sits one level inside the outer pipe. Reading only the top level
 * finds `readonly` and misses the constraint that actually fails.
 */
function stringFor(schema, key = '') {
  for (const action of schema.pipe ?? []) {
    if (action.pipe) {
      const nested = stringFor(action, key)
      if (nested !== null) return nested
    }

    switch (action.type) {
      case 'iso_date':
        return faker.date.soon().toISOString().slice(0, 10)
      case 'iso_date_time':
        return faker.date.soon().toISOString().slice(0, 16)
      case 'iso_timestamp':
        return faker.date.recent().toISOString().replace(/\.\d+Z$/, 'Z')
      case 'iso_time':
        return faker.date.anytime().toISOString().slice(11, 16)
      case 'email':
        return faker.internet.email()
      case 'url':
        return faker.internet.url()
      case 'uuid':
        return faker.string.uuid()
      case 'regex':
        // No general way to satisfy an arbitrary regex. The only ones in this
        // schema are DRF's DecimalField patterns, which a plain decimal
        // satisfies; anything else falls back to the empty string, which is
        // what a `v.regex` we do not understand would have got anyway.
        return [faker.finance.amount({ min: 0, max: 999, dec: 2 }), '0', ''].find((candidate) =>
          action.requirement.test(candidate),
        ) ?? ''
      case 'max_length':
        return faker.string.alpha({ length: Math.min(action.requirement, 8) })
      default:
        break
    }
  }

  return byName(key)
}

/** A plausible value for a field name, so fixtures read like records. */
function byName(key) {
  if (/(^|_)email/.test(key)) return faker.internet.email()
  if (/(^|_)(tel|mobile|phone)/.test(key)) return faker.phone.number()
  if (/(^|_)(city)/.test(key)) return faker.location.city()
  if (/(^|_)(postal|zip)/.test(key)) return faker.location.zipCode()
  if (/(^|_)address/.test(key)) return faker.location.streetAddress()
  if (/country_code/.test(key)) return 'NL'
  if (/(^|_)(name|contact|full_name)/.test(key)) return faker.company.name()
  if (/url/.test(key)) return faker.internet.url()
  if (/(^|_)(remarks|description|reference|identifier)/.test(key)) return faker.lorem.words(3)
  if (/_id$/.test(key)) return String(faker.number.int({ min: 1, max: 9999 }))
  return faker.lorem.word()
}

let nextSeed = 1

/**
 * Every required entry of an object schema, filled in, with `overrides`
 * applied.
 *
 * Overrides are merged *through the schema*, not on top of the result: an
 * override for a nested object or for the elements of a nested array is itself
 * completed against that nested schema. So a test can say
 *
 *     apiOrder(schema, { assigned_user_info: [{ full_name: 'Jan Jansen' }] })
 *
 * and still get a valid `user_id` on that entry, which is the whole point —
 * otherwise every nested shape has to be spelled out by hand again.
 */
export function fixtureFor(schema, overrides = {}, { seed } = {}) {
  faker.seed(seed ?? nextSeed++)
  return build(schema, overrides)
}

function build(schema, overrides = {}) {
  const object = unwrap(schema)
  const out = {}

  for (const [key, entry] of Object.entries(object.entries ?? {})) {
    const value = valueFor(entry, key)
    if (value !== undefined) out[key] = value
  }

  for (const [key, override] of Object.entries(overrides)) {
    out[key] = completeOverride(unwrap(object.entries?.[key]), override)
  }

  return out
}

function completeOverride(entry, override) {
  if (!entry || override === null || override === undefined) return override

  if (entry.type === 'array' && Array.isArray(override)) {
    const item = unwrap(entry.item)
    return override.map((element) =>
      element && typeof element === 'object' && item?.entries ? build(item, element) : element,
    )
  }

  if (entry.entries && override && typeof override === 'object' && !Array.isArray(override)) {
    return build(entry, override)
  }

  return override
}

/** The item schema of a generated `Paginated*List` response. */
export function itemSchemaOf(listSchema) {
  const item = unwrap(listSchema.entries.results).item
  // A polymorphic list (`OrderExternal | Order`) — this app is never the API
  // user, so the app-facing variant is the last one. See useOrdersQuery.
  return item.options ? item.options[item.options.length - 1] : item
}

/** A paginated envelope around `rows`, as DRF sends it. */
export function paginated(rows, { count = rows.length, next = null, previous = null } = {}) {
  return { count, next, previous, results: rows }
}
