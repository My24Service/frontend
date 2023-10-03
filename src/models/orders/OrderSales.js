import BaseModel from '@/models/base'
import orderModel from './Order'


class OrderSalesService extends BaseModel {
  fields = orderModel.getFields()

  url = '/order/order/sales_orders/'

}

let orderSalesService = new OrderSalesService()

export default orderSalesService
export { OrderSalesService }
