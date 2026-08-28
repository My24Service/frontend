<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-maintenance-contract-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance contract?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkLock></IBiFileEarmarkLock> {{ $trans('Maintenance contracts') }}</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="refresh"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="showSearchModal"
            />
          </BButton-group>
          <router-link :to="{name: 'maintenance-contract-add'}" class="btn btn-primary">
            {{ $trans('Add contract') }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="panel overflow-auto">

      <BTable
        id="maintenance-contract-table"
        small
        primary-key="id"
        :busy="isLoading"
        :fields="contractFields"
        :items="contractRows"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(sum_tariffs)="data">
          <span v-if="dineroFor(data.item)">
            {{ dineroFor(data.item)!.toFormat('$0.00') }}
          </span>
        </template>
        <template #cell(name)="data">
          <router-link :to="{name: 'maintenance-contract-view', params: {pk: data.item.id}}">
            <span v-if="data.item.name">
              {{ data.item.name }}
            </span>
          </router-link>
        </template>
        <template #cell(customer_view_name)="data">
          {{ data.item.customer_view.name }}
        </template>
        <template #cell(created)="data">
          <small>{{ data.item.created }}</small>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="maintenance-contract-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </BTable>

    </div>

    <ListPagination
      v-if="!isLoading"
      :count="count"
      :label="$trans('Contract')"
      controls-id="maintenance-contract-table"
    />

  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import {
  customerMaintenanceContractDestroyMutation,
  customerMaintenanceContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedMaintenanceContractList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import { toDinero } from '@/utils'
import { useMainStore } from '@/stores/main'
import ListPagination from '../ListPagination.vue'
import { usePagedListScreen } from '../paged-list-screen'
import { invalidateMaintenanceContractListQueries } from './list-invalidation'
import { $trans } from '@/utils'

/**
 * The maintenance-contract list, rewritten into the feature folder.
 *
 * The template is the legacy screen's, column for column: name, customer,
 * the dinero-formatted contract value, remarks and created, with the edit
 * and delete icons. What changed is where the behaviour lives: the page and
 * search term come out of the URL (`usePagedListScreen`), the rows come from
 * the generated query options, and the delete goes through the generated
 * destroy mutation and invalidates the contract-list queries — which also
 * reaches the customer detail view's contracts table, since it reads the
 * same list resource.
 *
 * Two legacy absences are kept as absences. The headers show sort icons,
 * but the legacy table had no sort wiring — a click sorted the current page
 * locally and no request ever carried it — so no sort is wired here either.
 * And the legacy `#cell(totals)` counters slot was dead (no `totals` column
 * existed in the fields), so it is dropped rather than revived.
 */
const mainStore = useMainStore()

const {
  searchModal,
  deleteModal,
  isLoading,
  items: contracts,
  count,
  showSearchModal,
  handleSearchOk,
  showDeleteModal,
  doDelete,
  refresh,
} = usePagedListScreen<PaginatedMaintenanceContractList>({
  listOptions: (query) => customerMaintenanceContractListOptions({query}),
  destroyMutation: () => customerMaintenanceContractDestroyMutation(),
  invalidateAfterDelete: (queryClient) => invalidateMaintenanceContractListQueries(queryClient),
  copy: {
    loadError: $trans('Error loading maintenance contracts'),
    deletedDetail: $trans('Maintenance contract has been deleted'),
    deleteError: $trans('Error deleting maintenance contract'),
  },
})

const contractFields = [
  {key: 'name', label: $trans('Contract name'), sortable: true},
  {key: 'customer_view_name', label: $trans('Customer'), sortable: true},
  {key: 'sum_tariffs', label: $trans('Contract value'), sortable: true},
  {key: 'remarks', label: $trans('Remarks'), sortable: true},
  {key: 'created', label: $trans('Created'), sortable: true},
  {key: 'icons'},
]

type ContractRow = NonNullable<PaginatedMaintenanceContractList['results']>[number]
const contractRows = computed(() => contracts.value as ContractRow[])

/**
 * The legacy screen stamped every row with the tenant's default currency and
 * let its price mixin build the dinero — the list response carries no
 * currency of its own. Same sum here, from the same source.
 */
function dineroFor(row: ContractRow) {
  if (!row.sum_tariffs) return null
  try {
    return toDinero(String(row.sum_tariffs), mainStore.getDefaultCurrency)
  } catch {
    return null
  }
}
</script>
