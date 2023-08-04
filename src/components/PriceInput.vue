<template>
  <p class="flex">
    <b-form-input
      v-model="number"
      size="sm"
      class="input-number"
      @blur="update"
    ></b-form-input>
    <span class="bottom">.</span>
    <b-form-input
      v-model="decimal"
      size="sm"
      class="input-decimal"
      @blur="update"
    ></b-form-input>
  </p>
</template>

<script>
import Dinero from "dinero.js";
import {toDinero} from "../utils";

export default {
  name: "PriceInput",
  props: ['currency', 'value'],
  emits: ['priceChanged'],
  data() {
    return {
      dinero: null,
      number: null,
      decimal: null,
      prevAmount: null
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
  width: 60px;
  text-align: right;
}
.input-decimal {
  width: 24px;
  padding: 1px;
  margin: 1px;
  text-align: center;
}
.bottom {
  /*margin-bottom: auto;*/
  margin-top: auto;
}
.flex {
  display : flex;
  margin-top: auto;
}

</style>
