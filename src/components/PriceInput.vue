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
        size="sm"
        @blur="update"
        :state="v$.number.$error ? false : null"
      ></b-form-input>

      <template #append>
        <b-form-input
          v-model="decimal"
          class="input-decimal"
          size="sm"
          :state="v$.decimal.$error ? false : null"
          @blur="update"
        ></b-form-input>
      </template>
    </b-input-group>
  </p>
</template>

<script>
import Dinero from "dinero.js";
import {toDinero} from "../utils";
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'

export default {
  name: "PriceInput",
  props: ['currency', 'value'],
  emits: ['priceChanged'],
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
      if (this.dinero.getCurrency() === 'EUR') {
        return '€'
      }
      if (this.dinero.getCurrency() === 'USD') {
        return '$'
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
    setPrice(priceDecimal) {
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
  width: 50px;
  text-align: right;
}
.input-decimal {
  width: 56px !important;
  text-align: center;
}
.flex {
  display : flex;
  margin-top: auto;
}
</style>
