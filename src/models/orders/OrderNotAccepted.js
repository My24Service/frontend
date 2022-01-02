import BaseModel from '@/models/base'


class OrderNotAccepted extends BaseModel {
  fields = {

  }

  url = '/order/order/all_for_customer_not_accepted/'

  setAccepted(token, order_pk) {
    const headers = this.getHeaders(token)
    const url = `/order/order/${order_pk}/set_order_accepted/`

    return new Promise((resolve, reject) => {
      this.axios.post(url, {}, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

let orderNotAcceptedModel = new OrderNotAccepted()

export default orderNotAcceptedModel
