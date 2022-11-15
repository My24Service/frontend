import BaseModel from '@/models/base'


class StockLocation extends BaseModel {
  fields = {
    'name': '',
    'identifier': '',
    'created': null,
    'modified': null,
    'show_in_stats': false
  }

  url = '/inventory/stock-location/'
}

let stockLocationModel = new StockLocation()

export default stockLocationModel
