import VueRouter from 'vue-router'

import TheIndexLayout from '../components/TheIndexLayout.vue'
import auth from '../services/auth'

import store from '../store'
import orders from './orders'
import mobile from './mobile'
import customer from './customer'
import inventory from './inventory'
import company from './company'
import member from './member'
import account from './account'

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
]


const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  store.dispatch('hasAccessToRoute', to.path).then((isAllowed) => {
    if (isAllowed) {
      const needsAuth = to.meta.hasOwnProperty('needsAuth') ? to.meta.needsAuth : true

      console.log('path allowed, checking authenticated', to.path, needsAuth, auth.isAuthenticated())
      if (needsAuth && !auth.isAuthenticated()) {
          console.log('not isAuthenticated and auth needed', to.path)
          next(`/no-access?next=${to.path}`)
      } else {
        next()
      }
    } else {
      console.log('not allowed', to.path)
      next(`/no-access?next=${to.path}`)
    }
  });
});

export default router
