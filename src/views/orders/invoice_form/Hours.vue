<template>
  <b-overlay :show="isLoading" rounded="sm">
    <Collapse
      :title="getTitle()"
    >
      <div
        class="costs-table"
        v-if="!isLoading && hasStoredData"
      >
        <CostsTable
          :collection="costService.collection"
          :type="costType"
        />

        <CollectionEmptyContainer
          @buttonClicked="() => { emptyCollection() }"
        />

        <div class="use-on-invoice-container" v-if="!parentHasInvoiceLines">
          <h4>{{ $trans("What to add as invoice lines")}}</h4>
          <b-form-group>
            <b-form-radio-group
              v-model="useOnInvoiceSelected"
              :options="useOnInvoiceOptions"
            ></b-form-radio-group>
          </b-form-group>
          <b-button
            @click="() => { createInvoiceLines() }"
            class="btn btn-primary update-button"
            type="button"
            variant="primary"
          >
            {{ $trans("Create invoice lines") }}
          </b-button>
        </div>

      </div>

      <b-container fluid v-if="!isLoading && !hasStoredData">
        <b-row>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Engineer")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Hours")'
            />
          </b-col>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Engineer rate")'
              />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Margin")'
              />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("VAT type")'
              />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row v-for="activity in costService.collection" :key="activity.user_id" class="material_row">
          <b-col cols="3">
            {{ getFullname(activity.user_id) }}
          </b-col>
          <b-col cols="2">
            {{ activity.hours_total }}
          </b-col>
          <b-col cols="3">
            <b-form-radio-group
              @change="updateTotals"
              v-model="activity.use_price"
            >
              <b-form-radio :value="usePriceOptions.USE_PRICE_USER">
                {{ $trans('Engineer') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_USER).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="activity.price_other"
                    :currency="activity.price_other_currency"
                    @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, activity)"
                  />
                </p>
              </b-form-radio>
            </b-form-radio-group>
          </b-col>
          <b-col cols="1">
            <MarginInput
              :margin="activity.margin_perc"
              @inputChanged="(val) => marginChanged(activity, val)"
            />
          </b-col>
          <b-col cols="1">
            <VAT @vatChanged="(val) => changeVatType(activity, val)" />
          </b-col>
          <b-col cols="2">
            <Totals
              :total="activity.total_dinero"
              :margin="activity.margin_dinero"
              :vat="activity.vat_dinero"
            />
          </b-col>
        </b-row>
        <TotalRow
          :items_total="hours_total"
          :total="total"
          :total_vat="totalVAT"
        />

        <CollectionSaveContainer
          @buttonClicked="() => { saveCollection() }"
        />

      </b-container>
    </Collapse>
  </b-overlay>
</template>

