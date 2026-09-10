<template>
  <div class="app-page">
    <b-modal
      id="delete-customer-user-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer user?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3><IBiPeople></IBiPeople>{{ $trans("People") }}</h3>
        <BButton-toolbar>
          <BButton-group class="me-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto me-2"
            :aria-label="$trans('Search customer users')"
            :placeholder="$trans('Search customer users')"
          />
          <router-link
            v-if="authStore.isStaff || authStore.isSuperuser"
            :to="{name: 'customeruser-add'}"
            class="btn btn-primary"
          >
            {{ $trans('Add customer user') }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="page-details panel">
      <div class="app-detail panel overflow-auto">
        <div class="data-table">
          <ServerDataTable
            :table="table"
            :is-loading="isLoading"
            :empty-text="$trans('No customer users found')"
          />
        </div>
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Customer user')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companyCustomeruserDestroyMutation,
  companyCustomeruserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyCustomeruserListData, PaginatedCustomerUserList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { useAuthStore } from '@/features/auth'
import { companyCustomeruserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

const authStore = useAuthStore()

type CustomerUserRow = NonNullable<PaginatedCustomerUserList['results']>[number]

const columnHelper = createAppColumnHelper<CustomerUserRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The customer-user list endpoint declares no `ordering` parameter, so
    // the backend would silently drop a sort the wire carried — the column
    // stays non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '20%'},
    cell: (info) => h(RouterLink, {
      to: {name: 'customeruser-edit', params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '15%'}, header: $trans('Username'), enableSorting: false}),
  columnHelper.accessor('email', {meta: {width: '15%'}, header: $trans('Email'), enableSorting: false}),
  // The linked customer is a read-model join (customer_details), not a
  // sortable backend column — same reason as above, rendered as text like
  // the legacy template's `#cell(customer)` slot.
  columnHelper.display({
    id: 'customer',
    header: $trans('Customer'),
    meta: {width: '20%'},
    cell: (info) => {
      const row = info.row.original
      if (!row.customer_user?.customer) return h('i', $trans('No customer selected'))
      const details = row.customer_details
      return details ? `${details.name}, ${details.city}` : ''
    },
  }),
  columnHelper.accessor('last_login', {meta: {width: '10%'}, header: $trans('Last login'), enableSorting: false}),
  columnHelper.accessor('date_joined', {meta: {width: '10%'}, header: $trans('Date joined'), enableSorting: false}),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(IconLinkEdit, {
        router_name: 'customeruser-edit',
        router_params: {pk: info.row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

type CustomerUserListQueryParams = NonNullable<CompanyCustomeruserListData['query']>

const paged = useServerPagedList<CustomerUserRow>({
  listOptions: (query) => companyCustomeruserListOptions({
    query: {
      ...baseListParams(query),
    } as CustomerUserListQueryParams,
  }),
  getRowId: (row: CustomerUserRow) => String(row.id),
  loadError: $trans('Error loading customer users'),
})

const table = useAppTable({
  key: 'customer-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: companyCustomeruserDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()}),
  copy: {
    deletedDetail: $trans('Customer user has been deleted'),
    deleteError: $trans('Error deleting customer user'),
  },
})
</script>
