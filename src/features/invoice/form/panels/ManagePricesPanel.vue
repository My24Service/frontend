<template>
  <details>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Manage prices') }}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>
    <b-container fluid>
      <h5>{{ $trans("Materials") }}</h5>
      <b-row>
        <b-col cols="3" class="header">{{ $trans("Name") }}</b-col>
        <b-col cols="2" class="header">{{ $trans("Identifier") }}</b-col>
        <b-col cols="3" class="header ml-3">{{ $trans("Purchase price ex.") }}</b-col>
        <b-col cols="3" class="header">{{ $trans("Selling price ex.") }}</b-col>
        <b-col cols="1" />
      </b-row>
      <b-row v-for="material in materials" :key="material.id">
        <b-col cols="3">{{ material.name }}</b-col>
        <b-col cols="2">{{ material.identifier }}</b-col>
        <b-col cols="3">
          <PriceInput v-model="material.price_purchase" :currency="currency" @price-changed="price => queueMaterialPrice(material, 'purchase', price)" />
        </b-col>
        <b-col cols="3">
          <PriceInput v-model="material.price_selling" :currency="currency" @price-changed="price => queueMaterialPrice(material, 'selling', price)" />
        </b-col>
        <b-col cols="1">
          <BButton v-if="!hasTeamleader" :disabled="materialUpdating" @click="updateMaterial(material.id)" class="btn" size="sm" variant="primary" :title="$trans('This will update the API')">
            <b-spinner small v-if="materialUpdating" /> {{ $trans("Update") }}
          </BButton>
          <BButton v-else :disabled="linkingProduct" :variant="linkedProduct(material.id) ? 'success' : 'danger'" :title="$trans('Link material to product')" @click="emit('linkMaterial', material)">
            {{ $trans(linkedProduct(material.id) ? 'View' : 'Not yet linked') }}
          </BButton>
        </b-col>
      </b-row>
    </b-container>

    <hr />
    <b-container fluid v-if="!hasTeamleader">
      <h5>{{ $trans("Engineers") }}</h5>
      <b-row>
        <b-col cols="7" class="header">{{ $trans("Name") }}</b-col>
        <b-col cols="4" class="header ml-3">{{ $trans("Hourly price") }}</b-col>
        <b-col cols="1" />
      </b-row>
      <b-row v-for="engineer in engineers" :key="engineer.id">
        <b-col cols="7">{{ engineer.full_name }}</b-col>
        <b-col cols="4">
          <PriceInput v-model="engineer.engineer.hourly_rate" :currency="currency" @price-changed="price => queueEngineerPrice(engineer, price)" />
        </b-col>
        <b-col cols="1">
          <BButton @click="updateEngineer(engineer.id)" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
        </b-col>
      </b-row>
    </b-container>

    <hr />
    <b-container fluid v-if="customer && !hasTeamleader">
      <h5>{{ $trans("Prices for customer") }}</h5>
      <b-row>
        <b-col cols="7" class="header">{{ $trans("Name") }}</b-col>
        <b-col cols="4" class="header ml-3">{{ $trans("Price") }}</b-col>
        <b-col cols="1" />
      </b-row>
      <b-row v-for="row in customerPriceRows" :key="row.field">
        <b-col cols="7">{{ row.label }}</b-col>
        <b-col cols="4">
          <PriceInput :model-value="customer[row.field]" @update:model-value="value => setCustomerPrice(row.field, value)" :currency="currency" @price-changed="price => queueCustomerPrice(row.field, price)" />
        </b-col>
        <b-col cols="1">
          <BButton @click="updateCustomer" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
        </b-col>
      </b-row>
    </b-container>
  </details>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Customer, Engineer, Material, ProductList } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import { $trans } from '@/services/i18n'
import type { toDinero } from '@/services/money'
import { usePricingUpdates, type PatchedCustomerPrices } from '../use-customer-prices'

