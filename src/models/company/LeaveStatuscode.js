import AbstractStatuscodeModel from '@/models/company/AbstractStatuscode.js'
import {BaseStatuscodeService, STATUSCODE_TYPE_LEAVE_HOURS} from "./AbstractStatuscode";


class LeaveStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_LEAVE_HOURS

  constructor(statuscode) {
    super()
    for (const [k, v] of Object.entries(statuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class LeaveStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_LEAVE_HOURS
}

export { LeaveStatuscodeService, LeaveStatuscodeModel }
