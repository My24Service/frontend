import moment from 'moment'

import my24 from './services/my24'
import {OrderService} from './models/orders/Order.js'

import {
  AUTH_LEVELS
} from "./constants";
import Dinero from "dinero.js";
import {useStore} from "vuex";

function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

function getIsLoggedIn(store) {
  return store.getters.isLoggedIn
}

function getUserAuthLevel(store) {
  if (store.getters.getIsStudent) {
    return AUTH_LEVELS.STUDENT
  }

  if (store.getters.getIsSales) {
    return AUTH_LEVELS.SALES
  }

  if (store.getters.getIsEngineer) {
    return AUTH_LEVELS.ENGINEER
  }

  if (store.getters.getIsCustomer) {
    return AUTH_LEVELS.CUSTOMER
  }

  if (store.getters.getIsPlanning) {
    return AUTH_LEVELS.PLANNING
  }

  if (store.getters.getIsEmployee) {
    return AUTH_LEVELS.EMPLOYEE
  }

  if (store.getters.getIsSuperuser) {
    return AUTH_LEVELS.SUPERUSER
  }

  if (store.getters.getIsStaff) {
    return AUTH_LEVELS.STAFF
  }
}

function hasAccessRouteAuthLevel(authLevelNeeded, store) {
  const authLevelUser = getUserAuthLevel(store)

  // TODO in the future use ONLY arrays?
  // let needed = typeof authLevelNeeded === 'string' ? [ authLevelNeeded ] : authLevelNeeded
  if (typeof authLevelNeeded === 'string') {
    if (authLevelNeeded === AUTH_LEVELS.STAFF) {
      return authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.SUPERUSER) {
      return authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.PLANNING) {
      return authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.SALES) {
      return authLevelUser === AUTH_LEVELS.SALES || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.CUSTOMER) {
      return authLevelUser === AUTH_LEVELS.CUSTOMER || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.EMPLOYEE) {
      return authLevelUser === AUTH_LEVELS.EMPLOYEE || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.STUDENT) {
      return authLevelUser === AUTH_LEVELS.STUDENT || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }

    if (authLevelNeeded === AUTH_LEVELS.ENGINEER) {
      return authLevelUser === AUTH_LEVELS.ENGINEER || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
    }
  }

  if (typeof authLevelNeeded === 'object') {
    return authLevelNeeded.indexOf(authLevelUser) !== -1 || authLevelUser === AUTH_LEVELS.PLANNING || authLevelUser === AUTH_LEVELS.STAFF || authLevelUser === AUTH_LEVELS.SUPERUSER
  }

  return false
}

function translateHoursField(field) {
  const allFields = {
    'work_total': this.$trans("Work total"),
    'break_total': this.$trans('Breaks total'),
    'travel_total': this.$trans('Travel total'),
    'distance_total': this.$trans('Distance total'),
    'extra_work': this.$trans('Total extra work'),
    'actual_work': this.$trans('Total actual work'),
    'unforeseen_work': this.$trans('Total unforeseen work'),
    'distance_fixed_rate_amount': this.$trans('Total trips')
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
  const service = new OrderService()
  const countResult = await service.getUnacceptedCount()
  const store = useStore()
  if (countResult && 'count' in countResult) {
    await store.dispatch('setUnacceptedCount', countResult.count)
  }
}

function hasAccessToModule(module, part) {
  const store = useStore()
  return my24.hasAccessToModule({
    isStaff: store.getters.getIsStaff,
    isSuperuser: store.getters.getIsSuperuser,
    contract: store.state.memberContract,
    module,
    part,
  })
}

function toDinero(priceDecimal, currency) {
  if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') {
    let amount = priceDecimal * 100
    amount = parseInt(amount.toFixed(0))
    // console.log({ priceDecimal, amount, currency })
    if (isNaN(amount)) {
      throw `toDinero - invalid input for amount: ${priceDecimal}`
    }
    return Dinero({ amount, currency })
  } else {
    throw `${currency} not supported`
  }
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function $trans(text) {
  if (!window.django) {
    return text
  }

  if (window.member_type_text && text in window.member_type_text) {
    return django.gettext(window.member_type_text[text])
  }

  return django.gettext(text)
}

export {
  isEmpty,
  translateHoursField,
  displayDurationFromSeconds,
  displayDuration,
  doFetchUnacceptedCountAndUpdateStore,
  hasAccessToModule,
  getIsLoggedIn,
  hasAccessRouteAuthLevel,
  getUserAuthLevel,
  toDinero,
  uuidv4,
  $trans
}
