import BaseModel from '@/models/base'


class OrderWorkorderService extends BaseModel {
  fields = {

  }

  url = '/order/order/workorder_orders/'

}

let orderWorkorderModelService = new OrderWorkorderService()

export default orderWorkorderModelService
export { OrderWorkorderService }
