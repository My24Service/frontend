import { computed, ref, watch } from 'vue'
import * as v from 'valibot'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'

import { mergeTakenVerdict } from '@/features/forms/use-availability-probe'
import { fieldErrors, type FieldMessages } from '@/features/forms/validation'
import { useRoutePk } from '@/features/forms/use-route-pk'
import { useResourceForm, type ResourceFormCopy } from '@/features/forms/use-resource-form'
import {
  passwordErrors,
  userFormErrors,
  withPassword,
  type UserIdentityValues,
} from './user-form'
import { useUsernameProbe } from './use-username-probe'

/** The username + password half every user form shares. Extras ride alongside. */
export type UserFormValuesBase = {
  username: string
  password1: string
  password2: string
} & Record<string, unknown>

/**
 * What each of the 7 per-type user forms keeps. Everything else — the pk
 * split, the detail read, the probe wiring, the password rules, the guards,
 * the toasts — lives here.
 *
 * - `ops`: `retrieve` / `create` / `update` generated ops + the list
 *   `invalidate` (e.g. `companySalesuserRetrieveOptions`,
 *   `companySalesuserCreateMutation()`, `companySalesuserPartialUpdateMutation()`,
 *   `(qc) => qc.invalidateQueries({queryKey: companySalesuserListQueryKey()})`).
 * - `empty()`: the blank slate (e.g. `emptySalesUser`).
 * - `fromRecord()`: the record → flat values (e.g. `salesUserFromRecord` —
 *   currently inline in each `*Form.vue`, hoist it beside `empty`).
 * - `payloadOf()`: flat values → nested wire payload (currently private in
 *   each `schemas.ts`, export it).
 * - `schema`: the request schema the form parses (e.g.
 *   `vSalesUserRequestWritable`; api passes its strengthened
 *   `apiUserFormSchema`).
 * - `fieldMessages`: the per-type `FIELD_MESSAGES`.
 * - `takenMessage`: the per-type `USERNAME_TAKEN_MESSAGE`.
 * - `copy`: the seven toast strings (`fetchError`, `created`, ...).
 *
 * Extras stay in the form — the wrapper must not block them:
 * - engineer location query + create-location mutation,
 * - customer picker query + selection state,
 * - employee branch list / my-branch queries,
 * - student/api list-side toggles and token display.
 * Combine `isLoading` yourself (`base.isLoading || extra.isLoading`).
 * `prepare` pins derived state before validation (employee branch id);
 * `validateExtra` adds form-level rules beside the parse (none today —
 * `preferred_location` is handled here).
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
  payloadOf: (values: TValues) => unknown
  schema: v.GenericSchema
  fieldMessages: FieldMessages<string>
  takenMessage: () => string
  copy: ResourceFormCopy
  /** Pins derived state before validation (employee: branch id from my-branch). */
  prepare?: (values: TValues) => void
  /** Form-level rules beside the parse. */
  validateExtra?: (values: TValues, errors: TErrors) => void
  reasonOf?: (error: unknown, fallback: string) => string
  onSaved?: (result: unknown, context: { isCreate: boolean; id: number }) => Promise<void>
  createVars?: (body: TBody) => Record<string, unknown>
  updateVars?: (id: number, body: TBody) => Record<string, unknown>
}

function isApiPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const record = payload as Record<string, unknown>
  return 'api_user' in record && !('first_name' in record)
}

/**
 * User-slice wrapper over `useResourceForm`. Composes the shared skeleton
 * with the identity specifics every user form repeats:
 *
 * - probe wiring (field read + `originalUsername`, `waitForProbe` barrier
 *   before send, taken-username refusal merging the taken message),
 * - password rules via `passwordErrors` + `withPassword` assembly,
 * - validate = schema parse messages + password merge (+ api sub-object split
 *   + `preferred_location` refusal) + probe verdict.
 */
export function useUserForm<
  TValues extends UserFormValuesBase,
  TRecord,
  TBody,
  TErrors extends Record<string, string | undefined>,
>(config: UseUserFormConfig<TValues, TRecord, TBody, TErrors>) {
  const { isCreate } = useRoutePk(config.pk)
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
    validate: async (values: TValues) => {
      config.prepare?.(values)
      const creating = isCreate.value
      const payload = config.payloadOf(values)

      let found: Record<string, string | undefined>
      if (isApiPayload(payload)) {
        // The api-user request nests everything but `username` under
        // `api_user`, so `fieldErrors` keys on the first path segment and a
        // single top-level call only ever sees `username`. Validate the
        // sub-object against its own entry for per-field copy — the same
        // composition `userFormErrors` performs, which this shape cannot call
        // directly (its values lack the first/last/email half).
        const messages = config.fieldMessages as Record<string, ((issue?: v.BaseIssue<unknown>) => string) | undefined>
        const top = fieldErrors(config.schema, payload, { username: messages.username } as FieldMessages<string>)
        const subSchema = (config.schema as unknown as { entries: { api_user: v.GenericSchema } }).entries.api_user
        const subPayload = (payload as Record<string, unknown>).api_user as unknown
        const sub = fieldErrors(subSchema, subPayload, {
          name: messages.name,
          expire_start_dt: messages.expire_start_dt,
          expire_in_days: messages.expire_in_days,
        } as FieldMessages<string>)
        const passwords = passwordErrors(
          values as unknown as Pick<UserIdentityValues, 'password1' | 'password2'>,
          { isCreate: creating },
        )
        found = { ...top, ...sub, ...passwords }
      } else {
        found = { ...userFormErrors(
          config.schema,
          payload,
          values as unknown as UserIdentityValues,
          config.fieldMessages,
          { isCreate: creating },
        ) }
      }

      // `preferred_location` stays nullable on the wire (existing engineers
      // predate it), but the form still refuses an unchosen location, as the
      // legacy form did. A form-level check beside the parse, like the
      // password rules — not a redeclared entry.
      if ((values as Record<string, unknown>).preferred_location === null) {
        const message = (config.fieldMessages as Record<string, (() => string) | undefined>).preferred_location?.()
        if (message && !found.preferred_location) {
          found.preferred_location = message
        }
      }

      config.validateExtra?.(values, found as TErrors)
      if (Object.keys(found).length > 0) return found as TErrors

      await probeRef.current.waitForProbe()

      mergeTakenVerdict(found as Record<string, string | undefined>, {
        probe: probeRef.current,
        read: () => String((values as Record<string, unknown>).username ?? ''),
        original: originalUsername,
        field: 'username',
        message: config.takenMessage,
      })
      return found as TErrors
    },
    parse: (values: TValues) => {
      const creating = isCreate.value
      const payload = config.payloadOf(values)
      const parsed = v.parse(config.schema, payload) as Record<string, unknown>
      const password1 = String((values as Record<string, unknown>).password1 ?? '')
      // The create/edit asymmetry `withPassword` encodes; the cast is safe —
      // it only ever reads `password1`.
      return withPassword(parsed, values as unknown as UserIdentityValues, {
        isCreate: creating,
        password: password1 !== '' ? password1 : undefined,
      }) as unknown as TBody
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
