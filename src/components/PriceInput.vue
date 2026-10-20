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

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'

import { formatMoneyPlain, toDinero, type Money } from '@/services/money'

defineOptions({name: 'PriceInput'})

const props = defineProps<{
  currency?: string
  modelValue?: string | number | null
  allowEmpty?: boolean
}>()

const emit = defineEmits<{
  priceChanged: [price: Money]
  receivedFocus: []
  'update:modelValue': [value: string]
}>()

const dinero = ref<Money | null>(null)
const prevAmount = ref<number | null>(null)
const number = ref<string | null>(null)
const decimal = ref<string | null>(null)

const rules = computed(() => props.allowEmpty
  ? {number: {numeric}, decimal: {numeric}}
  : {number: {required, numeric}, decimal: {required, numeric}})

const v$ = useVuelidate(rules, {number, decimal})

const amount = computed(() => `${number.value}.${decimal.value}`)

watch(number, () => emit('update:modelValue', amount.value))
watch(decimal, () => emit('update:modelValue', amount.value))

const currencyCode = computed(() => {
  if (!dinero.value) {
    return
  }

  const currency = dinero.value.getCurrency()
  if (currency === 'EUR') {
    return '€'
  }
  if (currency === 'USD') {
    return '$'
  }
  if (currency === 'GBP') {
    return '£'
  }
  throw new Error(`Unknown currency: ${currency}`)
})

function gotFocus() {
  emit('receivedFocus')
}

function setPrice(priceDecimal: string | number | null | undefined) {
  if (!props.currency) {
    return
  }

  dinero.value = toDinero(priceDecimal, props.currency)
  const parts = formatMoneyPlain(dinero.value).split('.')
  number.value = parts[0]
  decimal.value = parts[1]
}

function update() {
  v$.value.$touch()
  if (v$.value.$invalid) {
    console.log('invalid?', v$.value.$invalid)
    return
  }

  const cents = parseInt(`${number.value}${decimal.value}`)
  if (isNaN(cents)) {
    throw new Error(`invalid input: ${number.value}.${decimal.value}`)
  }

  if (prevAmount.value && prevAmount.value === cents) {
    return
  }

  emit('priceChanged', toDinero(cents / 100, props.currency ?? ''))
  prevAmount.value = cents
  setPrice(cents / 100)
}

setPrice(props.modelValue)
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
