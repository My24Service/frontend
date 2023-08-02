import BaseModel from '@/models/base'
import {toDinero} from "../../utils";
import Dinero from "dinero.js";

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

  price_purchase;
  price_selling;
  price_selling_alt;

  price_purchase_ex;
  price_purchase_ex_dinero;
  price_purchase_ex_number;
  price_purchase_ex_decimal;
  price_purchase_ex_currency;

  price_selling_ex;
  price_selling_ex_dinero;
  price_selling_ex_number;
  price_selling_ex_decimal;
  price_selling_ex_currency;
  price_selling_alt_ex;

  image;

  constructor(material) {
    if (material.price_purchase_ex && material.price_purchase_ex_currency) {
      material.price_purchase_ex_dinero = toDinero(
        material.price_purchase_ex, material.price_purchase_ex_currency)
      let parts = material.price_purchase_ex_dinero.toFormat('0.00').split('.')
      material.price_purchase_ex_number = parts[0]
      material.price_purchase_ex_decimal = parts[1]

      material.price_selling_ex_dinero = toDinero(material.price_selling_ex, material.price_selling_ex_currency)
      parts = material.price_selling_ex_dinero.toFormat('0.00').split('.')
      material.price_selling_ex_number = parts[0]
      material.price_selling_ex_decimal = parts[1]
    }

    for (const [k,v] of Object.entries(material)) {
      this[k] = v
    }
  }

  recalcSelling() {
    this.price_selling_ex_dinero = this.price_purchase_ex_dinero.multiply(1+this.margin/100)
    let parts = this.price_selling_ex_dinero.toFormat('0.00').split('.')
    this.price_selling_ex_number = parts[0]
    this.price_selling_ex_decimal = parts[1]
  }

  setPurchasePrice() {
    const price = parseInt(`${this.price_purchase_ex_number}${this.price_purchase_ex_decimal}`)
    this.price_purchase_ex_dinero = Dinero({
      amount: price,
      currency: this.price_purchase_ex_currency
    })
  }

  setSellingPrice() {
    const price = parseInt(`${this.price_selling_ex_number}${this.price_selling_ex_decimal}`)
    this.price_selling_ex_dinero = Dinero({
      amount: price,
      currency: this.price_selling_ex_currency
    })
  }
}

// rename to service?
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
    'price_purchase_ex_dinero': null,
    'price_purchase_ex_number': '0',
    'price_purchase_ex_decimal': '00',
    'price_purchase_ex_currency': 'EUR',

    'price_selling_ex': '0.00',
    'price_selling_ex_dinero': null,
    'price_selling_ex_number': '0',
    'price_selling_ex_decimal': '00',
    'price_selling_ex_currency': 'EUR',
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

let materialModel = new Material()

export { MaterialModel }
export default materialModel
