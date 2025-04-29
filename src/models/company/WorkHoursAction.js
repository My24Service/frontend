import AbstractActionModel from '@/models/company/AbstractAction.js'

class WorkHoursActionModel extends AbstractActionModel {
  constructor(workhoursAction) {
    super()
    for (const [k, v] of Object.entries(workhoursAction)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

export { WorkHoursActionModel }
