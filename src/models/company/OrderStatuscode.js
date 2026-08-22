import AbstractStatuscodeModel, {
  STATUSCODE_TYPE_ORDER,
  BaseStatuscodeService,
} from '@/models/company/AbstractStatuscode.js'


class OrderStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_ORDER

  constructor(statuscode) {
    super()
    for (const [k, v] of Object.entries(statuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class OrderStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_ORDER
}

export { OrderStatuscodeService, OrderStatuscodeModel }
