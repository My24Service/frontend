import * as v from 'valibot'

import type { WriteContext } from './use-resource-form'
import type { FieldLabels } from './validated-form-context'
import { fieldErrors, type FieldErrors, type FieldMessages } from './validation'

/**
 * The part of a generated resource (`@/api/resources.gen`) a write contract
 * reads: the body schema of each direction the API has.
 */
export interface WriteResource<TCreate extends v.GenericSchema, TUpdate extends v.GenericSchema> {
  readonly path: string
  readonly create?: {readonly body: TCreate}
  readonly update?: {readonly body: TUpdate}
}

/** What a form adds to the generated bodies. */
export interface WriteContractOptions<TField extends string, TValues> {
  /**
   * The form's values as the schema sees them: blanks dropped, `''` gone to
   * null, a `Date` to its wire string. Identity when the form already holds
   * the wire shape.
   */
  shape?: (values: TValues) => unknown
  /** The form's copy, handed to `fieldErrors` unchanged. */
  labels?: FieldLabels<TField>
  messages?: FieldMessages<TField>
  /**
   * The schema validation reads, when it is not the body being sent.
   *
   * Two forms need this, and both are saying something the default cannot:
   * a form whose edit saves the *whole* record validates against the create
   * body even on an edit (that component is the one that says what a whole
   * record needs), and a form carrying a rule of its own - the leave form's
   * clock, the sick leave's start day - validates against its strengthened
   * copy. Everything else validates what it submits.
   */
  validateWith?: v.GenericSchema
}

/**
 * A form's write contract: the generated bodies it writes through, and the
 * `validate`/`parse` pair `useResourceForm` wants.
 *
 *     export const branchWrite = writeContract(companyBranch, {
 *       validateWith: companyBranch.create.body,
 *       shape: shaped,
 *       labels: FIELD_LABELS,
 *     })
 *
 * The resource is the declaration: its create and update bodies are bound
 * together in `resources.gen.ts`, so a form cannot validate against one
 * resource's create body while sending another's patch body - which used to
 * typecheck, because every body is just a schema. A resource the API only
 * creates, or only updates, sends its one body for both directions.
 */
export function writeContract<
  TCreate extends v.GenericSchema = v.GenericSchema,
  TUpdate extends v.GenericSchema = TCreate,
  TField extends string = string,
  TValues = unknown,
>(
  resource: WriteResource<TCreate, TUpdate>,
  {
    shape = (values: TValues) => values,
    labels = {},
    messages = {},
    validateWith,
  }: WriteContractOptions<TField, TValues> = {},
) {
  // Each direction falls back to the other's body, and the casts state what
  // the fallback means for the types: with `create` absent nothing infers
  // `TCreate`, so it is the bare `GenericSchema`; with `update` absent
  // `TUpdate` defaults to `TCreate`, and the create body is what is sent.
  const createSchema = (resource.create?.body ?? resource.update?.body) as TCreate | undefined
  const updateSchema = (resource.update?.body ?? resource.create?.body) as TUpdate | undefined
  if (!createSchema || !updateSchema) {
    throw new Error(`writeContract: ${resource.path} has no body to write`)
  }

  const schemaFor = (context: Pick<WriteContext, 'isCreate'>) => (context.isCreate ? createSchema : updateSchema)

  return {
    resource,
    validate(values: TValues, context: Pick<WriteContext, 'isCreate'>): FieldErrors<TField> {
      return fieldErrors<TField>(validateWith ?? schemaFor(context), shape(values), messages, labels)
    },
    parse(
      values: TValues,
      context: Pick<WriteContext, 'isCreate'>,
    ): v.InferOutput<TCreate> | v.InferOutput<TUpdate> {
      return v.parse(schemaFor(context), shape(values))
    },
    /**
     * The two directions on their own, for a caller that hands its body
     * straight to the generated mutation for one of them: `parse` returns a
     * union, and a union satisfies neither mutation's exact body type.
     */
    parseCreate(values: TValues): v.InferOutput<TCreate> {
      return v.parse(createSchema, shape(values))
    },
    parseUpdate(values: TValues): v.InferOutput<TUpdate> {
      return v.parse(updateSchema, shape(values))
    },
  }
}
