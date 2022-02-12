import BaseModel from '@/models/base'


class Supplier extends BaseModel {
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
    'remarks': '',
    'identifier': ''
  }

  url = '/inventory/supplier/'

  search(query) {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}autocomplete/?q=${query}`)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

let supplierModel = new Supplier()

export default supplierModel
