import AbstractStatuscodeModel from '@/models/company/AbstractStatuscode.js'
import {BaseStatuscodeService, STATUSCODE_TYPE_QUOTATION} from "../company/AbstractStatuscode";


class QuotationStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_QUOTATION
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

class QuotationStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_QUOTATION
}

export { QuotationStatuscodeService, QuotationStatuscodeModel }
