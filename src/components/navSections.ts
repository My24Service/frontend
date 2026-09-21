import { EQUIPMENT_TYPES } from '@/constants'
import { CODE_TYPES } from '@/features/statuscode'

// Section configs for the config-driven SubNav (`items` API) and the route
// name lists NavItems needs for its branch/settings active states.
//
// Item shape: { label, to, active?, show?, badge? }
// - label: passed through $trans at render.
// - to: a route location, or a function of the nav context returning one (the
//   company People entries pick their target from the module contract).
// - active: route names that keep the entry highlighted. By route NAME, not by
//   path segment - the old files each split $route.path with a different
//   index, which broke on detail/form pages whose last segment is a pk.
// - show: boolean or (ctx) => boolean. Every guard from the old SubNav* files
//   lives here unchanged.
// - badge: 'requestedCount' renders the requested-members count.
//
// ctx shape: { hasAccessToModule, isAdmin, isPlanning, isStaff, isSuperuser,
//   isCustomer, isBranchEmployee, hasBranches, flavour, memberType }.

export interface NavCtx {
  hasAccessToModule(module: string, part?: string): boolean
  readonly isAdmin: boolean
  readonly isPlanning: boolean
  readonly isStaff: boolean
  readonly isSuperuser: boolean
  readonly isCustomer: boolean
  readonly isBranchEmployee: boolean
  readonly hasBranches: boolean
  readonly flavour: string
  readonly memberType: string
}

export interface SubNavItem {
  label: string
  to: RouteLocationRaw | ((ctx: NavCtx) => RouteLocationRaw)
  active?: string[]
  show?: boolean | ((ctx: NavCtx) => boolean)
  badge?: 'requestedCount'
}

const COMPANY_USER_ROUTES = [
  'users-engineers', 'engineer-edit', 'engineer-add',
  'users-salesusers', 'salesuser-edit', 'salesuser-add',
  'users-customerusers', 'customeruser-edit', 'customeruser-add',
  'users-planningusers', 'planninguser-edit', 'planninguser-add',
  'users-apiusers', 'apiuser-add', 'apiuser-edit',
  'users-employees', 'employee-edit', 'employee-add',
  'users-studentusers', 'studentuser-add', 'studentuser-edit', 'studentuser-detail',
]

const COMPANY_TIME_REGISTRATION_ROUTES = [
  'company-time-registration', 'company-time-registration-detail',
  'leave-requests', 'leave-list', 'leave-list-add', 'leave-edit', 'leave-types',
  'unconfirmed-sick-leave', 'sick-leave-list', 'sick-leave-list-add', 'sick-leave-list-edit',
]

const COMPANY_STATUSCODE_ROUTES = [
  'company-statuscodes',
  ...CODE_TYPES.flatMap((type) => [
    `company-statuscodes-${type}`,
    `company-statuscodes-${type}-add`,
    `company-statuscodes-${type}-edit`,
    `company-statuscodes-action-${type}-add`,
    `company-statuscodes-action-${type}-edit`,
  ]),
]

function maintenanceUsersTarget(ctx: NavCtx): RouteLocationRaw {
  if (ctx.hasAccessToModule('company', 'engineer-users') && !ctx.hasBranches) {
    return { name: 'users-engineers' }
  }
  if (ctx.hasAccessToModule('company', 'sales-users') && !ctx.hasBranches) {
    return { name: 'users-salesusers' }
  }
  if (ctx.hasAccessToModule('company', 'customer-users') && !ctx.hasBranches) {
    return { name: 'users-customerusers' }
  }
  if (ctx.hasBranches && ctx.isBranchEmployee) {
    return { name: 'users-employees' }
  }
  return { name: 'users-planningusers' }
}

function tempsUsersTarget(ctx: NavCtx): RouteLocationRaw {
  if (ctx.hasAccessToModule('company', 'student-users')) {
    return { name: 'users-studentusers' }
  }
  return { name: 'users-planningusers' }
}

function equipmentRoutes(prefix: string): string[] {
  const names = [`${prefix}-list`, `${prefix}-edit`, `${prefix}-view`, `${prefix}-add`]
  for (const type of Object.values(EQUIPMENT_TYPES)) {
    names.push(`${prefix}-view-${type}`, `${prefix}-edit-${type}`)
  }
  return names
}

function locationRoutes(prefix: string): string[] {
  return [`${prefix}-list`, `${prefix}-edit`, `${prefix}-view`, `${prefix}-add`]
}

const STAFF_OR_PLANNING = (ctx: NavCtx): boolean => ctx.isStaff || ctx.isSuperuser || ctx.isPlanning
const PLANNING_OR_ADMIN = (ctx: NavCtx): boolean => ctx.isPlanning || ctx.isAdmin

