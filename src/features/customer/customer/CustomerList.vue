<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-customer-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          <IBiBuilding></IBiBuilding> {{ $trans("Customers") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="refresh"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="showSearchModal"
            />
            <ButtonLinkDownload
              v-bind:method="downloadList"
              v-bind:title="$trans('Download')"
            />
          </BButton-group>
          <router-link :to="{name: 'customer-add'}" class="btn btn-primary">
            <IBiBuilding></IBiBuilding>{{$trans('Add customer')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">

      <BTable
        id="customer-table"
        :small="true"
        primary-key="id"
        :busy="isLoading"
        :fields="customerFields"
        :items="customerRows"
        responsive="md"
        class="data-table"
        :no-local-sorting="true"
        @sorted="sortingChanged"
        :sort-by="sortBy"
        sort-icon-left
        :tbody-tr-class="rowClass"
      >
        <template #cell(name)="data">
          <div v-if="data.item.branch_view" class="listing-item">
            <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">
              {{ data.item.branch_view.name }}, {{ data.item.branch_view.city }}, {{ data.item.branch_view.country_code }}
              (<span class="branch">{{ $trans("Branch") }}</span>)
            </router-link><br/>
            {{ $trans('Customer ID') }}: {{ data.item.customer_id }}<br/>
            {{ data.item.branch_view.address }}<br/>
            {{ data.item.branch_view.country_code }}-{{ data.item.branch_view.postal }}<br/>
            <span v-if="data.item.branch_view.contact && data.item.branch_view.contact.trim() !== ''">
                <b>{{ $trans('Contact') }}</b>: {{ data.item.branch_view.contact }}<br/>
            </span>
            <span v-if="data.item.branch_view.email">
              {{ $trans('Email') }}: <BLink class="px-1" v-bind:href="`mailto:${data.item.branch_view.email}`">{{ data.item.branch_view.email }}</BLink><br/>
            </span>
            <span v-if="data.item.branch_view.tel && data.item.branch_view.tel.trim() !== ''">
                <b>{{ $trans('Tel') }}</b>: {{ data.item.branch_view.tel }}<br/>
            </span>
            <span v-if="data.item.branch_view.mobile && data.item.branch_view.mobile.trim() !== ''">
                <b>{{ $trans('Mobile') }}</b>: {{ data.item.branch_view.mobile }}<br/>
            </span>
          </div>
          <span v-if="!data.item.branch_view" class="listing-item" :title="`${$trans('Customer ID:')} ${data.item.customer_id}`" >
            <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link>
          </span>
        </template>
        <template #cell(contract)="data">
          <span v-if="data.item.maintenance_contract && data.item.maintenance_contract.trim() != ''">
            <b>{{ data.item.maintenance_contract }}</b> <small>{{ $trans('Maintenance contract') }}</small>
          </span> &nbsp;
          <span v-if="data.item.standard_hours_txt !== '0:00'">
            <b>{{ data.item.standard_hours_txt }}</b> <small class="dimmed">{{ $trans('Standard hours') }}</small>
          </span>
        </template>
        <template #cell(remarks)="data">
          <span v-if="data.item.remarks && data.item.remarks.trim() != ''" :title="data.item.remarks">
            <IBiInfoSquare></IBiInfoSquare>
            <small> {{ data.item.remarks }}</small>
          </span>
        </template>

        <template #cell(contact)="data">
          {{  data.item.contact}}
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
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
      :label="$trans('Customer')"
      controls-id="customer-table"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useToast } from 'bootstrap-vue-next'

import {
  customerCustomerDestroyMutation,
  customerCustomerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedCustomerList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkDownload from '@/components/ButtonLinkDownload.vue'
import SearchModal from '@/components/SearchModal.vue'
import my24 from '@/services/my24'
import ListPagination from '../ListPagination.vue'
import { usePagedListScreen } from '../paged-list-screen'
import { useRoutePagedList } from '../route-paged-list'
import { SESSION_AUTH_HEADER } from '../session-auth-header'
import { invalidateCustomerListQueries } from './list-invalidation'
import { $trans } from '@/utils'

/**
 * The Customer list, rewritten into the feature folder.
 *
 * The template is the legacy screen's, byte for byte where it can be: the
 * columns, the branch-row rendering and the three toolbar actions are what a
 * planner reads all day. What changed is where the behaviour lives: the page
 * and search term come out of the URL (`usePagedListScreen`), the rows come
 * from the generated query options, and the delete goes through the generated
 * destroy mutation and invalidates the customer list, so a saved change is
 * on the next list the user opens.
 *
 * The download is a one-shot file export — its result is never displayed or
 * cached anywhere — so it builds its URL and hands it to the download helper
 * directly (the raw-SDK rule's exception), keeping the search term exactly as
 * the legacy `getExportUrl` did, trailing `?` included.
 */

const {create} = useToast()
const {searchQuery} = useRoutePagedList()

const {
  searchModal,
  deleteModal,
  isLoading,
  items: customers,
  count,
  sortBy,
  sortingChanged,
  showSearchModal,
  handleSearchOk,
  showDeleteModal,
  doDelete,
  refresh,
} = usePagedListScreen<PaginatedCustomerList>({
  listOptions: (query) => customerCustomerListOptions({query}),
  destroyMutation: () => customerCustomerDestroyMutation({headers: SESSION_AUTH_HEADER}),
  invalidateAfterDelete: (queryClient) => invalidateCustomerListQueries(queryClient),
  copy: {
    loadError: $trans('Error loading customers'),
    deletedDetail: $trans('Customer has been deleted'),
    deleteError: $trans('Error deleting customer'),
  },
})

const customerFields = [
  {key: 'name', label: $trans('Company'), sortable: true},
  {key: 'contract', label: ''},
  {key: 'city', label: ''},
  {key: 'num_orders', label: $trans('Orders'), sortable: true},
  {key: 'remarks', label: $trans('Remarks'), tdAttr: {style: 'max-width: 20ch; white-space: nowrap'}},
  {key: 'contact', label: $trans('Contact')},
  {key: 'icons', thAttr: {width: '15%'}},
]

/** The branch view is a Customer-or-Branch record; the template reads its
 * contact fields directly, as the legacy screen always did. */
type CustomerRow = NonNullable<PaginatedCustomerList['results']>[number] & {
  branch_view: Record<string, any> | null
}
const customerRows = computed(() => customers.value as CustomerRow[])

function rowClass(
  item: CustomerRow | null,
  type: 'row' | 'row-details' | 'row-top' | 'row-bottom' | 'table-busy',
) {
  if (item && type === 'row') {
    return item.branch_view ? 'branch' : ''
  }
  return ''
}

function downloadList() {
  if (confirm($trans('Are you sure you want to export all customers?'))) {
    const listArgs = searchQuery.value ? [`q=${searchQuery.value}`] : []
    my24.downloadItemAuth(`/api/customer/export/?${listArgs.join('&')}`, 'customers.xlsx')
  }
}
</script>

<style>
tr.branch {
  background-color: #f6cdd1;
}
</style>
