<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Entry') }}</h3>
      <b-row v-if="entry">
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Order ID') }}:</strong></b-td>
              <b-td>{{ entry.order_id }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Supplier') }}:</strong></b-td>
              <b-td>{{ entry.supplier }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Product') }}:</strong></b-td>
              <b-td>{{ entry.material_name }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Amount') }}:</strong></b-td>
              <b-td>{{ entry.amount }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Entry date') }}:</strong></b-td>
              <b-td>{{ entry.entry_date }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Moved to location') }}:</strong></b-td>
              <b-td>{{ entry.stock_location_name }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <BButton class="btn btn-info" type="button" variant="primary" @click="router.go(-1)">
          {{ $trans('Back') }}
        </BButton>
        <router-link
          :to="{name: 'purchaseorder-entry-edit', params: {pk: entryId}}"
          class="btn btn-primary"
        >{{ $trans('Edit') }}</router-link>
      </footer>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { useQueryErrorToast } from '@/features/forms'

/**
 * One purchase-order entry, read-only: which order and product it booked in,
 * how many, when, and where to. The legacy screen read a supplier with the
 * entry's id and rendered an empty supplier block; this shows the entry.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()

const entryId = computed(() => Number(props.pk))

const entryQuery = useQuery(() => Api.InventoryPurchaseorderEntry.retrieveOptions(entryId.value))
useQueryErrorToast(entryQuery.error, $trans('Error fetching entry'))

const entry = computed(() => entryQuery.data.value)
const isLoading = computed(() => entryQuery.isLoading.value)
</script>
