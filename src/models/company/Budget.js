import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";

class BudgetModel {
  id
  year
  amount
  amount_currency

  priceFields = ['amount']

  constructor(budget) {
    for (const [k, v] of Object.entries(budget)) {
      if (this.hasOwnProperty(k)) {
        this[k] = v
      }
    }
    this.setPriceFields(this)
  }

  setAmount(priceDinero) {
    return this.setPriceField('amount', priceDinero)
  }
}

Object.assign(BudgetModel.prototype, priceMixin);

class BudgetService extends BaseModel {
  model = BudgetModel

  url = '/company/budget/'

  async getCosts(id) {
    const url = `${this.getDetailUrl(id)}costs/`

    const result = await this.axios.get(url)
    return result.data
  }

  async getExpectedCosts(id) {
    const url = `${this.getDetailUrl(id)}expected_costs/`

    const result = await this.axios.get(url)
    return result.data
  }
}

export  { BudgetService, BudgetModel }
