<template>
  <b-overlay :show="isLoading" rounded="sm">
    <details :open="isView ? 'open' : ''">
      <SectionHeader
        v-if="quotationLineType"
        :parent-has-quotation-lines="parentHasQuotationLines"
        :section="quotationLineType"
        :title="$trans('Call out costs')"
      />

      <div v-if="!parentHasQuotationLines && isLoaded">
        <div
          v-for="(cost, index) in this.costService.collection"
          :key="index"
        >
          <b-container>
            <b-row>
              <b-col cols="2">
                <b-form-group
                  v-bind:label="$trans('Amount')"
                  v-if="cost.quotation"
                >
                  <b-form-input
                    type="number"
                    @blur="amountChanged"
                    v-model="cost.amount_int"
                    size="sm"
                    style="width: 100px !important; float:left !important;"
                    :disabled="parentHasQuotationLines"
                  ></b-form-input>
                </b-form-group>
              </b-col>
              <b-col cols="3">
                <b-form-group
                  v-bind:label="$trans('Price')"
                  v-if="cost.quotation && !cost.savedHours"
                >
                  <PriceInput
                    v-model="cost.price_other"
                    :currency="cost.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val, cost)"
                    @receivedFocus="cost.use_price = usePriceOptions.USE_PRICE_OTHER"
                  />
                </b-form-group>
              </b-col>
              <b-col cols="2">
                <b-form-group
                  v-bind:label="$trans('VAT')"
                  v-if="cost.quotation && !cost.savedHours"
                >
                  <VAT
                    v-if="!parentHasQuotationLines"
                    @vatChanged="(val) => changeVatType(cost, val)"
                  />
                </b-form-group>
              </b-col>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <b-col cols="12">
                <div v-if="cost.total_dinero">
                  <TotalsInputs
                    :total="cost.total_dinero"
                    :vat="cost.vat_dinero"
                  />
                </div>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" class="text-center">
                <b-button
                  @click="() => deleteCost(index)"
                  type="button"
                  variant="danger"
                  size="sm"
                >
                  {{ $trans("Delete cost") }}
                </b-button>
              </b-col>
            </b-row>
            <hr/>
          </b-container>
        </div>
        <div class="text-center">
          <b-button
            :disabled="collectionHasEmptyItem"
            @click="addCost"
            class="btn btn-primary"
            type="button"
          >
            {{ $trans("Add call out cost") }}
          </b-button>
          <span style="width: 80px">&nbsp;</span>
          <b-button
            :disabled="showSaveButton"
            @click="() => saveCosts()"
            type="button"
            variant="primary"
          >
            {{ $trans("Save changes") }}
          </b-button>
        </div>
        <hr/>
      </div>

      <div v-if="!isCollectionEmpty">
        <TotalRow
          :items_total="totalAmount"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />
        <hr/>
      </div>

      <EmptyQuotationLinesContainer
        v-if="parentHasQuotationLines"
        class="text-center"
        @buttonClicked="() => { emptyQuotationLines() }"
      />

      <div v-if="showAddQuotationLinesBlock">
        <AddToQuotationLines
          :useOnQuotationOptions="useOnQuotationOptions"
          @buttonClicked="createQuotationLinesClicked"
        />
      </div>

    </details>
  </b-overlay>
</template>
<script>
import quotationMixin from "./mixin.js";
import Multiselect from 'vue-multiselect'
import DurationInput from "../../../components/DurationInput.vue"
import {
  USE_PRICE_OTHER,
} from "./constants";
import {COST_TYPE_CALL_OUT_COSTS, CostService} from "@/models/quotations/Cost";
import HeaderCell from "./Header";
import VAT from "./VAT";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import TotalsInputs from "../../../components/TotalsInputs";
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import AddToQuotationLines from './AddToQuotationLines.vue'
import {ChapterModel} from "@/models/quotations/Chapter";
import {CustomerModel} from "@/models/customer/Customer";
import {QuotationLineService} from "@/models/quotations/QuotationLine";
import CollectionEmptyContainer from "./EmptyQuotationLinesContainer.vue";
import SectionHeader from "./SectionHeader.vue";
import EmptyQuotationLinesContainer from "./EmptyQuotationLinesContainer.vue";

