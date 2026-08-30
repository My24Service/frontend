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
 *   - document  the customer document panel the form embeds.
 *   - maintenance-contract
 *               the contract list, its create/edit form (whose equipment
 *               rows are staged client-side and replayed on save) and the
 *               detail view whose orders tab hands equipment lines to the
 *               maintenance order form.
 */

export { default as CustomerList } from './customer/CustomerList.vue'
export { default as CustomerForm } from './customer/CustomerForm.vue'
export { default as CustomerView } from './customer/CustomerView.vue'
// PROTOTYPE (TanStack Table experiment): not part of the Slice's surface;
// mounted by a throwaway route in the router. Delete with the experiment.
export { default as CustomerListTable } from './customer/CustomerListTable.vue'
export { default as MaintenanceContractListTable } from './maintenance-contract/MaintenanceContractListTable.vue'
export { default as MaintenanceContractList } from './maintenance-contract/MaintenanceContractList.vue'
export { default as MaintenanceContractForm } from './maintenance-contract/MaintenanceContractForm.vue'
export { default as MaintenanceContractView } from './maintenance-contract/MaintenanceContractView.vue'
