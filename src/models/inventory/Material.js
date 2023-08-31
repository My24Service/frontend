import BaseModel from '@/models/base'
import priceMixin from "../../mixins/price";
import {toDinero} from "../../utils";

class MaterialModel {
  name_short;
  name;
  identifier;
  unit;

  supplier;
  supplier_relation;
  supplier_name;

  product_type;
  location;

  margin;
  margin_perc;

  price_purchase;
  price_selling;
  price_selling_alt;

  price_purchase_ex;
  price_purchase_ex_dinero;
  price_purchase_ex_currency;

  price_selling_ex;
  price_selling_ex_currency;
  price_selling_alt_ex;

  price_other
  price_other_currency

  priceFields = ['price_purchase_ex', 'price_selling_ex']

  image;

  constructor(material) {
    for (const [k, v] of Object.entries(material)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }

  recalcSelling() {
    this.price_selling_ex_dinero = this.price_purchase_ex_dinero.multiply(1+this.margin_perc/100)
    this.price_selling_ex = this.price_selling_ex_dinero.toFormat('0.00')
    this.price_selling_ex_currency = this.price_selling_ex_dinero.getCurrency()
    return true
  }

  setPurchasePrice(priceDinero) {
    return this.setPriceField('price_purchase_ex', priceDinero)
  }

  setSellingPrice(priceDinero) {
    return this.setPriceField('price_selling_ex', priceDinero)
  }

}

Object.assign(MaterialModel.prototype, priceMixin);

class MaterialService extends BaseModel {
  // TODO: remove this and use model
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
    'price_purchase_ex_dinero': null,
    'price_purchase_ex_currency': 'EUR',

    'price_other': '0.00',
    'price_other_dinero': null,
    'price_other_currency': 'EUR',

    'price_selling_ex': '0.00',
    'price_selling_ex_dinero': null,
    'price_selling_ex_currency': 'EUR',

    'price_selling_alt_ex': '0.00',

    'image': null
  }

  url = '/inventory/material/'

  async move(materialPk, fromLocationPk, toLocationPk, amount) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.url}${materialPk}/move/`
    const body = {
      'from_location_id': fromLocationPk,
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
    let listArgs = [`year=${year}`]

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    return this.axios.get(`${this.url}stats_table/?${listArgs.join('&')}`)
      .then((response) => response.data)
  }

  getStatsTableUrl(year) {
    let listArgs = [`year=${year}`]

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    return `/inventory/stats_table_export/?${listArgs.join('&')}`
  }
}

let materialService = new MaterialService()

export { MaterialModel }
export default materialService
