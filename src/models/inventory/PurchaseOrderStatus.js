import BaseModel from '@/models/base'


class PurchaseOrderStatus extends BaseModel {
  fields = {
    'purchase_order': 0,
    'status': '',
    'new_status': ''
  }

  url = '/inventory/purchaseorder-status/'

}

let purchaseOrderStatusModel = new PurchaseOrderStatus()

export default purchaseOrderStatusModel
