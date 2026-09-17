<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div
      class="costs-table"
      v-if="!isLoading && hasStoredData"
    >
      <CostsTable
        :collection="collection"
        :type="costType"
      />

      <CollectionEmptyContainer
        @buttonClicked="() => { emptyCollectionClicked() }"
      />

      <AddToInvoiceLinesDiv
        v-if="!parentHasInvoiceLines"
        :useOnInvoiceOptions="useOnInvoiceOptions"
        @buttonClicked="createInvoiceLinesClicked"
      />

    </div>

    <b-container fluid v-if="!isLoading && !hasStoredData">
      <b-row>
        <b-col cols="2">
          <HeaderCell
            :text='$trans("Material")'
          />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("Amount")'
          />
        </b-col>
        <b-col cols="4">
          <HeaderCell
            :text='$trans("Use price")'
          />
        </b-col>
        <b-col cols="2">
          <HeaderCell
            :text='$trans("VAT type")'
          />
        </b-col>
        <b-col cols="3" />
      </b-row>
      <b-row v-for="material in collection" :key="material.id" class="material_row">
        <b-col cols="2">
          {{ material.name }}
        </b-col>
        <b-col cols="1">
          <input type="number" class="form-control form-control-sm" v-model.number="material.amount" style="width:4em;text-align:right" v-on:change="materialAmountChange(material,$event)" />
        </b-col>
        <b-col cols="4">
          <BFormRadioGroup
            @change="updateTotals"
            v-model="material.use_price"
            v-if="!teamleaderProducts"
          >
            <BFormRadio :value="usePriceOptions.USE_PRICE_PURCHASE">
              {{ $trans('Pur.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
            </BFormRadio>

            <BFormRadio :value="usePriceOptions.USE_PRICE_SELLING">
              {{ $trans('Sel.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
            </BFormRadio>

            <BFormRadio :value="usePriceOptions.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="material.price_other"
                  :currency="material.price_other_currency"
                  @priceChanged="(val) => otherPriceChanged(val, material)"
                />
              </p>
            </BFormRadio>
          </BFormRadioGroup>
          <BFormRadioGroup
            @change="updateTotals"
            v-model="material.use_price"
            v-else
          >
            <div :class="getTlProduct(material.material_id) ? 'w-100 bg-success mb-2' : 'w-100 bg-danger mb-2'">
              <img :src="PIXEL_URL" :alt="$trans('pixel')">
            </div>
            <p class="flex">
              <span v-if="getTlProduct(material.material_id)">
                {{ $trans('Teamleader') }}:&nbsp;
              </span>
              <span v-else>{{ $trans('not linked') }}</span>
              <PriceInput
                v-model="material.price"
                :currency="material.price_currency"
                @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, material)"
              />
            </p>
          </BFormRadioGroup>
        </b-col>
        <b-col cols="2">
          <VAT @vatChanged="(val) => changeVatType(material, val)" />
        </b-col>
        <b-col cols="3">
          <TotalsInputs
            :total="material.total_dinero"
            :vat="material.vat_dinero"
          />
        </b-col>
        <b-col cols="12">
          {{ $trans("teamleader") }}
        </b-col>
      </b-row>
      <TotalRow
        :items_total="totalAmount"
        :total="total_dinero"
        :total_vat="totalVAT_dinero"
      />

      <CollectionSaveContainer
        @buttonClicked="() => { saveCollection() }"
      />

    </b-container>
  </b-overlay>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AssignedOrderMaterialTotals, Customer, Engineer, InvoiceLine, Material, ProductList, UsePriceEnum } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import TotalsInputs from '@/components/TotalsInputs.vue'
import { $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import TotalRow from './TotalRow.vue'
import CollectionSaveContainer from './CollectionSaveContainer.vue'
import CollectionEmptyContainer from './CollectionEmptyContainer.vue'
import CostsTable from './CostsTable.vue'
import AddToInvoiceLinesDiv from './AddToInvoiceLinesDiv.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import type { CostRow } from '../use-cost-collection'
import type { InvoiceLineDraft, InvoiceLineType } from '../calculations'
import { PIXEL_URL } from '@/constants'
import { materialPrice } from '../calculations'
import { COST_TYPE_USED_MATERIALS, USE_PRICE_PURCHASE, USE_PRICE_SELLING, USE_PRICE_OTHER } from '../constants'

type UsedMaterial = AssignedOrderMaterialTotals & {
  user_id?: number | string
  is_partner?: boolean
  full_name?: string
  partner_companycode?: string | null
}

const props = withDefaults(defineProps<{
  order_pk?: number | null
  material_models?: Material[] | null
  used_materials?: UsedMaterial[] | null
  engineer_models?: Engineer[] | null
  customer?: Partial<Customer> | null
  invoiceLinesParent?: readonly { type?: string }[] | null
  teamleaderProducts?: ProductList[] | null
}>(), { order_pk: null, material_models: null, used_materials: null, engineer_models: null, customer: null, invoiceLinesParent: null, teamleaderProducts: null })
const emit = defineEmits<{
  invoiceLinesCreated: [lines: InvoiceLineDraft[]]
  emptyCollectionClicked: [type: Exclude<InvoiceLineType, 'manual'>]
}>()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const costType = COST_TYPE_USED_MATERIALS
const usePriceOptions = { USE_PRICE_PURCHASE, USE_PRICE_SELLING, USE_PRICE_OTHER } as const
function getTlProduct(materialId: number | null | undefined) {
  return props.teamleaderProducts?.find(product => product.material.id === materialId)
}
function getMaterialPriceFor(row: CostRow, option: UsePriceEnum) {
  const material = props.material_models?.find(material => material.id === row.material)
  if (!material) return toDinero('0.00', default_currency)
  return option === USE_PRICE_PURCHASE
    ? toDinero(material.price_purchase_ex, material.price_purchase_ex_currency)
    : toDinero(material.price_selling_ex, material.price_selling_ex_currency)
}
function rate(row: CostRow) {
  const option = row.use_price
  if (option !== 'purchase' && option !== 'selling' && option !== 'other') throw new Error('Invalid material price option: ' + option)
  const material = props.material_models?.find(material => material.id === row.material)
  return {
    price: materialPrice(option, { purchase: material?.price_purchase_ex, selling: material?.price_selling_ex,
      other: row.price_other, teamleader: getTlProduct(row.material)?.selling_price }),
    currency: default_currency,
  }
}
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, updateTotals, changeVatType, otherPriceChanged, loadData,
} = useCostCollection({
  orderId: () => props.order_pk, costType: () => costType,
  invoiceLinesParent: () => props.invoiceLinesParent, engineers: () => props.engineer_models,
  buildRows: () => (props.used_materials ?? []).map(material => {
    const { id, ...metadata } = material
    return makeCostRow({ ...metadata, name: material.name ?? undefined, identifier: material.identifier ?? undefined,
      cost_type: costType, order: props.order_pk ?? undefined,
      material: id, material_id: id, amount_decimal: material.amount,
      use_price: USE_PRICE_SELLING,
      user: material.is_partner ? null : material.user_id == null ? undefined : Number(material.user_id),
      user_full_name: material.is_partner ? material.full_name : null,
    }, default_currency, invoice_default_vat)
  }),
  rate, description: row => {
    const material = props.material_models?.find(material => material.id === row.material)
    return $trans('material') + ': ' + (material ? material.name : $trans('unknown'))
  },
  title: () => $trans('Used materials'), amount: () => totalAmount.value,
  onInvoiceLinesCreated: lines => emit('invoiceLinesCreated', lines),
  onEmpty: type => emit('emptyCollectionClicked', type),
})
// Preserve the integer summary while retaining decimal quantities on individual lines.
const totalAmount = ref((props.used_materials ?? []).reduce((total, row) => total + parseInt(String(row.amount), 10), 0))
function materialAmountChange(material: CostRow, _event: Event) {
  material.amount_decimal = material.amount ?? 0
  for (const row of props.used_materials ?? []) {
    if (row.identifier === material.identifier) row.amount = Number(material.amount)
  }
  totalAmount.value = (props.used_materials ?? []).reduce((total, row) => total + parseInt(String(row.amount), 10), 0)
  updateTotals()
}
watch(() => props.teamleaderProducts, () => { if (!hasStoredData.value) updateTotals() }, { deep: true })
watch(() => props.material_models, () => { void loadData() }, { deep: true })
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
