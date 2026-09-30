import * as v from 'valibot'
import moment from 'moment'

import {
  fieldErrors,
  nextWorkingDay,
  toApiDate,
  type FieldErrors,
  type FieldLabels,
  type FieldMessages,
  type WriteContext,
} from '@/features/forms'
import type { MaterialRowBody } from '../../material-rows'

/**
 * The form's own state. A purchase order keeps its own copy of the supplier's
 * address and contact details rather than pointing at the supplier record, so
 * that it still says where the goods were ordered from if the supplier later
 * moves - hence one text field per detail, all nullable the way the supplier's
 * are. The date is a `Date` for the picker; the wire takes `YYYY-MM-DD`.
 */
export type PurchaseOrderFormValues = {
  /** The supplier picked; null until then, which the request does not allow. */
  supplier: number | null
  supplier_reservation: number | null
  order_name: string | null
  order_address: string | null
  order_postal: string | null
  order_city: string | null
  order_country_code: string | null
  order_reference: string | null
  order_tel: string | null
  order_mobile: string | null
  order_email: string | null
  order_contact: string | null
  expected_entry_date: Date | null
  supplier_remarks: string | null
  description: string | null
}

export type PurchaseOrderFieldErrors = FieldErrors<keyof PurchaseOrderFormValues>

/** A new order starts empty, in the Netherlands, expected the next working day. */
export function emptyPurchaseOrder(): PurchaseOrderFormValues {
  return {
    supplier: null,
    supplier_reservation: null,
    order_name: '',
    order_address: '',
    order_postal: '',
    order_city: '',
    order_country_code: 'NL',
    order_reference: '',
    order_tel: '',
    order_mobile: '',
    order_email: '',
    order_contact: '',
    expected_entry_date: nextWorkingDay(),
    supplier_remarks: '',
    description: '',
  }
}

/**
 * The stored order as form values.
 *
 * The response carries the date twice: `expected_entry_date` is the tenant's
 * display string, `expected_entry_date_iso` the machine-readable one. The ISO
 * twin is the one to read; parsing the display string as DD/MM/YYYY, which is
 * all that was possible before the twin existed, is right only for the tenants
 * whose date_format is that, so it stays as the fallback and nothing more.
 */
export function purchaseOrderFromRecord(record: Api.PurchaseOrderDetail): PurchaseOrderFormValues {
  const date = record.expected_entry_date_iso
    ? moment(record.expected_entry_date_iso)
    : moment(record.expected_entry_date, 'DD/MM/YYYY')
  return {
    supplier: record.supplier,
    supplier_reservation: record.supplier_reservation ?? null,
    order_name: record.order_name ?? null,
    order_address: record.order_address ?? null,
    order_postal: record.order_postal ?? null,
    order_city: record.order_city ?? null,
    order_country_code: record.order_country_code ?? null,
    order_reference: record.order_reference ?? null,
    order_tel: record.order_tel ?? null,
    order_mobile: record.order_mobile ?? null,
    order_email: record.order_email ?? null,
    order_contact: record.order_contact ?? null,
    expected_entry_date: date.isValid() ? date.toDate() : null,
    supplier_remarks: record.supplier_remarks ?? null,
    description: record.description ?? null,
  }
}

/** What an order copies from a supplier, whether the supplier record or its autocomplete row. */
export interface SupplierSource {
  id: number
  name?: string | null
  address?: string | null
  city?: string | null
  postal?: string | null
  country_code?: string | null
  tel?: string | null
  mobile?: string | null
  email?: string | null
  contact?: string | null
  remarks?: string | null
}

/**
 * Copy a supplier's details onto an order. Filling them in is a rule about
 * purchase orders, not about the form that happens to pick the supplier.
 */
export function applySupplier(values: PurchaseOrderFormValues, supplier: SupplierSource): void {
  Object.assign(values, {
    supplier: supplier.id,
    order_name: supplier.name ?? null,
    order_address: supplier.address ?? null,
    order_city: supplier.city ?? null,
    order_postal: supplier.postal ?? null,
    order_country_code: supplier.country_code ?? null,
    order_tel: supplier.tel ?? null,
    order_mobile: supplier.mobile ?? null,
    order_email: supplier.email ?? null,
    order_contact: supplier.contact ?? null,
    supplier_remarks: supplier.remarks ?? null,
  })
}

export const FIELD_LABELS = {
  supplier: () => $trans('Supplier'),
  order_name: () => $trans('Name'),
  order_address: () => $trans('Address'),
  order_postal: () => $trans('Postal'),
  order_city: () => $trans('City'),
  order_country_code: () => $trans('Country'),
  order_reference: () => $trans('Reference'),
  order_mobile: () => $trans('Mobile'),
  order_tel: () => $trans('Tel.'),
  order_contact: () => $trans('Contacts'),
  description: () => $trans('Description'),
  supplier_remarks: () => $trans('Supplier remarks'),
  expected_entry_date: () => $trans('Expected entry date'),
} as const satisfies FieldLabels<keyof PurchaseOrderFormValues>

/**
 * The two rules the request cannot say: a supplier is chosen from a picker
 * (the schema sees a null, not a blank), and the date is always given, where
 * the request allows leaving it out.
 */
export const FIELD_MESSAGES = {
  supplier: () => $trans('Please select a supplier or reservation'),
  expected_entry_date: () => $trans('Please enter a date'),
} as const satisfies FieldMessages<keyof PurchaseOrderFormValues>

const CreateBody = Api.InventoryPurchaseorderWithMaterials.create.body
const UpdateBody = Api.InventoryPurchaseorder.extras.withMaterialsPartialUpdate.body

/**
 * Validation reads the create body for both directions: the form saves a whole
 * order, and that is the component that says what a whole order needs. The
 * expected date is optional on the wire and required here, by unwrapping its
 * entry rather than redeclaring it.
 */
const wholeOrder = v.object({
  ...CreateBody.entries,
  expected_entry_date: v.unwrap(CreateBody.entries.expected_entry_date),
})

/**
 * The order's own fields as the wire takes them. `purchase_order_id` is never
 * among them: the server assigns it on create and it is not editable.
 */
function shaped(values: PurchaseOrderFormValues) {
  const {expected_entry_date, ...rest} = values
  return {
    ...rest,
    expected_entry_date: expected_entry_date ? toApiDate(expected_entry_date) : null,
  }
}

export function validatePurchaseOrder(values: PurchaseOrderFormValues): PurchaseOrderFieldErrors {
  return fieldErrors(wholeOrder, shaped(values), FIELD_MESSAGES, FIELD_LABELS)
}

export type PurchaseOrderWithMaterialsBody =
  | v.InferOutput<typeof CreateBody>
  | v.InferOutput<typeof UpdateBody>

/**
 * The body of a save: the order's own fields joined to its whole material set,
 * which the endpoint reads as the order's complete child set - a row without an
 * `id` is created, one with it updated, a stored row left out deleted. The
 * pair differs only in the verb's address: `POST purchaseorder/with-materials/`
 * and `PATCH purchaseorder/{id}/with-materials/`.
 */
export function parsePurchaseOrder(
  values: PurchaseOrderFormValues,
  materials: MaterialRowBody[],
  context: Pick<WriteContext, 'isCreate'>,
): PurchaseOrderWithMaterialsBody {
  return v.parse(context.isCreate ? CreateBody : UpdateBody, {...shaped(values), materials})
}
