import * as v from 'valibot'

import { vCustomerDocumentRequest } from '@/api/valibot.gen'

/**
 * One row of the documents table while the panel is open.
 *
 * The generated request schema is used directly for the parse (see
 * DocumentPanel), so the only thing worth naming here is the state a row
 * carries that the wire does not: `storedFile` is the URL a saved document
 * already has, kept apart from `file`, which is set only when a new file was
 * picked and holds its base64 data URL.
 */
export type DocumentRow = v.InferInput<typeof vCustomerDocumentRequest> & {
  id?: number
  storedFile?: string
}
