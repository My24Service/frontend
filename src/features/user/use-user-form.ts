import { computed, ref, watch } from 'vue'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'

import { mergeTakenVerdict } from '@/features/forms/use-availability-probe'
import {
  useResourceForm,
  type ResourceFormCopy,
  type WriteContext,
} from '@/features/forms/use-resource-form'
import { useUsernameProbe } from './use-username-probe'

/** The username + password half every user form shares. Extras ride alongside. */
export type UserFormValuesBase = {
  username: string
  password1: string
  password2: string
} & Record<string, unknown>

/**
 * What each of the 7 per-type user forms keeps. Everything else — the pk
 * split, the detail read, the probe wiring, the guards, the toasts — lives
 * here.
 *
 * - `ops`: `retrieve` / `create` / `update` generated ops + the list
 *   `invalidate` (e.g. `companySalesuserRetrieveOptions`,
 *   `companySalesuserCreateMutation()`, `companySalesuserPartialUpdateMutation()`,
 *   `(qc) => qc.invalidateQueries({queryKey: companySalesuserListQueryKey()})`).
 * - `empty()`: the blank slate (e.g. `emptySalesUser`).
 * - `fromRecord()`: the record → flat values (e.g. `salesUserFromRecord`).
 * - `validate()`: the per-type `validateXUserForm`. It owns the schema
 *   parse's field messages, the create/edit password rules, and the
 *   form-only rules the generated request schema cannot express (the api
 *   user's `api_user` sub-object, the engineer's preferred location).
 * - `parse()`: the per-type `parseXUserForm`. It shapes the flat form state
 *   onto the wire; the wrapper hands it the assembled password.
 * - `takenMessage`: the per-type `USERNAME_TAKEN_MESSAGE`.
 * - `copy`: the seven toast strings (`fetchError`, `created`, ...).
 *
 * Extras stay in the form — the wrapper must not block them:
 * - engineer location query + create-location mutation,
 * - customer picker query + selection state,
 * - employee branch list / my-branch queries,
 * - student/api list-side toggles and token display.
 * Combine `isLoading` yourself (`base.isLoading || extra.isLoading`).
 * `prepare` pins derived state before validation (employee branch id).
 */
export interface UseUserFormConfig<
  TValues extends UserFormValuesBase,
  TRecord,
  TBody,
  TErrors extends Record<string, string | undefined>,
> {
  pk: () => string | number | null
  retrieve: (id: number) => Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: UseMutationOptions<any, any, any>
  invalidate: (queryClient: QueryClient) => Promise<unknown>
  empty: () => TValues
  fromRecord: (record: TRecord) => TValues
  /** The per-type `validateXUserForm`. */
  validate: (values: TValues, context: WriteContext) => TErrors
  /** The per-type `parseXUserForm`; `password` is the wrapper-assembled one. */
  parse: (values: TValues, context: WriteContext & { password?: string }) => TBody
  takenMessage: () => string
  copy: ResourceFormCopy
  /** Pins derived state before validation (employee: branch id from my-branch). */
  prepare?: (values: TValues) => void
  /** Form-level rules beside the parse. */
  validateExtra?: (values: TValues, errors: TErrors) => void
  reasonOf?: (error: unknown, fallback: string) => string
  onSaved?: (result: unknown, context: WriteContext) => Promise<void>
  createVars?: (body: TBody) => Record<string, unknown>
  updateVars?: (id: number, body: TBody) => Record<string, unknown>
}

/**
 * User-slice wrapper over `useResourceForm`. Composes the shared skeleton
 * with the identity specifics every user form repeats:
 *
 * - probe wiring (field read + `originalUsername`, `waitForProbe` barrier
 *   before send, taken-username refusal merging the taken message),
 * - password assembly: the per-type parse is handed `password1` when one was
 *   typed, so the create/edit asymmetry stays in one place per type,
 * - validate = the per-type schema function's messages, then the probe verdict.
 */
export function useUserForm<
  TValues extends UserFormValuesBase,
  TRecord,
  TBody,
  TErrors extends Record<string, string | undefined>,
>(config: UseUserFormConfig<TValues, TRecord, TBody, TErrors>) {
  const originalUsername = ref<string | null>(null)

  // Filled after `base`: `validate` only runs on submit, by which time the
  // probe exists. A holder (not `base` itself) so the closure compiles without
  // referencing `base` inside its own initializer.
  const probeRef = {} as { current: ReturnType<typeof useUsernameProbe> }

  const base = useResourceForm<TValues, TRecord, TBody, TErrors>({
    pk: config.pk,
    retrieve: config.retrieve,
    create: config.create,
    update: config.update,
    invalidate: config.invalidate,
    empty: config.empty,
    fromRecord: config.fromRecord,
    validate: async (values: TValues, context: WriteContext) => {
      config.prepare?.(values)

      const found: Record<string, string | undefined> = {
        ...config.validate(values, context),
      }

      config.validateExtra?.(values, found as TErrors)
      if (Object.keys(found).length > 0) return found as TErrors

      await probeRef.current.waitForProbe()

      mergeTakenVerdict(found, {
        probe: probeRef.current,
        read: () => String((values as Record<string, unknown>).username ?? ''),
        original: originalUsername,
        field: 'username',
        message: config.takenMessage,
      })
      return found as TErrors
    },
    parse: (values: TValues, context: WriteContext) => {
      const password1 = String((values as Record<string, unknown>).password1 ?? '')
      return config.parse(values, {
        ...context,
        password: password1 !== '' ? password1 : undefined,
      })
    },
    copy: config.copy,
    reasonOf: config.reasonOf,
    onSaved: config.onSaved,
    createVars: config.createVars,
    updateVars: config.updateVars,
  })

  const liveProbe = useUsernameProbe(
    () => String((base.values.value as Record<string, unknown>).username ?? ''),
    originalUsername,
  )
  probeRef.current = liveProbe

  watch(
    () => base.record.value,
    (record) => {
      if (!record) return
      originalUsername.value = (record as { username?: string | null }).username ?? null
    },
    { immediate: true },
  )

  const usernameTakenVisible = computed(() =>
    liveProbe.state.value === 'taken' &&
    !(base.errors.value as Record<string, string | undefined>).username,
  )

  const usernameValidationState = computed(() => {
    const errors = base.errors.value as Record<string, string | undefined>
    if (!base.submitClicked.value) return liveProbe.validationState.value ?? null
    if (errors.username) return false
    return liveProbe.validationState.value ?? true
  })

  return {
    ...base,
    originalUsername,
    probe: liveProbe,
    usernameTakenVisible,
    usernameValidationState,
  }
}
