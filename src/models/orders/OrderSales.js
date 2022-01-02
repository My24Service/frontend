import BaseModel from '@/models/base'
import orderModel from './Order'


class OrderSales extends BaseModel {
  fields = orderModel.getFields()

  url = '/order/order/sales_orders/'

}

let orderSalesModel = new OrderSales()

export default orderSalesModel
