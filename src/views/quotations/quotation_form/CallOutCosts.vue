<template>
  <details>
    <summary class="flex-columns space-between">
      <h6>
        {{ $trans('Call out costs') }}
        <b-icon-check-circle v-if="parentHasQuotationLines"></b-icon-check-circle>
      </h6>
      <b-icon-chevron-down></b-icon-chevron-down>
    </summary>
    <div
      v-for="(cost, index) in this.costService.collection"
      :key="index"
      style="padding-top: 8px;"
    >
      <b-form-group
        label-cols="3"
        v-bind:label="$trans('Amount')"
        v-if="cost.quotation"
      >
        <b-form-input
          type="number"
          @blur="updateTotals"
          v-model="cost.amount_int"
          size="sm"
          style="width: 100px !important; float:left !important;"
          :disabled="parentHasQuotationLines"
        ></b-form-input>
        <div style="width: 100px !important; float:right !important;">
          {{ $trans('VAT') }}
          <VAT
            v-if="!parentHasQuotationLines"
            @vatChanged="(val) => changeVatType(cost, val)"
            style="width: 60px"
          />
          <span v-else>{{ cost.vat_type }}%</span>
        </div>
      </b-form-group>

      <b-form-group
        label-cols="3"
        v-bind:label="$trans('Price')"
        v-if="cost.quotation && !cost.savedHours"
      >
        <b-form-radio-group
          @change="updateTotals"
          v-model="cost.use_price"
          v-if="!parentHasQuotationLines"
        >
          <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
            <p class="flex">
              {{ $trans("Other") }}:&nbsp;&nbsp;
              <PriceInput
                v-model="cost.price_other"
                :currency="cost.price_other_currency"
                @priceChanged="(val) => otherPriceChanged(val, cost)"
              />
            </p>
          </b-form-radio>
        </b-form-radio-group>
        <b-form-input
          v-else
          :value="cost.price_dinero.toFormat('$0.00')"
          disabled="disabled"
        >
        </b-form-input>
      </b-form-group>

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
        <b-row v-if="!parentHasQuotationLines">
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <b-button
              @click="() => deleteCost(index)"
              class="btn btn-danger"
              type="button"
              variant="danger"
            >
              {{ $trans("Delete cost") }}
            </b-button>
          </b-col>
        </b-row>
        <hr/>
      </b-container>
    </div>

    <b-container style="padding-top: 8px;">
      <b-row v-if="totalAmount">
        <b-col cols="12">
          <TotalRow
            class="total-row"
            v-if="!compLoading"
            :items_total="totalAmount"
            :total="total_dinero"
            :total_vat="totalVAT_dinero"
          />
          <hr/>
        </b-col>
      </b-row>
      <b-row v-if="costService.collection.length && !parentHasQuotationLines">
        <b-col cols="2"></b-col>
        <b-col cols="10">
          <b-button
            :disabled="compLoading"
            @click="addCost"
            class="btn btn-primary"
            type="button"
          >
            {{ $trans('Add call out cost') }}
          </b-button>
          <span style="width: 80px">&nbsp;</span>
          <b-button
            :disabled="compLoading"
            @click="() => saveCosts()"
            class="btn btn-danger"
            type="button"
            variant="danger"
            v-if="costService.collection.length"
          >
            {{ $trans("Save call out costs") }}
          </b-button>
        </b-col>
      </b-row>
      <b-row v-if="!costService.collection.length && !parentHasQuotationLines">
        <b-col cols="7"></b-col>
        <b-col cols="5">
          <b-button
            :disabled="compLoading"
            @click="addCost"
            class="btn btn-primary"
            type="button"
          >
            {{ $trans('Add call out cost') }}
          </b-button>
        </b-col>
      </b-row>

      <b-row v-if="showAddQuotationLinesBlock">
        <b-col cols="12">
          <hr />
          <AddToQuotationLines
            :useOnQuotationOptions="useOnQuotationOptions"
            @buttonClicked="createQuotationLinesClicked"
          />
          <hr/>
        </b-col>
      </b-row>

    </b-container>
  </details>
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
import {toDinero} from "@/utils";
import AddToQuotationLines from './AddToQuotationLines.vue'
import {ChapterModel} from "@/models/quotations/Chapter";
import {CustomerModel} from "@/models/customer/Customer";
import {QuotationLineService} from "@/models/quotations/QuotationLine";

export default {
  name: "CallOutCosts",
  mixins: [quotationMixin],
  components: {
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
  },
  watch: {
    quotationLinesParent(newVal) {
      this.checkParentHasQuotationLines(newVal)
    }
  },
  computed: {
    compLoading () {
      return this.isLoading
    },
    showAddQuotationLinesBlock() {
      return this.costService.collection.length && !this.parentHasQuotationLines
    }
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
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price_other', priceDinero)
      this.updateTotals()
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
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Created'), this.$trans('Call out costs have been updated'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        console.log('Error creating call out costs', error)
        this.errorToast(this.$trans('Error creating call out costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true

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
      } catch(error) {
        this.errorToast(this.$trans('Error fetching material cost'))
        this.isLoading = false
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id
      }
    },
    getEngineerRateFor(obj, usePrice) {
      switch (usePrice) {
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.hourly_rate_engineer_dinero
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return toDinero(this.default_hourly_rate, this.default_currency)
        default:
          throw `getEngineerRateFor: unknown usePrice for work hours: ${usePrice}`
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
          throw `getPrice: unknown use_price for quotation: ${activity.use_price}`
      }
    },
    getCurrency(activity) {
      return this.default_currency
    },
    updateTotals() {
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
    getDescriptionUserTotalsQuotationLine(cost) {
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
