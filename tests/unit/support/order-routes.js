/**
 * The routes the Order-Slice screens link to, for the harness's router.
 *
 * Same purpose as `customer-routes.js`: a deep mount renders the real
 * `<router-link>`s, each resolving its `:to` at setup time — an unknown name
 * throws "No match for {name}" and the mount dies. The paths mirror
 * `src/router/orders.js` and the three mobile list routes.
 */

const blank = { template: '<div />' }

export const orderRoutes = [
  { path: '/orders/orders', name: 'order-list', component: blank },
  { path: '/orders/orders-not-accepted', name: 'orders-not-accepted', component: blank },
  { path: '/orders/orders/form', name: 'order-add', component: blank },
  { path: '/orders/orders/form/:pk', name: 'order-edit', component: blank },
  { path: '/orders/orders/view/:pk', name: 'order-view', component: blank },
  { path: '/orders/orders/detail/:uuid', name: 'order-detail', component: blank },
  { path: '/orders/orders/workorder/:uuid', name: 'workorder-view', component: blank },
  { path: '/orders/schedule', name: 'orders-schedule', component: blank },
  { path: '/orders/filter', name: 'order-filter-list', component: blank },

  { path: '/mobile/orders', name: 'mobile-orders', component: blank },
  { path: '/mobile/dispatch/:assignModeProp?', name: 'mobile-dispatch', component: blank },

  { path: '/customers/customers/:pk', name: 'customer-view', component: blank },
  { path: '/invoices/create/:uuid', name: 'invoice-create', component: blank },
  { path: '/invoices/edit/:pk/:uuid', name: 'invoice-edit', component: blank },
  { path: '/invoices/view/:uuid', name: 'invoice-view', component: blank },
]
