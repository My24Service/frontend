import * as v from 'valibot'

import { vCustomerDocumentWritable, vPatchedCustomerDocumentWritable } from '@/api/valibot.gen'

/**
 * See README/ADR.
 */


/** What a newly chosen document POSTs. */
export const documentCreateSchema = v.object({...vCustomerDocumentWritable.entries})

/** What an edited document PATCHes. */
export const documentPatchSchema = v.object({...vPatchedCustomerDocumentWritable.entries})

/** One row as the panel stages it: the loaded record plus any local edits. */
export type DocumentRow = {
  id?: number
  customer: number
  name: string
  description?: string | null
  /** The file that rides out: a data URL once chosen, absent for stored rows. */
  file?: string
  /** The stored file's URL, display-only — never sent back. */
  storedFile?: string
  user_can_view?: boolean
}
