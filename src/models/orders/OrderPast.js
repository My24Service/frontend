import BaseModel from '@/models/base'
import orderModel from './Order'


class OrderPast extends BaseModel {
  fields = orderModel.fields

  url = '/order/order/past/'

}

let orderPastModel = new OrderPast()

export default orderPastModel
