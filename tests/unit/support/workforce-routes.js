/**
 * The routes the Workforce-Slice screens link to, for the harness's router.
 *
 * Same purpose as `statuscode-routes.js`: a deep mount renders the real
 * `<router-link>`s, each resolving its `:to` at setup time, and an unknown
 * name throws "No match for {name}". The names and paths mirror the
 * time-registration blocks of `src/router/company.js`, so a spec that follows
 * a link lands where the application would.
 */

const blank = { template: '<div />' }

export const workforceRoutes = [
  { path: '/company/time-registration', name: 'company-time-registration', component: blank },
  { path: '/company/time-registration/detail/:user_id', name: 'company-time-registration-detail', component: blank },
  { path: '/company/time-registration/leave/requests', name: 'leave-requests', component: blank },
  { path: '/company/time-registration/leave', name: 'leave-list', component: blank },
  { path: '/company/time-registration/leave/form', name: 'leave-list-add', component: blank },
  { path: '/company/time-registration/leave/form/:pk', name: 'leave-edit', component: blank },
  { path: '/company/time-registration/leave/types', name: 'leave-types', component: blank },
  { path: '/company/time-registration/sick-leave/unconfirmed', name: 'unconfirmed-sick-leave', component: blank },
  { path: '/company/time-registration/sick-leave', name: 'sick-leave-list', component: blank },
  { path: '/company/time-registration/sick-leave/form', name: 'sick-leave-list-add', component: blank },
  { path: '/company/time-registration/sick-leave/form/:pk', name: 'sick-leave-list-edit', component: blank },
]
