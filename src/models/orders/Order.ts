import BaseModel from '../base'
import { formDefaults, nullableStr, int, str, validate, SchemaValidationError } from '../schema'
import * as v from 'valibot'
import {
  orderCreateSchemaFor,
  orderUpdateSchemaFor,
  orderWritableEntries,
  type OrderWriteContext,
} from './order-schemas'

export * from './order-schemas'

/**
 * The default start/end date: the next working day.
 *
 * A function rather than a module-level constant: computed once at import
 * time, a session left open past midnight keeps handing out yesterday's
 * "tomorrow".
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
 * Derived from `orderWritableEntries` so the writable fields cannot drift from
 * what the backend accepts, plus the two groups above. `start_date`/`end_date` are
 * overridden back to `Date` because the datepicker binds Date objects;
 * `insert`/`update` convert them on the way out.
 *
 * `order_email_extra` defaults to `[]`, not `''`: it is a ListField of
 * e-mails and OrderViewMaintenance.vue calls `.join(', ')` on it.
 */
export const OrderFormSchema = v.object({
  ...orderWritableEntries,
  start_date: v.optional(v.date(), () => nextWorkingDay()),
  end_date: v.optional(v.date(), () => nextWorkingDay()),
  ...discardedByBackendEntries,
  ...formOnlyEntries,
})

export type OrderForm = v.InferOutput<typeof OrderFormSchema>

/**
 * The order form's blank values.
 *
 * `order_type` is the case the schema split exists for: `OrderCreateSerializer`
 * requires it, and a new order has not chosen one yet. That is a property of
 * the form, not of the API, so it is a default here rather than a `v.nullable`
 * widening of a write schema that correctly says the field is required.
 */
const ORDER_FORM_DEFAULTS = {
  order_type: null,
  order_country_code: 'NL',
  // Stated rather than inferred: `start_time`/`end_time` are `apiTime()` pipes,
  // and a pipe around a union has no single implied blank value, so
  // `inferDefault` leaves them `undefined`. A blank form has no time set.
  start_time: null,
  end_time: null,
}

/**
 * The order form's blank values, freshly built on each call.
 *
 * Exported so tests can pin them without going through `getFields()`, which
 * JSON-clones and would hide an `undefined` by dropping the key.
 */
export const orderFormDefaults = () => formDefaults(OrderFormSchema, ORDER_FORM_DEFAULTS)

/**
 * Validate what a form is about to POST to `/order/order/`.
 *
 * Which serializer the backend will read it with depends on who is writing -
 * customer, branch employee or planning - so the caller says which it is
 * rather than this guessing. See `OrderWriteContext`.
 *
 * Returns `{ success, output, errors }` and never throws - a form wants to
 * render the failures, not crash on them. `output` is the payload to send: the
 * schema drops the form-only keys the serializer does not accept and converts
 * the datepicker's `Date`s to `YYYY-MM-DD`.
 */
export function validateOrderCreate(order: unknown, write: OrderWriteContext) {
  return validate(orderCreateSchemaFor(write), order)
}

/**
 * Validate what a form is about to PATCH onto an existing order.
 *
 * Only the customer variant differs here; everyone else updates through
 * `OrderUpdateSerializer`, which accepts neither `quotation` nor `branch`.
 */
export function validateOrderUpdate(order: unknown, write: OrderWriteContext) {
  return validate(orderUpdateSchemaFor(write), order)
}

/**
 * The context is required, but `BaseModel`'s collection helpers call
 * `this.insert(item)` with one argument. Say what is missing, rather than
 * failing on a destructure.
 */
function requireWriteContext(write: OrderWriteContext, method: string) {
  if (!write?.role) {
    throw new Error(
      `OrderService.${method} needs a write context saying who is writing, ` +
        "e.g. {role: 'planning', hasBranches} - the backend picks its serializer by role. " +
        'BaseModel.updateCollection() cannot be used for orders for this reason.',
    )
  }
}

/**
 * The client-side Order object the forms instantiate directly
 * (`new OrderModel()`).
 *
 * Generated from OrderFormSchema so it cannot drift from `fields`.
 */
const OrderModel = class {
  constructor(data: Partial<OrderForm> = {}) {
    Object.assign(this, formDefaults(OrderFormSchema, ORDER_FORM_DEFAULTS), data)
  }
  // The defaults are assigned in the constructor rather than declared as class
  // properties, so the construct signature is asserted to describe the result.
} as new (data?: Partial<OrderForm>) => OrderForm

class OrderService extends BaseModel {
  model = OrderModel
  fields = formDefaults(OrderFormSchema, ORDER_FORM_DEFAULTS)

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
   * Create an order, checked against the serializer the backend will read it
   * with. `write` says which - the view picks by role, which a model cannot
   * know without reading a store. Throws `SchemaValidationError` (one message
   * per field) before issuing any request; what is sent is the schema's output,
   * so unknown keys, `created`/`modified` and the form-only fields drop out.
   */
  async insert(order: unknown, write: OrderWriteContext) {
    requireWriteContext(write, 'insert')

    const result = validateOrderCreate(order, write)

    if (!result.success) {
      throw new SchemaValidationError('order', result.errors)
    }

    return super.insert(result.output)
  }

  /** As `insert`, for the update serializers. See `orderUpdateSchemaFor`. */
  async update(pk: number | string, order: unknown, write: OrderWriteContext) {
    requireWriteContext(write, 'update')

    const result = validateOrderUpdate(order, write)

    if (!result.success) {
      throw new SchemaValidationError('order update', result.errors)
    }

    return super.update(pk, result.output)
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