export const SUBNAV_SECTIONS: Record<string, SubNavItem[]> = {
  orders: [
    {
      label: 'Schedule',
      to: { name: 'orders-schedule' },
      active: ['orders-schedule', 'orders-schedule-params'],
      show: (ctx) => ctx.hasBranches,
    },
    {
      label: 'Stats',
      to: { name: 'order-year-stats' },
      active: ['order-year-stats', 'order-month-stats'],
    },
    {
      label: 'Filters',
      to: { name: 'order-filter-list' },
      active: [
        'order-filter-list', 'order-filter-add', 'order-filter-edit',
        'settings-order-filter-list', 'settings-order-filter-add', 'settings-order-filter-edit',
      ],
      show: (ctx) => ctx.isAdmin || ctx.isPlanning,
    },
  ],
  company: [
    {
      label: 'Dashboard',
      to: { name: 'company-dashboard' },
      active: ['company-dashboard'],
      show: (ctx) => !ctx.isBranchEmployee,
    },
    {
      label: 'Dashboard',
      to: { name: 'employee-dashboard' },
      active: ['employee-dashboard'],
      show: (ctx) => ctx.isBranchEmployee,
    },
    {
      label: 'Time registration',
      to: { name: 'company-time-registration' },
      active: COMPANY_TIME_REGISTRATION_ROUTES,
      show: (ctx) => !ctx.hasBranches,
    },
    {
      label: 'People',
      to: maintenanceUsersTarget,
      active: COMPANY_USER_ROUTES,
      show: (ctx) => ctx.memberType === 'maintenance',
    },
    {
      label: 'People',
      to: tempsUsersTarget,
      active: COMPANY_USER_ROUTES,
      show: (ctx) => ctx.flavour === 'temps',
    },
    {
      label: 'Partners',
      to: { name: 'company-partners-active' },
      active: [
        'company-partners-active', 'company-partners-requests-sent',
        'partner-request-add', 'company-partners-requests-received',
      ],
      show: (ctx) => ctx.hasAccessToModule('company', 'partners') && PLANNING_OR_ADMIN(ctx),
    },
    {
      label: 'Branches',
      to: { name: 'company-branches' },
      active: [
        'company-branches', 'company-my-branch', 'company-branch-edit',
        'company-branch-add', 'company-branch-view',
      ],
      show: (ctx) => ctx.hasBranches && PLANNING_OR_ADMIN(ctx),
    },
    {
      label: 'My branch',
      to: { name: 'company-my-branch' },
      active: ['company-my-branch'],
      show: (ctx) => ctx.hasBranches && ctx.isBranchEmployee,
    },
    {
      label: 'Settings',
      to: { name: 'company-settings' },
      active: ['company-settings'],
      show: (ctx) => ctx.memberType === 'maintenance' && PLANNING_OR_ADMIN(ctx),
    },
    {
      label: 'Info',
      to: { name: 'company-info' },
      active: ['company-info'],
      show: PLANNING_OR_ADMIN,
    },
    {
      label: 'Pictures',
      to: { name: 'company-pictures' },
      active: ['company-pictures', 'company-picture-edit', 'company-picture-add'],
      show: PLANNING_OR_ADMIN,
    },
    {
      label: 'Statuscodes',
      to: { name: 'company-statuscodes' },
      active: COMPANY_STATUSCODE_ROUTES,
      show: PLANNING_OR_ADMIN,
    },
    {
      label: 'Templates',
      to: { name: 'company-templates' },
      active: ['company-templates', 'customer-template-add', 'customer-template-edit'],
      show: PLANNING_OR_ADMIN,
    },
    {
      label: 'Import',
      to: { name: 'company-import-list' },
      active: ['company-import-list', 'company-import-add', 'company-import-edit', 'company-import-preview'],
      show: (ctx) => ctx.isStaff || ctx.isSuperuser,
    },
    {
      label: 'Budgets',
      to: { name: 'company-budgets' },
      active: ['company-budgets', 'company-budget-view'],
      show: (ctx) => ctx.hasBranches && !ctx.isBranchEmployee,
    },
    {
      label: 'My budgets',
      to: { name: 'company-my-budgets' },
      active: ['company-my-budgets'],
      show: (ctx) => ctx.hasBranches && ctx.isBranchEmployee,
    },
    {
      label: 'Activity',
      to: { name: 'company-activity' },
      active: ['company-activity'],
      show: PLANNING_OR_ADMIN,
    },
    {
      label: 'Gripp',
      to: { name: 'company-connector-gripp' },
      active: ['company-connector-gripp'],
      show: (ctx) => ctx.hasAccessToModule('company', 'connector-gripp'),
    },
    {
      label: 'Teamleader',
      to: { name: 'company-teamleader-settings' },
      active: ['company-teamleader-settings', 'company-teamleader-callback'],
      show: (ctx) => ctx.hasAccessToModule('company', 'teamleader'),
    },
  ],
  customers: [
    {
      label: 'Dashboard',
      to: { name: 'customer-dashboard' },
      active: ['customer-dashboard'],
      show: (ctx) => !ctx.hasBranches && ctx.isCustomer,
    },
    {
      label: 'Maintenance contracts',
      to: { name: 'maintenance-contracts' },
      active: [
        'maintenance-contracts', 'maintenance-contract-edit',
        'maintenance-contract-add', 'maintenance-contract-view',
      ],
      show: (ctx) => ctx.hasAccessToModule('customers', 'maintenance-contracts'),
    },
    {
      label: 'Equipment',
      to: { name: 'customers-equipment-list' },
      active: equipmentRoutes('customers-equipment'),
      show: (ctx) => ctx.hasAccessToModule('customers', 'equipment') && !ctx.isCustomer,
    },
    {
      label: 'Locations',
      to: { name: 'customers-location-list' },
      active: locationRoutes('customers-location'),
      show: (ctx) => ctx.hasAccessToModule('customers', 'locations') && !ctx.isCustomer,
    },
  ],
  equipment: [
    {
      label: 'Equipment',
      to: { name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL } },
      active: equipmentRoutes('equipment-equipment'),
      show: (ctx) => ctx.hasAccessToModule('equipment', 'equipment'),
    },
    {
      label: 'Locations',
      to: { name: 'equipment-location-list' },
      active: locationRoutes('equipment-location'),
      show: (ctx) => ctx.hasAccessToModule('equipment', 'locations'),
    },
    {
      label: 'Buildings',
      to: { name: 'equipment-building-list' },
      active: locationRoutes('equipment-building'),
      show: (ctx) => ctx.hasAccessToModule('equipment', 'buildings'),
    },
  ],
  inventory: [
    {
      label: 'Purchase orders',
      to: { name: 'purchaseorder-list' },
      active: [
        'purchaseorder-list', 'purchaseorder-add', 'purchaseorder-edit',
        'purchaseorder-view', 'purchaseorder-add-from-reservation',
      ],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'purchaseorders'),
    },
    {
      label: 'Entries',
      to: { name: 'purchaseorder-entry-list' },
      active: [
        'purchaseorder-entry-list', 'purchaseorder-entry-add',
        'purchaseorder-entry-edit', 'purchaseorder-entry-view',
      ],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'purchaseorder-entries'),
    },
    {
      label: 'Materials',
      to: { name: 'material-list' },
      active: ['material-list', 'material-add', 'material-edit', 'material-view'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'materials'),
    },
    {
      label: 'Suppliers',
      to: { name: 'supplier-list' },
      active: ['supplier-list', 'supplier-add', 'supplier-edit', 'supplier-view'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'suppliers'),
    },
    {
      label: 'Locations',
      to: { name: 'stock-location-list' },
      active: ['stock-location-list', 'stock-location-add', 'stock-location-edit', 'stock-location-view'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'stock-locations'),
    },
    {
      label: 'Mutations',
      to: { name: 'mutation-list' },
      active: ['mutation-list', 'mutation-add'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'mutations'),
    },
    {
      label: 'Move',
      to: { name: 'material-move' },
      active: ['material-move'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'move-material'),
    },
    {
      label: 'Statistics',
      to: { name: 'inventory-stats' },
      active: ['inventory-stats'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'stats'),
    },
    {
      label: 'Statistics table',
      to: { name: 'inventory-stats-table' },
      active: ['inventory-stats-table'],
      show: (ctx) => ctx.hasAccessToModule('inventory', 'stats'),
    },
  ],
  invoices: [
    {
      label: 'Invoices',
      to: { name: 'invoice-list' },
      active: ['invoice-list', 'invoice-view'],
      show: STAFF_OR_PLANNING,
    },
    {
      label: 'Preliminary',
      to: { name: 'preliminary-invoices' },
      active: ['preliminary-invoices', 'invoice-create', 'invoice-edit'],
      show: STAFF_OR_PLANNING,
    },
    {
      label: 'Sent',
      to: { name: 'invoices-sent' },
      active: ['invoices-sent', 'invoice-send'],
      show: STAFF_OR_PLANNING,
    },
  ],
  members: [
    {
      label: 'Active',
      to: { name: 'member-list' },
      active: ['member-list', 'member-edit', 'member-add', 'member-request'],
      show: (ctx) => ctx.isAdmin,
    },
    {
      label: 'Requested',
      to: { name: 'member-requested-list' },
      active: ['member-requested-list'],
      show: (ctx) => ctx.isAdmin,
      badge: 'requestedCount',
    },
    {
      label: 'Deleted',
      to: { name: 'member-deleted-list' },
      active: ['member-deleted-list'],
      show: (ctx) => ctx.isAdmin,
    },
    {
      label: 'Contracts',
      to: { name: 'contract-list' },
      active: ['contract-list', 'contract-edit', 'contract-add'],
      show: (ctx) => ctx.isAdmin,
    },
    {
      label: 'Modules',
      to: { name: 'module-list' },
      active: ['module-list', 'module-edit', 'module-add'],
      show: (ctx) => ctx.isSuperuser,
    },
    {
      label: 'Module parts',
      to: { name: 'module-part-list' },
      active: ['module-part-list', 'module-part-edit', 'module-part-add'],
      show: (ctx) => ctx.isSuperuser,
    },
  ],
  mobile: [
    {
      label: 'Dispatch',
      to: { name: 'mobile-dispatch' },
      active: ['mobile-dispatch'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'dispatch'),
    },
    {
      label: 'Map',
      to: { name: 'mobile-map' },
      active: ['mobile-map'],
      // Was a per-tenant companycode blocklist; a product difference is a
      // branch on profile.flavour, never on the companycode. The engineer
      // map is a maintenance-flavour dispatch feature.
      show: (ctx) => !ctx.hasBranches && ctx.flavour === 'maintenance',
    },
    {
      label: 'Orders',
      to: { name: 'mobile-orders' },
      active: ['mobile-orders'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'orders'),
    },
    {
      label: 'In progress',
      to: { name: 'mobile-orders-in-progress' },
      active: ['mobile-orders-in-progress'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'orders-in-progress') && ctx.memberType === 'maintenance',
    },
    {
      label: 'Finished',
      to: { name: 'mobile-orders-finished' },
      active: ['mobile-orders-finished'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'orders-finished'),
    },
    {
      label: 'Assigned finished',
      to: { name: 'mobile-assigned-finished' },
      active: ['mobile-assigned-finished'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'assigned-finished'),
    },
    {
      label: 'Trips',
      to: { name: 'mobile-trips' },
      active: ['mobile-trips', 'mobile-trips-edit', 'mobile-trips-add'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'trips') && ctx.flavour === 'temps',
    },
    {
      label: 'Trip availability',
      to: { name: 'mobile-trip-availability' },
      active: ['mobile-trip-availability', 'mobile-trip-availability-detail'],
      show: (ctx) => ctx.hasAccessToModule('mobile', 'trip-availability') && ctx.flavour === 'temps',
    },
  ],
  quotations: [
    {
      label: 'Quotations',
      to: { name: 'quotation-list' },
      active: ['quotation-list', 'quotation-view', 'quotation-edit', 'quotation-detail'],
      show: STAFF_OR_PLANNING,
    },
    {
      label: 'Preliminary',
      to: { name: 'preliminary-quotations' },
      active: ['preliminary-quotations', 'quotation-add', 'quotation-edit-preliminary'],
      show: STAFF_OR_PLANNING,
    },
    {
      label: 'Sent',
      to: { name: 'quotations-sent' },
      active: ['quotations-sent', 'quotations-sent-view', 'quotation-send'],
      show: STAFF_OR_PLANNING,
    },
  ],
}