/**
 * The collapsible "Manage prices" block of the invoice form: the tenant's
 * material prices, engineer hourly rates and the three per-customer prices,
 * each row with its own Update button that PATCHes that one record.
 *
 * The material and engineer rows are edited in place - they are the form's
 * own copies of the bootstrap data, and the cost panels read the same objects,
 * so a price typed here reprices a draft cost line at once. The customer is a
 * single object rather than a list, so it goes through `v-model:customer` and
 * the form swaps in the edited copy. What is only staged here is which fields
 * changed: a PriceInput event queues the formatted value under its record, and
 * Update sends the queued fields alone.
 *
 * On a Teamleader tenant (`teamleaderProducts` not null) the material rows
 * link to Teamleader products instead of being edited, and the engineer and
 * customer tables are hidden because those rates come from the integration.
 * The link itself is the form's flow (it owns the product chooser), so this
 * panel only says which material was clicked.
 */
type Money = ReturnType<typeof toDinero>
type CustomerPriceField = keyof PatchedCustomerPrices

const props = withDefaults(defineProps<{
  materials: Material[]
  engineers: Engineer[]
  currency: string
  /** The linked Teamleader products, or null off a Teamleader tenant. */
  teamleaderProducts?: ProductList[] | null
  /** True while the form is linking a product; disables the link buttons. */
  linkingProduct?: boolean
}>(), {
  teamleaderProducts: null,
  linkingProduct: false,
})

const customer = defineModel<Customer | null>('customer', { default: null })

const emit = defineEmits<{
  linkMaterial: [material: Material]
}>()

const hasTeamleader = computed(() => props.teamleaderProducts !== null)

function linkedProduct(materialId: number): ProductList | undefined {
  return props.teamleaderProducts?.find(product => product.material.id === materialId)
}

const customerPriceRows = computed<{ field: CustomerPriceField; label: string }[]>(() => [
  { field: 'hourly_rate_engineer', label: $trans('Hourly rate engineer') },
  { field: 'call_out_costs', label: $trans('Call out costs') },
  { field: 'price_per_km', label: $trans('Price/KM') },
])

const { updateCustomerPrices, updateEngineerRate, updateMaterialPrices } = usePricingUpdates()

/** The edited fields per record, keyed by id, waiting for that row's Update. */
const materialPrices = ref<Record<number, { price_purchase?: string; price_selling?: string }>>({})
const engineerPrices = ref<Record<number, string>>({})
const customerPrices = ref<PatchedCustomerPrices>({})
const materialUpdating = ref(false)

function queueMaterialPrice(material: { id: number }, kind: 'purchase' | 'selling', price: Money) {
  const key = kind === 'purchase' ? 'price_purchase' : 'price_selling'
  materialPrices.value[material.id] = { ...materialPrices.value[material.id], [key]: price.toFormat('0.00') }
}

function queueEngineerPrice(engineer: { id: number }, price: Money) {
  engineerPrices.value[engineer.id] = price.toFormat('0.00')
}

function setCustomerPrice(field: CustomerPriceField, value: Customer[CustomerPriceField]) {
  if (!customer.value) return
  customer.value = { ...customer.value, [field]: value }
}

function queueCustomerPrice(field: CustomerPriceField, price: Money) {
  customerPrices.value[field] = price.toFormat('0.00')
}

async function updateMaterial(id: number) {
  materialUpdating.value = true
  try {
    const saved = await updateMaterialPrices(id, materialPrices.value[id] ?? {})
    if (saved) delete materialPrices.value[id]
  } finally {
    materialUpdating.value = false
  }
}

async function updateEngineer(id: number) {
  const saved = await updateEngineerRate(id, engineerPrices.value[id])
  if (saved) delete engineerPrices.value[id]
}

async function updateCustomer() {
  const saved = await updateCustomerPrices(customer.value?.id, customerPrices.value)
  if (saved) customerPrices.value = {}
}
</script>
