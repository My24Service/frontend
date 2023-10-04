import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {CostModel} from "./Cost";
import {toDinero} from "../../utils";

class InvoiceLineModel {
  id
  type
  invoice
  description
  amount

  vat_type
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

  calcTotal() {
    const total_dinero = this.price_dinero.multiply(this.amount)
    this.setPriceField('total', total_dinero)

    const vat = total_dinero.multiply(parseInt(this.vat_type)/100)
    this.setPriceField('vat', vat)
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

  url = '/order/invoice-line/'

  getItemsTotal() {
    if (!this.collection.length) {
      return  toDinero("0.00", "EUR")
    }

    return this.collection.reduce(
      (total, m) => (total.add(m.total_dinero)),
      toDinero("0.00", this.collection[0].total_currency)
    )
  }

  getItemsTotalVAT() {
    if (!this.collection.length) {
      return toDinero("0.00", "EUR")
    }

    return this.collection.reduce(
      (total, m) => (total.add(m.vat_dinero)),
      toDinero("0.00", this.collection[0].vat_currency)
    )
  }

  newModelFromCost(cost, description, type) {
    return new this.model({
      type,
      description,
      amount: cost.getAmount(),
      vat: cost.vat,
      vat_currency: cost.vat_currency,
      price: cost.price,
      price_currency: cost.price_currency,
      price_text: cost.price_dinero.toFormat('$0.00'),
      total: cost.total,
      total_currency: cost.total_currency
    })
  }
}

export default new InvoiceLineService()

export { InvoiceLineModel, InvoiceLineService }
