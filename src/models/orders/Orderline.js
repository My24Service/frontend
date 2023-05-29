import BaseModel from '../base'


class Orderline extends BaseModel {
  fields = {
    'id': null,
    'order': null,
    'product': null,
    'location': null,
    'remarks': null,
    'price_purchase': null,
    'price_selling': null,
    'amount': null,
    'material_relation': null,
    'location_relation_inventory': null,
    'purchase_order_material': null,
    'equipment': null,
    'equipment_location': null,
    'maintenance_contract': null

  }

  url = '/order/orderline/'

}

let orderlineModel = new Orderline()

export default orderlineModel
