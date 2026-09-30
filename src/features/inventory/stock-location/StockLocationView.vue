<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3>
          <IBiBookshelf></IBiBookshelf>
          <span class="backlink" @click="goBack">{{ $trans('Stock Locations') }}</span> /
          {{ record?.name }} <small class="dimmed">({{ record?.identifier }})</small>
        </h3>
        <router-link
          :to="{name: 'stock-location-edit', params: {pk: id ?? 0}}"
          class="btn btn-primary"
        >
          {{ `${$trans('Edit')} ${$trans('stock location')}` }}
        </router-link>
      </div>
    </header>

      <div class="page-detail">
        <div class="panel col-2-3">
          <h6>{{ $trans('Inventory') }} &middot; {{ record?.name }}</h6>
          <b-row>
            <b-col cols="12">
              <b-table
                small
                id="location-materials-table"
                :fields="inventoryFields"
                :items="inventory"
                responsive="sm"
              ></b-table>
            </b-col>
          </b-row>
        </div>
      </div>

  </div>
</template>

<script setup lang="ts">
import { useQueryErrorToast } from '@/features/forms'

/**
 * The stock location detail page: the record and the stock it holds, per
 * material. Two parallel reads; the legacy screen answered either failing with
 * one message and so does this.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const { router } = useCommon()

const id = computed(() => (props.pk == null ? null : Number(props.pk)))

const detailQuery = useQuery(() => ({
  ...Api.InventoryStockLocation.retrieveOptions(id.value ?? 0),
  enabled: id.value != null,
}))
const inventoryQuery = useQuery(() => ({
  ...Api.InventoryInventoryMaterialsForLocation.list.options({query: {location: id.value ?? 0}}),
  enabled: id.value != null,
}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching stock location/inventory'))
useQueryErrorToast(inventoryQuery.error, $trans('Error fetching stock location/inventory'))

const record = computed(() => detailQuery.data.value)
const inventory = computed(() => inventoryQuery.data.value ?? [])

const inventoryFields = [
  { key: 'material_name', label: $trans('Material') },
  { key: 'total_amount', label: $trans('Total amount') },
]

function goBack() {
  router.go(-1)
}
</script>
