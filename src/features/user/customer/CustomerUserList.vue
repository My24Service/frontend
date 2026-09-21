<template>
  <div class="app-page">
    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('People')"
      :search-label="$trans('Search customer users')"
      :refresh="refresh"
      :empty-text="$trans('No customer users found')"
      :label="$trans('Customer user')"
      :delete-modal="{
        modalId: 'delete-customer-user-modal',
        confirmText: $trans('Are you sure you want to delete this customer user?'),
        destroyMutation: companyCustomeruserDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()}),
        deletedDetail: $trans('Customer user has been deleted'),
        deleteError: $trans('Error deleting customer user'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          v-if="authStore.isStaff || authStore.isSuperuser"
          :to="{name: 'customeruser-add'}"
          class="btn btn-primary"
        >
          {{ $trans('Add customer user') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import {
  companyCustomeruserDestroyMutation,
  companyCustomeruserListOptions,
  companyCustomeruserListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyCustomeruserListData, PaginatedCustomerUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type CustomerUserRow = ListRow<PaginatedCustomerUserList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = ref<{showDeleteModal: (id: number) => void} | null>(null)

const columnHelper = createAppColumnHelper<CustomerUserRow>()

const userColumns = createUserColumns(columnHelper, {
  nameRoute: 'customeruser-edit',
  widths: {name: '20%', username: '15%', email: '15%', lastLogin: '10%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  userColumns.email,
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
  userColumns.lastLogin,
  userColumns.dateJoined,
  createActionColumn(columnHelper, {
    editRoute: 'customeruser-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type CustomerUserListQueryParams = NonNullable<CompanyCustomeruserListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<CustomerUserRow>({
  key: 'customer-user-table',
  columns,
  listOptions: (query) => companyCustomeruserListOptions({
    query: {
      ...baseListParams(query),
    } as CustomerUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading customer users'),
})
</script>
