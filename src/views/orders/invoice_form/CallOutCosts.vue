<template>
  <Collapse
    :title="$trans('Call out costs')"
  >
    <b-container fluid>
      <b-row>
        <b-col cols="2">
          <HeaderCell
            :text='$trans("Amount")'
          />
        </b-col>
        <b-col cols="6">
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
      <b-row>
        <b-col cols="2">
          <b-form-input
            @blur="updateTotals"
            v-model="coc_item.amount_int"
            size="sm"
            class="input-margin"
          ></b-form-input>
        </b-col>
        <b-col cols="6">
          <b-form-radio-group
            @change="updateTotals"
            v-model="coc_item.use_price"
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
                  v-model="coc_item.other"
                  :currency="coc_item.other_currency"
                  @priceChanged="(val) => otherPriceChanged(val)"
                />
              </p>
            </b-form-radio>
          </b-form-radio-group>
        </b-col>
        <b-col cols="1">
          <MarginInput
            :margin="coc_item.margin_perc"
            @inputChanged="(val) => marginChanged(coc_item, val)"
          />
        </b-col>
        <b-col cols="1">
          <VAT @vatChanged="(val) => changeVatType(coc_item, val)" />
        </b-col>
        <b-col cols="2">
          <Totals
            :total="coc_item.total_dinero"
            :margin="coc_item.margin_dinero"
            :vat="coc_item.vat_dinero"
          />
        </b-col>
      </b-row>
      <TotalRow
        :items_total="coc_item.amount_int"
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
import {toDinero} from "../../../utils";
import {
  OPTION_CALL_OUT_COSTS_TOTALS,
  OPTION_NONE, USE_PRICE_CUSTOMER, USE_PRICE_OTHER, USE_PRICE_SETTINGS
} from "./constants";
import PriceInput from "../../../components/PriceInput";
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import invoiceMixin from "./mixin";
import CostService, {COST_TYPE_CALL_OUT_COSTS, CostModel} from "../../../models/orders/Cost";

export default {
  name: "CallOutCostsComponent",
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
    invoice_default_call_out_costs: {
      type: [Number, String],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
  },
  data() {
    return {
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_call_out_costs_dinero: null,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      costService: new CostService(),

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_CALL_OUT_COSTS_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

    }
  },
  created() {
    this.invoice_default_call_out_costs_dinero = toDinero(
      this.invoice_default_call_out_costs,
      this.default_currency
    )

    this.coc_item = new CostModel({
      ...this.getDefaultCostProps(),
    })
    this.costService.collection.push(this.coc_item)
    this.updateTotals()
  },
  methods: {
    getDefaultCostProps() {
      return {
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        other: "0.00",
        other_currency: this.default_currency,
        other_dinero: toDinero("0.00", this.default_currency),
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        cost_type: COST_TYPE_CALL_OUT_COSTS,
        amount_int: 1,
      }
    },
    getPriceFor(type) {
      switch (type) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_dinero
        default:
          throw `getPrice: unknown use_price: ${type}`
      }
    },
    getPrice() {
      switch (this.coc_item.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_OTHER:
          return this.coc_item.other_dinero
        default:
          throw `getPrice: unknown use_price: ${this.use_price}`
      }
    },
    getCurrency() {
      switch (this.coc_item.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return this.coc_item.other_currency
        default:
          throw `getCurrency: unknown use_price: ${this.use_price}`
      }
    },
    otherPriceChanged(priceDinero) {
      this.coc_item.setPriceField('other', priceDinero)
      this.updateTotals()
    },
    updateTotals() {
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()
    },
  }
}
</script>

<style scoped>

</style>
