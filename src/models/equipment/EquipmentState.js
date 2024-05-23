import BaseModel from "../base";

class EquipmentStateModel {
  id
  equipment
  state
  replace_months

  constructor(state) {
    for (const [k, v] of Object.entries(state)) {
      this[k] = v
    }
  }
}


class EquipmentStateService extends BaseModel {
  url = '/equipment/equipment-state/'
}

const equipmentStateService = new EquipmentStateService()

export default equipmentStateService
export  {EquipmentStateModel, EquipmentStateService}
