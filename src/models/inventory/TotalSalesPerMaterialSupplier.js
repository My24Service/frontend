import BaseModel from '@/models/base'


class TotalSalesPerMaterialSupplier extends BaseModel {
  fields = {
  }

  url = '/inventory/material/total_sales_per_supplier_per_material/'

}

let totalSalesPerMaterialSupplierModel = new TotalSalesPerMaterialSupplier()

export default totalSalesPerMaterialSupplierModel