// Route name lists for the NavItems branch/settings modes, whose old
// indexOf-based isActive() checks could not be expressed as a path segment.
export const BRANCH_ORDER_ROUTES = [
  'order-list', 'order-add', 'order-edit', 'order-add-maintenance',
  'order-add-quotation', 'order-view', 'order-detail', 'orders-not-accepted',
]

export const BRANCH_PLANNING_ROUTES = ['orders-schedule', 'orders-schedule-params']

export const SETTINGS_STATUSCODE_ROUTES = CODE_TYPES.flatMap((type) => [
  `settings-${type}-statuscode-list`,
  `settings-${type}-statuscode-edit`,
  `settings-${type}-statuscode-add`,
  `settings-${type}-statuscode-action-edit`,
  `settings-${type}-statuscode-action-add`,
])

export const SETTINGS_USER_ROUTES = [
  'settings-users-employees', 'settings-employee-edit', 'settings-employee-add',
  'settings-users-planningusers', 'settings-planninguser-edit', 'settings-planninguser-add',
]

export const SETTINGS_IMPORT_ROUTES = [
  'settings-company-import-list', 'settings-company-import-add',
  'settings-company-import-edit', 'settings-company-import-preview',
]

export const SETTINGS_FILTER_ROUTES = [
  'settings-order-filter-list', 'settings-order-filter-add', 'settings-order-filter-edit',
]

export const SETTINGS_BRANCH_ROUTES = [
  'settings-branches', 'settings-branch-edit', 'settings-branch-add',
  'settings-branch-view', 'settings-my-branch',
]

export { equipmentRoutes, locationRoutes }
