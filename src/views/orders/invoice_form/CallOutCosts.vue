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
            v-model="coc_item.amount"
            size="sm"
            class="input-margin"
          ></b-form-input>
        </b-col>
        <b-col cols="6">
          <b-form-radio-group
            @change="updateTotals"
            v-model="coc_item.usePrice"
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
                  @priceChanged="(val) => setPriceOther(val)"
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
            :total="coc_item.total"
            :margin="coc_item.margin"
            :vat="coc_item.vat"
          />
        </b-col>
      </b-row>
      <TotalRow
        :items_total="coc_item.amount"
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
  OPTION_NONE
} from "./constants";
import PriceInput from "../../../components/PriceInput";
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import invoiceMixin from "./mixin";

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

      coc_item: {
        margin: null,
        vat: null,
        margin_perc: null,
        other_dinero: null,
        other_currency: null,
        other: null,
        amount: 1,
        usePrice: null,
      },

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_CALL_OUT_COSTS_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptions: {
        USE_PRICE_SETTINGS: 'settings',
        USE_PRICE_CUSTOMER: 'customer',
        USE_PRICE_OTHER: 'other',
      },

    }
  },
  created() {
    this.invoice_default_call_out_costs_dinero = toDinero(
      this.invoice_default_call_out_costs,
      this.default_currency
    )

    this.coc_item = {
      ...this.coc_item,
      vat_type: this.invoice_default_vat,
      margin_perc: this.invoice_default_margin,
      other: "0.00",
      other_currency: this.default_currency,
      other_dinero: toDinero("0.00", this.default_currency),
      usePrice: this.usePriceOptions.USE_PRICE_SETTINGS,
    }
    this.updateTotals()
  },
  methods: {
    radioChanged() {
      this.$emit('radioChanged', this.usePrice)
    },
    getPriceFor(type) {
      switch (type) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_dinero
        default:
          throw `getPrice: unknown usePrice: ${type}`
      }
    },
    getPrice() {
      switch (this.coc_item.usePrice) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_OTHER:
          return this.coc_item.other_dinero
        default:
          throw `getPrice: unknown usePrice: ${this.usePrice}`
      }
    },
    getCurrency() {
      switch (this.coc_item.usePrice) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return this.coc_item.other_currency
        default:
          throw `getCurrency: unknown usePrice: ${this.usePrice}`
      }
    },
    setPriceOther(priceDinero) {
      this.coc_item.other_dinero = priceDinero
      this.coc_item.other = this.coc_item.other_dinero.toFormat('0.00')
      this.coc_item.other_currency = this.coc_item.other_dinero.getCurrency()
      this.updateTotals()
    },
    updateTotals() {
      this.coc_item = this.updateUserTotals()
      this.total = this.getItemsTotal([this.coc_item])
      this.totalVAT = this.getItemsTotalVAT([this.coc_item])
    },
    updateUserTotals() {
      let item = this.coc_item
      const price = this.getPrice(item)
      const currency = this.getCurrency(item)
      const total = price.multiply(item.amount)
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (item.margin_perc > 0) {
        margin = total.multiply(item.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(item.vat_type)/100)
      item.currency = currency
      item.total = total_with_margin
      item.vat = vat
      item.margin = margin

      return item
    },
  }
}
</script>

<style scoped>

</style>
