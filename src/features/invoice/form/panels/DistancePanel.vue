<template>
  <details>
    <summary class='flex-columns space-between'>
      <h6>{{$trans('Distance')}}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>
    <CostCollectionShell
      :collection="collection"
      :cost-type="costType"
      :is-loading="isLoading"
      :has-stored-data="hasStoredData"
      :parent-has-invoice-lines="parentHasInvoiceLines"
      :use-on-invoice-options="useOnInvoiceOptions"
      :items-total="distance_total"
      :total="total_dinero"
      :total-vat="totalVAT_dinero"
      @empty-collection="emptyCollectionClicked"
      @create-invoice-lines="createInvoiceLinesClicked"
      @save="saveCollection"
    >
      <template #draft>
        <b-row>
          <b-col cols="2">
            <HeaderCell
            :text='$trans("Engineer")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text="$trans('To/Back')"
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Total")'
            />
          </b-col>
          <b-col cols="3">
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
        <b-row v-for="distance in collection" :key="distance.user_id ?? undefined" class="distance_row">
          <b-col cols="2" v-if="!distance.is_partner">
            {{ getFullname(distance.user) }}
          </b-col>
          <b-col cols="2" v-else>
            {{ distance.full_name }} ({{ distance.partner_companycode }})
          </b-col>
          <b-col cols="1">
            <input type="number" class="form-control form-control-sm" v-model.number="distance.distance_to_total" style="display:inline-block;width:3.5em;text-align:right" v-on:change="distanceChange(distance)" />
            <input type="number" class="form-control form-control-sm" v-model.number="distance.distance_back_total" style="display:inline-block;width:3.5em;text-align:right" v-on:change="distanceChange(distance)" />
          </b-col>
          <b-col cols="1">
            {{ distance.distance_total }}
          </b-col>
          <b-col cols="3">
            <BFormRadioGroup
              @change="updateTotals"
              v-model="distance.use_price"
            >
              <BFormRadio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="distance.price_other"
                    :currency="distance.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val, distance)"
                  />
                </p>
              </BFormRadio>
            </BFormRadioGroup>
          </b-col>
          <b-col cols="2">
            <VAT v-model="distance.vat_type" @vatChanged="(val) => changeVatType(distance, val)" />
          </b-col>
          <b-col cols="3">
            <TotalsInputs
              :total="distance.total_dinero"
              :vat="distance.vat_dinero"
            />
          </b-col>
        </b-row>
      </template>
    </CostCollectionShell>
  </details>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ActivityUserTotal, UsePriceEnum } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import TotalsInputs from '@/components/TotalsInputs.vue'
import { $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import CostCollectionShell from './CostCollectionShell.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import type { CostRow } from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import { costRate } from '../calculations'
import { COST_TYPE_DISTANCE, USE_PRICE_SETTINGS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER } from '../calculations'

type UserTotal = ActivityUserTotal & { is_partner?: boolean }
/**
 * The distance driven per engineer as a cost collection. The order, customer,
 * engineers and the invoice-lines callbacks come from the form through
 * `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  user_totals?: UserTotal[] | null
  distance_total?: number | null
  /** The tenant's price per km, the "settings" rate. */
  invoice_default_price_per_km?: string | null
}>(), { user_totals: null, distance_total: null, invoice_default_price_per_km: null })
const context = useCostPanelContext()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const costType = COST_TYPE_DISTANCE
const distanceTotal = ref<number | null>(null)
const usePriceOptions = { USE_PRICE_SETTINGS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER } as const
function rate(row: Pick<CostRow, 'use_price' | 'price_other' | 'price_other_currency'>) {
  const option = row.use_price
  if (option !== 'settings' && option !== 'customer' && option !== 'other') throw new Error('Invalid distance price option: ' + option)
  return costRate(option, {
    settings: { price: props.invoice_default_price_per_km, currency: default_currency },
    customer: { price: context.customer.value?.price_per_km, currency: context.customer.value?.price_per_km_currency ?? default_currency },
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
  createInvoiceLinesClicked, updateTotals, changeVatType, otherPriceChanged, getFullname,
} = useCostCollection({
  context,
  costType: () => costType,
  buildRows: () => (props.user_totals ?? []).map(activity => makeCostRow({
    ...activity,
    cost_type: costType,
    order: context.orderPk.value ?? undefined,
    user_id: Number(activity.user_id),
    user: activity.is_partner ? null : Number(activity.user_id),
    user_full_name: activity.is_partner ? activity.full_name : null,
    amount_int: activity.distance_total ?? 0,
    use_price: USE_PRICE_SETTINGS,
  }, default_currency, invoice_default_vat)),
  rate,
  description: row => $trans('distance') + ': ' + row.user_full_name,
  title: () => $trans('Distance'),
  amount: () => distanceTotal.value ?? props.distance_total ?? 0,
})
function distanceChange(distance: CostRow) {
  distance.distance_total = Number(distance.distance_to_total ?? 0) + Number(distance.distance_back_total ?? 0)
  distance.amount_int = distance.distance_total
  updateTotals()
  distanceTotal.value = collection.value.reduce((total, row) => total + Number(row.amount_int), 0)
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
