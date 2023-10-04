import BaseModel from '../../models/base'
import {MaintenanceEquipmentModel} from "./MaintenanceEquipment";
import priceMixin from "../../mixins/price";

class MaintenanceContractModel {
  id
  customer
  name
  remarks
  sum_tariffs
  sum_tariffs_currency
  equipment = []
  priceFields = ['sum_tariffs']

  constructor(maintenanceContract) {
    for (const [k, v] of Object.entries(maintenanceContract)) {
      if (k === 'equipment') {
        this[k] = v.map((m) => new MaintenanceEquipmentModel(m))
      } else {
        this[k] = v
      }
    }
    this.setPriceFields(this)
  }

}

Object.assign(MaintenanceContractModel.prototype, priceMixin);

class MaintenanceContractService extends BaseModel {
  model = MaintenanceContractModel

  fields = {
    'customer': null,
    'name': null,
    'contract_value': 0.00,
    'remarks': '',
    'equipment': []
  }

  url = '/customer/maintenance-contract/'

}

const maintenanceContractService = new MaintenanceContractService()

export default maintenanceContractService
export {MaintenanceContractModel, MaintenanceContractService}
