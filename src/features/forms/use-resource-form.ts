import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import { errorToast, infoToast } from '@/services/i18n'
import { useRoutePk } from './use-route-pk'
import { useQueryErrorToast } from './use-query-error-toast'

/**
 * Which write a form is about to make, and the id it addresses.
 *
 * Discriminated so the id stays honest: a create has no id yet (`null`, not the
 * `NaN` that `Number(null)` produces), and an edit's id is a real number.
 * `validate`, `parse` and `onSaved` all receive it, so none of them has to
 * re-derive "is this a create?" from the route prop. A callback that does not
 * care simply declares one parameter.
 */
export type WriteContext = {isCreate: true; id: null} | {isCreate: false; id: number}

/** The seven strings a create/edit form says. Already localized by the caller. */
export interface ResourceFormCopy {
  fetchError: string
  created: string
  createdDetail: string
  updated: string
  updatedDetail: string
  createError: string
  updateError: string
}

/**
 * The create/edit skeleton the user forms each wrote out by hand: the pk
 * split, the detail read (fetched only when editing), the error toast, the
 * create/update mutation pair with its toast + invalidate + `router.go(-1)`,
 * the loading and double-submit guards, and validate → parse → send.
 *
 * A form keeps only what is actually its own: extra reads, field state, and
 * panel-specific logic. Failed writes surface the passed `createError` /
 * `updateError` copy verbatim; the Member form is the one that says otherwise,
 * passing `saveErrorReason` so the API's own reason reaches the toast body
 * (its ledger row records that, and its spec pins it).
 */
