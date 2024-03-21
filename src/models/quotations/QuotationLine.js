import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {toDinero} from "@/utils";

class QuotationLineModel {
  id
  quotation
  chapter
  info
  extra_description
  amount
  material
  material_name
  material_identifier
  cost_type

  vat_type
  vat
  vat_currency

  price
  price_currency

  total
  total_currency

  priceFields = ['price', 'vat', 'total']

  constructor(quotationLine) {
    for (const [k, v] of Object.entries(quotationLine)) {
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

Object.assign(QuotationLineModel.prototype, priceMixin);

class QuotationLineService extends BaseModel {
  model = QuotationLineModel
  collection = []

  url = '/quotation/quotation-line/'

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
      extra_description: '',
      info: description,
      cost_type: type,
      amount: cost.getAmount(),
      vat_type: Math.round(cost.vat_type),
      vat: cost.vat,
      vat_currency: cost.vat_currency,
      price: cost.price,
      price_currency: cost.price_currency,
      price_text: cost.price_dinero.toFormat('$0.00'),
      total: cost.total,
      total_currency: cost.total_currency,
      material: cost?.material,
      material_name: cost?.material_name
    })
  }
}

export { QuotationLineService, QuotationLineModel }
