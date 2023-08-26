import BaseModel from '../base'
import {toDinero} from "../../utils";

class CustomerModel {
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
  call_out_costs_dinero

  hourly_rate_engineer
  hourly_rate_engineer_currency
  hourly_rate_engineer_dinero

  hourly_rate_partner_engineer
  hourly_rate_partner_engineer_currency
  hourly_rate_partner_engineer_dinero

  price_per_km
  price_per_km_currency
  price_per_km_dinero

  constructor(customerData) {
    for (const [k, v] of Object.entries(customerData)) {
      this[k] = v
    }

    this.setPriceFields(this)
  }

  setHourlyRateEngineer(priceDinero) {
    this.hourly_rate_engineer_dinero = priceDinero
    this.hourly_rate_engineer = this.hourly_rate_engineer_dinero.toFormat('0.00')
    this.hourly_rate_engineer_currency = this.hourly_rate_engineer_dinero.getCurrency()
    return true
  }

  setPricePerKm(priceDinero) {
    this.price_per_km_dinero = priceDinero
    this.price_per_km = this.price_per_km_dinero.toFormat('0.00')
    this.price_per_km_currency = this.price_per_km_dinero.getCurrency()
    return true
  }

  setHourlyRatePartnerEngineer(priceDinero) {
    this.hourly_rate_partner_engineer_dinero = priceDinero
    this.hourly_rate_partner_engineer = this.hourly_rate_partner_engineer_dinero.toFormat('0.00')
    this.hourly_rate_partner_engineer_currency = this.hourly_rate_partner_engineer_dinero.getCurrency()
    return true
  }

  setCallOutCosts(priceDinero) {
    this.call_out_costs_dinero = priceDinero
    this.call_out_costs = this.call_out_costs_dinero.toFormat('0.00')
    this.call_out_costs_currency = this.call_out_costs_dinero.getCurrency()
    return true
  }

  setPriceFields(obj) {
    if (obj.hourly_rate_engineer && obj.hourly_rate_engineer_currency) {
      this.hourly_rate_engineer_dinero = toDinero(
        obj.hourly_rate_engineer, obj.hourly_rate_engineer_currency)
    }

    if (obj.hourly_rate_partner_engineer && obj.hourly_rate_partner_engineer_currency) {
      this.hourly_rate_partner_engineer_dinero = toDinero(
        obj.hourly_rate_partner_engineer, obj.hourly_rate_partner_engineer_currency)
    }

    if (obj.call_out_costs && obj.call_out_costs_currency) {
      this.call_out_costs_dinero = toDinero(
        obj.call_out_costs, obj.call_out_costs_currency)
    }

    if (obj.price_per_km && obj.price_per_km_currency) {
      this.price_per_km_dinero = toDinero(
        obj.price_per_km, obj.price_per_km_currency)
    }
  }
}

class CustomerPriceModel {
  // minimal model for prices PATCH
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

    return `/customer/export/?${listArgs.join('&')}`
  }

}

export default new CustomerService()
export { CustomerPriceModel, CustomerModel }
