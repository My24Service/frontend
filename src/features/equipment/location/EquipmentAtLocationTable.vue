<template>
  <b-table
    id="equipment-table"
    :small="true"
    :busy="isLoading"
    :fields="fields"
    :items="equipment"
    responsive="md"
    class="data-table"
  >
    <template #cell(name)="data">
      <router-link :to="toRoute(props.viewRoute, {pk: data.item.id})">
        {{ data.item.name }}
      </router-link><br>
    </template>
    <template #cell(customer)="data">
      <span v-if="data.item.customer_branch_view">
        {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
      </span>
    </template>
    <template #cell(branch)="data">
      <span v-if="data.item.customer_branch_view">
        {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
      </span>
    </template>
  </b-table>
</template>

<script setup lang="ts">

import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
/**
 * The equipment standing at one location, shown on the location's detail page.
 *
 * An embedded table, not a page of its own: it reads one oversized page
 * (`page_size=1000`) and offers no paging, search or sorting, which is what the
 * legacy table did and what a location's equipment list is for.
 *
 * The columns follow the same role matrix as the equipment list: only a
 * planning user sees an owner column, and which owner depends on whether the
 * member has branches.
 */
const props = defineProps<{
  locationId: number
  /** The route `location_view`'s equipment links resolve to. */
  viewRoute: RouteName
  isLoading?: boolean
}>()

const hasBranches = useMainStore().getMemberHasBranches
const authStore = useAuthStore()
const planning = !authStore.isEmployee && !authStore.isCustomer

const fields = computed(() => [
  {key: 'name', label: $trans('Name')},
  ...(planning && hasBranches ? [{key: 'branch', label: $trans('Branch')}] : []),
  ...(planning && !hasBranches ? [{key: 'customer', label: $trans('Customer')}] : []),
  {key: 'num_orders', label: $trans('Orders')},
])

const listQuery = useQuery(Api.EquipmentEquipment.list.options({
  query: {location: props.locationId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))
useQueryErrorToast(listQuery.error, $trans('Error loading equipment'))

const equipment = computed(() => listQuery.data.value?.results ?? [])
</script>
