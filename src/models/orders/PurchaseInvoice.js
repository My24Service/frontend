import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";

class PurchaseInvoiceModel {
  id
  order
  reference
  description
  vat
  vat_currency

  total
  total_currency

  priceFields = ['vat', 'total']

  constructor(invoiceData) {
    for (const [k, v] of Object.entries(invoiceData)) {
      this[k] = v
    }

    this.setPriceFields(this)
  }
}

Object.assign(PurchaseInvoiceModel.prototype, priceMixin);

class PurchaseInvoiceService extends BaseModel {
  model = PurchaseInvoiceModel
  collection = []

  url = '/order/purchase-invoice/'
}

const purchaseInvoiceService = new PurchaseInvoiceService()

export default purchaseInvoiceService
export { PurchaseInvoiceModel }
