import * as v from 'valibot'

export type DocumentRow = v.InferInput<typeof schemas.vCustomerDocumentRequest> & {
  id?: number
  storedFile?: string
}
