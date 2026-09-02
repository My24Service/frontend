import BaseModel from '../base'
import priceMixin from "../../mixins/price";

/**
 * TEMPORARY SHIM — do not extend.
 *
 * The Customer screens (list, form, detail/dashboard and the documents
 * panel) moved to `src/features/customer/`, taking the form-defaults bag and
 * the documents service with them; what remains here is exactly what the
 * not-yet-rewritten quotation, order, invoice, equipment and company screens
 * still need:
 *
 *   - `CustomerModel` — the display wrapper those screens construct over a
 *     detail payload, with the price-field normalisation PriceInput drives.
 *     Its field list is the shape hint the price mixin walks, not a form
 *     contract; the constructor copies whatever the caller supplies, exactly
 *     as it always did.
 *   - `CustomerPriceModel` — the minimal body InvoiceForm PATCHes prices
 *     with; its field list is the outgoing whitelist (the constructor filters
 *     on it), a hand-held subset of the generated customer write schema's
 *     price fields.
 *   - `CustomerService` — `search` (the autocomplete the order, quotation and
 *     equipment forms bind to), `getMyCustomer` (EquipmentForm's customer
 *     branch) and the inherited `detail`/`update`. The `fields` dict — the
 *     hand-restated defaults whose staleness was the reason for the
 *     schema-derived rule — went with the form; `getCustomerId`,
 *     `getNewCustomerIdFromLatest` and `getExportUrl` went with it too, into
 *     the Slice.
 *
 * Per CONTEXT.md, a Shim is defined by where it lives — outside the finished
 * Slice, beside its legacy callers — and by being temporary. This one
 * disappears when those screens get their own Slices and call the generated
 * SDK directly, the way #326 retired the Member service; the remaining work
 * is tracked by the rewrite's parent, #313.
 */

class CustomerModel {
  default_currency
  id
  name
  address
  postal
  city
  country_code
  tel
  email
  contact
  mobile
  time
  time2
  timealt
  timealt2
  remarks
  customer_id
  external_identifier
  products_without_tax
  maintenance_contract
  standard_hours_hour
  standard_hours_minute
  branch_partner
  branch_id
  use_branch_address

  call_out_costs
  call_out_costs_currency

  hourly_rate_engineer
  hourly_rate_engineer_currency

  hourly_rate_partner_engineer
  hourly_rate_partner_engineer_currency

  price_per_km
  price_per_km_currency

  priceFields = [
    'call_out_costs',
    'hourly_rate_engineer',
    'hourly_rate_partner_engineer',
    'price_per_km'
  ]

  constructor(customerData) {
    for (const [k, v] of Object.entries(customerData)) {
      this[k] = v
    }

    this.setPriceFields(this)
  }

  setHourlyRateEngineer(priceDinero) {
    return this.setPriceField('hourly_rate_engineer', priceDinero)
  }

  setPricePerKm(priceDinero) {
    return this.setPriceField('price_per_km', priceDinero)
  }

  setHourlyRatePartnerEngineer(priceDinero) {
    return this.setPriceField('hourly_rate_partner_engineer', priceDinero)
  }

  setCallOutCosts(priceDinero) {
    return this.setPriceField('call_out_costs', priceDinero)
  }
}

Object.assign(CustomerModel.prototype, priceMixin);

class CustomerPriceModel {
  // minimal model for prices PATCH, no mixin needed
  id
  call_out_costs
  call_out_costs_currency

  hourly_rate_engineer
  hourly_rate_engineer_currency

  hourly_rate_partner_engineer
  hourly_rate_partner_engineer_currency

  price_per_km
  price_per_km_currency

  constructor(customerData) {
    for (const [k, v] of Object.entries(customerData)) {
      if (this.hasOwnProperty(k)) {
        this[k] = v
      }
    }
  }
}

class CustomerService extends BaseModel {
  url = '/customer/customer/'

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }

  getMyCustomer() {
    return this.axios.get('/customer/customer-my/').then((response) => response.data)
  }
}

export default new CustomerService()
export { CustomerPriceModel, CustomerModel, CustomerService }
