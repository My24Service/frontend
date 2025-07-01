import AbstractStatuscodeModel, {
  STATUSCODE_TYPE_WORK_HOURS
} from '@/models/company/AbstractStatuscode.js'
import {
  BaseStatuscodeService,
  STATUSCODE_TYPE_SICK_LEAVE
} from "./AbstractStatuscode";


class WorkHoursStatuscodeModel extends AbstractStatuscodeModel {
  code_type = STATUSCODE_TYPE_WORK_HOURS

  constructor(statuscode) {
    super()
    for (const [k, v] of Object.entries(statuscode)) {
      if (this[k]) {
        this[k] = v
      }
    }
  }
}

class WorkHoursStatuscodeService extends BaseStatuscodeService {
  code_type = STATUSCODE_TYPE_WORK_HOURS
}

export { WorkHoursStatuscodeService, WorkHoursStatuscodeModel }
