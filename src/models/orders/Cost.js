import BaseModel from '@/models/base'
import {toDinero} from "../../utils";
import priceMixin from "../../mixins/price";

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

  margin
  margin_currency

  price
  price_currency

  vat_type

  vat
  vat_currency

  priceFields = ['margin', 'price', 'vat']

  constructor(cost) {
    for (const [k, v] of Object.entries(cost)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }

}

Object.assign(CostModel.prototype, priceMixin);

class CostService extends BaseModel {

}
