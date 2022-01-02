import BaseModel from '@/models/base';


class AssignedOrderMaterial extends BaseModel {
  fields = {
    'id': null,
    'assigned_order': null,
    'material': null,
    'location': null,
    'location_name': null,
    'amount': null,
    'material_name': null,
    'material_identifier': null
  }

  url = '/mobile/assignedordermaterial/'
}

let assignedOrderMaterialModel = new AssignedOrderMaterial();

export default assignedOrderMaterialModel
