import BaseModel from '@/models/base'


class MaintenanceContract extends BaseModel {
  fields = {
    'customer': null,
    'contract_value': 0.00,
    'remarks': ''
  }

  url = '/customer/maintenance-contract/'
}

const maintenanceContractModel = new MaintenanceContract()

export default maintenanceContractModel
