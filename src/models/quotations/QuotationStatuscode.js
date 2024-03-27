import BaseModel from '@/models/base'
import AbstractStatuscodeModel from '@/models/company/AbstractStatuscode.js'


class QuotationStatuscodeModel extends AbstractStatuscodeModel {
  code_type = "quotation"
  num_days
  num_days_operator
  num_days_model_field


  constructor(quotationStatuscode) {
    super()
    for (const [k, v] of Object.entries(quotationStatuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class QuotationStatuscodeService extends BaseModel {
  url = '/statuscode/statuscode/'

  async list() {
    this.addListArg('code_type=quotation')
    return await super.list()
  }
}

export { QuotationStatuscodeService, QuotationStatuscodeModel }
