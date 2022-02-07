import BaseModel from '@/models/base'


class Assign extends BaseModel {
  assignToUser(token, user_id, order_ids, notify_user) {
    const url = notify_user ? `/mobile/assign-user/${user_id}/?notify_user=1` : `/mobile/assign-user/${user_id}/`
    // const headers = this.getHeaders(token)
    const data = {order_ids: order_ids.join(',')}

    return this.axios.post(url, data)
  }

  unAssign(token, user_id, order_pk) {
    const url = `/mobile/unassign-user/${user_id}/`
    // const headers = this.getHeaders(token)
    const data = { order_pk }

    return this.axios.post(url, data)
  }
}


export default new Assign()
