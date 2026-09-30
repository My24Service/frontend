import * as v from 'valibot'

import {
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'

/**
 * The form's own state. The generated request declares the prices as optional
 * strings and the supplier as a nullish id; the form holds every text field as
 * a string and a supplier not yet picked as `null`. Two entries are not wire
 * fields at all:
 *
 * - `supplier_name` is the read-only companion the picker fills in so the
 *   chosen supplier shows; it never rides the body.
 * - `image` is the staged upload as a data URL, `null` while no file was
 *   picked. The record's own image is a URL the write endpoint would save as
 *   the image, so it stays out of the values and only shows as the current
 *   image.
 */
export type MaterialFormValues = {
  name: string
  name_short: string
  identifier: string
  unit: string
  supplier_relation: number | null
  supplier_name: string
  location: string
  product_type: string
  price_purchase: string
  price_selling: string
  price_selling_alt: string
  price_purchase_ex: string
  price_selling_ex: string
  price_selling_alt_ex: string
  /** A newly picked file as a data URL, or null when no file was chosen. */
  image: string | null
}

export type MaterialFieldErrors = FieldErrors<keyof MaterialFormValues>

/**
 * A blank material. The form binds a subset of the create body's twenty keys
 * (the currencies are the server's to default), so the blank is written out
 * rather than derived from the whole component. The prices start at "0.00",
 * as the legacy model's did.
 */
export function emptyMaterial(): MaterialFormValues {
  return {
    name: '',
    name_short: '',
    identifier: '',
    unit: '',
    supplier_relation: null,
    supplier_name: '',
    location: '',
    product_type: '',
    price_purchase: '0.00',
    price_selling: '0.00',
    price_selling_alt: '0.00',
    price_purchase_ex: '0.00',
    price_selling_ex: '0.00',
    price_selling_alt_ex: '0.00',
    image: null,
  }
}

/** The fetched record as form values. The stored image URL is left out. */
export function materialFromRecord(record: Api.InventoryMaterial.Record): MaterialFormValues {
  return {
    name: record.name ?? '',
    name_short: record.name_short ?? '',
    identifier: record.identifier ?? '',
    unit: record.unit ?? '',
    supplier_relation: record.supplier_relation ?? null,
    supplier_name: record.supplier_name ?? '',
    location: record.location ?? '',
    product_type: record.product_type ?? '',
    price_purchase: record.price_purchase,
    price_selling: record.price_selling,
    price_selling_alt: record.price_selling_alt,
    price_purchase_ex: record.price_purchase_ex,
    price_selling_ex: record.price_selling_ex,
    price_selling_alt_ex: record.price_selling_alt_ex,
    image: null,
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
 * The create body with a name that must be given. The request declares it
 * `nullable` with no minimum, so a blank name passes the generated schema;
 * a material needs one. `v.unwrap` drops the null and keeps the maximum
 * codegen put underneath. Recorded in `docs/schema-strengthenings.md`.
 */
const materialFormSchema = v.object({
  ...Api.InventoryMaterial.create.body.entries,
  name: v.pipe(v.unwrap(Api.InventoryMaterial.create.body.entries.name), v.minLength(1)),
})

/**
 * The wire body. Only a fresh upload (a `data:` URI) carries the image: what
 * the API hands back is a URL, and sending that back would save the material
 * with its own URL as the image. A supplier not picked is left out rather than
 * sent as an id nothing has.
 */
function shaped(values: MaterialFormValues) {
  const body: Record<string, unknown> = {
    name: values.name,
    name_short: values.name_short,
    identifier: values.identifier,
    unit: values.unit,
    location: values.location,
    product_type: values.product_type,
    price_purchase: values.price_purchase,
    price_selling: values.price_selling,
    price_selling_alt: values.price_selling_alt,
    price_purchase_ex: values.price_purchase_ex,
    price_selling_ex: values.price_selling_ex,
    price_selling_alt_ex: values.price_selling_alt_ex,
  }
  if (values.supplier_relation != null) body.supplier_relation = values.supplier_relation
  if (values.image?.startsWith('data:')) body.image = values.image
  return body
}

/**
 * Every write validates against the strengthened create body: the form saves a
 * whole material, and that is the component that says what a whole material
 * needs. The patch body it sends on an edit is a superset of what PATCH needs.
 */
export const materialWrite = writeContract(Api.InventoryMaterial, {
  validateWith: materialFormSchema,
  shape: shaped,
  labels: FIELD_LABELS,
})
