<template>
  <b-form-radio-group
    @change="radioChanged"
    v-model="newItem.usePrice"
  >
    <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER">
      {{ $trans('Engineer') }}
      {{ getEngineerRateFor(newItem, usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER).toFormat("$0.00") }}
    </b-form-radio>

    <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS">
      {{ $trans('Settings') }}
      {{ getEngineerRateFor(newItem, usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS).toFormat("$0.00") }}
    </b-form-radio>

    <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER">
      {{ $trans('Customer') }}
      {{ getEngineerRateFor(newItem, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
    </b-form-radio>

    <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER">
      <p class="flex">
        {{ $trans("Other") }}:&nbsp;&nbsp;
        <PriceInput
          v-model="newItem.engineer_rate_other"
          :currency="newItem.engineer_rate_other_currency"
          @priceChanged="priceChanged"
        />
      </p>
    </b-form-radio>
  </b-form-radio-group>
</template>

<script>
import PriceInput from "../../../components/PriceInput";
import invoiceMixin from "./mixin";
import {toDinero} from "../../../utils";

export default {
  name: "EngineerPriceRadio",
  emits: [
    'otherPriceChanged',
    'radioChanged'
  ],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
  },
  data() {
    return {
      newItem: null
    }
  },
  created() {
    this.newItem = this.item
  },
  props: {
    engineer_models: {
      type: [Array],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
    item: {
      type: [Object],
      default: null
    },
  },
  methods: {
    getEngineerRateFor(obj, usePrice) {
      const user = this.engineer_models.find((m) => m.id === obj.user_id)
      if (user) {
        switch (usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.getInvoiceDefaultHourlyRateDinero()
          default:
            throw `unknown usePrice for engineer: ${usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    priceChanged(dineroVal) {
      this.$emit('otherPriceChanged', dineroVal)
    },
    radioChanged() {
      this.$emit('radioChanged', this.newItem.usePrice)
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
