import moment from 'moment'
import BaseModel from '@/models/base';
import {use} from "chai";


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

  getDetailChangeDate(pk) {
    return this.axios.get(`${this.url}${pk}/detail_change_date/`).then((response) => response.data)
  }

  async updateDetailChangeDate(pk, data) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    // check date types
    if (data.alt_start_date !== null && typeof data.alt_start_date === 'object') {
      data.alt_start_date = moment(data.alt_start_date).format('YYYY-MM-DD')
    }

    if (data.alt_end_date !== null && typeof data.alt_end_date === 'object') {
      data.alt_end_date = moment(data.alt_end_date).format('YYYY-MM-DD')
    }

    return this.axios.patch(`${this.url}${pk}/detail_change_date/`, data, headers).then((response) => response.data)
  }

  async listDevice(user_pk) {
    return this.axios.get(`${this.url}list_device/?user_pk=${user_pk}`).then((response) => response.data)
  }
}

let assignedOrderModel = new AssignedOrderService()

export default assignedOrderModel
export { AssignedOrderService }
