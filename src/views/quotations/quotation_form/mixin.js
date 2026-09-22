import {OPTION} from "./constants";
import {QuotationLineModel} from "@/models/quotations/QuotationLine";

import {quotationCostQuotationCreate} from "@/api/sdk.gen";

import {formatMoneyPlain} from "@/services/money";

/**
 * One row of the replace-set body `POST cost/quotation/{quotation_id}/{cost_type}/`
 * takes (see CostViewset.replace_for_quotation).
 *
 * The quotation and the cost type travel in the url, so neither is in the row;
 * `chapter` is, because a quotation has several and this panel edits one of
 * them. Unlike the order twin, this Cost model does not price itself in save(),
 * so the panel's own `vat` and `total` are part of the row.
 */
function costRow(cost) {
  return {
    ...(cost.id == null ? {} : {id: cost.id}),
    chapter: cost.chapter ?? null,
    user: cost.user ?? null,
    material: cost.material ?? null,
    amount_int: cost.amount_int == null ? null : Number(cost.amount_int),
    amount_decimal: cost.amount_decimal == null ? null : String(cost.amount_decimal),
    amount_duration: cost.amount_duration == null ? null : String(cost.amount_duration),
    price: cost.price,
    vat_type: String(cost.vat_type),
    vat: cost.vat,
    total: cost.total,
    // The currency each amount is in. The server reads the companion off the raw
    // row and otherwise keeps the column's default (EUR), so dropping it
    // relabels a USD or GBP tenant's costs. Only sent when the row has one: the
    // field rejects null, and omitting the key keeps the server's default.
    ...(cost.price_currency ? {price_currency: cost.price_currency} : {}),
    ...(cost.vat_currency ? {vat_currency: cost.vat_currency} : {}),
    ...(cost.total_currency ? {total_currency: cost.total_currency} : {}),
  }
}

let quotationMixin = {
  emits: [
    'emptyQuotationLinesClicked'
  ],
  data() {
    return {
      useOnQuotationOptions: [
        { text: $trans('Items'), value: OPTION.USER_TOTALS },
        { text: $trans('Total'), value: OPTION.ONLY_TOTAL },
        { text: $trans('None'), value: OPTION.NONE },
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
    showAddQuotationLinesBlock() {
      return this.costService.collection.length && !this.parentHasQuotationLines && !this.isView
    },
  },
  methods: {
    emptyQuotationLines() {
      this.$emit('emptyQuotationLinesClicked', this.quotationLineType)
    },
    scrollToHeader() {
      const el = document.getElementById(this.sectionHeader)
      if (el) {
        el.scrollIntoView()
      } else {
        console.debug(`scrollToHeader: header '${this.sectionHeader} element not found`)
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
    /**
     * Write this panel's rows as one replace-set: a row without an id is
     * created, a row with one updates that stored row, and a stored row left
     * out of the list is deleted - all in one request and one server-side
     * transaction, where the per-row `updateCollection` walked the collection
     * and aborted on the first failure, leaving a partly written set. The
     * server answers with the stored rows, ids included.
     *
     * The request carries `chapter`, the same filter the list read uses, because
     * "absent from the list" means "delete" and a panel only ever holds one
     * chapter's rows: unscoped, saving this chapter would delete every other
     * chapter's costs of the same type.
     */
    async replaceCostRows(rows = this.costService.collection) {
      const quotation = this.chapter.quotation
      if (quotation == null) {
        throw new Error('A quotation is required to save costs')
      }

      const {data} = await quotationCostQuotationCreate({
        path: {
          quotation_id: String(quotation),
          cost_type: this.quotationLineType,
        },
        query: {
          chapter: Number(this.chapter.id),
        },
        body: rows.map(costRow),
        throwOnError: true,
      })

      return data
    },
    async emptyCollection() {
      this.isLoading = true
      try {
        // An empty set deletes every stored row of this cost type.
        await this.replaceCostRows([])
        await this.loadData()
      } catch (e) {
        console.log(e)
        errorToast(this.create, $trans('Error removing costs'))
      }
      this.isLoading = false
    },
    async saveCollection() {
      this.isLoading = true
      try {
        await this.replaceCostRows()
        await this.loadData()
        infoToast(this.create, $trans('Saved'), $trans('Costs saved'))
      } catch (e) {
        console.log(e)
        errorToast(this.create, $trans('Error saving costs'))
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
        case OPTION.ONLY_TOTAL:
          const quotationLine = new QuotationLineModel({
            cost_type: this.quotationLineType,
            info: this.getDescriptionOnlyTotalQuotationLine(),
            amount: this.getTotalAmountQuotationLine(),
            vat: formatMoneyPlain(this.totalVAT_dinero),
            vat_currency: this.totalVAT_dinero.getCurrency(),
            vat_type: Math.round(this.costService.collection[0].vat_type),
            price: "0.00",
            price_currency: "EUR",
            price_text: "*",
            total: formatMoneyPlain(this.total_dinero),
            total_currency: this.total_dinero.getCurrency(),
          })
          this.$emit('quotationLinesCreated', [quotationLine])
          this.scrollToHeader()
          break
        case OPTION.USER_TOTALS:
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
        case OPTION.NONE:
          console.debug("not adding any costs")
          break
        default:
          throw `createQuotationLines: unknown option: ${this.useOnQuotationSelected}`
      }
    }
  }
}

export default quotationMixin
