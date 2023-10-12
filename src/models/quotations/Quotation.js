import BaseModel from '@/models/base'
import priceMixin from "../../mixins/price";
import { QuotationLineModel } from "./QuotationLine";


class QuotationModel {
  id
  quotation
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
  description
  total
  vat
  accepted = false

  vat_type
  vat
  vat_currency

  total
  total_currency

  priceFields = ['vat', 'total']

  constructor(invoiceData) {
    for (const [k, v] of Object.entries(invoiceData)) {
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
  fields = {
    customer_id: '',
    customer_relation: null,
    quotation_name: '',
    quotation_city: '',
    quotation_address: '',
    quotation_postal: '',
    quotation_country_code: '',
    quotation_email: '',
    quotation_tel: '',
    quotation_mobile: '',
    quotation_contact: '',
    quotation_reference: '',
    description: '',
    total: 0.00,
    vat: 0.00,
    accepted: false
  }

  url = '/quotation/quotation/'
  queryMode = 'all'

  getListUrl() {
    let base = ''
    if (this.queryMode === 'preliminary') {
      base = '/quotation/quotation/preliminary/'
    } else {
      console.log(`unknown queryMode: ${this.queryMode}`)
      base = '/quotation/quotation/'
    }

    return base
  }

}

let quotationService = new QuotationService()

export default quotationService
export { QuotationService, QuotationModel }
