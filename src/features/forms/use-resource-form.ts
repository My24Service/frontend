import { type QueryClient, type UseMutationOptions } from '@tanstack/vue-query'

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

/**
 * What `useResourceForm` needs of a generated resource (`@/api/resources.gen`):
 * one with a record, read and updated. An `action` has no record and is not
 * a member, so passing one is a type error rather than a form that cannot
 * load; `retrieve` and `update` are required because this composable always
 * builds both. Each member keeps its own `retrieve` - by id in the path, or
 * with no arguments for a singleton.
 */
type WithRecord<R extends Exclude<Api.Resource, Api.ActionResource>> = R & Required<Pick<R, 'retrieve' | 'update'>>

/**
 * `retrieveOptions` re-typed to the shape a form can actually meet.
 *
 * The generic `Resource` declares it `(...args: never[]) => object`, the only
 * signature that admits every resource's real one: a singleton's takes no id,
 * a collection's a `number` or a `string`. Intersecting a narrow signature with
 * that one does not work - the parameter becomes the *intersection* `never &
 * TId`, i.e. `never` - so the loose member is omitted and the narrow one
 * declared afresh. A form knows which kind it has, because it already narrows
 * on `kind` and `id`; this is that narrowing, written once.
 */
interface FormCalls<R extends Exclude<Api.Resource, Api.ActionResource>> {
  retrieveOptions(...args: R extends Api.SingletonResource
    ? []
    : [id: R extends Api.CollectionResource<infer TId> ? TId : never]): object
}

type Formable<R extends Exclude<Api.Resource, Api.ActionResource>> =
  Omit<WithRecord<R>, 'retrieveOptions'> & FormCalls<R>

export type FormResource =
  | Formable<Api.CollectionResource<number>>
  | Formable<Api.CollectionResource<string>>
  | Formable<Api.SingletonResource>

/**
 * Where a form's reads and writes come from: the generated resource, or the
 * generated pieces named by hand. One or the other - a form that names a
 * resource has nothing left to name, and the `never`s make a mix a type
 * error rather than a silent precedence rule.
 */
export type ResourceFormWiring =
  | {
    resource: FormResource
    retrieve?: never
    create?: never
    update?: never
    /**
     * Defaults to `resource.invalidate`. Given when a write stales more
     * than the resource's own reads - the branch form's `branch-my` variant
     * also refreshes the branch list.
     */
    invalidate?: (queryClient: QueryClient) => Promise<unknown>
  }
  | {
    resource?: never
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
    //
    // `create` is optional for the pathless "singleton" screens (the company
    // info, the tenant's settings, a branch employee's own branch), which only
    // ever edit; a create attempt there throws rather than silently doing
    // nothing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create?: UseMutationOptions<any, any, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: UseMutationOptions<any, any, any>
    /** The surviving invalidation concern — the writer refreshes what it made stale. */
    invalidate: (queryClient: QueryClient) => Promise<unknown>
  }

/** What `submitForm` accepts: `stay` keeps the user on the form after a successful write. */
export interface SubmitOptions {
  stay?: boolean
}

function isSubmitOptions(value: unknown): value is SubmitOptions {
  return typeof value === 'object' && value !== null && 'stay' in value
}

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
 *
 * `submitForm` answers whether the record was written, and `{stay: true}`
 * keeps the user on the form afterwards: the equipment, building and
 * location forms' "save and add another" is the adopter. A record without a
 * `:pk` route - the tenant's own settings, the branch employee's own branch -
 * is an edit whose endpoint declares no path; `updateVars` shapes what such
 * an update sends, the way `createVars` does for a create, and `create` is
 * left out.
 */
