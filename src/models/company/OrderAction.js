import AbstractActionModel from '@/models/company/AbstractAction.js'

class OrderActionModel extends AbstractActionModel {
  constructor(orderAction) {
    super()
    for (const [k, v] of Object.entries(orderAction)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

export { OrderActionModel }
