import moment from 'moment/min/moment-with-locales'
import type {Moment} from 'moment'

/**
 * The week the two UserHours screens show, and the arrows that move it.
 *
 * Both grids are declarative children: the parent fetches the payload and hands
 * it over through `processData`, while the week itself rides the address so the
 * parent refetches on it and the browser's back button walks the same steps.
 * The row shapes stay with the screens - one row per user on the list, one row
 * per day field on the detail - but the week state, its navigation and the
 * table vocabulary live here, next to `hours-fields.ts` which already groups
 * this pair's shared vocabulary the same way.
 */
export interface TableField {
  key: string
  label: string
  sortable?: boolean
}

export function useHoursWeekNav() {
  const store = useMainStore()
  const route = useRoute()
  const router = useRouter()

  const lang: string = store.getCurrentLanguage || 'nl'
  // Which day the week starts on is the locale's first day of the week, so the
  // index that lands on Monday is 1 in an English (Sunday-first) locale and 0 in
  // every other one. The parent computes its `start_date` the same way.
  const monday = lang === 'en' ? 1 : 0
  moment.locale(lang)
  // The week on screen is a plain date string, not a Moment: a Moment in a ref is
  // moved by mutating it in place, which Vue cannot see, so the header would keep
  // the week number it started on between two arrows. The legacy screens were
  // spared that only by the layout rebuilding the screen on every change of the
  // address (`:key="$route.fullPath"` in src/components/TheAppLayout.vue).
  const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
  const startDate = ref(dateQuery ?? moment().weekday(monday).format('YYYY-MM-DD'))
  const today = computed<Moment>(() => moment(startDate.value))
  const week = computed(() => today.value.format('[week] W'))

  /**
   * Move the week through the address rather than in local state: the parent
   * reads the date from the address and refetches on it, and the browser's back
   * button walks the same steps. The duplicate-navigation rejection is swallowed,
   * as the legacy screens swallowed it.
   */
  function goToWeek(days: number) {
    startDate.value = today.value.clone().add(days, 'days').format('YYYY-MM-DD')

    const query = {
      ...route.query,
      date: startDate.value,
    }
    router.push({query}).catch(() => {})
  }

  function nextWeek() {
    goToWeek(7)
  }

  function backWeek() {
    goToWeek(-7)
  }

  return {startDate, today, week, goToWeek, nextWeek, backWeek}
}

/**
 * The day columns and the week-total column both grids render, in payload
 * order. Each grid prepends its own lead column - 'User' on the list, 'Field'
 * on the detail - and keeps its own rows.
 */
export function buildDayHeaderColumns(dateList: string[]): TableField[] {
  const columns: TableField[] = []

  for (let i = 0; i < dateList.length; i++) {
    columns.push({
      key: `day${i}`,
      label: moment(dateList[i]).format('ddd DD'),
      sortable: true,
    })
  }

  columns.push({
    key: 'total',
    label: $trans('Total'),
    sortable: true,
  })

  return columns
}
