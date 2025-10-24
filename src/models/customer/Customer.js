import BaseModel from '../base'
import priceMixin from "../../mixins/price";

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
  // TODO: remove this and use model
  fields = {
    'id': null,
    'name': '',
    'address': '',
    'postal': '',
    'city': '',
    'country_code': 'NL',
    'tel': '',
    'email': '',
    'contact': '',
    'mobile': '',
    'time': null,
    'time2': null,
    'timealt': null,
    'timealt2': null,
    'remarks': '',
    'hours': null,
    'customer_id': '',
    'external_identifier': '',
    'products_without_tax': false,

    'maintenance_contract': '',

    'standard_hours_hour': 0,
    'standard_hours_minute': '00',
    'documents': [],
    'branch_partner': null,
    'branch_id': null,
    'branch_view': null,
    'use_branch_address': true,
    'num_orders': 0,

    'call_out_costs': '0.00',
    'call_out_costs_currency': 'EUR',

    'hourly_rate_engineer': '0.00',
    'hourly_rate_engineer_currency': 'EUR',

    'hourly_rate_partner_engineer': '0.00',
    'hourly_rate_partner_engineer_currency': 'EUR',

    'price_per_km': '0.00',
    'price_per_km_currency': 'EUR',
  }

  url = '/customer/customer/'

  getCustomerId() {
    return this.axios.get(`${this.url}check_customer_id_handling/`).then((result) => result.data)
  }

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }

  getNewCustomerIdFromLatest() {
    return this.axios.get(`${this.url}get_new_customer_id_from_latest/`).then((result) => result.data)
  }

  getExportUrl() {
    let listArgs = []

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    return `/api/customer/export/?${listArgs.join('&')}`
  }

}

export default new CustomerService()
export { CustomerPriceModel, CustomerModel, CustomerService }
