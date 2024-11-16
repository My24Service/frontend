<template>
  <p class="flex">
    <b-input-group
      size="sm"
    >
      <template #prepend>
        <b-input-group-text
        >
        {{ currencyCode }}
        </b-input-group-text>
      </template>

      <b-form-input
        v-model="number"
        class="input-number"
        type="number"
        :placeholder="$trans('Price')"
        size="sm"
        @input="update"
        @focus="gotFocus"
        :state="v$.number.$error ? false : null"
      ></b-form-input>

      <template #append>
        <b-form-input
          v-model="decimal"
          class="input-decimal"
          type="number"
          size="sm"
          :state="v$.decimal.$error ? false : null"
          @input="update"
          @focus="gotFocus"
        ></b-form-input>
      </template>
    </b-input-group>
  </p>
</template>

<script>
import Dinero from "dinero.js";
import {toDinero} from "@/utils";
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'

export default {
  name: "PriceInput",
  props: ['currency', 'value'],
  emits: ['priceChanged', 'receivedFocus'],
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
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
      number: null,
      decimal: null,
      prevAmount: null
    }
  },
  computed: {
    isInValid() {
      return this.v$.$invalid
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
  watch: {
    value(val) {
      this.setPrice(val)
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
    }
  },
  created() {
    this.setPrice(this.value)
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
  display : flex;
  margin-top: auto;
  min-width: 240px;
}
</style>
