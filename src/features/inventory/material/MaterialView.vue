<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBox></IBiBox>
          <span class="backlink" @click="goBack">{{ $trans("Materials") }}</span> / {{ record?.name }}
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}
          </BButton>
          <router-link
            :to="{name: 'material-edit', params: {pk: id}}"
            class="btn btn-primary"
          >
            {{ $trans('Edit material') }}
          </router-link>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm" class="flex-columns">
        <div class="panel col-1-3">
          <h3>{{ record?.name }}</h3>
          <dl>
            <dt>{{ $trans('Identifier') }}</dt>
            <dd>{{ record?.identifier }}</dd>
            <dt>{{ $trans('Shortname') }}</dt>
            <dd>{{ record?.name_short }}</dd>
            <dt>{{ $trans('Unit') }}</dt>
            <dd>{{ record?.unit }}</dd>
            <dt>{{ $trans('Supplier') }}</dt>
            <dd>{{ record?.supplier_name }}</dd>
            <dt>{{ $trans('Product type') }}</dt>
            <dd>{{ record?.product_type }}</dd>
          </dl>
          <br>
          <dl>
            <dt>{{ $trans('Purchase price') }}</dt>
            <dd>{{ record?.price_purchase }}</dd>
            <dt>{{ $trans('Selling price') }}</dt>
            <dd>{{ record?.price_selling }}</dd>
            <dt>{{ $trans('Alt. selling price') }}</dt>
            <dd>{{ record?.price_selling_alt }}</dd>
            <dt>{{ $trans('Purchase price ex.') }}</dt>
            <dd>{{ record?.price_purchase_ex }}</dd>
            <dt>{{ $trans('Selling price ex.') }}</dt>
            <dd>{{ record?.price_selling_ex }}</dd>
            <dt>{{ $trans('Alt. selling price ex.') }}</dt>
            <dd>{{ record?.price_selling_alt_ex }}</dd>
          </dl>
          <hr/>
          <img :src="record?.image || NO_IMAGE_URL" :alt="`${record?.name ?? ''} - ${$trans('Product image')}`"/>
        </div>

        <div class="panel col-2-3">
          <h6>{{ $trans('Inventory') }}</h6>
          <b-table :fields="inventoryFields" :items="inventory" responsive="sm"></b-table>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NO_IMAGE_URL } from '@/constants'
import { useQueryErrorToast } from '@/features/forms'

/**
 * The material detail page: the record and the stock it has, per location.
 *
 * Two parallel reads instead of the legacy screen's sequence. The legacy
 * screen answered either failing with one message and so does this.
 */
const props = defineProps<{
  /** The route's `:pk`. */
  pk: string | number
}>()

const { router } = useCommon()

const id = computed(() => Number(props.pk))

const detailQuery = useQuery(() => Api.InventoryMaterial.retrieveOptions(id.value))
const inventoryQuery = useQuery(() => Api.InventoryInventoryLocationsForMaterial.list.options({query: {material: id.value}}))
// One flag for both reads, so both failing toasts once.
useQueryErrorToast(
  computed(() => Boolean(detailQuery.error.value || inventoryQuery.error.value)),
  $trans('Error fetching inventory'),
)

const record = computed(() => detailQuery.data.value)
const inventory = computed(() => inventoryQuery.data.value ?? [])
const isLoading = computed(() => detailQuery.isLoading.value || inventoryQuery.isLoading.value)

const inventoryFields = [
  { key: 'location_name', label: $trans('Location') },
  { key: 'total_amount', label: $trans('Total amount') },
]

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
img {
  display: block;
  margin: auto;
  max-width: 100%;
}

img[src*="no-img.png"] {
  max-width: 320px;
}
</style>
