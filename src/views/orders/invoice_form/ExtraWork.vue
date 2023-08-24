<template>
  <Collapse
    :title="$trans('Extra work')"
  >
    <b-container fluid>
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
      <b-row v-for="extra_work in userTotals" :key="extra_work.user_id" class="material_row">
        <b-col cols="3">
          {{ getFullname(extra_work.user_id) }}
        </b-col>
        <b-col cols="2">
          {{ extra_work.work_total }}
        </b-col>
        <b-col cols="3">
          <EngineerPriceRadio
            :item="extra_work"
            :engineer_models="engineer_models"
            :customer="customer"
            @otherPriceChanged="(dineroVal) => otherPriceChanged(dineroVal, extra_work)"
            @radioChanged="(usePrice) => engineerPriceRadioChanged(extra_work, usePrice)"
          />
        </b-col>
        <b-col cols="1">
          <p class="flex">
            <b-form-input
              v-model="extra_work.margin_perc"
              size="sm"
              class="input-margin"
            ></b-form-input>
            <span class="percentage-container">%</span>
          </p>
        </b-col>
        <b-col cols="1">
          <VAT @vatChanged="(val) => changeVatType(extra_work, val)" />
        </b-col>
        <b-col cols="2">
          <Totals
            :total="extra_work.total"
            :margin="extra_work.margin"
            :vat="extra_work.vat"
          />
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="8">
          <span class="total-text">{{ $trans('Extra work total') }}</span>
        </b-col>
        <b-col cols="2">
          <span class="total-text">{{ extra_work_totals.extra_work }}</span>
        </b-col>
        <b-col cols="2">
          <Totals
            :total="total"
            :is-final-total="true"
            :vat="totalVAT"
          />
        </b-col>
      </b-row>

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
  OPTION_EXTRA_WORK_TOTALS,
  OPTION_NONE,
  OPTION_USER_TOTALS
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import EngineerPriceRadio from "./EngineerPriceRadio";

export default {
  name: "ExtraWorkComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    EngineerPriceRadio,
  },
  watch: {
    // userTotals: {
    //   handler(newValue) {
    //     // console.log('engineer_models changed', newValue)
    //     this.updateTotals()
    //   },
    //   deep: true
    // },
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
    extra_work_totals: {
      type: [Object],
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
  },
  created() {
    let count = 0
    this.userTotals = this.extra_work_totals.user_totals.map((a) => ({
      ...a,
      data_index: count++,
      vat_type: this.invoice_default_vat,
      margin_perc: this.invoice_default_margin,
      engineer_rate: this.getEngineerRate(a.user_id),
      engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
      engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
      engineer_rate_other: "0.00",
      engineer_rate_other_currency: this.default_currency,
      engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
      usePrice: this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER,
    }))

    this.updateTotals()
  },
  data () {
    return {
      isLoading: false,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      userTotals: [],
      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Extra work totals'), value: OPTION_EXTRA_WORK_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,
    }
  },
  methods: {
    createInvoiceLines() {
    },
    otherPriceChanged(dineroVal, extra_work) {
      this.setEngineerRateOther(dineroVal, extra_work)
      this.updateTotals()
    },
    engineerPriceRadioChanged(extra_work, usePrice) {
      extra_work.usePrice = usePrice
      this.updateHoursTotals()
    },
    changeVatType(extra_work, vatType) {
      extra_work.vat_type = vatType
      this.updateHoursTotals()
    },
    updateHoursTotals() {
      this.updateTotals()
      // this.updateExtraWorkTotals()
      // this.updateActualWorkTotals()
    },
    updateTotals() {
      this.userTotals = this.userTotals.map((m) => this.updateHoursUserTotals(m))
      this.total = this.getItemsTotal(this.userTotals)
      this.totalVAT = this.getItemsTotalVAT(this.userTotals)

      return true
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.input-margin {
  width: 40px;
  padding: 1px;
  margin: 1px;
  text-align: center;
}
.percentage-container {
  padding-top: 4px;
  padding-left: 4px;
}
.total-text {
  font-size: 14px;
  font-weight: bold;
}
</style>
