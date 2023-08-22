import {toDinero} from "../../../utils";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";

let invoiceMixin = {
  methods: {
    getItemsTotal(items) {
      return items.reduce(
        (total, m) => (total.add(m.total)),
        toDinero("0.00", items[0].currency)
      )
    },
    getItemsTotalVAT(items) {
      return items.reduce(
        (total, m) => (total.add(m.vat)),
        toDinero("0.00", items[0].currency)
      )
    },
    getFullname(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.full_name
    },
    getEngineerRateFor(obj, usePrice) {
      const user = this.engineer_models.find((m) => m.id === obj.user_id)
      if (user) {
        switch (usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.invoice_default_hourly_rate_dinero
          default:
            throw `unknown usePrice for engineer: ${usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getSelectedEngineerRate(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.invoice_default_hourly_rate_dinero
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER:
            return activity.engineer_rate_other_dinero
          default:
            throw `unknown usePrice for engineer: ${activity.usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getSelectedEngineerRateCurrency(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return user.engineer.hourly_rate_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.default_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER:
            return this.default_currency
          default:
            throw `unknown usePrice for engineer: ${activity.usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getEngineerRateDinero(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
    },
    getEngineerRate(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate
    },
    getEngineerRateCurrency(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate_currency
    },
    createInvoiceLine(type, description, amount, vat, price_dinero) {
      const price = price_dinero.toFormat("$0.00")
      const price_currency = price_dinero.getCurrency()
      return new InvoiceLineModel({
        type,
        description,
        amount,
        vat,
        price,
        price_currency
      })
    },
  }
}

export default invoiceMixin
