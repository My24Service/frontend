import {OPTION_NONE, OPTION_ONLY_TOTAL, OPTION_USER_TOTALS} from "./constants";

let quotationMixin = {
  data() {
    return {
      useOnQuotationOptions: [
        { text: this.$trans('Items'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Total'), value: OPTION_ONLY_TOTAL },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnQuotationSelected: null,
    }
  },
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
    createQuotationLinesClicked(selected) {
      this.useOnQuotationSelected = selected
      this.createQuotationLines()
    },
    createQuotationLines() {
      switch (this.useOnQuotationSelected) {
        case OPTION_ONLY_TOTAL:
          const quotationLine = new this.quotationLineService.model({
            type: this.quotationLineType,
            info: this.getDescriptionOnlyTotalQuotationLine(),
            amount: this.getTotalAmountQuotationLine(),
            vat: this.totalVAT_dinero.toFormat('0.00'),
            vat_currency: this.totalVAT_dinero.getCurrency(),
            price: "0.00",
            price_currency: "EUR",
            price_text: "*",
            total: this.total_dinero.toFormat('0.00'),
            total_currency: this.total_dinero.getCurrency(),
          })
          this.parentHasQuotationLines = true
          this.$emit('quotationLinesCreated', [quotationLine])
          break
        case OPTION_USER_TOTALS:
          const quotationLines = this.costService.collection.map((cost) =>
            this.quotationLineService.newModelFromCost(
              cost,
              this.getDescriptionUserTotalsQuotationLine(cost),
              this.quotationLineType
            )
          )
          this.parentHasQuotationLines = true
          this.$emit('quotationLinesCreated', quotationLines)
          break
        case OPTION_NONE:
          console.debug("not adding any distance")
          break
        default:
          throw `createQuotationLines: unknown option: ${this.useOnQuotationSelected}`
      }
    }
  }
}

export default quotationMixin
