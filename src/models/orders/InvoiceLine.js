import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {CostModel} from "./Cost";


class InvoiceLineModel {
  id
  type
  invoice
  description
  amount

  vat
  vat_currency

  price
  price_currency

  total
  total_currency

  priceFields = ['price', 'vat', 'total']

  constructor(invoiceLine) {
    for (const [k, v] of Object.entries(invoiceLine)) {
      this[k] = v
    }

    this.setPriceFields(this)
  }
}


Object.assign(InvoiceLineModel.prototype, priceMixin);

class InvoiceLineService extends BaseModel {
  model = InvoiceLineModel
  collection = []

  fields = {
    id: null,
    invoice: null,
    description: null,
    amount: null,
    vat: null,
    price: null,
    price_currency: null,
  }

  url = '/order/invoice/'

  newModelFromCost(cost, description, type) {
    return new this.model({
      type,
      description,
      amount: cost.getAmount(),
      vat: cost.vat,
      vat_currency: cost.vat_currency,
      price: cost.price,
      price_currency: cost.price_currency,
      total: cost.total,
      total_currency: cost.total_currency
    })
  }
}

export default new InvoiceLineService()

export { InvoiceLineModel }
