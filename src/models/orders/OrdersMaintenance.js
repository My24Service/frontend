import BaseModel from '../../models/base'

class OrdersMaintenanceService extends BaseModel {
  url = '/order/order/maintenance_orders/'
}

let ordersMaintenanceService = new OrdersMaintenanceService()

export default ordersMaintenanceService
export { OrdersMaintenanceService }
