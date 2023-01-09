import BaseModel from '@/models/base'


class Assign extends BaseModel {
  async assignToUser(user_id, order_ids, notify_user) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = notify_user ? `/mobile/assign-user/${user_id}/?notify_user=1` : `/mobile/assign-user/${user_id}/`
    const data = {order_ids: order_ids.join(',')}

    return this.axios.post(url, data, headers).then((response) => response.data)
  }

  async unAssign(user_id, order_pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `/mobile/unassign-user/${user_id}/`
    const data = { order_pk }

    return this.axios.post(url, data, headers).then((response) => response.data)
  }
}


export default new Assign()
