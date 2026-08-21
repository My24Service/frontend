import AbstractStatuscodeModel, {
  STATUSCODE_TYPE_WORK_HOURS,
  BaseStatuscodeService
} from '@/models/company/AbstractStatuscode.js'

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
