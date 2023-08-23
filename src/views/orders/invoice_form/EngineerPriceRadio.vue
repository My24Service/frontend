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

</style>
