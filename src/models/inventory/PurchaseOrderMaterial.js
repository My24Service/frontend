import BaseModel from '@/models/base'


class PurchaseOrderMaterial extends BaseModel {
  fields = {
    'id': null,
    'purchase_order': null,
    'material_view': {},
    'material': null,
    'material_name': null,
    'amount': 0,
    'remarks': ''
  }

  url = '/inventory/purchaseorder-material/'

}

let purchaseOrderMaterialModel = new PurchaseOrderMaterial()

export default purchaseOrderMaterialModel
