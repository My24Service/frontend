import BaseModel from '@/models/base'


class SupplierReservationMaterial extends BaseModel {
  fields = {
    'id': null,
    'reservation': null,
    'material_view': {},
    'material': null,
    'material_name': null,
    'amount': 0,
    'remarks': ''
  }

  url = '/inventory/supplier-reservationmaterial/'

}

let supplierReservationMaterialModel = new SupplierReservationMaterial()

export default supplierReservationMaterialModel
