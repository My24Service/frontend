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
  queryMode = 'all'

  fields = {
    id: null,
    order: null,
    vat: null,
    total: null,
    total_currency: null,
    term_of_payment_days: null,
  }

  url = '/invoice/invoice/'

  getListUrl() {
    let base = ''
    if (this.queryMode === 'preliminary') {
      base = '/invoice/invoice/preliminary/'
    } else if (this.queryMode === 'sent') {
      base = '/invoice/invoice/sent/'
    } else {
      console.log(`unknown queryMode: ${this.queryMode}`)
      base = '/invoice/invoice/'
    }

    return base
  }

  makeDefinitive(id) {
    const url = `/invoice/invoice/${id}/make_definitive/`
    return new this.axios.post(url, {}).then(response => response.data)
  }

  async getData(uuid) {
    const url = `${this.url}data/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }

  async getByUuid(uuid, createPDFHeader=null) {
    let headers = this.getHeaders()

    if (createPDFHeader) {
      headers.headers['x-create-pdf'] = createPDFHeader
    }

    const url = `/invoice/invoice-detail/${uuid}/`
    return this.axios.get(url, headers).then((response) => response.data)
  }

  async search(query) {
    const url = `${this.url}autocomplete/?q=${query}`
    return this.axios.get(url).then((response) => response.data)
  }

  recreateInvoicePdf(pk) {
    return this.axios.post(`${this.url}${pk}/recreate_pdf/?gotenberg=1`)
  }

  downloadPdfBlob(id) {
    const url = `/invoice/invoice/${id}/download_pdf_from_template/`
    return new this.axios.post(url, {}, {
      responseType: 'arraybuffer'
    })
  }
}

const invoiceService = new InvoiceService()

export default invoiceService
export { InvoiceModel, InvoiceService }
