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
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }
}

let supplierModel = new Supplier()

export default supplierModel
