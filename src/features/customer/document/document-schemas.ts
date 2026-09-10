import * as v from 'valibot'

import { vCustomerDocumentRequest, vPatchedCustomerDocumentRequest } from '@/api/valibot.gen'





export const documentCreateSchema = v.object({...vCustomerDocumentRequest.entries})


export const documentPatchSchema = v.object({...vPatchedCustomerDocumentRequest.entries})


export type DocumentRow = {
  id?: number
  customer: number
  name: string
  description?: string | null
  
  file?: string
  
  storedFile?: string
  user_can_view?: boolean
}
