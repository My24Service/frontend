import VueRouter from 'vue-router'

import TheIndexLayout from '../components/TheIndexLayout.vue'

import store from '../store'
import orders from './orders'
import mobile from './mobile'
import customer from './customer'
import equipment from './equipment'
import inventory from './inventory'
import company from './company'
import member from './member'
import account from './account'
import budget from './budget'
import catchall from './catchall'
import docks from './docks'
import {AUTH_LEVELS} from "../constants";
import {getIsLoggedIn, getUserAuthLevel, hasAccessRouteAuthLevel} from "../utils";

const routes = [
  {
    meta: { needsAuth: false },
    path: '/',
    component: TheIndexLayout
  },
  ...orders,
  ...mobile,
  ...customer,
  ...equipment,
  ...inventory,
  ...company,
  ...member,
  ...account,
  ...budget,
  ...catchall,
  ...docks,
]

const router = new VueRouter({
  routes
})

router.beforeEach(async (to, from, next) => {
  const isAllowedMemberPath = await store.dispatch('hasAccessToRoute', to.path)

  if (!isAllowedMemberPath) {
    console.debug(`route not allowed because of member: path=${to.path}`)
    next(`/no-access?next=${to.path}`)
    return
  }

  const needsAuth = to.meta.hasOwnProperty('needsAuth') ? to.meta.needsAuth : true

  if (!needsAuth) {
    console.debug(`route allowed, no auth needed: path=${to.path}`)
    next()
    return
  }

  if (!getIsLoggedIn(store)) {
    console.debug(`route not allowed for user (not logged in), path: ${to.path}, needsAuth: ${needsAuth}, logged in: ${getIsLoggedIn(store)}`)
    next(`/no-access?next=${to.path}`)
    return
  }

  // check user type if needed
  const authLevelNeeded = to.meta.hasOwnProperty('authLevelNeeded') ? to.meta.authLevelNeeded : AUTH_LEVELS.PLANNING
  if (hasAccessRouteAuthLevel(authLevelNeeded, store)) {
    console.debug(`route allowed: path=${to.path}, needed: ${authLevelNeeded}, user level: ${getUserAuthLevel(store)}`)
    next()
    return
  }

  console.debug(`route not allowed because of user auth level: path=${to.path}, needed: ${authLevelNeeded}, user level: ${getUserAuthLevel(store)}`)
  next(`/no-access?next=${to.path}`)
});

export default router
