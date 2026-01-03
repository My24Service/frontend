import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import {useMainStore} from "@/stores/main";
import TheIndexLayout from '../components/TheIndexLayout.vue'

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
import {getUserAuthLevel, hasAccessRouteAuthLevel} from "@/utils";
import { useAuthStore } from '@/stores/auth'

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
  const authStore = useAuthStore()
  const mainStore = useMainStore()
  const userIsLoggedIn = authStore.isLoggedIn;
  const isAllowedMemberPath = userIsLoggedIn ? await mainStore.hasAccessToRoute(to.path) : false;
  const path = to.path;
  const needsAuth = to.meta.hasOwnProperty('needsAuth') ? to.meta.needsAuth : true
  const authLevelNeeded = to.meta.hasOwnProperty('authLevelNeeded') ? to.meta.authLevelNeeded : AUTH_LEVELS.PLANNING
  const pathAuthLevel = authLevelNeeded;
  const userAuthLevel = userIsLoggedIn ? getUserAuthLevel() : null;

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

  if (!userIsLoggedIn) {
    console.warn('route not allowed for user (not logged in)',{path, needsAuth, userIsLoggedIn})
    next(`/no-access?next=${to.path}`)
    return
  }

  // check user type if needed
  if (hasAccessRouteAuthLevel(authLevelNeeded)) {
    console.debug('route allowed', {path, pathAuthLevel, userAuthLevel})
    next()
    return
  }

  console.warn('route not allowed because of user auth level', {path, pathAuthLevel, userAuthLevel})
  next(`/no-access?next=${to.path}`)
});
