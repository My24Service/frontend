import * as v from 'valibot'

import { vCustomerDocumentRequest } from '@/api/valibot.gen'

export type DocumentRow = v.InferInput<typeof vCustomerDocumentRequest> & {
  id?: number
  storedFile?: string
}
