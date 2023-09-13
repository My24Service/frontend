import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";
import {toDinero} from "../../utils";

class CostModel {
  order
  cost_type
  user
  user_full_name
  material
  amount_int
  amount_decimal
  amount_duration
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
    // console.log({total, vat_type: this.vat_type})
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
        return this.price_dinero.multiply(this.amount_decimal)
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        const seconds = this.amount_duration_secs ? this.amount_duration_secs : 0
        console.log({seconds})
        let total = this.price_dinero.multiply(seconds)
        return total.divide(60*60)
      case COST_TYPE_DISTANCE:
        return this.price_dinero.multiply(this.amount_int)
      case COST_TYPE_CALL_OUT_COSTS:
        return this.price_dinero.multiply(this.amount_int)
      default:
        throw `unknown cost type: ${this.cost_type}`
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
        throw `unknown cost type: ${this.cost_type}`
    }
  }
}

Object.assign(CostModel.prototype, priceMixin);

class CostService extends BaseModel {
  model = CostModel
  url = '/order/cost/'
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

  // method to create cost from material
  newModelFromMaterial(material, price, price_currency, defaultPropsView) {
    return new this.model({
      ...material,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      material: material.material_id,
      amount_decimal: material.amount,
      user: material.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_USED_MATERIALS,
    })
  }

  // method to create cost from work hours
  newModelFromWorkHours(activity, price, price_currency, defaultPropsView) {
    return new this.model({
      ...activity,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      hours_total: activity.work,
      amount_duration_secs: parseInt(activity.work_secs),
      user: activity.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_WORK_HOURS,
    })
  }

  // method to create cost from travel hours
  newModelFromTravelHours(activity, price, price_currency, defaultPropsView) {
    return new this.model({
      ...activity,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      hours_total: activity.travel_total,
      amount_duration_secs: parseInt(activity.travel_total_secs),
      user: activity.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_TRAVEL_HOURS,
    })
  }

  // method to create cost from extra work
  newModelFromExtraWork(activity, price, price_currency, defaultPropsView) {
    return new this.model({
      ...activity,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      hours_total: activity.extra_work,
      amount_duration_secs: parseInt(activity.extra_work_secs),
      user: activity.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_EXTRA_WORK,
    })
  }

  // method to create cost from actual work
  newModelFromActualWork(activity, price, price_currency, defaultPropsView) {
    return new this.model({
      ...activity,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      hours_total: activity.actual_work,
      amount_duration_secs: parseInt(activity.actual_work_secs),
      user: activity.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_ACTUAL_WORK,
    })
  }

  // method to create cost from distance
  newModelFromDistance(activity, price, price_currency, defaultPropsView) {
    return new this.model({
      ...activity,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      distance_to: activity.distance_to,
      distance_back: activity.distance_back,
      distance_total: activity.distance_total,
      amount_int: activity.distance_total,
      user: activity.user_id,
      price,
      price_currency,
      cost_type: COST_TYPE_DISTANCE,
    })
  }

  // method to create cost from distance
  newModelFromCallOutCosts(obj, price, price_currency, defaultPropsView) {
    return new this.model({
      ...obj,
      ...this.getDefaultCostProps(),
      ...defaultPropsView,
      price,
      price_currency,
      cost_type: COST_TYPE_CALL_OUT_COSTS,
    })
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

export { CostModel }

export default CostService

export const COST_TYPE_USED_MATERIALS = 'used_materials'
export const COST_TYPE_WORK_HOURS = 'work_hours'
export const COST_TYPE_TRAVEL_HOURS = 'travel_hours'
export const COST_TYPE_EXTRA_WORK = 'extra_work'
export const COST_TYPE_ACTUAL_WORK = 'actual_work'
export const COST_TYPE_DISTANCE = 'distance'
export const COST_TYPE_CALL_OUT_COSTS = 'call_out_costs'
