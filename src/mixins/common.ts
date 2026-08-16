import moment from "moment"
import { computed, type ComputedRef } from "vue"

import my24 from "@/services/my24"
import { $trans } from "@/utils"
import { useAuthStore } from "@/stores/auth"
import { useMainStore } from "@/stores/main"
import { isShltrTheme } from "@/theme"

/**
 * The shared component helpers, in one declaration usable from both API styles.
 *
 * The getters below are plain zero-argument functions that read their store on
 * every call. That is what makes the two exports possible from one source:
 * the options mixin uses them verbatim as `computed` (Vue calls them with the
 * component as `this`, which none of them need), and `useCommon()` wraps each
 * in `computed()` for `<script setup>`. Adding a helper here adds it to both.
 *
 * None of them may use `this` - that is the whole constraint.
 */
const getters = {
  // Which design a component should render. Resolved once at load from the
  // tenant's companycode; see @/theme.
  isShltrTheme: () => isShltrTheme,
  isStaff: () => useAuthStore().isStaff,
  isSuperuser: () => useAuthStore().isSuperuser,
  isAdmin: () => useAuthStore().isAdmin,
  isPlanning: () => useAuthStore().isPlanning,
  isCustomer: () => useAuthStore().isCustomer,
  isEngineer: () => useAuthStore().isEngineer,
  isSales: () => useAuthStore().isSales,
  isStudent: () => useAuthStore().isStudent,
  isEmployee: () => useAuthStore().isEmployee,
  isBranchEmployee: () => useAuthStore().isBranchEmployee,
  isLoggedIn: () => useAuthStore().isLoggedIn,
  username: () => useAuthStore().getUserName,
  hasBranches: () => useMainStore().getMemberHasBranches,
  companyIsDemo: () => useMainStore().getMemberCompanycode === 'demo',
  branchEmployeeBranch: () => useAuthStore().branchEmployeeBranch,
}

const methods = {
  $trans(text: string) {
    return $trans(text)
  },
  translateHoursField(field: string) {
    const allFields: Record<string, string> = {
      'work_total': $trans("Work total"),
      'break_total': $trans('Breaks total'),
      'travel_total': $trans('Travel total'),
      'distance_total': $trans('Distance total'),
      'extra_work': $trans('Total extra work'),
      'actual_work': $trans('Total actual work'),
      'unforeseen_work': $trans('Total unforeseen work'),
      'distance_fixed_rate_amount': $trans('Total trips')
    }

    return allFields[field]
  },
  displayDurationFromSeconds(seconds: number, exclude_seconds?: boolean) {
    return methods.displayDuration(moment.duration(seconds * 1000), exclude_seconds)
  },
  displayDuration(duration: moment.Duration, exclude_seconds?: boolean) {
    const totalMilliseconds = duration.as('milliseconds')
    const hours = parseInt(String(moment.duration(totalMilliseconds).asHours()))
    const format = exclude_seconds ? 'mm' : 'mm:ss'
    return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
  },
  hasAccessToModule(module: string, part?: string) {
    return my24.hasAccessToModule({
      isStaff: getters.isStaff(),
      isSuperuser: getters.isSuperuser(),
      contract: useMainStore().memberContract,
      module,
      part,
    })
  },
}

type Getters = typeof getters
type UseCommon = { [K in keyof Getters]: ComputedRef<ReturnType<Getters[K]>> } & typeof methods

/**
 * The composition-API half: the same getters as computed refs, plus the
 * methods unchanged.
 *
 * A `<script setup>` component destructures what it needs
 * (`const { isPlanning, hasBranches } = useCommon()`) and uses the refs
 * directly - the template unwraps them, so the markup reads the same as it
 * did under the mixin.
 */
export function useCommon(): UseCommon {
  const wrapped = Object.fromEntries(
    Object.entries(getters).map(([name, read]) => [name, computed(read)]),
  )

  return { ...wrapped, ...methods } as UseCommon
}

/**
 * The options-API half. Unchanged in behaviour and still the default export,
 * so the ~100 `mixins: [componentMixin]` call sites keep working as they are.
 */
const componentMixin = {
  computed: { ...getters },
  methods: { ...methods },
}

export default componentMixin
