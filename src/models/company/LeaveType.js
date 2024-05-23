import BaseModel from '@/models/base'

class LeaveTypeModel {
  id
  leave_type
  description
  start_date
  start_date_is_whole_day
  start_date_hours
  start_date_minutes
  end_date
  end_date_is_whole_day
  end_date_hours
  end_date_minutes
  total_hours
  total_minutes
  is_accepted
  is_rejected
}


class LeaveTypeService extends BaseModel {
  url = '/company/leave-type/'
  queryMode = 'all'

  removeNullFields(obj) {
    for (const [field, value] of Object.entries(obj)) {
      if (!value) {
        delete obj[field]
      }
    }
    return obj
  }

  async getLeaveTypesForSelect() {
    this.url = `${this.url}list_for_select/`
    const result = await this.list()
    this.url = '/company/leave-type/'
    return result
  }
}

export { LeaveTypeService, LeaveTypeModel }
