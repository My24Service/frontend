import BaseModel from '@/models/base'


class TotalSales extends BaseModel {
  fields = {
  }

  url = '/inventory/material/total_sales/'

}

let totalSalesModel = new TotalSales()

export default totalSalesModel
