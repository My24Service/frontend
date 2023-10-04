import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {InvoiceLineModel} from "./InvoiceLine";

class InvoiceModel {
  id
  order
  created_by_fullname
  description
  term_of_payment_days

  vat_type
  vat
  vat_currency

  total
  total_currency

  priceFields = ['vat', 'total']

  constructor(invoiceData) {
    for (const [k, v] of Object.entries(invoiceData)) {
      if (k === 'invoicelines') {
        this[k] = v.map((m) => new InvoiceLineModel(m))
      } else {
        this[k] = v
      }
    }

    this.setPriceFields(this)
  }
}

Object.assign(InvoiceModel.prototype, priceMixin);

class InvoiceService extends BaseModel {
  model = InvoiceModel
  collection = []

  fields = {
    id: null,
    order: null,
    vat: null,
    total: null,
    total_currency: null,
    term_of_payment_days: null,
  }

  url = '/order/invoice/'

  async getData(uuid) {
    const url = `${this.url}data/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }

  async getByUuid(uuid) {
    const url = `/order/invoice-detail/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }
}

const invoiceService = new InvoiceService()

export default invoiceService
export { InvoiceModel, InvoiceService }
