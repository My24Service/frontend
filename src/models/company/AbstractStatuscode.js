import BaseModel from "../base";

export const STATUSCODE_TYPE_ORDER = 'order'
export const STATUSCODE_TYPE_QUOTATION = 'quotation'
export const STATUSCODE_TYPE_INVOICE = 'invoice'
export const STATUSCODE_TYPE_TRIP = 'trip'
export const STATUSCODE_TYPE_LEAVE_HOURS = 'leave_hours'
export const STATUSCODE_TYPE_SICK_LEAVE = 'sick_leave'
export const STATUSCODE_TYPE_PURCHASE_ORDER = 'purchase_order'
export const STATUSCODE_TYPE_WORK_HOURS = 'work_hours'

class AbstractStatuscodeModel {
  statuscode
  color
  text_color
  description
  new_status_template
  as_filter = false
}

class BaseStatuscodeService extends BaseModel {
  code_type = undefined
  url = '/statuscode/statuscode/'

  async list() {
    this.setListArgs(`code_type=${this.code_type}`)
    return await super.list()
  }
}

export default AbstractStatuscodeModel
export { BaseStatuscodeService }
