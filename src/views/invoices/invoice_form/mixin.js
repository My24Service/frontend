import {OPTION_NONE, OPTION_ONLY_TOTAL, OPTION_USER_TOTALS} from "./constants";

let invoiceMixin = {
  data() {
    return {
      useOnInvoiceOptions: [
        { text: this.$trans('Items'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Total'), value: OPTION_ONLY_TOTAL },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,
    }
  },
  watch: {
    invoiceLinesParent: {
      handler(newValue) {
        this.checkParentHasInvoiceLines(newValue)
      },
      deep: true
    },
  },
  methods: {
    checkParentHasInvoiceLines(invoiceLines) {
      this.parentHasInvoiceLines = !!invoiceLines.find((line) => line.type === this.invoiceLineType)
    },
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
      if (!user) {
        console.log(`user: ${user_id} not found in ${this.engineer_models}`)
      }
      return !!user ? user.full_name : ""
    },
    createInvoiceLinesClicked(selected) {
      this.useOnInvoiceSelected = selected
      this.createInvoiceLines()
    },
    createInvoiceLines() {
      switch (this.useOnInvoiceSelected) {
        case OPTION_ONLY_TOTAL:
          const invoiceLine = new this.invoiceLineService.model({
            type: this.invoiceLineType,
            description: this.getDescriptionOnlyTotalInvoiceLine(),
            amount: this.getTotalAmountInvoiceLine(),
            vat: this.totalVAT_dinero.toFormat('0.00'),
            vat_currency: this.totalVAT_dinero.getCurrency(),
            price: "0.00",
            price_currency: "EUR",
            price_text: "*",
            total: this.total_dinero.toFormat('0.00'),
            total_currency: this.total_dinero.getCurrency(),
          })
          this.$emit('invoiceLinesCreated', [invoiceLine])
          break
        case OPTION_USER_TOTALS:
          // If the 'amount' has changed in the UI, this still hangs on to the
          // previous 'amount', totalling to '8' where it should be '10'.
          const invoiceLines = this.costService.collection.map((cost) =>
            this.invoiceLineService.newModelFromCost(
              cost,
              this.getDescriptionUserTotalsInvoiceLine(cost),
              this.invoiceLineType
            )
          )
          this.$emit('invoiceLinesCreated', invoiceLines)
          break
        case OPTION_NONE:
          console.debug("not adding any distance")
          break
        default:
          throw `createInvoiceLines: unknown option: ${this.useOnInvoiceSelected}`
      }
    }
  }
}

export default invoiceMixin
