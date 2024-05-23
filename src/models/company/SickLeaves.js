import BaseModel from '@/models/base'

class SickLeavesModel {
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


class SickLeavesService extends BaseModel {
  url = '/company/user-sick-leave/admin/'
  queryMode = 'all'

  removeNullFields(obj) {
    for (const [field, value] of Object.entries(obj)) {
      if (!value) {
        delete obj[field]
      }
    }
    return obj
  }

  async getUnseenSickLeaves() {
    this.url = `${this.url}all_unseen/`
    const result = await this.list()
    this.url = '/company/user-sick-leave/admin/'
    return result
  }

  async getTotals(data) {
    const url = `${this.url}get_totals/`
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    return this.axios.post(url, this.preInsert(data), headers).then(response => response.data)
  }

  async setAsSeen(pk) {
    const url = `${this.url}${pk}/set_seen/`
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(url, this.preUpdate({}), headers).then((response) => response.data)
  }

  async rejectLeave(pk) {
    const url = `${this.url}${pk}/set_rejected/`
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(url, this.preUpdate({}), headers).then((response) => response.data)
  }
}

export { SickLeavesService, SickLeavesModel }
