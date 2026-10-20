import * as v from 'valibot'
import { objectOmit } from '@vueuse/core'

import {
  fieldsFromRecord,
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'

const body = Api.InventoryMaterial.update.body

/** The text fields a material may leave blank. */
const OPTIONAL_TEXT = ['name_short', 'identifier', 'unit', 'location', 'product_type'] as const

/** The six prices, each a decimal string on the wire. */
const PRICES = [
  'price_purchase',
  'price_selling',
  'price_selling_alt',
  'price_purchase_ex',
  'price_selling_ex',
  'price_selling_alt_ex',
] as const

/**
 * The fields this form owns, picked from the patch body: it is the one body
 * that declares every key the form holds (`location` is on the patch body
 * and not on the create body), and for every key the two share, the create
 * body's rules are the same. So an edit validates what it sends, and a
 * create validates the same rules its body carries. The create body's twenty
 * keys include the currencies, which are the server's to default, and the
 * image, which the form stages on its own (see `shaped`).
 *
 * The name is piped with a minimum. Case 1 (`docs/schema-strengthenings.md`
 * entry 10): the request declares it nullish with no minimum, so a blank name
 * passes the generated schema, and a material needs one. `v.unwrap` drops the
 * null and keeps the maximum codegen put underneath.
 */
const materialFormSchema = v.object({
  ...v.pick(body, ['name', ...OPTIONAL_TEXT, 'supplier_relation', ...PRICES]).entries,
  name: v.pipe(v.unwrap(body.entries.name), v.minLength(1)),
})

/**
 * The form's own state: the picked fields as the schema takes them, and two
 * that never ride the body as they are held.
 */
export type MaterialFormValues = Required<v.InferInput<typeof materialFormSchema>> & {
  /** The read-only companion the picker fills in so the chosen supplier shows. */
  supplier_name: string
  /**
   * A newly picked file as a data URL, or null when no file was chosen. The
   * record's own image is a URL the write endpoint would save as the image,
   * so it stays out of the values and only shows as the current image.
   */
  image: string | null
}

export type MaterialFieldErrors = FieldErrors<keyof MaterialFormValues>

/**
 * A blank material. The text inputs start at `''` rather than the null a
 * nullish entry blanks to, as the legacy form sent them; the prices start at
 * "0.00", as the legacy model's did.
 */
export function emptyMaterial(): MaterialFormValues {
  return {
    ...formDefaults(materialFormSchema, {
      ...Object.fromEntries(OPTIONAL_TEXT.map((key) => [key, ''])),
      ...Object.fromEntries(PRICES.map((key) => [key, '0.00'])),
    }),
    supplier_name: '',
    image: null,
  }
}

/** The fetched record as form values. The stored image URL is left out. */
export function materialFromRecord(record: Api.InventoryMaterial.Record): MaterialFormValues {
  return {
    ...emptyMaterial(),
    ...fieldsFromRecord(materialFormSchema, record),
    supplier_name: record.supplier_name ?? '',
  }
}

// The generated entries carry the maxima and the price regexes; the labels
// name the field in each of those lines.
export const FIELD_LABELS = {
  name: () => $trans('Name'),
  name_short: () => $trans('Name short'),
  identifier: () => $trans('Identifier'),
  unit: () => $trans('Unit'),
  supplier_name: () => $trans('Supplier'),
  location: () => $trans('Location'),
  product_type: () => $trans('Product type'),
  price_purchase: () => $trans('Purchase price'),
  price_selling: () => $trans('Selling price'),
  price_selling_alt: () => $trans('Alt. selling price'),
  price_purchase_ex: () => $trans('Purchase price ex.'),
  price_selling_ex: () => $trans('Selling price ex.'),
  price_selling_alt_ex: () => $trans('Alt. selling price ex.'),
} as const satisfies FieldLabels<keyof MaterialFormValues>

/**
 * The wire body. Only a fresh upload (a `data:` URI) carries the image: what
 * the API hands back is a URL, and sending that back would save the material
 * with its own URL as the image. A supplier not picked is left out rather than
 * sent as an id nothing has. A cleared price is left out too: the generated
 * decimal pattern matches `''`, which the API answers with a 400, and both
 * bodies take the price as optional, so an absent one keeps the server's
 * default on a create and the stored price on an edit.
 */
function shaped(values: MaterialFormValues): Api.InventoryMaterial.UpdateInput {
  const shape: Api.InventoryMaterial.UpdateInput = objectOmit(
    values,
    ['supplier_name', 'image', 'supplier_relation', ...PRICES],
  )
  for (const key of PRICES) {
    if (values[key] !== '') shape[key] = values[key]
  }
  if (values.supplier_relation != null) shape.supplier_relation = values.supplier_relation
  if (values.image?.startsWith('data:')) shape.image = values.image
  return shape
}

/**
 * Every write validates against the strengthened form schema: the generated
 * entries of what it sends, with the name's minimum on top.
 */
export const materialWrite = writeContract(Api.InventoryMaterial, {
  validateWith: materialFormSchema,
  shape: shaped,
  labels: FIELD_LABELS,
})
