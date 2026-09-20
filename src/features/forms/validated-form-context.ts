/**
 * What a ValidatedForm hands down to the fields in its slot: a field asks for
 * what it needs by name and never sees the form's own props, so the derivation
 * rules live here rather than being re-spelled at every call site.
 */

/** What a field of a form holds: what the inputs underneath it accept.
 *
 * Text and number inputs hold `string | number`; a settings toggle holds a
 * `boolean`; a date picker holds a `Date`; a roles or conditions list holds an
 * array. `null` is the cleared value, `undefined` the absent one.
 */
export type FieldValue = string | number | boolean | Date | unknown[] | null | undefined

/**
 * What each field of a form is called.
 *
 * A thunk for the same reason a validation message is one: `$trans` reads a page
 * global, so the lookup happens when the label is read rather than when the
 * module holding it is imported. Keys are the form's own field names, so
 * `satisfies FieldLabels<keyof MemberFormValues & string>` rejects a label for a
 * field that does not exist.
 *
 * Every label is a `$trans('...')` literal and never a name derived from the
 * field: the page's catalogue is built by scanning the source for those literals,
 * so a label conjured at runtime would read English in a Dutch UI.
 */
export type FieldLabels<K extends string = string> = Partial<Record<K, () => string>>

export interface ValidatedFormContext {
  /**
   * The form's own name, which prefixes every field id: member + city ->
   * member_city. Empty when the form's ids carry no prefix.
   */
  readonly name: string
  idOf(field: string): string
  /** The field's live value, read off the form object. */
  valueOf(field: string): FieldValue
  /** Writes the field back onto the form object. */
  setValue(field: string, value: FieldValue): void
  /** The field's error, once validate has run. */
  errorOf(field: string): string | undefined
  /** The copy under the field while it sits empty. */
  messageOf(field: string): string | undefined
  /** The field's label, or its own name when the form has none for it. */
  labelOf(field: string): string
  /** Whether the form object really has this field. Guards a mistyped name. */
  hasField(field: string): boolean
  /** True once the form has been submitted at least once. */
  readonly submitted: boolean
}

const VALIDATED_FORM: InjectionKey<ValidatedFormContext> = Symbol('validated-form')

export function provideValidatedForm(context: ValidatedFormContext): void {
  provide(VALIDATED_FORM, context)
}

/**
 * The form the field belongs to. Every field renders inside a ValidatedForm,
 * so a missing provider is a programming error, reported as one rather than
 * read off an absent form.
 */
export function useValidatedForm(): ValidatedFormContext {
  const form = inject(VALIDATED_FORM)
  if (!form) throw new Error('ValidatedFormField must be used inside a ValidatedForm')
  return form
}
