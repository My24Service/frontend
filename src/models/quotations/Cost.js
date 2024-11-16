import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {toDinero} from "@/utils";

class CostModel {
  quotation
  chapter
  cost_type
  user
  user_full_name
  material = null
  amount_int = 0
  amount_decimal
  amount_duration = "00:00:00"
  amount_duration_read
  amount_duration_secs
  use_price

  margin_perc
  margin = "0.00"
  margin_currency

  price = "0.00"
  price_dinero = null
  price_currency

  vat_type

  vat = "0.00"
  vat_currency

  total = "0.00"
  total_currency

  total_amount = 0

  priceFields = ['margin', 'price', 'vat', 'total']

  constructor(cost) {
    for (const [k, v] of Object.entries(cost)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }

  updateTotals(priceDecimal, currency) {
    // console.log({priceDecimal, currency})
    this.setPriceField('price', toDinero(priceDecimal, currency))
    const total = this.getTotal()
    const vat = total.multiply(parseInt(this.vat_type)/100)
    this.currency = currency
    this.setPriceField('total', total)
    this.setPriceField('vat', vat)
  }

  getTotal() {
    switch (this.cost_type) {
      case COST_TYPE_USED_MATERIALS:
        return this.price_dinero.multiply(this.amount_decimal)
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        const seconds = this.amount_duration_secs ? this.amount_duration_secs : 0
        let total = this.price_dinero.multiply(seconds)
        return total.divide(60*60)
      case COST_TYPE_DISTANCE:
        return this.price_dinero.multiply(this.amount_int)
      case COST_TYPE_CALL_OUT_COSTS:
        return this.price_dinero.multiply(this.amount_int)
      default:
        console.log(`getTotal - unknown cost type: ${this.cost_type}`)
        return toDinero("0.00", "EUR")
    }
  }

  getAmount() {
    switch (this.cost_type) {
      case COST_TYPE_USED_MATERIALS:
        return this.amount_decimal
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        return this.amount_duration_read
      case COST_TYPE_DISTANCE:
        return this.amount_int
      case COST_TYPE_CALL_OUT_COSTS:
        return this.amount_int
      default:
        console.log(`getTotal - unknown cost type: ${this.cost_type}`)
        return 0
    }
  }

  isEmpty() {
    switch (this.cost_type) {
      case COST_TYPE_USED_MATERIALS:
        return this.material === null
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        return this.amount_duration_secs === 0
      case COST_TYPE_DISTANCE:
      case COST_TYPE_CALL_OUT_COSTS:
        return this.amount_int === 0
      default:
        console.log(`getTotal - unknown cost type: ${this.cost_type}`)
        return 0
    }
  }
}

Object.assign(CostModel.prototype, priceMixin);

class CostService extends BaseModel {
  model = CostModel
  url = '/quotation/cost/'
  invoice_default_margin = null
  invoice_default_vat = null
  default_currency = null

  getDefaultCostProps() {
    // default props for cost model
    return {
      margin_perc:  this.invoice_default_margin,
      vat_type: this.invoice_default_vat,
      vat_currency: this.default_currency,
      margin_currency: this.default_currency,
      price_currency: this.default_currency,
      total_currency: this.default_currency,
      price_other_currency: this.default_currency,
      price_other: "0.00",
    }
  }

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

  updateTotals(getPriceFunc, getCurrencyFunc) {
    for (const model of this.collection) {
      model.updateTotals(getPriceFunc(model), getCurrencyFunc(model))
    }
  }
}

export { CostModel, CostService }

export const COST_TYPE_USED_MATERIALS = 'used_materials'
export const COST_TYPE_WORK_HOURS = 'work_hours'
export const COST_TYPE_TRAVEL_HOURS = 'travel_hours'
export const COST_TYPE_EXTRA_WORK = 'extra_work'
export const COST_TYPE_ACTUAL_WORK = 'actual_work'
export const COST_TYPE_DISTANCE = 'distance'
export const COST_TYPE_CALL_OUT_COSTS = 'call_out_costs'
