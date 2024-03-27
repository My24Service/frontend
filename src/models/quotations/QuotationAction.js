import BaseModel from '@/models/base'
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

class QuotationActionService extends BaseModel {
  url = '/statuscode/action/'
}

export { QuotationActionService, QuotationActionModel }
