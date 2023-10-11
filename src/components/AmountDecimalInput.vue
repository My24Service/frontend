<template>
  <p class="flex">
    <b-input-group
      size="sm"
    >
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
import { toDinero } from "../utils";
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'

export default {
  name: "AmountDecimalInput",
  props: ['value'],
  emits: ['amountChanged'],
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
    }
  },
  data() {
    return {
      dinero: null,
      number: null,
      decimal: null
    }
  },
  computed: {
    isInValid() {
      return this.v$.$invalid
    }
  },
  watch: {
    value(val) {
      this.setAmount(val)
    }
  },
  methods: {
    setAmount(amountDecimal) {
      this.dinero = toDinero(amountDecimal, 'EUR')
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

      this.$emit('amountChanged', `${this.number}.${this.decimal}`)
    }
  },
  created() {
    this.setAmount(this.value)
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
