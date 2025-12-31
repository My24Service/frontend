import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'

import TheIndexLayout from '../components/TheIndexLayout.vue'

// import store from '../store'
import orders from './orders'
import quotations from './quotations'
import invoices from './invoices'
import mobile from './mobile'
import customer from './customer'
import equipment from './equipment'
import inventory from './inventory'
import company from './company'
import member from './member'
import account from './account'
import budget from './budget'
import catchall from './catchall'
import webshop from './webshop'
import bim from './bim'
import docks from './docks'
import {AUTH_LEVELS} from "@/constants";
import {getIsLoggedIn, getUserAuthLevel, hasAccessRouteAuthLevel} from "@/utils";
import {useStore} from "vuex";

const routes = [
  {
    meta: { needsAuth: false },
    path: '/',
    component: TheIndexLayout
  },
  ...webshop,
  ...bim,
  ...orders,
  ...quotations,
  ...invoices,
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

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const store = useStore()
  const isAllowedMemberPath = await store.dispatch('hasAccessToRoute', to.path)
  const path = to.path;
  const needsAuth = to.meta.hasOwnProperty('needsAuth') ? to.meta.needsAuth : true
  const authLevelNeeded = to.meta.hasOwnProperty('authLevelNeeded') ? to.meta.authLevelNeeded : AUTH_LEVELS.PLANNING
  const pathAuthLevel = authLevelNeeded;
  const userIsLoggedIn = getIsLoggedIn(store);
  const userAuthLevel = userIsLoggedIn ? getUserAuthLevel(store) : null;

  if (!needsAuth) {
    console.debug('route allowed, no auth needed', {path})
    next()
    return
  }

  if (!isAllowedMemberPath) {
    console.warn('route not allowed because of member', {path});
    next(`/no-access?next=${to.path}`)
    return
  }

  if (!getIsLoggedIn(store)) {
    console.warn('route not allowed for user (not logged in)',{path, needsAuth, userIsLoggedIn})
    next(`/no-access?next=${to.path}`)
    return
  }

  // check user type if needed
  if (hasAccessRouteAuthLevel(authLevelNeeded, store)) {
    console.debug('route allowed', {path, pathAuthLevel, userAuthLevel})
    next()
    return
  }

  console.warn('route not allowed because of user auth level', {path, pathAuthLevel, userAuthLevel})
  next(`/no-access?next=${to.path}`)
});
