import BaseModel from '@/models/base'


class StockLocation extends BaseModel {
  fields = {
    'name': '',
    'identifier': '',
    'created': null,
    'modified': null
  }

  url = '/inventory/stock-location/'
}

let stockLocationModel = new StockLocation()

export default stockLocationModel
