import VueRouter from 'vue-router'

import TheIndexLayout from '@/components/TheIndexLayout'

import store from '@/store'
import orders from './orders'
import mobile from './mobile'
import customer from './customer'
import inventory from './inventory'
import company from './company'
import member from './member'
import account from './account'

const routes = [
  {
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
      console.log('allowed', to.path)
      next()
    } else {
      console.log('not allowed', to.path)
      next(`/no-access?next=${to.path}`)
    }
  });
});

export default router
