import AbstractStatuscodeModel from '@/models/company/AbstractStatuscode.js'
import {
  BaseStatuscodeService,
  STATUSCODE_TYPE_SICK_LEAVE
} from "./AbstractStatuscode";


class SickLeaveStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_SICK_LEAVE

  constructor(statuscode) {
    super()
    for (const [k, v] of Object.entries(statuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class SickLeaveStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_SICK_LEAVE
}

export { SickLeaveStatuscodeService, SickLeaveStatuscodeModel }
