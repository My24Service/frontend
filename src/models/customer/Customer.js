import BaseModel from '../base'


class Customer extends BaseModel {
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
    'num_orders': 0
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

let customerModel = new Customer()

export default customerModel
