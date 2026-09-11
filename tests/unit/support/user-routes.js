/**
 * The routes the User-Slice screens link to, for the harness's router.
 *
 * Same purpose as `member-routes.js`: a deep mount renders the real
 * `<router-link>`s, each resolving its `:to` at setup time — an unknown name
 * throws "No match for {name}" and the mount dies. The paths mirror
 * `src/router/company.js` (and the settings tree that mounts the employee
 * and planning screens a second time), so a spec that navigates rather than
 * remounting lands where the application would.
 */

const blank = { template: '<div />' }

export const userRoutes = [
  { path: '/company/engineer-users', name: 'users-engineers', component: blank },
  { path: '/company/engineer-users/form/:pk', name: 'engineer-edit', component: blank },
  { path: '/company/engineer-users/form', name: 'engineer-add', component: blank },

  { path: '/company/sales-users', name: 'users-salesusers', component: blank },
  { path: '/company/sales-users/form/:pk', name: 'salesuser-edit', component: blank },
  { path: '/company/sales-users/form', name: 'salesuser-add', component: blank },

  { path: '/company/customer-users', name: 'users-customerusers', component: blank },
  { path: '/company/customer-users/form/:pk', name: 'customeruser-edit', component: blank },
  { path: '/company/customer-users/form', name: 'customeruser-add', component: blank },

  { path: '/company/planning-users', name: 'users-planningusers', component: blank },
  { path: '/company/planning-users/form/:pk', name: 'planninguser-edit', component: blank },
  { path: '/company/planning-users/form', name: 'planninguser-add', component: blank },

  { path: '/company/api-users', name: 'users-apiusers', component: blank },
  { path: '/company/api-users/form/:pk', name: 'apiuser-edit', component: blank },
  { path: '/company/api-users/form', name: 'apiuser-add', component: blank },

  { path: '/company/employee-users', name: 'users-employees', component: blank },
  { path: '/company/employee-users/form/:pk', name: 'employee-edit', component: blank },
  { path: '/company/employee-users/form', name: 'employee-add', component: blank },

  { path: '/company/student-users', name: 'users-studentusers', component: blank },
  { path: '/company/student-users/form/:pk', name: 'studentuser-edit', component: blank },
  { path: '/company/student-users/form', name: 'studentuser-add', component: blank },
  { path: '/company/student-users/view/:pk', name: 'studentuser-detail', component: blank },

  { path: '/settings/employee-users', name: 'settings-users-employees', component: blank },
  { path: '/settings/employee-users/form/:pk', name: 'settings-employee-edit', component: blank },
  { path: '/settings/employee-users/form', name: 'settings-employee-add', component: blank },

  { path: '/settings/planning-users', name: 'settings-users-planningusers', component: blank },
  { path: '/settings/planning-users/form/:pk', name: 'settings-planninguser-edit', component: blank },
  { path: '/settings/planning-users/form', name: 'settings-planninguser-add', component: blank },
]
