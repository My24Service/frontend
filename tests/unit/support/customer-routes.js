/**
 * The routes the Customer-Slice screens link to, for the harness's router.
 *
 * Same purpose as `member-routes.js`: a deep mount renders the real
 * `<router-link>`s, each resolving its `:to` at setup time — an unknown name
 * throws "No match for {name}" and the mount dies. The paths mirror
 * `src/router/customer.js` (and the one order route the customer detail view
 * links to), so a spec that navigates rather than remounting lands where the
 * application would.
 */

const blank = { template: '<div />' }

export const customerRoutes = [
  { path: '/customers/dashboard', name: 'customer-dashboard', component: blank },
  { path: '/customers/customers', name: 'customer-list', component: blank },
  { path: '/customers/customers/form/:pk', name: 'customer-edit', component: blank },
  { path: '/customers/customers/form', name: 'customer-add', component: blank },
  { path: '/customers/customers/:pk', name: 'customer-view', component: blank },

  { path: '/customers/maintenance-contracts', name: 'maintenance-contracts', component: blank },
  { path: '/customers/maintenance-contracts/form/:pk', name: 'maintenance-contract-edit', component: blank },
  { path: '/customers/maintenance-contracts/form', name: 'maintenance-contract-add', component: blank },
  { path: '/customers/maintenance-contracts/view/:pk', name: 'maintenance-contract-view', component: blank },

  { path: '/customers/equipment', name: 'customers-equipment-list', component: blank },
  { path: '/customers/equipment/form/:pk', name: 'customers-equipment-edit', component: blank },
  { path: '/customers/equipment/:pk', name: 'customers-equipment-view', component: blank },
  { path: '/customers/equipment/form', name: 'customers-equipment-add', component: blank },

  { path: '/customers/locations', name: 'customers-location-list', component: blank },
  { path: '/customers/locations/form/:pk', name: 'customers-location-edit', component: blank },
  { path: '/customers/locations/:pk', name: 'customers-location-view', component: blank },
  { path: '/customers/locations/form', name: 'customers-location-add', component: blank },

  { path: '/orders/form-maintenance', name: 'order-add-maintenance', component: blank },
]
