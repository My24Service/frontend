import moment from 'moment'
import BaseModel from '@/models/base';
import {use} from "chai";


class AssignedOrderChangeDatesModel {
  alt_start_date
  alt_start_time
  alt_end_date
  alt_end_time
}

class AssignedOrderModel {
  id
  engineer
  student_user
  order
  alt_start_date
  alt_start_time
  alt_end_date
  alt_end_time
  start_date
  start_time
  end_date
  end_time

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      this[k] = v
    }
  }
}

class AssignedOrderService extends BaseModel {
  fields = {
    "id": null,
    "engineer": null,
    "student_user": null,
    "order": null,
    "started": "",
    "ended": "",
    "rating": null,
    "user_full_name": "",
    "order_name": "",
    "order_city": ""
  }

  url = '/mobile/assignedorder/'

  getDate(d) {
    // check date types
    if (d !== null && typeof d === 'object') {
      return moment(d).format('YYYY-MM-DD')
    }
    return d
  }

  async updateDetailChangeDate(pk, data) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    data.alt_start_date = this.getDate(data.alt_start_date)
    data.alt_end_date = this.getDate(data.alt_end_date)

    return this.axios.patch(`${this.url}${pk}/detail_change_date/`, data, headers).then((response) => response.data)
  }

  async listDevice(user_pk) {
    return this.axios.get(`${this.url}list_device/?user_pk=${user_pk}`).then((response) => response.data)
  }
}

let assignedOrderModel = new AssignedOrderService()

export default assignedOrderModel
export { AssignedOrderService, AssignedOrderChangeDatesModel, AssignedOrderModel }
