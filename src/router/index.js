import VueRouter from 'vue-router'

import TheIndexLayout from '../components/TheIndexLayout.vue'

import store from '../store'
import orders from './orders'
import mobile from './mobile'
import customer from './customer'
import inventory from './inventory'
import company from './company'
import member from './member'
import account from './account'
import catchall from './catchall'
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
  ...inventory,
  ...company,
  ...member,
  ...account,
  ...catchall,
]

const router = new VueRouter({
  routes
})

router.beforeEach(async (to, from, next) => {
  const isAllowedMemberPath = await store.dispatch('hasAccessToRoute', to.path)

  if (!isAllowedMemberPath) {
    console.log(`route not allowed because of member: path=${to.path}`)
    next(`/no-access?next=${to.path}`)
    return
  }

  const needsAuth = to.meta.hasOwnProperty('needsAuth') ? to.meta.needsAuth : true

  if (!needsAuth) {
    console.log(`route allowed, no auth needed: path=${to.path}`)
    next()
    return
  }

  if (!getIsLoggedIn(store)) {
    console.log(`route not allowed for user (not logged in), path: ${to.path}, needsAuth: ${needsAuth}, logged in: ${getIsLoggedIn(store)}`)
    next(`/no-access?next=${to.path}`)
    return
  }

  // check user type if needed
  const authLevelNeeded = to.meta.hasOwnProperty('authLevelNeeded') ? to.meta.authLevelNeeded : AUTH_LEVELS.PLANNING
  if (hasAccessRouteAuthLevel(authLevelNeeded, store)) {
    console.log(`route allowed: path=${to.path}, needed: ${authLevelNeeded}, user level: ${getUserAuthLevel(store)}`)
    next()
    return
  }

  console.log(`route not allowed because of user auth level: path=${to.path}, needed: ${authLevelNeeded}, user level: ${getUserAuthLevel(store)}`)
  next(`/no-access?next=${to.path}`)
});

export default router
