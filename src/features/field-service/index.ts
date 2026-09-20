/**
 * The field-service Slice — the planning console over the mobile workforce.
 *
 * The router imports these screens and nothing else. Everything not exported
 * here is private wiring: the query keys (`invalidation.ts`), the assignment
 * module the two sides share, and each screen's own components.
 */
export { default as Dispatch } from './dispatch/Dispatch.vue'
export { default as EngineerMap } from './dispatch/EngineerMap.vue'
export { default as AssignedFinished } from './dispatch/AssignedFinished.vue'
export { default as AssignedOrderMaterial } from './dispatch/AssignedOrderMaterial.vue'
export { default as TripList } from './trips/TripList.vue'
export { default as TripForm } from './trips/TripForm.vue'
export { default as TripAvailability } from './trips/TripAvailability.vue'
export { default as TripAvailabilityDetail } from './trips/TripAvailabilityDetail.vue'
export { default as TimeSheet } from './hours/TimeSheet.vue'
export { default as TimeSheetDetail } from './hours/TimeSheetDetail.vue'
