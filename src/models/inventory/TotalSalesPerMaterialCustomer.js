import BaseModel from '@/models/base'


class TotalSalesPerMaterialCustomer extends BaseModel {
  fields = {
  }

  url = '/inventory/material/total_sales_per_material_customer/'

}

let totalSalesPerMaterialCustomerModel = new TotalSalesPerMaterialCustomer()

export default totalSalesPerMaterialCustomerModel
