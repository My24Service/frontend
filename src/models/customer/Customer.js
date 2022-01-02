import BaseModel from '@/models/base'


class Customer extends BaseModel {
  fields = {
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
    'documents': []
  }

  url = '/customer/customer/'

  getCustomerId() {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}check_customer_id_handling/`).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  search(query) {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => {
        resolve(response.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }
}

let customerModel = new Customer()

export default customerModel
