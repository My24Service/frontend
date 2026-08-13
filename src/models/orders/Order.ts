import BaseModel from '../base'
import { formFields, nullableStr, int, str } from '../schema'
import * as v from 'valibot'
import { OrderCreateSchema, toApiDate } from './order-schemas'

export * from './order-schemas'

/**
 * The default start/end date: the next working day.
 *
 * This is a function rather than a module-level constant. It used to be
 * computed once at import time, which meant a session left open past midnight
 * kept handing out yesterday's "tomorrow".
 */
export function nextWorkingDay(from: Date = new Date()): Date {
  const date = new Date(from)
  date.setDate(date.getDate() + 1)

  // Saturday -> Monday, Sunday -> Monday.
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1)
  } else if (date.getDay() === 6) {
    date.setDate(date.getDate() + 2)
  }

  return date
}

/**
 * Fields the order forms bind to that no Order serializer accepts.
 *
 * These are NOT round-tripped: DRF silently drops unknown keys, so whatever the
 * user types into them is discarded on submit. They are kept here so the
 * existing form bindings keep working and so the problem is visible in one
 * place instead of being buried in a defaults dict.
 *
 * - `service_number`   bound in OrderFormMaintenanceCustomer.vue; there is no
 *                      such column on the Order model at all.
 * - `required_users`   bound in OrderFormTemps.vue and present on the model and
 *                      the read serializers, but absent from
 *                      OrderCreateSerializer and OrderUpdateSerializer.
 */
const discardedByBackendEntries = {
  service_number: str(),
  required_users: int(1),
}

/**
 * Form-local state that legitimately never travels in the order payload.
 *
 * The order forms collect orderlines/infolines in the same object as the order,
 * but explicitly empty them before calling insert()/update() and then post them
 * to their own endpoints - see OrderFormMaintenanceEmployee.vue, which does
 * `const orderlines = this.order.orderlines; this.order.orderlines = []`.
 * The remaining keys are read-only display data the views render.
 */
const formOnlyEntries = {
  statuses: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  orderlines: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  infolines: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  workorder_documents: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  reported_codes_extra_data: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  workorder_pdf_url: nullableStr(''),
  workorder_pdf_url_partner: nullableStr(''),
}

/**
 * The shape the order forms bind to.
 *
 * Derived from OrderCreateSchema so the writable fields cannot drift from what
 * the backend accepts, plus the two groups above. `start_date`/`end_date` are
 * overridden back to `Date` because the datepicker binds Date objects;
 * preInsert/preUpdate convert them on the way out.
 *
 * Corrections against the previous hand-written dict:
 *   - `location` removed - it existed on neither the model nor any serializer
 *     and nothing in the frontend read it.
 *   - `order_email_extra` now defaults to `[]` rather than `''`. It is a
 *     ListField of e-mails; OrderViewMaintenance.vue calls `.join(', ')` on it,
 *     which would throw on the old string default.
 *   - `customer_reference`, `description`, `external_identifier` and
 *     `quotation` added - all accepted by the create serializer but missing
 *     from the old dict.
 */
export const OrderFormSchema = v.object({
  ...OrderCreateSchema.entries,
  start_date: v.optional(v.date(), () => nextWorkingDay()),
  end_date: v.optional(v.date(), () => nextWorkingDay()),
  ...discardedByBackendEntries,
  ...formOnlyEntries,
})

export type OrderForm = v.InferOutput<typeof OrderFormSchema>

/**
 * The client-side Order object the forms instantiate directly
 * (`new OrderModel()`).
 *
 * Generated from OrderFormSchema so it can no longer drift from `fields` - the
 * two used to be maintained by hand and had already diverged in both
 * directions.
 */
const OrderModel = class {
  constructor(data: Partial<OrderForm> = {}) {
    Object.assign(this, formFields(OrderFormSchema), data)
  }
  // The defaults are assigned in the constructor rather than declared as class
  // properties, so the construct signature is asserted to describe the result.
  // The previous OrderModel declared ~35 properties by hand and had already
  // drifted from `fields`; generating both from one schema is what prevents
  // that recurring.
} as new (data?: Partial<OrderForm>) => OrderForm

class OrderService extends BaseModel {
  model = OrderModel
  fields = formFields(OrderFormSchema)

  url = '/order/order/'
  queryMode = 'all'

