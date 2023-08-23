<template>
  <b-container fluid>
    <h3>{{ $trans("Hours") }}</h3>
    <b-row>
      <b-col cols="2">
        <HeaderCell
          :text='$trans("Engineer")'
        />
      </b-col>
      <b-col cols="1">
        <HeaderCell
          :text='$trans("Work")'
        />
      </b-col>
      <b-col cols="1">
        <HeaderCell
          :text='$trans("Travel")'
        />
      </b-col>
      <b-col cols="1">
        <HeaderCell
          :text='$trans("Total")'
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
    <b-row v-for="activity in userTotals" :key="activity.user_id" class="material_row">
      <b-col cols="2">
        {{ getFullname(activity.user_id) }}
      </b-col>
      <b-col cols="1">
        {{ activity.work_total }}
      </b-col>
      <b-col cols="1">
        {{ activity.travel_total }}
      </b-col>
      <b-col cols="1">
        {{ activity.hours_total }}
      </b-col>
      <b-col cols="3">
        <b-form-radio-group
          @change="updateHoursTotals"
          v-model="activity.usePrice"
        >
          <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER">
            {{ $trans('Engineer') }}
            {{ getEngineerRateFor(activity, usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER).toFormat("$0.00") }}
          </b-form-radio>

          <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS">
            {{ $trans('Settings') }}
            {{ getEngineerRateFor(activity, usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS).toFormat("$0.00") }}
          </b-form-radio>

          <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER">
            {{ $trans('Customer') }}
            {{ getEngineerRateFor(activity, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
          </b-form-radio>

          <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER">
            <p class="flex">
              {{ $trans("Other") }}:&nbsp;&nbsp;
              <PriceInput
                v-model="activity.engineer_rate_other"
                :currency="activity.engineer_rate_other_currency"
                @priceChanged="(val) => setEngineerRateOtherActivity(val, activity)"
              />
            </p>
          </b-form-radio>
        </b-form-radio-group>
      </b-col>
      <b-col cols="1">
        <p class="flex">
          <b-form-input
            @blur="updateHoursTotals"
            v-model="activity.margin_perc"
            size="sm"
            class="input-margin"
          ></b-form-input>
          <span class="percentage-container">%</span>
        </p>
      </b-col>
      <b-col cols="1">
        <VAT @vatChanged="(val) => changeVatType(activity, val)" />
      </b-col>
      <b-col cols="2">
        <Totals
          :total="activity.total"
          :margin="activity.margin"
          :vat="activity.vat"
        />
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="8">
        <span class="total-text">{{ $trans('Work total') }}</span>
      </b-col>
      <b-col cols="2">
        <span class="total-text">{{ activity_totals.hours_total }}</span>
      </b-col>
      <b-col cols="2">
        <Totals
          :total="activityTotal"
          :is-final-total="true"
          :vat="activityTotalVAT"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PriceInput from "../../../components/PriceInput";
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";
import {
  INVOICE_LINE_TYPE_ACTIVITY,
  OPTION_ACTIVITY_ACTIVITY_TOTALS, OPTION_ACTIVITY_ACTUAL_WORK,
  OPTION_NONE,
  OPTION_USER_TOTALS
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";

export default {
  name: "ActivityComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Totals,
    Collapse,
    HeaderCell,
    VAT,
  },
  watch: {
    engineer_models: {
      handler(newValue) {
        console.log('engineer_models changed', newValue)
        this.updateActivityTotals()
      },
      deep: true
    }
  },
  props: {
    activity_totals: {
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
    this.userTotals = this.activity_totals.user_totals.map((a) => ({
      ...a,
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

    this.updateActivityTotals()
  },
  data () {
    return {
      isLoading: false,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      userTotals: [],
      activityTotal: null,
      activityTotalVAT: null,

      useOnInvoiceActivityOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Activity totals'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceActivitySelected: null,
    }
  },
  methods: {
    createInvoiceLines() {
      switch (this.useOnInvoiceActivitySelected) {
        case OPTION_USER_TOTALS:
          let invoiceLines = this.userTotals.map((activity) => {
            this.createInvoiceLine(
              INVOICE_LINE_TYPE_ACTIVITY,
              `${this.$trans("Work hours")} ${this.getFullname(activity.user_id)}`,
              activity.total_hours,
              activity.vat,
              activity.total
            )
          })
          this.$emit('invoiceLinesCreated', invoiceLines)
          break
        case OPTION_ACTIVITY_ACTIVITY_TOTALS:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activity_totals.hours_total,
            this.activityTotalVAT,
            this.activityTotal
          )
          break
        case OPTION_ACTIVITY_ACTUAL_WORK:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activity_totals.actual_work_totals.actual_work,
            this.actualWorkTotalVAT,
            this.actualWorkTotal
          )
          break
        case OPTION_NONE:
          console.debug("not adding any activity")
      }
    },
    changeVatType(activity, vatType) {
      activity.vat_type = vatType
      this.updateHoursTotals()
    },
    updateHoursTotals() {
      this.updateActivityTotals()
      // this.updateExtraWorkTotals()
      // this.updateActualWorkTotals()
    },
    updateActivityTotals() {
      this.userTotals = this.userTotals.map((m) => this.updateUserActivityTotals(m))
      this.activityTotal = this.getItemsTotal(this.userTotals)
      this.activityTotalVAT = this.getItemsTotalVAT(this.userTotals)

      return true
    },
    updateUserActivityTotals(activity) {
      const price = this.getSelectedEngineerRate(activity)
      const currency = this.getSelectedEngineerRateCurrency(activity)
      const hours_parts = activity.hours_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1] / 60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (activity.margin_perc > 0) {
        margin = total.multiply(activity.margin_perc / 100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(activity.vat_type) / 100)
      activity.currency = currency
      activity.total = total_with_margin
      activity.vat = vat
      activity.margin = margin

      return activity
    },
    setEngineerRateOtherActivity(priceDinero, activity) {
      activity.engineer_rate_other_dinero = priceDinero
      activity.engineer_rate_other = activity.engineer_rate_other_dinero.toFormat('0.00')
      activity.engineer_rate_other_currency = activity.engineer_rate_other_dinero.getCurrency()

      this.updateHoursTotals()
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
