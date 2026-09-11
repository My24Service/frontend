<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-customer-user-modal"
      :confirm-text="$trans('Are you sure you want to delete this customer user?')"
      :destroy-mutation="companyCustomeruserDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: companyCustomeruserListQueryKey()})"
      :deleted-detail="$trans('Customer user has been deleted')"
      :delete-error="$trans('Error deleting customer user')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('People')"
      :search-label="$trans('Search customer users')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No customer users found')"
        :label="$trans('Customer user')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'

import {
  companyCustomeruserDestroyMutation,
  companyCustomeruserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyCustomeruserListData, PaginatedCustomerUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import { companyCustomeruserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type CustomerUserRow = ListRow<PaginatedCustomerUserList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

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
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type CustomerUserListQueryParams = NonNullable<CompanyCustomeruserListData['query']>

const paged = useServerPagedList<CustomerUserRow>({
  listOptions: (query) => companyCustomeruserListOptions({
    query: {
      ...baseListParams(query),
    } as CustomerUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading customer users'),
})

const table = useAppTable({
  key: 'customer-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
