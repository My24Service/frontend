import {toDinero} from "../../../utils";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";

let invoiceMixin = {
  methods: {
    marginChanged(obj, val) {
      obj.margin_perc = val
      this.updateTotals()
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    getInvoiceDefaultHourlyRateDinero() {
      return toDinero(
        this.$store.getters.getInvoiceDefaultHourlyRate,
        this.$store.getters.getDefaultCurrency
      )
    },
    getItemsTotal(items) {
      return items.reduce(
        (total, m) => (total.add(m.total)),
        toDinero("0.00", this.$store.getters.getDefaultCurrency)
      )
    },
    getItemsTotalVAT(items) {
      return items.reduce(
        (total, m) => (total.add(m.vat)),
        toDinero("0.00", this.$store.getters.getDefaultCurrency)
      )
    },
    getItemsTotalv2(items) {
      return items.reduce(
        (total, m) => (total.add(m.total_dinero)),
        toDinero("0.00", this.$store.getters.getDefaultCurrency)
      )
    },
    getItemsTotalVATv2(items) {
      return items.reduce(
        (total, m) => (total.add(m.vat_dinero)),
        toDinero("0.00", this.$store.getters.getDefaultCurrency)
      )
    },
    getFullname(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.full_name
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