  /**
   * Re-stamp the dates on every copy: `fields` is built once per service
   * instance, so without this a long-lived session would keep handing out the
   * date that was "tomorrow" when the service was constructed.
   */
  postCopyFields(fields: Record<string, any>) {
    fields.start_date = nextWorkingDay()
    fields.end_date = nextWorkingDay()
    return fields
  }

  recreateWorkorderPdfGotenberg(pk: number | string) {
    return this.axios.post(`${this.url}${pk}/recreate_pdf/?gotenberg=1`)
  }

  /**
   * Normalise an order for the API: drop the read-only timestamps and convert
   * the datepicker's Date objects to the `YYYY-MM-DD` the DateFields expect.
   */
  private toApiPayload(order: Record<string, any>) {
    delete order.created
    delete order.modified

    if (order.start_date instanceof Date) {
      order.start_date = toApiDate(order.start_date)
    }

    if (order.end_date instanceof Date) {
      order.end_date = toApiDate(order.end_date)
    }

    return order
  }

  preInsert(order: Record<string, any>) {
    return this.toApiPayload(order)
  }

  preUpdate(order: Record<string, any>) {
    return this.toApiPayload(order)
  }

  getListUrl() {
    switch (this.queryMode) {
      case 'dispatch':
        return '/order/order/dispatch_list_all/'
      case 'inprogress':
        return '/order/order/dispatch_list_inprogress/'
      case 'finished':
        return '/order/order/dispatch_list_finished/'
      case 'range':
        return '/order/order/get_within_range/'
      case 'unaccepted':
        return '/order/order/all_for_customer_not_accepted/'
      case 'all':
        return '/order/order/'
      default:
        console.log(`unknown queryMode: ${this.queryMode}`)
        return '/order/order/'
    }
  }

