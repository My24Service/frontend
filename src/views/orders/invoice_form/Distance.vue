<template>
  <Collapse
    :title="$trans('Distance')"
  >
    <b-container fluid>
      <b-row>
        <b-col cols="2">
          <HeaderCell
          :text='$trans("Engineer")'
          />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("To")'
          />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("Back")'
          />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("Total")'
          />
        </b-col>
        <b-col cols="3">
          <HeaderCell
            :text='$trans("Rate")'
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
      <b-row v-for="distance in costService.collection" :key="distance.user_id" class="distance_row">
        <b-col cols="2">
          {{ getFullname(distance.user_id) }}
        </b-col>
        <b-col cols="1">
          {{ distance.distance_to }}
        </b-col>
        <b-col cols="1">
          {{ distance.distance_back }}
        </b-col>
        <b-col cols="1">
          {{ distance.distance_total }}
        </b-col>
        <b-col cols="3">
          <b-form-radio-group
            @change="updateTotals"
            v-model="distance.use_price"
          >
            <b-form-radio :value="usePriceOptions.USE_PRICE_SETTINGS">
              {{ $trans('Settings') }}
              {{ getPriceFor(usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_CUSTOMER">
              {{ $trans('Customer') }}
              {{ getPriceFor(usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="distance.price_per_km_other"
                  :currency="distance.price_per_km_other_currency"
                  @priceChanged="(val) => otherPriceChanged(val, distance)"
                />
              </p>
            </b-form-radio>
          </b-form-radio-group>
        </b-col>
        <b-col cols="1">
          <MarginInput
            :margin="distance.margin_perc"
            @inputChanged="(val) => marginChanged(distance, val)"
          />
        </b-col>
        <b-col cols="1">
          <VAT @vatChanged="(val) => changeVatType(distance, val)" />
        </b-col>
        <b-col cols="2">
          <Totals
            :total="distance.total_dinero"
            :margin="distance.margin_dinero"
            :vat="distance.vat_dinero"
          />
        </b-col>
      </b-row>
      <TotalRow
        :items_total="distance_total"
        :total="total"
        :total_vat="totalVAT"
      />

      <div class="use-on-invoice-container">
        <h3>{{ $trans("What to add as invoice lines")}}</h3>
        <b-form-group>
          <b-form-radio-group
            v-model="useOnInvoiceSelected"
            :options="useOnInvoiceOptions"
          ></b-form-radio-group>
        </b-form-group>
      </div>

    </b-container>
  </Collapse>
</template>

<script>
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";
import {
  OPTION_DISTANCE_TOTALS, OPTION_NONE,
  OPTION_USER_TOTALS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER, USE_PRICE_SETTINGS
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import CostService, {
  COST_TYPE_DISTANCE,
} from "../../../models/orders/Cost";

export default {
  name: "DistanceComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
  },
  props: {
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
    distance_total: {
      type: [Number],
      default: null
    },
    invoice_default_price_per_km: {
      type: [String],
      default: null
    }
  },
  data() {
    return {
      costService: new CostService(),

      total: null,
      totalVAT: null,
      totalDistance: null,

      invoice_default_price_per_km_dinero: null,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_DISTANCE_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,
    }
  },
  created() {
    this.invoice_default_price_per_km_dinero = toDinero(
      this.invoice_default_price_per_km,
      this.default_currency
    )

    this.costService.collection = this.user_totals.map((a) => (
      new this.costService.model({
      ...this.getDefaultCostProps(),
      user_id: a.user_id,
      distance_to: a.distance_to,
      distance_back: a.distance_back,
      distance_total: a.distance_total,
      amount_int: a.distance_total,
    })))
    this.updateTotals()
  },
  methods: {
    getDefaultCostProps() {
      // default props for cost model
      return {
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        price_per_km_other: "0.00",
        price_per_km_other_currency: this.default_currency,
        price_per_km_other_dinero: toDinero("0.00", this.default_currency),
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        cost_type: COST_TYPE_DISTANCE,
        vat_currency: this.default_currency,
        margin_currency: this.default_currency,
        price_currency: this.default_currency,
        total_currency: this.default_currency,
      }
    },
    otherPriceChanged(priceDinero, distance) {
      distance.setPriceField('price_per_km_other', priceDinero)
      this.updateTotals()
    },
    getPriceFor(type) {
      switch (type) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        default:
          throw `getPrice: unknown use_price: ${type}`
      }
    },
    getPrice(distance) {
      switch (distance.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        case this.usePriceOptions.USE_PRICE_OTHER:
          return distance.price_per_km_other_dinero
        default:
          throw `getPrice: unknown use_price: ${distance.use_price}`
      }
    },
    getCurrency(distance) {
      switch (distance.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return distance.price_per_km_other_currency
        default:
          throw `getCurrency: unknown use_price: ${distance.use_price}`
      }
    },
    updateTotals() {
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()
    },
  },
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
