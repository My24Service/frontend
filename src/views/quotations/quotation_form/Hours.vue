<template>
  <Collapse
    :title="getTitle()"
  >
    <b-overlay :show="compLoading" rounded="sm">
      <b-container fluid>
        <b-row>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Hours")'
            />
          </b-col>
          <b-col cols="4">
            <HeaderCell
              :text='$trans("Engineer rate")'
              />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("VAT type")'
              />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row
          v-for="(cost, index) in this.costService.collection"
          :key="index"
          class="material_row"
        >
          <b-col cols="2" v-if="cost.quotation && !cost.savedHours">
            <DurationInput
              v-model="cost.amount_duration"
              @durationChanged="(duration) => changeDuration(cost, duration)"
            />
          </b-col>
          <b-col cols="2" v-if="cost.quotation && cost.savedHours">
            {{ cost.amount_duration }}
          </b-col>
          <b-col cols="4" v-if="cost.quotation">
            <b-form-radio-group
              @change="updateTotals"
              v-model="cost.use_price"
            >
              <b-form-radio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getEngineerRateFor(cost, usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getEngineerRateFor(cost, usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="cost.price_other"
                    :currency="cost.price_other_currency"
                    @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, cost)"
                  />
                </p>
              </b-form-radio>
            </b-form-radio-group>
          </b-col>
          <b-col cols="1" v-if="cost.quotation">
            <VAT @vatChanged="(val) => changeVatType(cost, val)" />
          </b-col>
          <b-col cols="2" v-if="cost.quotation">
            <TotalsInputs
              :total="cost.total_dinero"
              :vat="cost.vat_dinero"
            />
          </b-col>
          <b-col cols="1 delete-button" v-if="cost.quotation">
            <IconLinkDelete
              :title="$trans('Delete')"
              :method="() => deleteCost(index)"
            />
          </b-col>
        </b-row>
        <hr>
        <TotalRow
          class="total-row"
          v-if="!compLoading"
          :items_total="totalAmount"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />
        <hr>
        <b-row>
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <div class="float-right">
              <b-button
                :disabled="compLoading"
                @click="addCost"
                class="btn add-button"
                type="button"
              >
                {{ $trans(`Add ${this.getTitle().toLocaleLowerCase()}`) }}
              </b-button>
            </div>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <div class="float-right">
              <b-button
                :disabled="compLoading"
                @click="() => saveCosts()"
                class="btn btn-danger update-button"
                type="button"
                variant="danger"
              >
                {{ $trans(`Save ${this.getTitle().toLocaleLowerCase()}`) }}
              </b-button>
            </div>
          </b-col>
        </b-row>
        <hr v-if="!parentHasQuotationLines">
        <AddToQuotationLines
          v-if="!parentHasQuotationLines"
          :useOnQuotationOptions="useOnQuotationOptions"
          @buttonClicked="createQuotationLinesClicked"
        />
      </b-container>
    </b-overlay>
  </Collapse>
</template>
<script>
import quotationMixin from "./mixin.js";
import moment from 'moment'
import Multiselect from 'vue-multiselect'
import DurationInput from "../../../components/DurationInput.vue"
import quotationLineService from '@/models/quotations/QuotationLine.js'
import Collapse from "../../../components/Collapse";
import {
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS,
  USE_PRICE_PURCHASE,
  USE_PRICE_SELLING,
  INVOICE_LINE_TYPE_HOURS_TYPE_WORK,
  INVOICE_LINE_TYPE_HOURS_TYPE_TRAVEL
} from "./constants";
import CostService, {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "../../../models/quotations/Cost";
import HeaderCell from "./Header";
import VAT from "./VAT";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import TotalsInputs from "../../../components/TotalsInputs";
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import {toDinero} from "../../../utils";
import customerService, { CustomerModel } from '../../../models/customer/Customer.js'
import AddToQuotationLines from './AddToQuotationLines.vue'


export default {
  name: "HoursComponent",
  emits: ['quotationLinesCreated', 'emptyCollectionClicked'],
  mixins: [quotationMixin],
  components: {
    PriceInput,
    IconLinkDelete,
    Collapse,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    DurationInput,
    AddToQuotationLines
  },
  props: {
    quotation_pk: {
      type: [Number, String],
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: ''
    },
    quotation: {
      type: [Object],
      default: null
    },
    customer:{
      type: Object,
      default: null
    }
  },
  computed: {
    compLoading () {
      return this.loading || this.isLoading
    },
    quotationLineType() {
      switch (this.type) {
        case COST_TYPE_WORK_HOURS:
          return INVOICE_LINE_TYPE_HOURS_TYPE_WORK
        case COST_TYPE_TRAVEL_HOURS:
          return INVOICE_LINE_TYPE_HOURS_TYPE_TRAVEL
        case COST_TYPE_EXTRA_WORK:
          return INVOICE_LINE_TYPE_HOURS_TYPE_EXTRA_WORK
        case COST_TYPE_ACTUAL_WORK:
          return INVOICE_LINE_TYPE_HOURS_TYPE_ACTUAL_WORK
        default:
          throw `quotationLineType(), unknown type ${this.type}`
      }
    }
  },
  data() {
    return {
      isLoading: false,
      materialModels: [],
      engineerModels: [],
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      costService: new CostService(),
      usePriceOptions: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SETTINGS,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      default_hourly_rate: this.$store.getters.getInvoiceDefaultHourlyRate,
      hasStoredData: false,
      parentHasQuotationLines: false,
      quotationLineService
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency
    this.costService.addListArg(`quotation=${this.quotation_pk}`)
    this.costService.addListArg(`cost_type=${this.type}`)
    await this.loadData()
    this.isLoading = false
  },
  methods: {
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    getTitle() {
      switch (this.type) {
        case COST_TYPE_WORK_HOURS:
          return this.$trans("Work hours")
        case COST_TYPE_TRAVEL_HOURS:
          return this.$trans("Travel hours")
        case COST_TYPE_EXTRA_WORK:
          return this.$trans("Extra work")
        case COST_TYPE_ACTUAL_WORK:
          return this.$trans("Actual work")
        default:
          throw `getTitle(), unknown type ${this.type}`
      }
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
          cost_type: this.type,
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
        this.infoToast(this.$trans('Created'), this.$trans('Hours costs have been updated'))
        this.isLoading = false
        this.loadData()
      } catch(error) {
        console.log('Error creating hours costs', error)
        this.errorToast(this.$trans('Error creating hours costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    changeDuration(cost, duration) {
      cost.amount_duration = duration
      cost.amount_duration_secs = moment.duration(duration).asSeconds()
      this.updateTotals()
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true

      try {
        const response = await this.costService.list()
        const costs = response.results.map((cost) => {
          if (cost.use_price === this.usePriceOptions.USE_PRICE_OTHER) {
            cost.price_other = cost.price
            cost.price_other_currency = cost.price_currency
          }
          cost.savedHours = true
          return new this.costService.model(cost)
        })
        this.costService.collection = costs
        this.updateTotals()
        this.isLoading = false
      } catch(error) {
        this.errorToast(this.$trans('Error fetching material cost'))
        this.isLoading = false
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.quotation_pk,
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
      const totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_duration_secs),
        0
      )
      this.totalAmount = totalAmount ? Math.round(totalAmount / 3600) : 0
    },
    getDescriptionUserTotalsQuotationLine(cost) {
      return this.getTitle()
    },
    getDescriptionOnlyTotalQuotationLine() {
      return this.getTitle()
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    },
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.add-button {
  margin: 20px 0;
}
.row.total-row {
  margin-top: 20px;
}
.material_row {
  margin-bottom: 20px;
}
.delete-button {
  font-size: 1.8rem;
}
</style>
