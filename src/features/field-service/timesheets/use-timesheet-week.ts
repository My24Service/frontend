import moment from 'moment/min/moment-with-locales'

import {mobileAssignedorderListTimesheetTotalsRetrieveOptions} from '@/api/@tanstack/vue-query.gen'

/**
 * The week's totals for the two Timesheet screens, and the materials booked
 * against that week.
 *
 * One request feeds both the grid and the materials table. The grid is a child
 * that renders what it is given - it is declarative and therefore cannot fetch
 * - so the payload is loaded here, once, and handed over through the child's
 * `processData`. Each Timesheet screen owns its own query: the two used to
 * share a module-level model whose `setListArgs` the detail overwrote for the
 * list and back again.
 *
 * The list screen calls this with no user; the detail screen passes the route's
 * `user_id`, which arrives as text while the endpoint's type is an integer.
 */
export interface TimesheetChildHandle {
  processData: (payload: Api.ListTimesheetTotalsResponse) => void
}

export function useTimesheetWeek(
  getChild: () => TimesheetChildHandle | null | undefined,
  userId?: MaybeRefOrGetter<string | number | null | undefined>,
) {
  const store = useMainStore()
  const route = useRoute()

  const lang: string = store.getCurrentLanguage || 'nl'
  // See UserHoursData: the index that lands on Monday depends on whether the
  // locale starts its week on Sunday.
  const monday = lang === 'en' ? 1 : 0
  moment.locale(lang)

  /**
   * The week the screen shows, from the address.
   *
   * A date in the query string is the day itself and is used verbatim; only an
   * address without one falls back to the week the screen is in. It is read
   * reactively rather than once at creation: the layout renders the content view
   * with `:key="$route.fullPath"` (src/components/TheAppLayout.vue), so the
   * legacy screen was rebuilt - and refetched - on every change of the address,
   * and week navigation rides that query.
   */
  const startDate = computed(() => {
    const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
    return (dateQuery ? moment(dateQuery) : moment().weekday(monday)).format('YYYY-MM-DD')
  })

  /**
   * The week's totals, for the week on screen.
   *
   * The endpoint declares `start_date` as the anchor its window is computed
   * from; sending none asks for the endpoint's own default window. Without a
   * user this is everybody's week; with one it is that user's.
   */
  const timesheet = useQuery(() => mobileAssignedorderListTimesheetTotalsRetrieveOptions({
    query: userId === undefined
      ? {start_date: startDate.value}
      : {
        user_id: Number(toValue(userId)),
        start_date: startDate.value,
      },
  }))

  const isLoading = computed(() => timesheet.isLoading.value)

  /**
   * The materials of the week on screen.
   *
   * Assigned only when a payload arrives, so a failed week leaves the last good
   * one standing - as the legacy screen did, which filled this in its try block
   * only. The grid behaves the same way, because the child keeps whatever
   * `processData` was last given.
   */
  const materials = ref<Api.ListTimesheetTotalsResponse['materials']>([])

  // A watcher rather than the request's own continuation, because either of the
  // two facts it needs can arrive second: the payload (which vue-query hands
  // over synchronously when the week is already cached) or the child (which
  // mounts with this template and may be replaced later).
  watchEffect(() => {
    const payload = timesheet.data.value
    const child = getChild()

    if (!payload) return

    materials.value = payload.materials

    // The parent's call lands on a ref the child exposes; a child that is not
    // there (or is a stub) must not throw, so the handle is checked first.
    if (typeof child?.processData === 'function') {
      child.processData(payload)
    }
  })

  const materialFields = [
    {label: $trans('Material'), key: 'material_name', sortable: true},
    {label: $trans('Identifier'), key: 'material_identifier', sortable: true},
    {label: $trans('Amount'), key: 'amount', sortable: true},
  ]

  return {startDate, timesheet, isLoading, materials, materialFields}
}
