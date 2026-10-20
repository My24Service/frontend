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
  </details>
</template>

<script setup lang="ts">
import { formatMoneyPlain, type Money } from '@/services/money'
import { useMaterialPriceUpdates } from '../use-material-prices'

/**
 * The collapsible "Manage prices" block of the invoice form: the tenant's
 * material prices, each row with its own Update button that PATCHes that one
 * material.
 *
 * The rows are edited in place - they are the form's own copies of the
 * bootstrap data. What is only staged here is which fields changed: a
 * PriceInput event queues the formatted value under its record, and Update
 * sends the queued fields alone.
 *
 * On a Teamleader tenant (`teamleaderProducts` not null) the rows link to
 * Teamleader products instead of being edited. The link itself is the form's
 * flow (it owns the product chooser), so this panel only says which material
 * was clicked.
 */
const props = withDefaults(defineProps<{
  materials: Api.Material[]
  currency: string
  /** The linked Teamleader products, or null off a Teamleader tenant. */
  teamleaderProducts?: Api.ProductList[] | null
  /** True while the form is linking a product; disables the link buttons. */
  linkingProduct?: boolean
}>(), {
  teamleaderProducts: null,
  linkingProduct: false,
})

const emit = defineEmits<{
  linkMaterial: [material: Api.Material]
}>()

const hasTeamleader = computed(() => props.teamleaderProducts !== null)

function linkedProduct(materialId: number): Api.ProductList | undefined {
  return props.teamleaderProducts?.find(product => product.material.id === materialId)
}

const { updateMaterialPrices } = useMaterialPriceUpdates()

/** The edited fields per record, keyed by id, waiting for that row's Update. */
const materialPrices = ref<Record<number, { price_purchase?: string; price_selling?: string }>>({})
const materialUpdating = ref(false)

function queueMaterialPrice(material: { id: number }, kind: 'purchase' | 'selling', price: Money) {
  const key = kind === 'purchase' ? 'price_purchase' : 'price_selling'
  materialPrices.value[material.id] = { ...materialPrices.value[material.id], [key]: formatMoneyPlain(price) }
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
</script>
