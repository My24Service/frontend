/**
 * The Member Slice's public surface.
 *
 * This module is the only door into `src/features/member/`: the router mounts
 * what is exported here, and nothing outside the folder imports past it.
 * Anything not exported is the Slice's private wiring — query keys, form
 * schemas, per-screen helpers — and may change without notice to callers.
 *
 * Screens currently in the Slice:
 *
 *   - module-part  list + form (#321, the tracer bullet)
 *
 * The remaining Member screens (members, contracts, modules) still live in
 * `src/views/member/` and move here under their own tickets.
 */

export { default as ModulePartList } from './module-part/ModulePartList.vue'
export { default as ModulePartForm } from './module-part/ModulePartForm.vue'
