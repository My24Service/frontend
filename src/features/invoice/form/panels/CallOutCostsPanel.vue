<template>
    <CostCollectionShell
      :collection="collection"
      :cost-type="costType"
      :is-loading="isLoading"
      :has-stored-data="hasStoredData"
      :parent-has-invoice-lines="parentHasInvoiceLines"
      :use-on-invoice-options="useOnInvoiceOptions"
      :items-total="totalAmount"
      :total="total_dinero"
      :total-vat="totalVAT_dinero"
      @empty-collection="emptyCollectionClicked"
      @create-invoice-lines="createInvoiceLinesClicked"
      @save="saveCollection"
    >
      <template #stored-extra><hr></template>
      <template #draft>
        <b-row>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Amount")'
            />
          </b-col>
          <b-col cols="5">
            <HeaderCell
              :text='$trans("Rate")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("VAT type")'
            />
          </b-col>
          <b-col cols="3" />
        </b-row>
        <b-row>
          <b-col cols="2">
            <BFormInput
              @blur="updateTotals"
              v-model="coc_item.amount_int"
              size="sm"
            ></BFormInput>
          </b-col>
          <b-col cols="5">
            <BFormRadioGroup
              @change="updateTotals"
              v-model="coc_item.use_price"
            >
              <BFormRadio :value="USE_PRICE.SETTINGS">
                {{ $trans('Settings') }}
                {{ getPriceFor(USE_PRICE.SETTINGS).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="USE_PRICE.CUSTOMER">
                {{ $trans('Customer') }}
                {{ getPriceFor(USE_PRICE.CUSTOMER).toFormat("$0.00") }}
              </BFormRadio><br/>

              <BFormRadio :value="USE_PRICE.OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="coc_item.price_other"
                    :currency="coc_item.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val)"
                  />
                </p>
              </BFormRadio>
            </BFormRadioGroup>
          </b-col>
          <b-col cols="2">
            <VAT v-model="coc_item.vat_type" @vatChanged="(val) => changeVatType(coc_item, val)" />
          </b-col>
          <b-col cols="3">
            <TotalsInputs
              :total="coc_item.total_dinero"
              :vat="coc_item.vat_dinero"
            />
          </b-col>
        </b-row>
      </template>
    </CostCollectionShell>
</template>

<script setup lang="ts">
import type { UsePriceEnum } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import CostCollectionShell from './CostCollectionShell.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import type { CostRow } from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import { costRate, COST_TYPE, USE_PRICE } from '../calculations'

/**
 * The single call-out cost line of an order as a cost collection. The order,
 * customer and the invoice-lines callbacks come from the form through
 * `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  /** The tenant's call-out costs, the "settings" rate. */
  invoice_default_call_out_costs?: number | string | null
}>(), { invoice_default_call_out_costs: null })
const context = useCostPanelContext()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const costType = COST_TYPE.CALL_OUT_COSTS
function draftRow() {
  return makeCostRow({ cost_type: costType, order: context.orderPk.value ?? undefined,
    amount_int: 1, use_price: USE_PRICE.SETTINGS }, default_currency, invoice_default_vat)
}
function rate(row: Pick<CostRow, 'use_price' | 'price_other' | 'price_other_currency'>) {
  const option = row.use_price
  if (option !== 'settings' && option !== 'customer' && option !== 'other') throw new Error('Invalid call-out price option: ' + option)
  return costRate(option, {
    settings: { price: props.invoice_default_call_out_costs, currency: default_currency },
    customer: { price: context.customer.value?.call_out_costs, currency: context.customer.value?.call_out_costs_currency ?? default_currency },
    other: { price: row.price_other, currency: row.price_other_currency },
  })
}
function getPriceFor(option: UsePriceEnum) {
  const selected = rate({ use_price: option, price_other: '0.00', price_other_currency: default_currency })
  return toDinero(selected.price, selected.currency)
}
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, updateTotals, changeVatType, otherPriceChanged: changeOtherPrice,
} = useCostCollection({
  context,
  costType: () => costType,
  buildRows: () => [draftRow()],
  rate,
  description: () => $trans('Call out costs'),
  title: () => $trans('Call out costs'),
  amount: () => totalAmount.value,
})
const coc_item = computed(() => collection.value[0] ?? draftRow())
const totalAmount = computed(() => collection.value.reduce((total, row) => total + Number(row.amount_int), 0))
function otherPriceChanged(value: ReturnType<typeof toDinero>) {
  changeOtherPrice(value, coc_item.value)
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
