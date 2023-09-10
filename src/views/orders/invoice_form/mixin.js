import {toDinero} from "../../../utils";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";

let invoiceMixin = {
  methods: {
    async emptyCollection() {
      this.isLoading = true
      try {
        await this.costService.emptyCollection()
        await this.loadData()
      } catch (e) {
        console.log(e)
        this.errorToast(this.$trans('Error removing costs'))
      }
      this.isLoading = false
    },
    async saveCollection() {
      this.isLoading = true
      try {
        await this.costService.updateCollection()
        await this.loadData()
        this.infoToast(this.$trans('Saved'), this.$trans('Costs saved'))
      } catch (e) {
        console.log(e)
        this.errorToast(this.$trans('Error saving costs'))
      }
      this.isLoading = false
    },
    // TODO can we move this to Cost model?
    marginChanged(obj, val) {
      obj.margin_perc = val
      this.updateTotals()
    },
    // TODO can we move this to Cost model?
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    getFullname(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.full_name
    },
  }
}

export default invoiceMixin
