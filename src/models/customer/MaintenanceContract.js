import BaseModel from '@/models/base'


class MaintenanceContract extends BaseModel {
  fields = {
    'customer': null,
    'name': null,
    'contract_value': 0.00,
    'remarks': '',
    'equipment': []
  }

  url = '/customer/maintenance-contract/'

}

const maintenanceContractModel = new MaintenanceContract()

export default maintenanceContractModel
