import BaseModel from '@/models/base'


class SupplierReservation extends BaseModel {
  fields = {
    'supplier': null,
    'supplier_view': {},
    'material': null,
    'material_view': {},
    'amount': 0,
    'remarks': ''
  }

  url = '/inventory/supplier-reservation/'

}

let supplierReservationModel = new SupplierReservation()

export default supplierReservationModel
