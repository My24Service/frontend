import BaseModel from '@/models/base'
import orderModel from './Order'


class OrderPast extends BaseModel {
  fields = orderModel.fields

  url = '/order/order/pastv2/'

}

let orderPastModel = new OrderPast()

export default orderPastModel