export default {
  name: "CallOutCosts",
  mixins: [quotationMixin],
  components: {
    EmptyQuotationLinesContainer,
    SectionHeader,
    CollectionEmptyContainer,
    PriceInput,
    IconLinkDelete,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    DurationInput,
     AddToQuotationLines
  },
  emits: [
    'emptyQuotationLinesClicked'
  ],
  props: {
    chapter: {
      type: ChapterModel,
      default: null
    },
    customer:{
      type: CustomerModel,
      default: null
    },
    quotationLinesParent: {
      type: [Array],
      default: null
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  watch: {
    quotationLinesParent(newVal) {
      this.checkParentHasQuotationLines(newVal)
      this.scrollToHeader()
    }
  },
  computed: {
    compLoading () {
      return this.isLoading
    },
    showAddQuotationLinesBlock() {
      return this.costService.collection.length && !this.parentHasQuotationLines
    },
    isCollectionEmpty() {
      const nonEmptyItems = this.costService.collection.filter((c) => c.amount_int !== null && c.amount_int > 0)
      return nonEmptyItems.length === 0 && this.hasChanges
    },
    showSaveButton() {
      return !this.hasChanges
    },
    collectionHasEmptyItem() {
      const emptyItem = this.costService.collection.find((c) => c.amount_int === null && c.amount_int > 0)
      return emptyItem && this.hasChanges
    },
  },
  data() {
    return {
      isLoading: false,
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      costService: new CostService(),
      usePriceOptions: {
        USE_PRICE_OTHER,
      },
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      default_hourly_rate: this.$store.getters.getInvoiceDefaultHourlyRate,
      quotationLineType: COST_TYPE_CALL_OUT_COSTS,
      parentHasQuotationLines: false,
      quotationLineService: new QuotationLineService(),
      isLoaded: false,
      hasChanges: false
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    if (this.chapter.id) {
      this.costService.addListArg(`chapter=${this.chapter.id}`)
      this.costService.addListArg(`cost_type=${COST_TYPE_CALL_OUT_COSTS}`)
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    emptyQuotationLines() {
      this.$emit('emptyQuotationLinesClicked', this.quotationLineType)
    },
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price_other', priceDinero)
      this.updateTotals()
      this.hasChanges = true
    },
    addCost() {
      this.costService.collection.push(
        new this.costService.model({
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: this.getPrice(
            {use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          price_currency: this.getCurrency(
            {use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
          cost_type: COST_TYPE_CALL_OUT_COSTS,
          margin_perc: 0
        })
      )
      this.updateTotals()
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      if (this.costService.collection.length === 0) {
        this.addCost()
      }
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Created'), this.$trans('Call out costs have been updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error creating call out costs', error)
        this.errorToast(this.$trans('Error creating call out costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
      this.hasChanges = true
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true
      this.isLoaded = false

      try {
        await this.costService.loadCollection()
        this.costService.collection = this.costService.collection.map((cost) => {
          if (cost.use_price === this.usePriceOptions.USE_PRICE_OTHER) {
            cost.price_other = cost.price
            cost.price_other_currency = cost.price_currency
          }
          cost.callOutCostSaved = true
          return new this.costService.model(cost)
        })
        this.updateTotals()
        this.checkParentHasQuotationLines(this.quotationLinesParent)
        if (this.costService.collection.length === 0) {
          this.addCost()
        }
        this.isLoading = false
        this.isLoaded = true
      } catch(error) {
        this.errorToast(this.$trans('Error fetching material cost'))
        this.isLoading = false
        this.isLoaded = true
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id
      }
    },
    getPrice(activity) {
      switch (activity.use_price) {
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.hourly_rate_engineer
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_hourly_rate
        case this.usePriceOptions.USE_PRICE_OTHER:
          return activity.price_other
        default:
          console.log(`getPrice - unknown use price: ${activity.use_price}`)
          return "0.00"
      }
    },
    getCurrency(_activity) {
      return this.default_currency
    },
    amountChanged() {
      this.hasChanges = true
      this.updateTotals()
    },
    updateTotals() {
      if (this.isCollectionEmpty) {
        return
      }

      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
      this.totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_int),
        0
      )
    },
    getDescriptionUserTotalsQuotationLine(_cost) {
      return `${this.$trans("Call out costs")}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${this.$trans("Call out costs")}`
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    }
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
