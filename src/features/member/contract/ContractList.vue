<template>
  <div class="app-page">
    <b-modal
      id="delete-contract-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this contract?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class="page-title">
        <h3>
          {{ $trans("Contracts") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              :method="showSearchModal"
            />
          </BButton-group>
          <router-link :to="{name: 'contract-add'}" class="btn">
            {{$trans('Add contract')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">

      <div class="overflow-auto">
        <b-table
          id="contract-table"
          small
          :busy="isLoading"
          :fields="fields"
          :items="contracts"
          responsive="md"
          class="data-table"
          sort-icon-left
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <IconLinkEdit
                router_name="contract-edit"
                v-bind:router_params="{pk: data.item.id}"
                :title="$trans('Edit')"
              />
              <IconLinkDelete
                :title="$trans('Delete')"
                v-bind:method="function() { showDeleteModal(data.item.id) }"
              />
            </div>
          </template>
        </b-table>
      </div>
    </div>

    <ListPagination
      v-if="!isLoading"
      :count="count"
      :label="$trans('Contract')"
      controls-id="contract-table"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  memberContractDestroyMutation,
  memberContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedContractList } from '@/api/types.gen'
import SearchModal from '@/components/SearchModal.vue'
import ListPagination from '../ListPagination.vue'
import { usePagedListScreen } from '../paged-list-screen'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import { invalidateContractListQueries } from './list-invalidation'
import { $trans } from '@/utils'

/**
 * The Contract list — the tracer bullet's list pattern on its third resource
 * (#323). Page and search term are read from the route and folded into the
 * query key reactively; deletes go through the generated mutation and
 * invalidate every list variant (see ./list-invalidation.ts for why that also
 * covers the Member form's assignment dropdown). The screen skeleton around
 * the table is the Slice's shared `usePagedListScreen`; what remains here is
 * this resource's factories, invalidation helper, copy and columns.
 */

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
} = usePagedListScreen<PaginatedContractList>({
  listOptions: (query) =>
    memberContractListOptions({
      query,
    }),
  destroyMutation: memberContractDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateContractListQueries(queryClient),
  copy: {
    loadError: $trans('Error loading contracts'),
    deletedDetail: $trans('Contract has been deleted'),
    deleteError: $trans('Error deleting contract'),
  },
})

const fields = [
  {key: 'name', label: $trans('Name'), thAttr: {width: '20%'}, sortable: true},
  {key: 'modules_text', label: $trans('Modules'), thAttr: {width: '50%'}, sortable: true},
  {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}, sortable: true},
  {key: 'modified', label: $trans('Modified'), thAttr: {width: '10%'}, sortable: true},
  {key: 'icons', thAttr: {width: '10%'}},
]
</script>
