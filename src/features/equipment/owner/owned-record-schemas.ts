import * as v from 'valibot'
import {
  fieldErrors,
  selectMessage,
  type FieldErrors,
  type FieldLabels,
  type WriteContext,
} from '@/features/forms'
import type { OwnedValues, OwnerKind } from './owner-kind'

/** Who the owner is for this write: the key the tenant's variant carries, and whether this user chose it. */
export interface OwnerRule {
  kind: OwnerKind
  /** False for the roles the API pins, whose owner slot is filled for them. */
  responsible: boolean
}

/**
 * Validation and parsing for a record owned by a customer or a branch.
 *
 * The create body of an equipment, location or building is a `oneOf` of two
 * variants - `{branch, …}` or `{customer, …}` - and the edit body is one patch
 * schema that declares both keys. Each entity's `schemas.ts` keeps what is its
 * own (the form values, the empty record, the record-to-values mapping and the
 * field labels); this is the part they had in common, character for
 * character: which generated schema a write is checked and stripped against,
 * and the one rule the schemas cannot say.
 *
 * That rule - an owner is required - is said here rather than by the schema,
 * for two reasons. valibot reports a failed `oneOf` at the root rather than on
 * either foreign key, so the schema alone would give no field to show the
 * message on; and whether an owner is required at all depends on the role - a
 * branch employee and a customer user send no choice, and the API pins theirs.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md, "which owner is
 * required") - a rule the API must stay lax about, because which key is
 * required is a property of the tenant rather than of the payload.
 */
export function ownedRecordSchemas<TValues extends OwnedValues>(schemas: {
  /** The generated `*BranchCreateRequest`. */
  branch: v.GenericSchema
  /** The generated `*CustomerCreateRequest`. */
  customer: v.GenericSchema
  /** The generated `vPatched*Request`, which declares both owner keys. */
  patch: v.GenericSchema
  labels: FieldLabels<keyof TValues>
}) {
  type Field = keyof TValues & string

  /** The variant this tenant uses on a create; the patch body on an edit. */
  function schemaFor(context: WriteContext, kind: OwnerKind): v.GenericSchema {
    if (!context.isCreate) return schemas.patch
    return kind === 'branch' ? schemas.branch : schemas.customer
  }

  return {
    /** The generated entries' own issues under the caller's labels, plus the owner rule. */
    validate(values: TValues, context: WriteContext, owner: OwnerRule): FieldErrors<Field> {
      const errors = fieldErrors<Field>(schemaFor(context, owner.kind), values, {}, schemas.labels)

      if (context.isCreate && owner.responsible && values[owner.kind] == null) {
        errors[owner.kind] = selectMessage(owner.kind === 'branch' ? $trans('Branch') : $trans('Customer'))
      }

      return errors
    },

    /**
     * The body to send, as the generated request component resolves it.
     *
     * A create is parsed against the variant this tenant uses rather than the
     * union, so the parse both checks it and returns it stripped to the keys
     * that variant declares: a branch-owned create goes out without the
     * `customer: null` the form was holding. An edit parses the patch body,
     * which declares both owner keys - the form round-trips the record rather
     * than diffing it, as the legacy screens did.
     */
    parse(values: TValues, context: WriteContext, kind: OwnerKind): unknown {
      return v.parse(schemaFor(context, kind), values)
    },
  }
}
