import BaseModel from '@/models/base'


class OrderNotAccepted extends BaseModel {
  url = '/order/order/all_for_customer_not_accepted/'

  async setAccepted(order_pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `/order/order/${order_pk}/set_order_accepted/`

    return new this.axios.post(url, {}, headers).then(response => response.data)
  }

  async setRejected(order_pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `/order/order/${order_pk}/set_order_rejected/`

    return new this.axios.post(url, {}, headers).then(response => response.data)
  }

  getCount() {
    return new this.axios.get('/order/order/all_for_customer_not_accepted_count/')
      .then(response => response.data)
  }
}

let orderNotAcceptedModel = new OrderNotAccepted()

export default orderNotAcceptedModel
