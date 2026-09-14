import moment from 'moment'

import my24 from './services/my24'
import {$trans} from './services/i18n'
import {OrderService} from './models/orders/Order'

// Deep import on purpose: the "@/features/auth" door re-exports LoginForm.vue,
// which pulls bootstrap-vue-next into this module's graph and deadlocks specs
// that mock it through tests/unit/support/form-harness.js.
import {useAuthStore} from "@/features/auth/store";
import {useMainStore} from "@/stores/main";

function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

function translateHoursField(field) {
  const allFields = {
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
}

function displayDurationFromSeconds(seconds, exclude_seconds) {
  return this.displayDuration(moment.duration(seconds*1000), exclude_seconds)
}

function displayDuration(duration, exclude_seconds) {
  const totalMilliseconds = duration.as('milliseconds')
  const hours = parseInt(moment.duration(totalMilliseconds).asHours())
  const format = exclude_seconds ? 'mm' : 'mm:ss'
  return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
}

async function doFetchUnacceptedCountAndUpdateStore() {
  const store = useMainStore()
  const service = new OrderService()
  const countResult = await service.getUnacceptedCount()
  if (countResult && 'count' in countResult) {
    store.setUnacceptedCount(countResult.count)
  }
}

function hasAccessToModule(module, part) {
  const authStore = useAuthStore()
  const mainStore = useMainStore()
  return my24.hasAccessToModule({
    isStaff: authStore.isStaff,
    isSuperuser: authStore.isSuperuser,
    contract: mainStore.memberContract,
    module,
    part,
  })
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export {
  isEmpty,
  translateHoursField,
  displayDurationFromSeconds,
  displayDuration,
  doFetchUnacceptedCountAndUpdateStore,
  hasAccessToModule,
  uuidv4
}
