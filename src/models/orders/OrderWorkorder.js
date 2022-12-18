import BaseModel from '@/models/base'


class OrderWorkorder extends BaseModel {
  useRust = true
  fields = {

  }

  url = '/order/order/workorder_orders/'

}

let orderWorkorderModel = new OrderWorkorder()

export default orderWorkorderModel
