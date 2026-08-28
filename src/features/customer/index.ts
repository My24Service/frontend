/**
 * The Customer Slice's public surface.
 *
 * This module is the only door into `src/features/customer/`: the router
 * mounts what is exported here, and nothing outside the folder imports past
 * it. Anything not exported is the Slice's private wiring — query keys, form
 * schemas, per-screen helpers — and may change without notice to callers.
 *
 * Screens currently in the Slice:
 *
 *   - customer  list, the create/edit form (with its documents panel and
 *               branch-partner section), and the detail view that doubles as
 *               the customer-type user's dashboard.
 */

export { default as CustomerList } from './customer/CustomerList.vue'
export { default as CustomerForm } from './customer/CustomerForm.vue'
export { default as CustomerView } from './customer/CustomerView.vue'
