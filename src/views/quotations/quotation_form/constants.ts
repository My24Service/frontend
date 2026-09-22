import { enumOf } from '@/enums'
import type { InvoiceLineOption, InvoiceLineType } from '@/features/invoice'

export const OPTION = enumOf<InvoiceLineOption>()({
  USER_TOTALS: 'user_totals',
  ONLY_TOTAL: 'total',
  NONE: 'none',
})

export const INVOICE_LINE_TYPE = enumOf<InvoiceLineType>()({
  USED_MATERIALS: 'used-materials',
  CALL_OUT_COSTS: 'call-out-costs',
  DISTANCE: 'distance',
  HOURS_TYPE_WORK: 'work',
  HOURS_TYPE_TRAVEL: 'travel',
  HOURS_TYPE_EXTRA_WORK: 'extra-work',
  HOURS_TYPE_ACTUAL_WORK: 'actual-work',
  MANUAL: 'manual',
})

