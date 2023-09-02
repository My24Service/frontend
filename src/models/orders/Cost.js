import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {toDinero} from "../../utils";
import orderlineModel from "./Orderline";

class CostModel {
  order
  created_by
  cost_type
  user
  material
  amount_int
  amount_decimal
  amount_duration
  use_price

  margin_perc
  margin = "0.00"
  margin_currency

  price = "0.00"
  price_currency

  vat_type

  vat = "0.00"
  vat_currency

  total = "0.00"
  total_currency

  priceFields = ['margin', 'price', 'vat', 'total']

  constructor(cost) {
    for (const [k, v] of Object.entries(cost)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }

  updateTotals(price, currency) {
    this.price = price
    this.price_currency = currency
    const total = this.getTotal()
    let total_with_margin = total
    let margin = toDinero("0.00", currency)
    if (this.margin_perc > 0) {
      margin = total.multiply(this.margin_perc/100)
      total_with_margin = total.add(margin)
    }
    const vat = total_with_margin.multiply(parseInt(this.vat_type)/100)
    this.currency = currency

    this.setPriceField('margin', margin)
    this.setPriceField('total', total)
    this.setPriceField('vat', vat)
  }

  getTotal() {
    switch (this.cost_type) {
      case COST_TYPE_USED_MATERIALS:
        return this.price.multiply(this.amount_decimal)
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        const seconds = this.amount_duration ? this.amount_duration : 0
        let total = this.price.multiply(seconds)
        return total.divide(60*60)
      case COST_TYPE_DISTANCE:
        return this.price.multiply(this.amount_int)
      case COST_TYPE_CALL_OUT_COSTS:
        return this.price.multiply(this.amount_int)
      default:
        throw `unknown cost type: ${this.cost_type}`
    }
  }
}

Object.assign(CostModel.prototype, priceMixin);

class CostService extends BaseModel {
  model = CostModel

  getItemsTotal() {
    if (!this.collection.length) {
      return null
    }

    return this.collection.reduce(
      (total, m) => (total.add(m.total_dinero)),
      toDinero("0.00", this.collection[0].total_currency)
    )
  }

  getItemsTotalVAT() {
    if (!this.collection.length) {
      return null
    }

    return this.collection.reduce(
      (total, m) => (total.add(m.vat_dinero)),
      toDinero("0.00", this.collection[0].vat_currency)
    )
  }

  updateTotals(getPriceFunc, getCurrencyFunc) {
    for (const model of this.collection) {
      model.updateTotals(getPriceFunc(model), getCurrencyFunc(model))
    }
  }
}

export { CostModel }

export default CostService

export const COST_TYPE_USED_MATERIALS = 'used_materials'
export const COST_TYPE_WORK_HOURS = 'work_hours'
export const COST_TYPE_TRAVEL_HOURS = 'travel_hours'
export const COST_TYPE_DISTANCE = 'distance'
export const COST_TYPE_EXTRA_WORK = 'extra_work'
export const COST_TYPE_ACTUAL_WORK = 'actual_work'
export const COST_TYPE_CALL_OUT_COSTS = 'call_out_costs'