export function useResourceForm<TValues extends object, TRecord, TBody, TErrors extends object>(config: ResourceFormWiring & {
  pk: () => string | number | null
  /** The variables the create mutation wants, built from the parsed body. Defaults to `{body}`. */
  createVars?: (body: TBody, context: WriteContext) => Record<string, unknown>
  /**
   * The variables the update mutation wants. Defaults to `{path: {id}, body}`,
   * which is what every `/{id}/` endpoint declares; a pathless endpoint
   * (`member/me`, `branch-my`, `my_settings`) refuses a path; a `singleton`
   * resource defaults to `{body}` for that reason, and a screen without one
   * passes `(body) => ({body})` itself.
   */
  updateVars?: (body: TBody, context: WriteContext) => Record<string, unknown>
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
  /**
   * Where a successful save goes. Defaults to `router.go(-1)`; the Order
   * form's "Submit and open dispatch" is the adopter, going forward to the
   * dispatch screen instead of back to the list.
   */
  afterSave?: () => void | Promise<void>
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { create: toast } = useToast()

  const { isCreate, id } = useRoutePk(config.pk)

  // wiring ----------------------------------------------------------------
  //
  // Every one of these asks the resource rather than its parts: `retrieveOptions`
  // already knows whether the id belongs in the path and whether it is an
  // integer or a name, and `invalidate` already walks the resource's own
  // `reads`. What is left for this composable to know is the one thing a
  // resource cannot state - how a *generic* form body becomes this endpoint's
  // variables, which is `updateVars` below.
  const { resource } = config
  // One narrowing per line, because a union of function types takes the
  // *intersection* of its parameters: passing `string | number` to
  // `(id: string) | (id: number)` is a `never`. `kind` and then `id` are the
  // two discriminants, and each names one member.
  const retrieve = resource
    ? (id: number) => {
      if (resource.kind === 'singleton') return resource.retrieveOptions()
      return resource.id === 'string'
        ? resource.retrieveOptions(String(id))
        : resource.retrieveOptions(id)
    }
    : config.retrieve
  const createOptions = resource
    ? resource.kind === 'collection' ? resource.create?.mutation() : undefined
    : config.create
  const updateOptions = resource ? resource.update.mutation() : config.update
  const updateVars = config.updateVars
    ?? (resource?.kind === 'singleton' ? (body: TBody) => ({body}) : undefined)
  const invalidate = config.invalidate
    ?? (resource ? (client: QueryClient) => resource.invalidate(client) : undefined)
  if (!invalidate) {
    throw new Error('useResourceForm: a form needs a resource or an explicit `invalidate`')
  }

  /**
   * The id a create wrote, once its write landed. A record that exists must not
   * be created twice: if the write succeeded but a later step failed — the
   * caller's `onSaved` work, the staged child rows — the retry has to update
   * that record. The route still reads "create" (so the detail read stays off
   * and a form keeps what it staged), but the write context no longer does.
   */
  const createdId = ref<number | null>(null)

  watch([isCreate, id], () => { createdId.value = null })

  /**
   * The write context `validate`, `parse` and `onSaved` receive. `useRoutePk`'s
   * `id` is `Number(pk)`, which is `NaN` on a create; this is where that stops,
   * so no caller ever has to guard against a NaN id.
   */
  const writeContext = computed<WriteContext>(() => {
    if (!isCreate.value) return {isCreate: false, id: id.value}
    if (createdId.value !== null) return {isCreate: false, id: createdId.value}
    return {isCreate: true, id: null}
  })

  // reads -----------------------------------------------------------------

  const detailQuery = useQuery(() => ({
    ...retrieve(id.value),
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

  async function leave() {
    if (config.afterSave) await config.afterSave()
    else router.go(-1)
  }

  /**
   * Set by `submitForm` for the write it is about to make, read by the
   * mutations' `onSuccess`. The re-entry guard makes one write at a time, so a
   * single flag is enough.
   */
  let stayOnForm = false

  const createMutation = useMutation({
    ...(createOptions ?? {
      mutationFn: async () => {
        throw new Error('useResourceForm: this form has no `create` mutation, but was asked to create')
      },
    }),
    onSuccess: async (result: unknown) => {
      // Read the context before recording the id: this first call's `onSaved`
      // is still the create's, even though the retry's will be the update's.
      const context = writeContext.value
      // A "save and add another" stays to create again, so it must not point
      // the form at the record it just made.
      if (!stayOnForm) createdId.value = (result as {id?: number} | null | undefined)?.id ?? null
      await settle(result, context, config.copy.createError)
      infoToast(toast, config.copy.created, config.copy.createdDetail)
      await invalidate(queryClient)
      if (!stayOnForm) await leave()
    },
    onError: (error: unknown) => onWriteError(error, config.copy.createError),
  })

  const updateMutation = useMutation({
    ...updateOptions,
    onSuccess: async (result: unknown) => {
      await settle(result, writeContext.value, config.copy.updateError)
      infoToast(toast, config.copy.updated, config.copy.updatedDetail)
      await invalidate(queryClient)
      if (!stayOnForm) await leave()
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

  /**
   * Validate, parse and send. Resolves `true` only when the record was
   * written - after `onSaved`, the toast and the invalidation - so a caller
   * can tell a written record from a validation failure or a failed write.
   *
   * `{stay: true}` skips the exit (`afterSave` / `router.go(-1)`). The first
   * argument is checked for shape rather than trusted, because the common
   * `@click="form.submitForm"` binding hands over a MouseEvent.
   */
  async function submitForm(options?: SubmitOptions | Event): Promise<boolean> {
    const stay = isSubmitOptions(options) && options.stay === true

    // The re-entry guard three of the six forms were missing.
    if (saving.value) return false
    saving.value = true
    stayOnForm = stay

    try {
      submitClicked.value = true

      const found = await config.validate(values.value, writeContext.value)
      errors.value = found
      if (Object.keys(found).length > 0) return false

      // The parsed output is the body — typed by the request schema and
      // stripped of anything it does not declare.
      const body = config.parse(values.value, writeContext.value)

      try {
        const context = writeContext.value
        if (context.isCreate) {
          await createMutation.mutateAsync(
            (config.createVars ?? ((b: TBody) => ({ body: b })))(body, context))
        } else {
          await updateMutation.mutateAsync(
            (updateVars ?? ((b: TBody) => ({ path: { id: context.id }, body: b })))(body, context))
        }
        return true
      } catch {
        // Already handled: onError told the user what failed, and the form
        // keeps what they entered.
        return false
      }
    } finally {
      saving.value = false
      stayOnForm = false
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
