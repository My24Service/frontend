import BaseModel from '@/models/base'


class Material extends BaseModel {
  fields = {
    'name_short': '',
    'name': '',
    'identifier': '',
    'unit': '',

    'supplier': '',
    'supplier_relation': 0,
    'supplier_name': '',

    'product_type': '',
    'location': '',

    'price_purchase': '0.00',
    'price_selling': '0.00',
    'price_selling_alt': '0.00',

    'price_purchase_ex': '0.00',
    'price_selling_ex': '0.00',
    'price_selling_alt_ex': '0.00',

    'image': null
  }

  url = '/inventory/material/'

  async move(materialPk, fromLoctionPk, toLocationPk, amount) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.url}${materialPk}/move/`
    const body = {
      'from_location_id': fromLoctionPk,
      'to_location_id': toLocationPk,
      amount,
    }

    return this.axios.post(url, body, headers).then((response) => response.data)
  }

  search(query, supplier) {
    const url = supplier ? `${this.url}autocomplete/?supplier=${supplier}&q=${query}` : `${this.url}?q=${query}`

    return this.axios.get(url).then((response) => response.data)
  }

  getForSupplier(supplier) {
    return this.axios.get(`${this.url}?supplier_relation=${supplier}`).then((response) => response.data.results)
  }

  getStatsTable(year) {
    return this.axios.get(`${this.url}stats_table/?year=${year}`).then((response) => response.data)
  }
}

let materialModel = new Material()

export default materialModel
