import BaseModel from '@/models/base'


class TotalSalesPerSupplier extends BaseModel {
  fields = {
  }

  url = '/inventory/material/total_sales_per_supplier/'

}

let totalSalesPerSupplierModel = new TotalSalesPerSupplier()

export default totalSalesPerSupplierModel