export function useResourceForm<TValues extends object, TRecord, TBody, TErrors extends object>(config: {
  pk: () => string | number | null
  /** The generated `*RetrieveOptions` for this record. */
  retrieve: (id: number) => Record<string, unknown>
  /**
   * The generated `*CreateMutation()` / `*PartialUpdateMutation()` results.
   *
   * `any` rather than a type parameter, and the reason is narrower than
   * "contravariance": `UseMutationOptions` is not a plain data shape. It
   * re-exposes the response and the error through the parameters of
   * `onSuccess`, `onSettled`, `onError` and `throwOnError`, which makes BOTH
   * slots invariant, so `unknown` is rejected the moment a generated pair is
   * passed and only `any` — or that pair's exact types — satisfies them. The
   * variables slot *could* be parameterized, but every call site already
   * supplies four explicit type arguments and TypeScript does not infer the
   * parameters that follow them: the fifth and sixth would silently take their
   * defaults. Buying the fix means naming five generated types across ten type
   * arguments at ~14 call sites, plus four casts inside this composable, to
   * delete two suppressed `any`s. That was measured, not assumed — the spike is
   * recorded in the 2026-09-10 session log.
   *
   * Only `mutationFn` is used from these — the composable supplies its own
   * `onSuccess`/`onError`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: UseMutationOptions<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: UseMutationOptions<any, any, any>
  /** The variables each mutation wants, built from the parsed body. */
  createVars?: (body: TBody) => Record<string, unknown>
  /** The surviving invalidation concern — the writer refreshes what it made stale. */
  invalidate: (queryClient: QueryClient) => Promise<unknown>
  empty: () => TValues
  fromRecord: (record: TRecord) => TValues
  validate: (values: TValues, context: WriteContext) => TErrors | Promise<TErrors>
  /**
   * Work that belongs to the same save: rows staged in the form that can only
   * be written once the record has an id. Runs after the write and before the
   * success toast, so a failure here reports as a failed save and the form
   * keeps the user on it.
   */
  onSaved?: (result: unknown, context: WriteContext) => Promise<void>
  parse: (values: TValues, context: WriteContext) => TBody
  copy: ResourceFormCopy
  /**
   * Maps a write failure to the toast body. Defaults to the identity (the
   * passed `createError` / `updateError` verbatim); the Member form's
   * `saveErrorReason` is the adopter, and every other form keeps the generic
   * copy its spec pins.
   */
  reasonOf?: (error: unknown, fallback: string) => string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { create: toast } = useToast()

  const { isCreate, id } = useRoutePk(config.pk)

  /**
   * The write context `validate`, `parse` and `onSaved` receive. `useRoutePk`'s
   * `id` is `Number(pk)`, which is `NaN` on a create; this is where that stops,
   * so no caller ever has to guard against a NaN id.
   */
  const writeContext = computed<WriteContext>(() =>
    isCreate.value ? {isCreate: true, id: null} : {isCreate: false, id: id.value},
  )

  // reads -----------------------------------------------------------------

  const detailQuery = useQuery(() => ({
    ...config.retrieve(id.value),
    // A create form has no record to fetch; without this the retrieve fires
    // against `undefined`.
    enabled: !isCreate.value,
  }) as never)

  /**
   * The fetched record, typed. `detailQuery` itself is deliberately loose —
   * the generated query options resist a single generic signature — so this is
   * the accessor screens should read.
   */
  const record = computed(() => detailQuery.data.value as TRecord | undefined)

  useQueryErrorToast(detailQuery.error, config.copy.fetchError)

  // form state ------------------------------------------------------------

  const values = ref(config.empty()) as Ref<TValues>

  watch(
    () => detailQuery.data.value,
    (data) => {
      if (!data) return
      values.value = config.fromRecord(data as TRecord)
    },
    { immediate: true },
  )

  // writes ----------------------------------------------------------------

  function onWriteError(error: unknown, fallback: string) {
    const reason = (config.reasonOf ?? ((_: unknown, body: string) => body))(error, fallback)
    errorToast(toast, reason)
  }

  /** Run the caller's post-write work, reporting its failure as a failed save. */
  async function settle(result: unknown, context: WriteContext, fallback: string) {
    if (config.onSaved) {
      try {
        await config.onSaved(result, context)
      } catch (error) {
        // onError does not fire for a throw inside onSuccess, so tell the user
        // here, then abort: no success toast and no navigation away.
        onWriteError(error, fallback)
        throw error
      }
    }
  }

  const createMutation = useMutation({
    ...config.create,
    onSuccess: async (result: unknown) => {
      await settle(result, writeContext.value, config.copy.createError)
      infoToast(toast, config.copy.created, config.copy.createdDetail)
      await config.invalidate(queryClient)
      router.go(-1)
    },
    onError: (error: unknown) => onWriteError(error, config.copy.createError),
  })

  const updateMutation = useMutation({
    ...config.update,
    onSuccess: async (result: unknown) => {
      await settle(result, writeContext.value, config.copy.updateError)
      infoToast(toast, config.copy.updated, config.copy.updatedDetail)
      await config.invalidate(queryClient)
      router.go(-1)
    },
    onError: (error: unknown) => onWriteError(error, config.copy.updateError),
  })

  // guards ----------------------------------------------------------------

  const saving = ref(false)

  const isLoading = computed(() =>
    detailQuery.isLoading.value ||
    saving.value ||
    createMutation.isPending.value ||
    updateMutation.isPending.value,
  )
  const buttonDisabled = computed(() =>
    saving.value || createMutation.isPending.value || updateMutation.isPending.value,
  )

  // validation ------------------------------------------------------------

  const errors = ref({}) as Ref<TErrors>
  const submitClicked = ref(false)

  async function submitForm(): Promise<void> {
    // The re-entry guard three of the six forms were missing.
    if (saving.value) return
    saving.value = true

    try {
      submitClicked.value = true

      const found = await config.validate(values.value, writeContext.value)
      errors.value = found
      if (Object.keys(found).length > 0) return

      // The parsed output is the body — typed by the request schema and
      // stripped of anything it does not declare.
      const body = config.parse(values.value, writeContext.value)

      try {
        if (isCreate.value) {
          await createMutation.mutateAsync(
            (config.createVars ?? ((b: TBody) => ({ body: b })))(body))
        } else {
          await updateMutation.mutateAsync({ path: { id: id.value }, body })
        }
      } catch {
        // Already handled: onError told the user what failed, and the form
        // keeps what they entered.
      }
    } finally {
      saving.value = false
    }
  }

  function cancelForm(): void {
    router.go(-1)
  }

  return {
    isCreate,
    id,
    detailQuery,
    record,
    values,
    errors,
    submitClicked,
    saving,
    isLoading,
    buttonDisabled,
    createMutation,
    updateMutation,
    submitForm,
    cancelForm,
  }
}
