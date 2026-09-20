const blank = { template: '<div />' }

/**
 * The routes the Field-service-Slice screens link to, for the harness's router.
 *
 * Same purpose as `member-routes.js` and `statuscode-routes.js`: a deep mount
 * renders the real `<router-link>`s, each resolving its `:to` at setup time, and
 * an unknown name throws "No match for {name}". The names and paths mirror
 * `src/router/mobile.js` verbatim — the Slice's screens must keep every one of
 * them, because the specs assert them and users have them bookmarked.
 *
 * The order names are here because the dispatch board links to the order
 * screens; they belong to the order Slice and are registered by its own router.
 */
export const fieldServiceRoutes = [
  { path: '/mobile/dispatch/:assignModeProp?', name: 'mobile-dispatch', component: blank },
  { path: '/mobile/map', name: 'mobile-map', component: blank },
  { path: '/mobile/orders', name: 'mobile-orders', component: blank },
  { path: '/mobile/orders-in-progress', name: 'mobile-orders-in-progress', component: blank },
  { path: '/mobile/orders-finished', name: 'mobile-orders-finished', component: blank },
  { path: '/mobile/assigned-finished', name: 'mobile-assigned-finished', component: blank },
  { path: '/mobile/timesheet', name: 'mobile-timesheet', component: blank },
  { path: '/mobile/timesheet/:user_id', name: 'mobile-timesheet-detail', component: blank },
  { path: '/mobile/trips', name: 'mobile-trips', component: blank },
  { path: '/mobile/trips/form', name: 'mobile-trips-add', component: blank },
  { path: '/mobile/trips/form/:pk', name: 'mobile-trips-edit', component: blank },
  { path: '/mobile/trip-availability', name: 'mobile-trip-availability', component: blank },
  { path: '/mobile/trip-availability/:pk', name: 'mobile-trip-availability-detail', component: blank },
  { path: '/orders/:pk/edit', name: 'order-edit', component: blank },

  // The engineer-event screens' own routes, and the company-users routes their
  // pills row navigates to. The pills render a <router-link> per entry, so a
  // deep mount resolves every one of these names at setup.
  { path: '/company/engineer-users', name: 'users-engineers', component: blank },
  { path: '/company/engineer-users/events', name: 'engineer-event-list', component: blank },
  { path: '/company/engineer-users/event-types', name: 'engineer-event-type-list', component: blank },
  { path: '/company/engineer-users/event-types/form/:pk', name: 'engineer-event-type-edit', component: blank },
  { path: '/company/engineer-users/event-types/form', name: 'engineer-event-type-add', component: blank },
  { path: '/company/student-users', name: 'users-studentusers', component: blank },
  { path: '/company/sales-users', name: 'users-salesusers', component: blank },
  { path: '/company/customer-users', name: 'users-customerusers', component: blank },
  { path: '/company/planning-users', name: 'users-planningusers', component: blank },
  { path: '/company/employees', name: 'settings-users-employees', component: blank },
  { path: '/company/api-users', name: 'users-apiusers', component: blank },
]
