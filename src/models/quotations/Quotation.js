import BaseModel from '@/models/base'
import priceMixin from "../../mixins/price";
import { QuotationLineModel } from "./QuotationLine";


class QuotationModel {
  id
  uuid
  name
  description
  customer_id
  customer_relation
  quotation_name
  quotation_city
  quotation_address
  quotation_postal
  quotation_country_code
  quotation_email
  quotation_tel
  quotation_mobile
  quotation_contact
  quotation_reference
  accepted = false
  preliminary
  quotation_expire_days

  vat_type
  vat
  vat_currency

  total
  total_currency

  definitive_date

  chapters = []
  images = []
  statuses = []

  priceFields = ['vat', 'total']

  constructor(quotationData) {
    for (const [k, v] of Object.entries(quotationData)) {
      if (k === 'quotationlines') {
        this[k] = v.map((m) => new QuotationLineModel(m))
      } else {
        this[k] = v
      }
    }
    this.setPriceFields(this)
  }
}

Object.assign(QuotationModel.prototype, priceMixin);

class QuotationService extends BaseModel {
  url = '/quotation/quotation/'
  queryMode = 'all'

  getListUrl() {
    let base = ''
    if (this.queryMode === 'preliminary') {
      base = '/quotation/quotation/preliminary/'
    } else if (this.queryMode === 'sent') {
      base = '/quotation/quotation/sent/'
    } else {
      console.log(`unknown queryMode: ${this.queryMode}`)
      base = '/quotation/quotation/'
    }

    return base
  }

  makeDefinitive(id) {
    const url = `/quotation/quotation/${id}/make_definitive/`
    return new this.axios.post(url, {}).then(response => response.data)
  }

  generatePdf(id) {
    const url = `/quotation/quotation/${id}/generate_definitive_pdf/`
    return new this.axios.post(url, {}).then(response => response.data)
  }

  async downloadPdf(id) {
    const url = `/quotation/quotation/${id}/download_definitive_pdf/`
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    headers.responseType = 'blob'

    return this.axios.post(url, {}, headers).then((response) => {
      return new Blob([response.data], { type: 'application/pdf' })
    });
  }

  removeNullFields(obj) {
    for (const [field, value] of Object.entries(obj)) {
      if (!value) {
        delete obj[field]
      }
    }
    return obj
  }

  preInsert(obj) {
    if (obj.hasOwnProperty('created')) {
      delete obj.created
    }
    if (obj.hasOwnProperty('modified')) {
      delete obj.modified
    }
    obj = this.removeNullFields(obj)
    return obj
  }

  preUpdate(obj) {
    delete obj.created
    delete obj.modified
    obj = this.removeNullFields(obj)
    return obj
  }

  async search(query) {
    const url = `${this.url}autocomplete/?q=${query}`
    return this.axios.get(url).then((response) => response.data)
  }
}

export { QuotationService, QuotationModel }
