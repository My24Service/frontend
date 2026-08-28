import * as v from 'valibot'

import { vCustomerDocumentWritable, vPatchedCustomerDocumentWritable } from '@/api/valibot.gen'

/**
 * The document panel's request bodies, derived from the generated schemas.
 *
 * The panel has no field-level validation of its own — the legacy screen had
 * none to mirror — but the parse-output-is-the-body rule still applies: a
 * row's `id` and its stored file's URL are staging state, not request fields,
 * and die at the parse instead of riding the wire. `file` is declared
 * `url()`-shaped by the schema, which a base64 `data:` URL satisfies; a
 * stored file's `https://` URL is stripped *before* the parse (in the panel)
 * so a stored document is never re-uploaded.
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
