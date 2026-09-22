import type { CodeTypeEnum } from '@/api/types.gen'
/**
 * The code types this Slice edits, in the order the pills show them.
 *
 * The wire enum (`CodeTypeEnum`) also carries `trip` and `purchase_order`;
 * those have their own screens (`/api/mobile/trip-statuscode/`, the purchase
 * order status) and are not managed here.
 */
export const CODE_TYPES = [
  'order',
  'leave_hours',
  'sick_leave',
  'quotation',
  'invoice',
  'work_hours',
] as const satisfies readonly CodeTypeEnum[]

export type CodeType = (typeof CODE_TYPES)[number]

export function isCodeType(value: unknown): value is CodeType {
  return (CODE_TYPES as readonly unknown[]).includes(value)
}

/** The pill label for a code type. A function, so `$trans` runs at render time. */
export function codeTypeLabel(type: CodeType): string {
  switch (type) {
    case 'order': return $trans('Orders')
    case 'leave_hours': return $trans('Leave')
    case 'sick_leave': return $trans('Sick leave')
    case 'quotation': return $trans('Quotation')
    case 'invoice': return $trans('Invoice')
    case 'work_hours': return $trans('Work hours')
  }
}

/**
 * The route names the Slice's screens link to, per code type and per tree.
 *
 * The screens mount twice — under /company and under /settings — and each
 * tree has its own naming scheme (`company-statuscodes-order-add` versus
 * `settings-order-statuscode-add`). The legacy screens rebuilt these strings
 * in three `getNavLink` methods; this is the one place that knows both
 * schemes.
 */
// CodeType is a literal union, so the template literals below are checked
// against the route table name by name.
export interface StatuscodeRouteNames {
  list: RouteName
  add: RouteName
  edit: RouteName
  actionAdd: RouteName
  actionEdit: RouteName
}

export function routeNamesFor(type: CodeType, fromSettings: boolean): StatuscodeRouteNames {
  if (fromSettings) {
    return {
      list: `settings-${type}-statuscode-list`,
      add: `settings-${type}-statuscode-add`,
      edit: `settings-${type}-statuscode-edit`,
      actionAdd: `settings-${type}-statuscode-action-add`,
      actionEdit: `settings-${type}-statuscode-action-edit`,
    }
  }

  return {
    list: `company-statuscodes-${type}`,
    add: `company-statuscodes-${type}-add`,
    edit: `company-statuscodes-${type}-edit`,
    actionAdd: `company-statuscodes-action-${type}-add`,
    actionEdit: `company-statuscodes-action-${type}-edit`,
  }
}
