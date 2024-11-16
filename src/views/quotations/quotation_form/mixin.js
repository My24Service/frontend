import {OPTION_NONE, OPTION_ONLY_TOTAL, OPTION_USER_TOTALS} from "./constants";
import {QuotationLineModel} from "@/models/quotations/QuotationLine";

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
  computed: {
    sectionHeader() {
      return `header-${this.quotationLineType}`
    },
    isCollectionEmpty() {
      const nonEmptyItems = this.costService.collection.filter((c) => !c.isEmpty())
      return nonEmptyItems.length === 0 && !this.isLoading
    },
    collectionHasEmptyItem() {
      const emptyItem = this.costService.collection.find((c) => c.isEmpty())
      return emptyItem && !this.isLoading
    },
  },
  methods: {
    // sectionHeader(type) {
    //   return `header-${type}`
    // },
    scrollToHeader() {
      const el = document.getElementById(this.sectionHeader)
      if (el) {
        el.scrollIntoView()
        console.log(`scrolled to ${this.sectionHeader}`)
      } else {
        console.log(`scrollToHeader: header '${this.sectionHeader} element not found`)
      }
    },
    checkValue(val) {
      if (!val || val === '') {
        return '-'
      }
      return val
    },
    checkParentHasQuotationLines(quotationLines) {
      this.parentHasQuotationLines = !!quotationLines.find(
        (line) => line.cost_type === this.quotationLineType
      )
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
    createQuotationLinesClicked(selected) {
      this.useOnQuotationSelected = selected
      this.createQuotationLines()
      this.scrollToHeader()
    },
    createQuotationLines() {
      switch (this.useOnQuotationSelected) {
        case OPTION_ONLY_TOTAL:
          const quotationLine = new QuotationLineModel({
            cost_type: this.quotationLineType,
            info: this.getDescriptionOnlyTotalQuotationLine(),
            amount: this.getTotalAmountQuotationLine(),
            vat: this.totalVAT_dinero.toFormat('0.00'),
            vat_currency: this.totalVAT_dinero.getCurrency(),
            vat_type: Math.round(this.costService.collection[0].vat_type),
            price: "0.00",
            price_currency: "EUR",
            price_text: "*",
            total: this.total_dinero.toFormat('0.00'),
            total_currency: this.total_dinero.getCurrency(),
          })
          this.$emit('quotationLinesCreated', [quotationLine])
          this.scrollToHeader()
          break
        case OPTION_USER_TOTALS:
          const quotationLines = this.costService.collection.map((cost) =>
            this.quotationLineService.newModelFromCost(
              cost,
              this.getDescriptionUserTotalsQuotationLine(cost),
              this.quotationLineType
            )
          )
          this.$emit('quotationLinesCreated', quotationLines)
          this.scrollToHeader()
          break
        case OPTION_NONE:
          console.debug("not adding any costs")
          break
        default:
          throw `createQuotationLines: unknown option: ${this.useOnQuotationSelected}`
      }
    }
  }
}

export default quotationMixin
