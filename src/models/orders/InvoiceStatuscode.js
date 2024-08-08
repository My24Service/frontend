import AbstractStatuscodeModel from '@/models/company/AbstractStatuscode.js'
import {BaseStatuscodeService, STATUSCODE_TYPE_INVOICE} from "../company/AbstractStatuscode";


class InvoiceStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_INVOICE

  constructor(quotationStatuscode) {
    super()
    for (const [k, v] of Object.entries(quotationStatuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class InvoiceStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_INVOICE
}

export { InvoiceStatuscodeService, InvoiceStatuscodeModel }
