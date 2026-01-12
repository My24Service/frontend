<template>
  <p class="flex">
    <b-input-group
      size="sm"
    >
      <template #prepend>
        <b-input-group-text>
        {{ currencyCode }}
        </b-input-group-text>
      </template>

      <BFormInput
        v-model="number"
        class="input-number"
        :placeholder="$trans('Price')"
        size="sm"
        @input="update"
        @focus="gotFocus"
        :state="v$.number.$error ? false : null"
      ></BFormInput>

      <template #append>
        <BFormInput
          v-model="decimal"
          class="input-decimal"
          type="number"
          size="sm"
          :state="v$.decimal.$error ? false : null"
          @input="update"
          @focus="gotFocus"
        ></BFormInput>
      </template>
    </b-input-group>
  </p>
</template>

<script>
import Dinero from "dinero.js";
import {toDinero} from "@/utils";
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'
import componentMixin from "@/mixins/common";

export default {
  name: "PriceInput",
  props: ['currency', 'modelValue', 'allow-empty' ],
  emits: ['priceChanged', 'receivedFocus', 'update:modelValue'],
  mixins: [componentMixin],
  setup() {
    return {
      v$: useVuelidate(),
    }
  },
  validations() {
    if (this.allowEmpty) {
      return {
        number: {
          numeric
        },
        decimal: {
          numeric
        }
      }
    }

    return {
      number: {
        required,
        numeric
      },
      decimal: {
        required,
        numeric
      },
      // validationGroup: ['number', 'decimal'],
    }
  },
  data() {
    return {
      dinero: null,
      prevAmount: null,
      number: null,
      decimal: null,
    }
  },
  watch: {
    number(val) {
      console.log('number changed', val)
      this.$emit('update:modelValue', this.amount)
    },
    decimal(val) {
      console.log('decimal changed', val)
      this.$emit('update:modelValue', this.amount)
    }
  },
  computed: {
    amount() {
      return `${this.number}.${this.decimal}`
    },
    currencyCode() {
      if (!this.dinero) {
        return
      }

      if (this.dinero.getCurrency() === 'EUR') {
        return '€'
      }
      if (this.dinero.getCurrency() === 'USD') {
        return '$'
      }
      if (this.dinero.getCurrency() === 'GBP') {
        return '£'
      }
      throw `Unknown currency: ${this.dinero.getCurrency()}`
    }
  },
  methods: {
    gotFocus() {
      this.$emit('receivedFocus')
    },
    setPrice(priceDecimal) {
      if (!this.currency) {
        return
      }

      this.dinero = toDinero(priceDecimal, this.currency)
      const parts = this.dinero.toFormat('0.00').split('.')
      this.number = parts[0]
      this.decimal = parts[1]
    },
    update() {
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      const amount = parseInt(`${this.number}${this.decimal}`)
      if (isNaN(amount)) {
        throw `invalid input: ${this.number}.${this.decimal}`
      }

      if (this.prevAmount && this.prevAmount === amount) {
        return
      }

      const dinero = Dinero({
        amount,
        currency: this.currency
      })

      this.$emit('priceChanged', dinero)
      this.prevAmount = amount
      this.setPrice(amount/100)
    }
  },
  created() {
    this.setPrice(this.modelValue)
  }
}
</script>

<style scoped>
.input-number {
  max-width: 10ch;
  text-align: right;
}
.input-decimal {
  max-width: 7ch !important;
  text-align: center;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.flex {
  display: flex;
  margin-top: auto;
  min-width: 180px;
}
</style>
