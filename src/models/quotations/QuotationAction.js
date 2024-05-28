import AbstractActionModel from '@/models/company/AbstractAction.js'

class QuotationActionModel extends AbstractActionModel {
  constructor(quotationAction) {
    super()
    for (const [k, v] of Object.entries(quotationAction)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

export { QuotationActionModel }
