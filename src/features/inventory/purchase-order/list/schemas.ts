import {
  writeContract,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'

// The modal holds the create body unchanged: which order it adds to, and the status text.
export type PurchaseOrderStatusFieldErrors = FieldErrors<keyof Api.InventoryPurchaseorderStatus.CreateInput>

/** The order is 0 until the modal is opened for one, which sets it. */
export function emptyPurchaseOrderStatus(): Api.InventoryPurchaseorderStatus.CreateInput {
  return {purchase_order: 0, status: ''}
}

export function purchaseOrderStatusFromRecord(record: Api.PurchaseOrderStatus): Api.InventoryPurchaseorderStatus.CreateInput {
  return {purchase_order: record.purchase_order, status: record.status}
}

// The request already carries the status's minimum and maximum lengths; the
// label is all this adds, and every line the field can show is a rule's line
// with it filled in.
const FIELD_LABELS = {
  status: () => $trans('Status'),
} as const satisfies FieldLabels<keyof Api.InventoryPurchaseorderStatus.CreateInput>

export const purchaseOrderStatusWrite = writeContract(Api.InventoryPurchaseorderStatus, {labels: FIELD_LABELS})
