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
 *   - module       list + form (#322)
 *   - contract     list + form (#323, incl. the assignment dropdown's data)
 *   - member       list, serving its active/deleted/requested variants through
 *                  one `variant` prop (#324), and the create/edit form with
 *                  its logo uploads and company-code probe (#325)
 */

export { default as ModulePartList } from './module-part/ModulePartList.vue'
export { default as ModulePartForm } from './module-part/ModulePartForm.vue'
export { default as ModuleList } from './module/ModuleList.vue'
export { default as ModuleForm } from './module/ModuleForm.vue'
export { default as ContractList } from './contract/ContractList.vue'
export { default as ContractForm } from './contract/ContractForm.vue'
export { default as MemberList } from './member/MemberList.vue'
// PROTOTYPE (TanStack Table experiment): not part of the Slice's surface;
// mounted by a throwaway route in the router. Delete with the experiment.
export { default as MemberListTable } from './member/MemberListTable.vue'
export { default as ContractListTable } from './contract/ContractListTable.vue'
export { default as ModuleListTable } from './module/ModuleListTable.vue'
export { default as ModulePartListTable } from './module-part/ModulePartListTable.vue'
export { default as MemberForm } from './member/MemberForm.vue'
