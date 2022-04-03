import BaseModel from '@/models/base'


class OrderNotAccepted extends BaseModel {
  fields = {

  }

  url = '/order/order/all_for_customer_not_accepted/'

  setAccepted(token, order_pk) {
    const headers = this.getHeaders(token)
    const url = `/order/order/${order_pk}/set_order_accepted/`

    return new this.axios.post(url, {}, headers).then(response => response.data)
  }

  setRejected(token, order_pk) {
    const headers = this.getHeaders(token)
    const url = `/order/order/${order_pk}/set_order_rejected/`

    return new this.axios.post(url, {}, headers).then(response => response.data)
  }
}

let orderNotAcceptedModel = new OrderNotAccepted()

export default orderNotAcceptedModel
