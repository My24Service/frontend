import * as v from 'valibot'

import { vCustomerDocumentWritable, vPatchedCustomerDocumentWritable } from '@/api/valibot.gen'





export const documentCreateSchema = v.object({...vCustomerDocumentWritable.entries})


export const documentPatchSchema = v.object({...vPatchedCustomerDocumentWritable.entries})


export type DocumentRow = {
  id?: number
  customer: number
  name: string
  description?: string | null
  
  file?: string
  
  storedFile?: string
  user_can_view?: boolean
}
