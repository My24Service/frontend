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
      <template #draft>
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
              :text='$trans("Price")'
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
            <input type="number" class="form-control form-control-sm" v-model.number="material.amount" style="width:4em;text-align:right" v-on:change="materialAmountChange(material)" />
          </b-col>
          <b-col cols="4">
            <template v-if="teamleaderProducts">
              <div :class="getTlProduct(material.material_id) ? 'w-100 bg-success mb-2' : 'w-100 bg-danger mb-2'">
                <img :src="PIXEL_URL" :alt="$trans('pixel')">
              </div>
              <span v-if="getTlProduct(material.material_id)">{{ $trans('Teamleader') }}:&nbsp;</span>
              <span v-else>{{ $trans('not linked') }}</span>
            </template>
            <PriceInput
              v-model="material.price"
              :currency="material.price_currency"
              @priceChanged="(val) => priceChanged(val, material)"
            />
          </b-col>
          <b-col cols="2">
            <VAT v-model="material.vat_type" @vatChanged="(val) => changeVatType(material, val)" />
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
      </template>
    </CostCollectionShell>
</template>

<script setup lang="ts">
import type { AssignedOrderMaterialTotals, Material, ProductList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import CostCollectionShell from './CostCollectionShell.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import type { CostRow } from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import { PIXEL_URL } from '@/constants'
import { COST_TYPE } from '../calculations'

type UsedMaterial = AssignedOrderMaterialTotals & {
  user_id?: number | string
  is_partner?: boolean
  full_name?: string
  partner_companycode?: string | null
}

/**
 * The materials used on the order as a cost collection. A draft is seeded
 * with the material's selling price or, on a Teamleader tenant, the linked
 * product's, and each row's price is edited in place. The order, engineers
 * and the invoice-lines callbacks come from the form through
 * `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  material_models?: Material[] | null
  used_materials?: UsedMaterial[] | null
  /** The linked Teamleader products, or null off a Teamleader tenant. */
  teamleaderProducts?: ProductList[] | null
}>(), { material_models: null, used_materials: null, teamleaderProducts: null })
const context = useCostPanelContext()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const costType = COST_TYPE.USED_MATERIALS
function getTlProduct(materialId: number | null | undefined) {
  return props.teamleaderProducts?.find(product => product.material.id === materialId)
}
function defaultRate(materialId: number | null | undefined) {
  const material = props.material_models?.find(material => material.id === materialId)
  // A linked Teamleader product's selling price overrides the material's own.
  const product = getTlProduct(materialId)
  if (product) return { price: product.selling_price, currency: default_currency }
  return { price: material?.price_selling_ex, currency: material?.price_selling_ex_currency ?? default_currency }
}
// Own copy of the bootstrap rows: a quantity edit lands here, never on the prop.
const materialRows = ref<UsedMaterial[]>((props.used_materials ?? []).map(row => ({...row})))
const sumAmounts = (rows: readonly UsedMaterial[]) => rows.reduce((total, row) => total + Number(row.amount), 0)
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, changeVatType, priceChanged, setPrice, loadData,
} = useCostCollection({
  context,
  costType: () => costType,
  buildRows: () => materialRows.value.map(material => {
    const { id, ...metadata } = material
    return makeCostRow({
      ...metadata,
      name: material.name ?? undefined,
      identifier: material.identifier ?? undefined,
      cost_type: costType,
      order: context.orderPk.value ?? undefined,
      material: id,
      material_id: id,
      amount_decimal: material.amount,
      user: material.is_partner ? null : material.user_id == null ? undefined : Number(material.user_id),
      user_full_name: material.is_partner ? material.full_name : null,
    }, defaultRate(id), invoice_default_vat)
  }),
  description: row => {
    const material = props.material_models?.find(material => material.id === row.material)
    return $trans('material') + ': ' + (material ? material.name : $trans('unknown'))
  },
  title: () => $trans('Used materials'),
  amount: () => totalAmount.value,
})
const totalAmount = ref(sumAmounts(materialRows.value))
function materialAmountChange(material: CostRow) {
  material.amount_decimal = material.amount ?? 0
  for (const row of materialRows.value) {
    if (row.identifier === material.identifier) row.amount = Number(material.amount)
  }
  totalAmount.value = sumAmounts(materialRows.value)
}
// A linked product only changes the price the drafts are seeded with, so the
// rows stay and only their prices are reseeded. New material records instead
// change what the drafts are built from, so the collection reloads from the
// server.
watch(() => props.teamleaderProducts, () => {
  if (hasStoredData.value) return
  for (const row of collection.value) setPrice(row, defaultRate(row.material))
}, { deep: true })
watch(() => props.material_models, () => {
  void loadData()
}, { deep: true })
watch(() => props.used_materials, (rows) => {
  materialRows.value = (rows ?? []).map(row => ({...row}))
  totalAmount.value = sumAmounts(materialRows.value)
})
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
