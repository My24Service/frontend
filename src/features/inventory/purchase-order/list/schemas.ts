import {
  writeContract,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'

/** The status modal's state: which order it adds to, and the status text. */
export interface PurchaseOrderStatusFormValues {
  /** The order the modal was opened for; 0 until one is. */
  purchase_order: number
  status: string
}

export type PurchaseOrderStatusFieldErrors = FieldErrors<keyof PurchaseOrderStatusFormValues>

export function emptyPurchaseOrderStatus(): PurchaseOrderStatusFormValues {
  return {purchase_order: 0, status: ''}
}

export function purchaseOrderStatusFromRecord(record: Api.PurchaseOrderStatus): PurchaseOrderStatusFormValues {
  return {purchase_order: record.purchase_order, status: record.status}
}

// The request already carries the status's minimum and maximum lengths; the
// label is all this adds, and every line the field can show is a rule's line
// with it filled in.
const FIELD_LABELS = {
  status: () => $trans('Status'),
} as const satisfies FieldLabels<keyof PurchaseOrderStatusFormValues>

export const purchaseOrderStatusWrite = writeContract(Api.InventoryPurchaseorderStatus, {labels: FIELD_LABELS})
