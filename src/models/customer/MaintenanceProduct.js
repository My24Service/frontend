import BaseModel from '@/models/base'


class MaintenanceProduct extends BaseModel {
  fields = {
    'customer': null,
    // 'product_inventory': 0,
    'product_name': '',
    'brand': '',
    'amount': 0,
    'times_per_year': 0,
    'remarks': '',
    'installation_date': '',
    'production_date': '',
    'serialnumber': '',
    'contract_value': 0.00,
    'standard_hours': 0,
    'materials': ''
  }

  url = '/customer/maintenance-product/'

  async getAll() {
    return this.axios.get(`${this.url}get_all/`).then(response => response.data)
  }
}

const maintenanceProductModel = new MaintenanceProduct()

export default maintenanceProductModel
