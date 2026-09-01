import { vMemberWritable } from '@/api/valibot.gen'
import { formDefaults } from '@/models/schema'

/**
 * TEMPORARY SHIM — do not extend.
 *
 * The hand-written Member service and model were deleted at #326; what four
 * screens outside the Member Slice still needed from this file was default
 * field shapes — nothing more, no HTTP call goes through here. This is that:
 * two helpers deriving their blanks from the generated request schema via
 * `formDefaults`, so a field added or renamed in the backend shows up (or
 * fails loudly) without this file being edited.
 *
 * The single stated override is `is_public: true`, carried over from the old
 * field bag: a new member is public until someone says otherwise. It is a UI
 * decision, which is what `formDefaults`' overrides are for.
 *
 * Two deliberate differences from the bag it replaces: enum-typed fields
 * (`member_type`, `equipment_qr_type`) default to undefined instead of `''`
 * — "not chosen yet" — and fields the legacy dict had simply fallen behind on
 * (`equipment_qr_type`, `is_requested`, `has_mobile_activity_user_select`,
 * `deep_link`) are present now, because the schema, not memory, decides the
 * key list.
 *
 * Per CONTEXT.md, a Shim is defined by where it lives: outside the finished
 * Slice, beside its legacy callers, and temporary. This one disappears when
 * the company Info/Settings/Connector-Gripp screens and the quotation detail
 * get their own slices — the remaining work tracked by the rewrite's parent,
 * #313.
 */

/** The blank member shape: every writable field, derived from the schema. */
export function memberFieldDefaults() {
  return formDefaults(vMemberWritable, {is_public: true})
}

/** The blank shape with a whole record merged over it, exactly as the old
 *  model's constructor did: every key the caller supplies wins, including
 *  ones the write schema does not declare - QuotationView hands this the
 *  tenant's full stored record, readonly fields and all. Only
 *  {@link memberFieldDefaults} checks its inputs against the schema. */
export function memberShape(overrides = {}) {
  return {...memberFieldDefaults(), ...overrides}
}
