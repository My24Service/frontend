import BaseModel from '../base'
import priceMixin from "../../mixins/price";
import {toDinero} from "../../utils";


class MaintenanceEquipmentModel {
  id
  contract
  equipment
  equipment_name
  times_per_year
  remarks

  tariff
  tariff_currency

  num_order_equipment
  created_orders

  priceFields = ['tariff']

  constructor(maintenanceEquipment) {
    for (const [k, v] of Object.entries(maintenanceEquipment)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }
}

Object.assign(MaintenanceEquipmentModel.prototype, priceMixin);

class MaintenanceEquipmentService extends BaseModel {
  model = MaintenanceEquipmentModel
  fields = {
    'id': null,
    'contract': null,
    'customer': null,
    'equipment': null,
    'equipment_name': '',
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

  getItemsTotal() {
    if (!this.collection.length) {
      return  toDinero("0.00", this.modelDefaults.tariff_currency)
    }

    return this.collection.reduce(
      (total, m) => (total.add(m.tariff_dinero)),
      toDinero("0.00", this.collection[0].tariff_currency)
    )
  }

}

const maintenanceEquipmentService = new MaintenanceEquipmentService()

export default maintenanceEquipmentService
export {MaintenanceEquipmentModel, MaintenanceEquipmentService }