<script>
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";
import {
  INVOICE_LINE_TYPE_ACTIVITY,
  INVOICE_LINE_TYPE_HOURS_TYPE_ACTUAL_WORK,
  INVOICE_LINE_TYPE_HOURS_TYPE_EXTRA_WORK,
  INVOICE_LINE_TYPE_HOURS_TYPE_TRAVEL,
  INVOICE_LINE_TYPE_HOURS_TYPE_WORK,
  INVOICE_LINE_TYPE_USED_MATERIALS,
  OPTION_ACTIVITY_ACTIVITY_TOTALS,
  OPTION_ACTIVITY_ACTUAL_WORK,
  OPTION_NONE,
  OPTION_USER_TOTALS,
  USE_PRICE_CUSTOMER,
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS,
  USE_PRICE_USER
} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import CostService, {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "../../../models/orders/Cost";
import PriceInput from "../../../components/PriceInput";
import {toDinero} from "../../../utils";
import CollectionSaveContainer from "./CollectionSaveContainer";
import CollectionEmptyContainer from "./CollectionEmptyContainer";
import CostsTable from "./CostsTable";

export default {
  name: "HoursComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
    PriceInput,
    CollectionSaveContainer,
    CollectionEmptyContainer,
    CostsTable,
  },
  watch: {
    engineer_models: {
      handler(newValue) {
        // console.log('engineer_models changed', newValue)
        this.updateTotals()
      },
      deep: true
    },
    customer: {
      handler(newValue) {
        // console.log('customer changed', newValue)
        this.updateTotals()
      },
      deep: true
    }
  },
  props: {
    order_pk: {
      type: [Number],
      default: null
    },
    type: {
      type: [String],
      default: null
    },
    hours_total: {
      type: [String],
      default: null
    },
    user_totals: {
      type: [Array],
      default: null
    },
    engineer_models: {
      type: [Array],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
    invoiceLinesParent: {
      type: [Array],
      default: null
    },
  },
  data () {
    return {
      isLoading: false,

      COST_TYPE_WORK_HOURS,
      COST_TYPE_TRAVEL_HOURS,
      COST_TYPE_EXTRA_WORK,
      COST_TYPE_ACTUAL_WORK,

      costService: new CostService(),

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,
      default_hourly_rate: this.$store.getters.getInvoiceDefaultHourlyRate,

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptions: {
        USE_PRICE_USER,
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

      hasStoredData: false,
      costType: this.type,
      parentHasInvoiceLines: false,
    }
  },
  computed: {
    invoiceLineType() {
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
          throw `invoiceLineType(), unknown type ${this.type}`
      }
    }
  },
  async created() {
    this.isLoading = true

    // set vars in service
    this.costService.invoice_default_margin = this.invoice_default_margin
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${this.type}`)

    await this.loadData()

    this.isLoading = false
  },
  methods: {
    async loadData() {
      this.costService.collection = []
      this.hasStoredData = false
      // check if we already stored costs
      const response = await this.costService.list()
      if (response.results.length > 0) {
        this.costService.collection = response.results.map((cost) => (
          new this.costService.model(cost)
        ))
        this.hasStoredData = true
      } else {
        // map input to Cost model collection
        let user_totals
        const use_price = this.usePriceOptions.USE_PRICE_SETTINGS

        switch (this.type) {
          case COST_TYPE_WORK_HOURS:
            // filter out empty values
            user_totals = this.user_totals.filter((m) => m.work_secs !== null)
            this.costService.collection = user_totals.map((activity) => (
              this.costService.newModelFromWorkHours(
                activity,
                this.getPrice({...activity, use_price}),
                this.getCurrency({...activity, use_price}),
                this.getDefaultProps()
              )))
            break
          case COST_TYPE_TRAVEL_HOURS:
            user_totals = this.user_totals.filter((m) => m.travel_total_secs !== null)
            this.costService.collection = user_totals.map((activity) => (
              this.costService.newModelFromTravelHours(
                activity,
                this.getPrice({...activity, use_price}),
                this.getCurrency({...activity, use_price}),
                this.getDefaultProps()
              )))
            break
          case COST_TYPE_EXTRA_WORK:
            user_totals = this.user_totals.filter((m) => m.extra_work_secs !== null)
            this.costService.collection = user_totals.map((activity) => (
              this.costService.newModelFromExtraWork(
                activity,
                this.getPrice({...activity, use_price}),
                this.getCurrency({...activity, use_price}),
                this.getDefaultProps()
              )))
            break
          case COST_TYPE_ACTUAL_WORK:
            user_totals = this.user_totals.filter((m) => m.actual_work_secs !== null)
            this.costService.collection = user_totals.map((activity) => (
              this.costService.newModelFromActualWork(
                activity,
                this.getPrice({...activity, use_price}),
                this.getCurrency({...activity, use_price}),
                this.getDefaultProps()
              )))
            break
          default:
            throw `created set userTotals, unknown type ${this.type}`
        }

        this.updateTotals()
      }
    },
    getDefaultProps() {
      return {
        order: this.order_pk,
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS
      }
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
    otherPriceChanged(dineroVal, model) {
      model.setPriceField('price_other', dineroVal)
      this.updateTotals()
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()

      return true
    },
    getPrice(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return this.default_hourly_rate
          case this.usePriceOptions.USE_PRICE_OTHER:
            return activity.price_other
          default:
            throw `getPrice: unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getPrice: model not found")
      }
    },
    getCurrency(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate_currency
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_currency
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return this.default_currency
          case this.usePriceOptions.USE_PRICE_OTHER:
            return this.default_currency
          default:
            throw `getCurrency: unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getCurrency: model not found")
      }
    },
    getEngineerRateFor(obj, usePrice) {
      const user = this.engineer_models.find((m) => m.id === obj.user_id)
      if (user) {
        switch (usePrice) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate_dinero
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return toDinero(this.default_hourly_rate, this.default_currency)
          default:
            throw `getEngineerRateFor: unknown usePrice for engineer: ${usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getDescriptionUserTotalsInvoiceLine(cost) {
      return `${this.getTitle()}: ${cost.user_full_name}`
    },
    getDescriptionOnlyTotalInvoiceLine() {
      return this.getTitle()
    },
    getTotalAmountInvoiceLine() {
      return this.distance_total
    },
  }
}
</script>

<style scoped>

</style>
