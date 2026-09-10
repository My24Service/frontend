import { vMemberRequest } from '@/api/valibot.gen'
import { formDefaults } from '@/models/schema'

/**
 * The blank member, as the Member Slice defines it.
 *
 * The hand-written Member service and model were deleted at #326; what the
 * screens that have not been converted yet still needed from them was default
 * field shapes - nothing more, no HTTP call goes through here. That knowledge
 * is member knowledge, so it lives with the Slice instead of beside those
 * legacy callers: these two helpers derive their blanks from the generated
 * request schema via `formDefaults`, so a field added or renamed in the
 * backend shows up (or fails loudly) without this file being edited.
 *
 * The single stated override is `is_public: true`, carried over from the old
 * field bag: a new member is public until someone says otherwise. It is a UI
 * decision, which is what `formDefaults`' overrides are for.
 *
 * Two deliberate differences from the bag it replaces: enum-typed fields
 * (`member_type`, `equipment_qr_type`) default to undefined instead of `''`
 * - "not chosen yet" - and fields the legacy dict had simply fallen behind on
 * (`equipment_qr_type`, `is_requested`, `has_mobile_activity_user_select`,
 * `deep_link`) are present now, because the schema, not memory, decides the
 * key list.
 *
 * The consumers are the screens that have not been converted yet: the company
 * Info/Settings/Connector-Gripp screens and the quotation detail (the remaining
 * work is tracked by the rewrite's parent, #313). They import this module
 * directly rather than through `./index.ts`, which is the router's door: this
 * is private wiring, and it loses its last importer when those screens get
 * slices of their own.
 */

/** The blank member shape: every writable field, derived from the schema. */
export function memberFieldDefaults(): Record<string, any> {
  return formDefaults(vMemberRequest, {is_public: true})
}

/** The blank shape with a whole record merged over it, exactly as the old
 *  model's constructor did: every key the caller supplies wins, including
 *  ones the write schema does not declare - QuotationView hands this the
 *  tenant's full stored record, readonly fields and all. Only
 *  {@link memberFieldDefaults} checks its inputs against the schema. */
export function memberShape(overrides: Record<string, any> = {}): Record<string, any> {
  return {...memberFieldDefaults(), ...overrides}
}
