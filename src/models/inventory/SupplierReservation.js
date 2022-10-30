import BaseModel from '@/models/base'
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial.js'


class SupplierReservation extends BaseModel {
  fields = {
    'id': null,
    'supplier': null,
    'supplier_view': {},
    'materials': [],
    'material': supplierReservationMaterialModel.getFields(),
    'amount': 0,
  }

  url = '/inventory/supplier-reservation/'

}

let supplierReservationModel = new SupplierReservation()

export default supplierReservationModel
