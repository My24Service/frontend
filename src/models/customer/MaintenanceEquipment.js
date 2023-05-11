import BaseModel from '../base'

class MaintenanceEquipment extends BaseModel {
  fields = {
    'id': null,
    'contract': null,
    'customer': null,
    'equipment': null,
    'equipment_name': '',
    'amount': 1,
    'times_per_year': 1,
    'remarks': '',
    'contract_value': 0.00,
    'num_order_equipment': 0,
    'created_orders': 0
  }

  url = '/customer/maintenance-equipment/'

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }
}

const maintenanceEquipmentModel = new MaintenanceEquipment()

export default maintenanceEquipmentModel
