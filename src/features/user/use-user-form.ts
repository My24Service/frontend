import { computed, ref, watch } from 'vue'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'

import { mergeTakenVerdict } from '@/features/forms/use-availability-probe'
import {
  useResourceForm,
  type ResourceFormCopy,
  type WriteContext,
} from '@/features/forms/use-resource-form'
import { useUsernameProbe } from './use-username-probe'

export interface UserFormValuesBase {
  username: string
  password1: string
  password2: string
}

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
}

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

      if (Object.keys(found).length > 0) return found as TErrors

      await probeRef.current.waitForProbe()

      mergeTakenVerdict(found, {
        probe: probeRef.current,
        read: () => values.username,
        original: originalUsername,
        field: 'username',
        message: config.takenMessage,
      })
      return found as TErrors
    },
    parse: (values: TValues, context: WriteContext) => {
      // The wrapper's half of the password rule: the per-type parse is handed
      // the typed password, or nothing when the field is untouched.
      const password1 = values.password1
      return config.parse(values, {
        ...context,
        password: password1 !== '' ? password1 : undefined,
      })
    },
    copy: config.copy,
  })

  const liveProbe = useUsernameProbe(
    () => base.values.value.username,
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
    liveProbe.state.value === 'taken' && !base.errors.value.username,
  )

  const usernameValidationState = computed(() => {
    const errors = base.errors.value
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