  search(query: string) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }

  getWorkorderData(uuid: string) {
    return this.axios.get(`/order/workorder-data/${uuid}/`).then((response) => response.data)
  }

  /**
   * Shared plumbing for the stats endpoints, each of which takes one optional
   * filter and wraps its payload in a key named after the action.
   *
   * There are two shapes, and the difference is deliberate rather than an
   * oversight: the customer and branch variants fall back to an unfiltered URL
   * when given no pk, while the location, equipment and building variants
   * always append their filter. Collapsing all twenty into one helper would
   * erase that, so the two shapes stay distinct and named.
   * order-stats-urls.spec.js pins the exact URL of every one of them.
   */
  private async statsRequest(action: string, url: string) {
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data[action] : {}
  }

  /** Filter omitted when no pk is given - the customer/branch shape. */
  private statsOptionalFilter(action: string, filter: string, pk?: number | string | null) {
    const url = pk ? `${this.url}${action}/?${filter}=${pk}` : `${this.url}${action}/`
    return this.statsRequest(action, url)
  }

  /** Filter always appended - the location/equipment/building shape. */
  private statsRequiredFilter(action: string, filter: string, pk: number | string) {
    return this.statsRequest(action, `${this.url}${action}/?${filter}=${pk}`)
  }

  // order types
  getOrderTypesStatsCustomer(customerPk?: number | string | null) {
    return this.statsOptionalFilter('order_types_stats', 'customer', customerPk)
  }

  getOrderTypesStatsBranch(branchPk?: number | string | null) {
    return this.statsOptionalFilter('order_types_stats', 'branch', branchPk)
  }

  getOrderTypesStatsLocation(locationPk: number | string) {
    return this.statsRequiredFilter('order_types_stats', 'location', locationPk)
  }

  getOrderTypesStatsEquipment(equipmentPk: number | string) {
    return this.statsRequiredFilter('order_types_stats', 'equipment', equipmentPk)
  }

  getOrderTypesStatsBuilding(buildingPk: number | string) {
    return this.statsRequiredFilter('order_types_stats', 'building', buildingPk)
  }

  // order types per month
  getOrderTypesMonthsStatsCustomer(customerPk?: number | string | null) {
    return this.statsOptionalFilter('order_types_month_stats', 'customer', customerPk)
  }

  getOrderTypesMonthsStatsBranch(branchPk?: number | string | null) {
    return this.statsOptionalFilter('order_types_month_stats', 'branch', branchPk)
  }

  getOrderTypesMonthsStatsLocation(locationPk: number | string) {
    return this.statsRequiredFilter('order_types_month_stats', 'location', locationPk)
  }

  getOrderTypesMonthsStatsEquipment(equipmentPk: number | string) {
    return this.statsRequiredFilter('order_types_month_stats', 'equipment', equipmentPk)
  }

  getOrderTypesMonthsStatsBuilding(buildingPk: number | string) {
    return this.statsRequiredFilter('order_types_month_stats', 'building', buildingPk)
  }

  // order counts
  getMonthsStatsCustomer(customerPk?: number | string | null) {
    return this.statsOptionalFilter('order_counts_stats', 'customer', customerPk)
  }

  getMonthsStatsBranch(branchPk?: number | string | null) {
    return this.statsOptionalFilter('order_counts_stats', 'branch', branchPk)
  }

  getMonthsStatsLocation(locationPk: number | string) {
    return this.statsRequiredFilter('order_counts_stats', 'location', locationPk)
  }

  getMonthsStatsEquipment(equipmentPk: number | string) {
    return this.statsRequiredFilter('order_counts_stats', 'equipment', equipmentPk)
  }

  getMonthsStatsBuilding(buildingPk: number | string) {
    return this.statsRequiredFilter('order_counts_stats', 'building', buildingPk)
  }

  // order types per year
  getCountsYearOrdertypeStatsCustomer(customerPk?: number | string | null) {
    return this.statsOptionalFilter('counts_year_order_type_stats', 'customer', customerPk)
  }

  getCountsYearOrdertypeStatsBranch(branchPk?: number | string | null) {
    return this.statsOptionalFilter('counts_year_order_type_stats', 'branch', branchPk)
  }

  getCountsYearOrdertypeStatsLocation(locationPk: number | string) {
    return this.statsRequiredFilter('counts_year_order_type_stats', 'location', locationPk)
  }

  getCountsYearOrdertypeStatsEquipment(equipmentPk: number | string) {
    return this.statsRequiredFilter('counts_year_order_type_stats', 'equipment', equipmentPk)
  }

  getCountsYearOrdertypeStatsBuilding(buildingPk: number | string) {
    return this.statsRequiredFilter('counts_year_order_type_stats', 'building', buildingPk)
  }
  async getTopXCustomers() {
    const response = await this.axios.get(`${this.url}get_top_x_customers/`)
    return response.data.get_top_x_customers
  }

  detailUuid(uuid: string) {
    return this.axios.get(`${this.url}detail/${uuid}/`).then((response) => response.data)
  }

  /**
   * Read a paginated list response, recording the pagination counters the way
   * BaseModel.list() does.
   */
  private async listFrom(url: string) {
    const response = await this.axios.get(url)

    if ('count' in response.data) {
      this.count = response.data.count
    }

    if ('num_pages' in response.data) {
      this.numPages = response.data.num_pages
    }

    return response.data
  }

  getAllForCustomer(customer_pk: number | string) {
    const baseUrl = `${this.url}all_for_customer_web/?customer_id=${customer_pk}`
    return this.listFrom(`${baseUrl}&${this.getListArgs().join('&')}`)
  }

  getAllForEquipmentLocation(equipment_id?: number | string | null, location_id?: number | string | null) {
    const filter = equipment_id ? `equipment=${equipment_id}` : `location=${location_id}`
    const baseUrl = `${this.url}all_for_equipment_location/?${filter}`
    return this.listFrom(`${baseUrl}&${this.getListArgs().join('&')}`)
  }

  async setAccepted(order_pk: number | string) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios
      .post(`${this.url}${order_pk}/set_order_accepted/`, {}, headers)
      .then((response) => response.data)
  }

  async setRejected(order_pk: number | string) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios
      .post(`${this.url}${order_pk}/set_order_rejected/`, {}, headers)
      .then((response) => response.data)
  }

  getUnacceptedCount() {
    return this.axios
      .get(`${this.url}all_for_customer_not_accepted_count/`)
      .then((response) => response.data)
  }

  getListArgs() {
    const listArgs: string[] = []

    listArgs.push(`page=${this.currentPage}`)

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    if (this.sort) {
      listArgs.push(`order_by=${this.sort}`)
    }

    if (this.since) {
      listArgs.push(`since=${this.since}`)
    }

    for (const arg of this.listArgs) {
      listArgs.push(arg)
    }

    return listArgs
  }
}

const orderService = new OrderService()

export default orderService
export { OrderService, OrderModel }
