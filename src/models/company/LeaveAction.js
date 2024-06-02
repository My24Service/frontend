import AbstractActionModel from '@/models/company/AbstractAction.js'

class LeaveActionModel extends AbstractActionModel {
  constructor(action) {
    super()
    for (const [k, v] of Object.entries(action)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

export { LeaveActionModel }
