import BaseModel from '@/models/base'
import orderModel from './Order'


class OrderPastService extends BaseModel {
  fields = orderModel.fields

  url = '/order/order/past/'

}

let orderPastService = new OrderPastService()

export default orderPastService
export { OrderPastService }
