import BaseModel from '@/models/base'


class TotalSalesPerCustomer extends BaseModel {
  fields = {
  }

  url = '/inventory/material/total_sales_per_customer/'

}

let totalSalesPerCustomerModel = new TotalSalesPerCustomer()

export default totalSalesPerCustomerModel
