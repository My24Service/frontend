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
              v-model="coc_item.amount_int"
              size="sm"
            ></BFormInput>
          </b-col>
          <b-col cols="5">
            <PriceInput
              v-model="coc_item.price"
              :currency="coc_item.price_currency"
              @priceChanged="(val) => priceChanged(val, coc_item)"
            />
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
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import CostCollectionShell from './CostCollectionShell.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import { COST_TYPE } from '../calculations'

/**
 * The single call-out cost line of an order as a cost collection, its draft
 * seeded with the tenant's call-out costs. The order and the invoice-lines
 * callbacks come from the form through `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  /** The tenant's call-out costs, which seed the draft. */
  invoice_default_call_out_costs?: number | string | null
}>(), { invoice_default_call_out_costs: null })
const context = useCostPanelContext()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const costType = COST_TYPE.CALL_OUT_COSTS
function draftRow() {
  return makeCostRow({ cost_type: costType, order: context.orderPk.value ?? undefined, amount_int: 1 },
    { price: props.invoice_default_call_out_costs, currency: default_currency }, invoice_default_vat)
}
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, changeVatType, priceChanged,
} = useCostCollection({
  context,
  costType: () => costType,
  currency: () => default_currency,
  buildRows: () => [draftRow()],
  description: () => $trans('Call out costs'),
  title: () => $trans('Call out costs'),
  amount: () => totalAmount.value,
})
const coc_item = computed(() => collection.value[0] ?? draftRow())
const totalAmount = computed(() => collection.value.reduce((total, row) => total + Number(row.amount_int), 0))
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
