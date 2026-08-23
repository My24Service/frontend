export const NEW_DATA_EVENTS = {
  REFRESH_INITIAL: 'refresh_initial',
  UNACCEPTED_ORDER: 'unaccepted_order_event',
  DISPATCH: 'dispatch',
  ENGINEER_EVENT: 'engineer-event',
  CONTRACT: 'contract'
} as const

export const NEW_DATA_EVENTS_TYPES = {
  NEW_DATA_ORDER_COPIED: 'ORDER_COPIED',
  NEW_DATA_ORDER_REJECTED: 'ORDER_REJECTED',
  NEW_DATA_ORDER_ACCEPTED: 'ORDER_ACCEPTED',
} as const

export const AUTH_LEVELS = {
  STUDENT: 'student_user',
  SALES: 'sales_user',
  ENGINEER: 'engineer',
  CUSTOMER: 'customer_user',
  PLANNING: 'planning_user',
  EMPLOYEE: 'employee_user',
  SUPERUSER: 'is_superuser',
  STAFF: 'is_staff',
} as const

export const EQUIPMENT_TYPES = {
  TECHNICAL: 'technical',
  FACILITY: 'facility',
} as const

export const NO_IMAGE_URL = `${document.location.origin}/assets/no-img.png`
export const PIXEL_URL = `${document.location.origin}/assets/pixel.png`
